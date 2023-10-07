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

  scopes<Scope = string>(type: PropType, cKey?: CacheKey<Sub, Act, Obj>): Scope[] {
    return this.grant.scopes(type, cKey);
  }

  subjects(cKey?: CacheKey<Sub, Act, Obj>): Sub[] {
    return this.grant.subjects(cKey);
  }

  time(cKey?: CacheKey<Sub, Act, Obj>, options?: TimeOptions): boolean {
    return this.grant.time(cKey, options);
  }

  location(ip: string, cKey?: CacheKey<Sub, Act, Obj>): boolean {
    return this.grant.location(ip, cKey);
  }

  async field<Data>(
    data: any,
    cKey?: CacheKey<Sub, Act, Obj> | (<Data>(data: Data) => CacheKey<Sub, Act, Obj> | Promise<CacheKey<Sub, Act, Obj>>),
  ): Promise<Data> {
    return this.grant.field<Data>(data, cKey);
  }

  async filter<Data>(
    data: any,
    cKey?: CacheKey<Sub, Act, Obj> | (<Data>(data: Data) => CacheKey<Sub, Act, Obj> | Promise<CacheKey<Sub, Act, Obj>>),
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
