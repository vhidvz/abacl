/* eslint-disable @typescript-eslint/no-explicit-any */
import { TimeOptions } from './acl.interface';
import { IGrant } from './grant.interface';

export interface PolicyPattern {
  subject?: string;

  action?: string;
  object?: string;
}

export interface IPermission<Sub = string, Act = string, Obj = string> {
  readonly granted: boolean;
  readonly grant: IGrant<Sub, Act, Obj>;

  has(pattern: PolicyPattern): boolean;
  subjects(pattern?: PolicyPattern): Sub[];

  location(ip: string, pattern?: PolicyPattern): boolean;
  time(pattern?: PolicyPattern, options?: TimeOptions): boolean;

  field<T = any>(data: any, pattern?: PolicyPattern, deep_copy?: boolean): T;
  filter<T = any>(data: any, pattern?: PolicyPattern, deep_copy?: boolean): T;
}
export type PermissionInterface<Sub = string, Act = string, Obj = string> = IPermission<Sub, Act, Obj>;
