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

  has<T = string, M = string, S = string>(cKey: CacheKey<T, M, S>): boolean {
    return this.grant.has<T, M, S>(cKey);
  }

  scopes<Scope = string, T = string, M = string, S = string>(type: PropType, cKey?: CacheKey<T, M, S>): Scope[] {
    return this.grant.scopes<Scope, T, M, S>(type, cKey);
  }

  subjects<T = string, M = string, S = string>(cKey?: CacheKey<T, M, S>): Sub[] {
    return this.grant.subjects<T, M, S>(cKey);
  }

  time<T = string, M = string, S = string>(cKey?: CacheKey<T, M, S>, options?: TimeOptions): boolean {
    return this.grant.time<T, M, S>(cKey, options);
  }

  location<T = string, M = string, S = string>(ip: string, cKey?: CacheKey<T, M, S>): boolean {
    return this.grant.location<T, M, S>(ip, cKey);
  }

  async field<Data, T = string, M = string, S = string>(
    data: any,
    cKey?: CacheKey<T, M, S> | (<Data>(data: Data) => CacheKey<T, M, S> | Promise<CacheKey<T, M, S>>),
  ): Promise<Data> {
    return this.grant.field<Data, T, M, S>(data, cKey);
  }

  async filter<Data, T = string, M = string, S = string>(
    data: any,
    cKey?: CacheKey<T, M, S> | (<Data>(data: Data) => CacheKey<T, M, S> | Promise<CacheKey<T, M, S>>),
  ): Promise<Data> {
    return this.grant.filter<Data, T, M, S>(data, cKey);
  }

  static build<Sub = string, Act = string, Obj = string>(
    granted: boolean,
    policies: Policy<Sub, Act, Obj>[],
    options?: ControlOptions,
  ): Permission<Sub, Act, Obj> {
    return new Permission(granted, new Grant(policies, options));
  }
}
