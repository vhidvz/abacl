/* eslint-disable @typescript-eslint/no-explicit-any */
import { isInSubnet } from 'is-in-subnet';

import { ControlOptions, Policy, Pattern, Time, TimeOptions, PropType, CacheKey } from '../types';
import { accessibility, accumulate, filterByNotation, isCIDR, validate } from '../utils';
import { POLICY_NOTATION, SEP, STRICT } from '../consts';
import { key, parse, pattern } from '../driver';

const addOptions = <Sub = string, Act = string, Obj = string>(cKey: CacheKey<Sub, Act, Obj>) => {
  const patterns: Pattern[] = [];
  const { subject, action, object, strict } = cKey;

  if (subject) patterns.push(pattern({ strict, subject }));
  if (action) patterns.push(pattern({ strict, action }));
  if (object) patterns.push(pattern({ strict, object }));

  return patterns;
};

export class Grant<Sub = string, Act = string, Obj = string> {
  protected readonly options: ControlOptions = {};
  protected present: Record<string, Policy<Sub, Act, Obj>> = {};

  constructor(policies?: Policy<Sub, Act, Obj>[], options?: ControlOptions) {
    const { strict } = options ?? {};

    this.options.strict = strict ?? STRICT;

    if (policies?.length) this.policies = policies;
  }

  set policies(policies: Policy<Sub, Act, Obj>[]) {
    if (!policies?.length) this.present = {};

    for (const policy of policies) this.update(policy);
  }

  get policies() {
    return Object.values(this.present);
  }

  update(policy: Policy<Sub, Act, Obj>) {
    validate(policy);

    policy = filterByNotation(policy, POLICY_NOTATION);

    this.present[key(policy)] = policy;
  }

  exists(policy: Policy<Sub, Act, Obj>): boolean {
    return key(policy) in this.present;
  }

  delete(policy: Policy<Sub, Act, Obj>): boolean {
    return delete this.present[key(policy)];
  }

  has(cKey: CacheKey<Sub, Act, Obj>): boolean {
    if (!Object.keys(cKey).length) throw new Error('Cache key is required');

    const keys = Object.keys(this.present);
    const test = (p: Pattern) => keys.some((i) => p.test(i));

    return test(pattern(cKey));
  }

  scopes<S = string>(prop: PropType, cKey?: CacheKey<Sub, Act, Obj>): S[] {
    if (!cKey || !Object.keys(cKey).length) {
      return [...new Set<S>(this.policies.map((p) => parse(p[prop]).scope as S).filter((s) => !!s))];
    } else {
      const add = (set: Set<S>, patterns: Pattern[]) => {
        this.policies
          .filter((p) => patterns.every((pattern) => pattern.test(key(p))))
          .map((p) => parse(p[prop]).scope as S)
          .forEach((s) => s && set.add(s));
      };

      const scopes = new Set<S>([]);
      add(scopes, addOptions(cKey));

      return [...scopes];
    }
  }

  subjects(cKey?: CacheKey<Sub, Act, Obj>): Sub[] {
    if (!cKey || !Object.keys(cKey).length) return [...new Set<Sub>(this.policies.map((p) => p.subject))];
    else {
      const add = (set: Set<Sub>, patterns: Pattern[]) => {
        this.policies.filter((p) => patterns.every((pattern) => pattern.test(key(p)))).map((p) => set.add(p.subject));
      };

      const subjects = new Set<Sub>([]);
      add(subjects, addOptions(cKey));

      return [...subjects];
    }
  }

  time(options?: TimeOptions, cKey?: CacheKey<Sub, Act, Obj>): boolean {
    const times: Record<string, Time> = {};

    if (!cKey || !Object.keys(cKey).length) {
      for (const time of this.policies.filter((p) => p.time?.length).map((p) => p.time))
        time?.forEach((t) => t && (times[`${t.cron_exp}${SEP}${t.duration}`] = t));
    } else {
      const add = (patterns: Pattern[]) => {
        this.policies
          .filter((p) => patterns.every((pattern) => pattern.test(key(p))))
          .map((p) => p.time)
          .flat()
          .forEach((t) => t && (times[`${t.cron_exp}${SEP}${t.duration}`] = t));
      };

      add(addOptions(cKey));
    }

    if (!Object.keys(times).length) return true;
    else return Object.values(times).some((t) => accessibility(t, options));
  }

  location(ip: string, cKey?: CacheKey<Sub, Act, Obj>): boolean {
    const locations = new Set<string>([]);

    if (!cKey || !Object.keys(cKey).length) {
      for (const location of this.policies.filter((p) => p.location?.length).map((p) => p.location))
        location?.forEach((l) => l && locations.add(l));
    } else {
      const add = (patterns: Pattern[]) => {
        this.policies
          .filter((p) => patterns.every((pattern) => pattern.test(key(p))))
          .map((p) => p.location)
          .flat()
          .forEach((l) => l && locations.add(l));
      };

      add(addOptions(cKey));
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

  async field<Data = any>(
    data: any,
    cKey?: CacheKey<Sub, Act, Obj> | ((data: any) => CacheKey<Sub, Act, Obj> | Promise<CacheKey<Sub, Act, Obj>>),
  ): Promise<Data> {
    const notation = accumulate(...(await this.notations(this.policies, data, 'field', cKey)));

    if (!notation.length) return data as Data;
    else {
      if (typeof cKey === 'function' && typeof data === 'object' && Array.isArray(data)) {
        return Promise.all(
          data.map(async (item) => {
            const notation = accumulate(...(await this.notations(this.policies, item, 'field', cKey)));
            return notation.length ? filterByNotation(item, notation) : item;
          }),
        ) as Data;
      } else return notation.length ? filterByNotation(data, notation) : data;
    }
  }

  async filter<Data = any>(
    data: any,
    cKey?: CacheKey<Sub, Act, Obj> | ((data: any) => CacheKey<Sub, Act, Obj> | Promise<CacheKey<Sub, Act, Obj>>),
  ): Promise<Data> {
    const notation = accumulate(...(await this.notations(this.policies, data, 'filter', cKey)));

    if (!notation.length) return data as Data;
    else {
      if (typeof cKey === 'function' && typeof data === 'object' && Array.isArray(data)) {
        return Promise.all(
          data.map(async (item) => {
            const notation = accumulate(...(await this.notations(this.policies, item, 'field', cKey)));
            return notation.length ? filterByNotation(item, notation) : item;
          }),
        ) as Data;
      } else return notation.length ? filterByNotation(data, notation) : data;
    }
  }

  protected async notations(
    policies: Policy<Sub, Act, Obj>[],
    data: any,
    type: 'filter' | 'field',
    cKey?: CacheKey<Sub, Act, Obj> | ((data: any) => CacheKey<Sub, Act, Obj> | Promise<CacheKey<Sub, Act, Obj>>),
  ) {
    const notations: string[][] = [];
    if (typeof cKey !== 'function' && (!cKey || !Object.keys(cKey).length)) {
      for (const notation of policies.filter((p) => p[type]?.length).map((p) => p[type])) notation && notations.push(notation);
    } else {
      const add = (patterns: Pattern[]) => {
        policies
          .filter((p) => patterns.every((pattern) => pattern.test(key(p))))
          .map((p) => p[type])
          .forEach((f) => f && notations.push(f));
      };

      add(addOptions(typeof cKey === 'function' ? await cKey(data) : cKey));
    }

    return notations;
  }
}
