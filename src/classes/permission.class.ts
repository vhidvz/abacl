/* eslint-disable @typescript-eslint/no-explicit-any */
import { CacheKey, ControlOptions, Policy, PropType, TimeOptions } from '../types';
import { Grant } from './grant.class';

export class Permission<Sub = string, Act = string, Obj = string> {
  readonly granted: boolean;
  readonly grant: Grant<Sub, Act, Obj>;

  constructor(granted: boolean, grant: Grant<Sub, Act, Obj>) {
    this.granted = granted;
    this.grant = grant;
  }

  get policies() {
    return this.grant.policies;
  }

  has(cKey: CacheKey<Sub, Act, Obj>): boolean {
    return this.grant.has(cKey);
  }

  scopes<Scope = string>(prop: PropType, cKey?: CacheKey<Sub, Act, Obj>): Scope[] {
    return this.grant.scopes(prop, cKey);
  }

  subjects(cKey?: CacheKey<Sub, Act, Obj>): Sub[] {
    return this.grant.subjects(cKey);
  }

  time(options?: TimeOptions, cKey?: CacheKey<Sub, Act, Obj>): boolean {
    return this.grant.time(options, cKey);
  }

  location(ip: string, cKey?: CacheKey<Sub, Act, Obj>): boolean {
    return this.grant.location(ip, cKey);
  }

  field<Data = any>(
    data: any,
    cKey?: CacheKey<Sub, Act, Obj> | ((data: any) => CacheKey<Sub, Act, Obj> | Promise<CacheKey<Sub, Act, Obj>>),
  ): Promise<Data> {
    return this.grant.field<Data>(data, cKey);
  }

  filter<Data = any>(
    data: any,
    cKey?: CacheKey<Sub, Act, Obj> | ((data: any) => CacheKey<Sub, Act, Obj> | Promise<CacheKey<Sub, Act, Obj>>),
  ): Promise<Data> {
    return this.grant.filter<Data>(data, cKey);
  }

  static build<Sub = string, Act = string, Obj = string>(
    granted: boolean,
    policies: Policy<Sub, Act, Obj>[],
    options?: ControlOptions,
  ): Permission<Sub, Act, Obj> {
    return new Permission(granted, new Grant(policies, options));
  }
}
