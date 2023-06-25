/* eslint-disable @typescript-eslint/no-explicit-any */
import { isInSubnet } from 'is-in-subnet';

import { PropType, accessibility, accumulate, filterByNotation, isCIDR, key, normalize, parse, validate } from '../utils';
import { ControlOptions, Policy, PolicyPattern, Time, TimeOptions } from '../types';
import { POLICY_NOTATION, SEP, STRICT } from '../consts';

type AddOption = { regex: RegExp; type: PropType };

export class Grant<Sub = string, Act = string, Obj = string> {
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

    const test = (regex: RegExp, type: PropType) => policies.some((p) => regex.test(normalize(p[type], type, this.options)));

    let flag = true;
    const { subject, action, object } = pattern;
    const policies = Object.values(this.present);
    if (subject) flag &&= test(RegExp(subject), 'subject');
    if (action) flag &&= test(RegExp(action), 'action');
    if (object) flag &&= test(RegExp(object), 'object');

    return flag && (!!subject || !!action || !!object);
  }

  scopes<T = string>(type: PropType, pattern?: PolicyPattern): T[] {
    const policies = Object.values(this.present);

    if (!pattern || !Object.keys(pattern).length) {
      return [...new Set<T>(policies.map((p) => parse(p[type]).scope as T).filter((s) => !!s))];
    } else {
      const add = (set: Set<T>, options: AddOption[]) => {
        policies
          .filter((p) => options.every(({ regex, type }) => regex.test(normalize(p[type], type))))
          .map((p) => parse(p[type]).scope as T)
          .forEach((s) => s && set.add(s));
      };

      const scopes = new Set<T>([]);
      add(scopes, this.addOptions(pattern));

      return [...scopes];
    }
  }

  subjects(pattern?: PolicyPattern): Sub[] {
    const policies = Object.values(this.present);

    if (!pattern || !Object.keys(pattern).length) return [...new Set<Sub>(policies.map((p) => p.subject))];
    else {
      const add = (set: Set<Sub>, options: AddOption[]) => {
        policies
          .filter((p) => options.every(({ regex, type }) => regex.test(normalize(p[type], type))))
          .map((p) => set.add(p.subject));
      };

      const subjects = new Set<Sub>([]);
      add(subjects, this.addOptions(pattern));

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
      const add = (options: AddOption[]) => {
        policies
          .filter((p) => options.every(({ regex, type }) => regex.test(normalize(p[type], type))))
          .map((p) => p.time)
          .flat()
          .forEach((t) => t && (times[`${t.cron_exp}${sep}${t.duration}`] = t));
      };

      add(this.addOptions(pattern));
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
      const add = (options: AddOption[]) => {
        policies
          .filter((p) => options.every(({ regex, type }) => regex.test(normalize(p[type], type))))
          .map((p) => p.location)
          .flat()
          .forEach((l) => l && locations.add(l));
      };

      add(this.addOptions(pattern));
    }

    if (!locations.size) return true;
    else {
      return (
        isInSubnet(
          ip,
          [...locations].filter((l) => isCIDR(l)),
        ) || locations.has(ip)
      );
    }
  }

  field<T>(data: any, pattern?: PolicyPattern | (<T>(data: T) => PolicyPattern), deep_copy = false): T {
    const policies = Object.values(this.present);

    const notation = accumulate(...this.notations(policies, data, 'field', pattern));
    if (!notation.length) return (deep_copy ? JSON.parse(JSON.stringify(data)) : data) as T;
    else {
      if (typeof pattern === 'function' && typeof data === 'object' && Array.isArray(data)) {
        return data.map((item) => {
          const notation = accumulate(...this.notations(policies, item, 'field', pattern));
          return filterByNotation(item, notation, deep_copy) as T;
        }) as T;
      } else return filterByNotation(data, notation, deep_copy) as T;
    }
  }

  filter<T>(data: any, pattern?: PolicyPattern | (<T>(data: T) => PolicyPattern), deep_copy = false): T {
    const policies = Object.values(this.present);

    const notation = accumulate(...this.notations(policies, data, 'filter', pattern));
    if (!notation.length) return (deep_copy ? JSON.parse(JSON.stringify(data)) : data) as T;
    else {
      if (typeof pattern === 'function' && typeof data === 'object' && Array.isArray(data)) {
        return data.map((item) => {
          const notation = accumulate(...this.notations(policies, item, 'filter', pattern));
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

  protected notations(
    policies: Policy<Sub, Act, Obj>[],
    data: any,
    type: 'filter' | 'field',
    pattern?: PolicyPattern | (<T>(data: T) => PolicyPattern),
  ) {
    const notations: string[][] = [];
    if (!pattern || !Object.keys(pattern).length) {
      for (const notation of policies.filter((p) => p[type]?.length).map((p) => p[type])) notation && notations.push(notation);
    } else {
      const add = (options: AddOption[]) => {
        policies
          .filter((p) => options.every(({ regex, type }) => regex.test(normalize(p[type], type))))
          .map((p) => p[type])
          .forEach((f) => f && notations.push(f));
      };

      add(this.addOptions(typeof pattern === 'function' ? pattern(data) : pattern));
    }

    return notations;
  }

  private addOptions(pattern: PolicyPattern) {
    const options: AddOption[] = [];
    const { subject, action, object } = pattern;
    if (subject) options.push({ regex: RegExp(subject), type: 'subject' });
    if (action) options.push({ regex: RegExp(action), type: 'action' });
    if (object) options.push({ regex: RegExp(object), type: 'object' });
    return options;
  }
}
