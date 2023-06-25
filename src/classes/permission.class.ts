/* eslint-disable @typescript-eslint/no-explicit-any */
import { ControlOptions, Policy, PolicyPattern, TimeOptions } from '../types';
import { Grant } from './grant.class';
import { PropType } from '../utils';

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

  has(pattern: PolicyPattern): boolean {
    return this.grant.has(pattern);
  }

  scopes<T = string>(type: PropType, pattern?: PolicyPattern): T[] {
    return this.grant.scopes<T>(type, pattern);
  }

  subjects(pattern?: PolicyPattern): Sub[] {
    return this.grant.subjects(pattern);
  }

  time(pattern?: PolicyPattern, options?: TimeOptions): boolean {
    return this.grant.time(pattern, options);
  }

  location(ip: string, pattern?: PolicyPattern): boolean {
    return this.grant.location(ip, pattern);
  }

  field<T>(data: any, pattern?: PolicyPattern | (<T>(data: T) => PolicyPattern), deep_copy = false): T {
    return this.grant.field<T>(data, pattern, deep_copy);
  }

  filter<T>(data: any, pattern?: PolicyPattern | (<T>(data: T) => PolicyPattern), deep_copy = false): T {
    return this.grant.filter<T>(data, pattern, deep_copy);
  }

  static build<Sub = string, Act = string, Obj = string>(
    granted: boolean,
    policies: Policy<Sub, Act, Obj>[],
    options?: ControlOptions,
  ): Permission<Sub, Act, Obj> {
    return new Permission(granted, new Grant(policies, options));
  }
}
