/* eslint-disable @typescript-eslint/no-explicit-any */
import { PermissionInterface, PolicyPattern, TimeOptions } from '../types';
import { Grant } from './grant.class';

export class Permission<Sub = string, Act = string, Obj = string> implements PermissionInterface<Sub, Act, Obj> {
  readonly granted: boolean;
  readonly grant: Grant<Sub, Act, Obj>;

  constructor(granted: boolean, grant: Grant<Sub, Act, Obj>) {
    this.granted = granted;
    this.grant = grant;
  }

  has(pattern: PolicyPattern): boolean {
    return this.grant.has(pattern);
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

  field<T = any>(data: any, pattern?: PolicyPattern, deep_copy?: boolean): T {
    return this.grant.field<T>(data, pattern, deep_copy);
  }

  filter<T = any>(data: any, pattern?: PolicyPattern, deep_copy?: boolean): T {
    return this.grant.filter<T>(data, pattern, deep_copy);
  }

  get policies() {
    return this.grant.policies;
  }
}
