/* eslint-disable @typescript-eslint/no-explicit-any */
import { isInSubnet } from 'is-in-subnet';

import { PropType, accessibility, accumulate, filterByNotation, isCIDR, key, normalize, parse, validate } from '../utils';
import { ControlOptions, GrantInterface, Policy, PolicyPattern, Time, TimeOptions } from '../types';
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

    let flag = true;
    const { subject, action, object } = pattern;
    const policies = Object.values(this.present);
    if (subject) flag &&= policies.some((p) => RegExp(subject).test(normalize(p.subject, 'subject', this.options)));
    if (action) flag &&= policies.some((p) => RegExp(action).test(normalize(p.action, 'action', this.options)));
    if (object) flag &&= policies.some((p) => RegExp(object).test(normalize(p.object, 'object', this.options)));

    return flag && (!!subject || !!action || !!object);
  }

  scopes<T = string>(type: PropType, pattern?: PolicyPattern): T[] {
    const policies = Object.values(this.present);

    if (!pattern || !Object.keys(pattern).length)
      return [...new Set<T>(policies.map((p) => parse(p[type]).scope as T).filter((s) => !!s))];
    else {
      type Option = { regex: RegExp; type: PropType };
      const add = (set: Set<T>, options: Option[]) => {
        policies
          .filter((p) => options.every(({ regex, type }) => regex.test(normalize(p[type], type))))
          .map((p) => parse(p[type]).scope as T)
          .forEach((s) => s && set.add(s));
      };

      const options: Option[] = [];
      const scopes = new Set<T>([]);
      const { subject, action, object } = pattern;
      if (subject) options.push({ regex: RegExp(subject), type: 'subject' });
      if (action) options.push({ regex: RegExp(action), type: 'action' });
      if (object) options.push({ regex: RegExp(object), type: 'object' });
      add(scopes, options);

      return [...scopes];
    }
  }

  subjects(pattern?: PolicyPattern): Sub[] {
    const policies = Object.values(this.present);

    if (!pattern || !Object.keys(pattern).length) return [...new Set<Sub>(policies.map((p) => p.subject))];
    else {
      type Option = { regex: RegExp; type: PropType };
      const add = (set: Set<Sub>, options: Option[]) => {
        policies
          .filter((p) => options.every(({ regex, type }) => regex.test(normalize(p[type], type))))
          .map((p) => set.add(p.subject));
      };

      const options: Option[] = [];
      const subjects = new Set<Sub>([]);
      const { subject, action, object } = pattern;
      if (subject) options.push({ regex: RegExp(subject), type: 'subject' });
      if (action) options.push({ regex: RegExp(action), type: 'action' });
      if (object) options.push({ regex: RegExp(object), type: 'object' });
      add(subjects, options);

      return [...subjects];
    }
  }

  time(pattern?: PolicyPattern, options?: TimeOptions): boolean {
    const policies = Object.values(this.present);

    const sep = this.options.sep ?? SEP;
    const times: Record<string, Time> = {};
    if (!pattern || !Object.keys(pattern).length) {
      for (const time of policies.filter((p) => p.time?.length).map((p) => p.time))
        time?.forEach((t) => t && (times[`${t.cron_exp}${sep}${t.duration}`] = t));
    } else {
      type Option = { regex: RegExp; type: PropType };
      const add = (options: Option[]) => {
        policies
          .filter((p) => options.every(({ regex, type }) => regex.test(normalize(p[type], type))))
          .map((p) => p.time)
          .flat()
          .forEach((t) => t && (times[`${t.cron_exp}${sep}${t.duration}`] = t));
      };

      const options: Option[] = [];
      const { subject, action, object } = pattern;
      if (subject) options.push({ regex: RegExp(subject), type: 'subject' });
      if (action) options.push({ regex: RegExp(action), type: 'action' });
      if (object) options.push({ regex: RegExp(object), type: 'object' });
      add(options);
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
      type Option = { regex: RegExp; type: PropType };
      const add = (options: Option[]) => {
        policies
          .filter((p) => options.every(({ regex, type }) => regex.test(normalize(p[type], type))))
          .map((p) => p.location)
          .flat()
          .forEach((l) => l && locations.add(l));
      };

      const options: Option[] = [];
      const { subject, action, object } = pattern;
      if (subject) options.push({ regex: RegExp(subject), type: 'subject' });
      if (action) options.push({ regex: RegExp(action), type: 'action' });
      if (object) options.push({ regex: RegExp(object), type: 'object' });
      add(options);
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

  field<T>(data: any, pattern?: PolicyPattern | (<T>(data: T) => PolicyPattern), deep_copy = false): T {
    const policies = Object.values(this.present);

    const get = (data: any) => {
      const fields: string[][] = [];
      if (!pattern || !Object.keys(pattern).length) {
        for (const field of policies.filter((p) => p.field?.length).map((p) => p.field)) field && fields.push(field);
      } else {
        type Option = { regex: RegExp; type: PropType };
        const add = (options: Option[]) => {
          policies
            .filter((p) => options.every(({ regex, type }) => regex.test(normalize(p[type], type))))
            .map((p) => p.field)
            .forEach((f) => f && fields.push(f));
        };

        const options: Option[] = [];
        const { subject, action, object } = typeof pattern === 'function' ? pattern(data) : pattern;
        if (subject) options.push({ regex: RegExp(subject), type: 'subject' });
        if (action) options.push({ regex: RegExp(action), type: 'action' });
        if (object) options.push({ regex: RegExp(object), type: 'object' });
        add(options);
      }

      return fields;
    };

    const notation = accumulate(...get(data));
    if (!notation.length) return (deep_copy ? JSON.parse(JSON.stringify(data)) : data) as T;
    else {
      if (typeof data === 'object' && Array.isArray(data)) {
        return data.map((item) => {
          const notation = accumulate(...get(item));
          return filterByNotation(item, notation, deep_copy) as T;
        }) as T;
      } else return filterByNotation(data, notation, deep_copy) as T;
    }
  }

  filter<T>(data: any, pattern?: PolicyPattern | (<T>(data: T) => PolicyPattern), deep_copy = false): T {
    const policies = Object.values(this.present);

    const get = (data: any) => {
      const filters: string[][] = [];
      if (!pattern || !Object.keys(pattern).length) {
        for (const filter of policies.filter((p) => p.filter?.length).map((p) => p.filter)) filter && filters.push(filter);
      } else {
        type Option = { regex: RegExp; type: PropType };
        const add = (options: Option[]) => {
          policies
            .filter((p) => options.every(({ regex, type }) => regex.test(normalize(p[type], type))))
            .map((p) => p.filter)
            .forEach((f) => f && filters.push(f));
        };

        const options: Option[] = [];
        const { subject, action, object } = typeof pattern === 'function' ? pattern(data) : pattern;
        if (subject) options.push({ regex: RegExp(subject), type: 'subject' });
        if (action) options.push({ regex: RegExp(action), type: 'action' });
        if (object) options.push({ regex: RegExp(object), type: 'object' });
        add(options);
      }

      return filters;
    };

    const notation = accumulate(...get(data));
    if (!notation.length) return (deep_copy ? JSON.parse(JSON.stringify(data)) : data) as T;
    else {
      if (typeof data === 'object' && Array.isArray(data)) {
        return data.map((item) => {
          const notation = accumulate(...get(item));
          return filterByNotation(item, notation, deep_copy) as T;
        }) as T;
      } else return filterByNotation(data, notation, deep_copy) as T;
    }
  }

  update(policy: Policy<Sub, Act, Obj>, deep_copy = true) {
    validate(policy);

    policy = filterByNotation(policy, POLICY_NOTATION, deep_copy);

    const add = (key: string) => {
      if (key in this.present) {
        const { subject, action, object } = policy;
        throw new Error(`policy with subject "${subject}", action "${action}" and object "${object}" already exists`);
      } else this.present[key] = policy;
    };

    add(key(policy, this.options.sep));
  }
}
