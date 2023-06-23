/* eslint-disable @typescript-eslint/no-explicit-any */
import { isInSubnet } from 'is-in-subnet';

import { ControlOptions, GrantInterface, Policy, PolicyPattern, Time, TimeOptions } from '../interfaces';
import { accessibility, accumulate, filterByNotation, isCIDR, key, log, validate } from '../utils';
import { POLICY_NOTATION, SEP, STRICT } from '../consts';

export class Grant<Sub = string, Act = string, Obj = string> implements GrantInterface<Sub, Act, Obj> {
  protected readonly options: ControlOptions = {};
  protected present: Record<string, Policy<Sub, Act, Obj>> = {};

  constructor(policies: Policy<Sub, Act, Obj>[], options?: ControlOptions) {
    const { sep, strict } = options ?? {};

    this.options.sep = sep ?? SEP;
    this.options.strict = strict ?? STRICT;

    if (policies.length) this.policies = policies;
  }

  set policies(policies: Policy<Sub, Act, Obj>[]) {
    if (!policies.length) this.present = {};

    for (const policy of policies) this.update(policy);
  }

  get policies() {
    return Object.values(this.present);
  }

  has(pattern: PolicyPattern): boolean {
    if (!Object.keys(pattern).length) throw new Error('Pattern is required');

    const { subject, action, object } = pattern;
    const policies = Object.values(this.present);
    if (subject) return policies.some((p) => RegExp(subject).test(p.subject as string));
    if (action) return policies.some((p) => RegExp(action).test(p.action as string));
    if (object) return policies.some((p) => RegExp(object).test(p.object as string));

    return false;
  }

  subjects(pattern?: PolicyPattern): Sub[] {
    const policies = Object.values(this.present);

    if (!pattern || !Object.keys(pattern).length) return policies.map((p) => p.subject);

    const subjects: Sub[] = [];
    const { subject, action, object } = pattern;
    if (subject) subjects.push(...policies.filter((p) => RegExp(subject).test(p.subject as string)).map((p) => p.subject));
    if (action) subjects.push(...policies.filter((p) => RegExp(action).test(p.action as string)).map((p) => p.subject));
    if (object) subjects.push(...policies.filter((p) => RegExp(object).test(p.object as string)).map((p) => p.subject));

    return subjects;
  }

  time(pattern?: PolicyPattern, options?: TimeOptions): boolean {
    const policies = Object.values(this.present);

    const sep = this.options.sep ?? SEP;
    const times: Record<string, Time> = {};
    if (!pattern || !Object.keys(pattern).length) {
      for (const time of policies.filter((p) => p.time?.length).map((p) => p.time))
        time?.forEach((t) => t && (times[`${t.cron_exp}${sep}${t.duration}`] = t));
    } else {
      const add = (regex: RegExp, prop: 'subject' | 'action' | 'object') => {
        policies
          .filter((p) => regex.test(p[prop] as string))
          .map((p) => p.time)
          .flat()
          .forEach((t) => t && (times[`${t.cron_exp}${sep}${t.duration}`] = t));
      };

      const { subject, action, object } = pattern;
      if (subject) add(RegExp(subject), 'subject');
      if (action) add(RegExp(action), 'action');
      if (object) add(RegExp(object), 'object');
    }

    if (!Object.keys(times).length) return true;
    else return Object.values(times).some((t) => accessibility(t, options));
  }

  location(ip: string, pattern?: PolicyPattern): boolean {
    const policies = Object.values(this.present);

    const locations = new Set<string>([]);
    if (!pattern || !Object.keys(pattern).length) {
      for (const location of policies.filter((p) => p.location?.length).map((p) => p.location))
        location?.forEach((l) => l && locations.add(l));
    } else {
      const add = (regex: RegExp, prop: 'subject' | 'action' | 'object') => {
        policies
          .filter((p) => regex.test(p[prop] as string))
          .map((p) => p.location)
          .flat()
          .forEach((l) => l && locations.add(l));
      };

      const { subject, action, object } = pattern;
      if (subject) add(RegExp(subject), 'subject');
      if (action) add(RegExp(action), 'action');
      if (object) add(RegExp(object), 'object');
    }

    if (!locations.size) return true;
    else
      return (
        isInSubnet(
          ip,
          [...locations].filter((l) => isCIDR(l)),
        ) || locations.has(ip)
      );
  }

  field<T>(data: any, pattern?: PolicyPattern, deep_copy = false): T {
    const policies = Object.values(this.present);

    const fields: string[][] = [];
    if (!pattern || !Object.keys(pattern).length) {
      for (const field of policies.filter((p) => p.field?.length).map((p) => p.field)) field && fields.push(field);
    } else {
      const add = (regex: RegExp, prop: 'subject' | 'action' | 'object') => {
        policies
          .filter((p) => regex.test(p[prop] as string))
          .map((p) => p.field)
          .forEach((f) => f && fields.push(f));
      };

      const { subject, action, object } = pattern;
      if (subject) add(RegExp(subject), 'subject');
      if (action) add(RegExp(action), 'action');
      if (object) add(RegExp(object), 'object');
    }

    const notations = accumulate(...fields);
    if (!notations.length) return filterByNotation(data, ['*'], deep_copy) as T;
    else return filterByNotation(data, notations, deep_copy) as T;
  }

  filter<T>(data: any, pattern?: PolicyPattern, deep_copy = false): T {
    const policies = Object.values(this.present);

    const filters: string[][] = [];
    if (!pattern || !Object.keys(pattern).length) {
      for (const filter of policies.filter((p) => p.filter?.length).map((p) => p.filter)) filter && filters.push(filter);
    } else {
      const add = (regex: RegExp, prop: 'subject' | 'action' | 'object') => {
        policies
          .filter((p) => regex.test(p[prop] as string))
          .map((p) => p.filter)
          .forEach((f) => f && filters.push(f));
      };

      const { subject, action, object } = pattern;
      if (subject) add(RegExp(subject), 'subject');
      if (action) add(RegExp(action), 'action');
      if (object) add(RegExp(object), 'object');
    }

    const notations = accumulate(...filters);
    if (!notations.length) return filterByNotation(data, ['*'], deep_copy) as T;
    else return filterByNotation(data, notations, deep_copy) as T;
  }

  update(policy: Policy<Sub, Act, Obj>, deep_copy = true) {
    validate(policy);

    policy = filterByNotation(policy, POLICY_NOTATION, deep_copy);

    const add = (key: string) => {
      if (key in this.present) {
        const { subject, action, object } = policy;
        log('update-policies').warn(`policy with subject ${subject}, action ${action} and object ${object} already exists`);

        this.present[key] = policy;
      } else this.present[key] = policy;
    };

    add(key(policy, this.options.sep));
    add(key(policy, this.options.sep));
  }
}
