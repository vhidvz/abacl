/* eslint-disable @typescript-eslint/no-explicit-any */
import { Grant } from './grant.interface';

export interface PolicyPattern {
  subject?: RegExp;

  action?: RegExp;
  object?: RegExp;
}

export interface Permission<Sub = string, Act = string, Obj = string> {
  readonly granted: boolean;
  readonly grant: Grant<Sub, Act, Obj>;

  has(pattern?: PolicyPattern): boolean;
  subjects(pattern?: PolicyPattern): Sub[];

  field<T = any>(data: any, pattern?: PolicyPattern): T;
  filter<T = any>(data: any, pattern?: PolicyPattern): T;
}
export type PermissionInterface<Sub = string, Act = string, Obj = string> = Permission<Sub, Act, Obj>;
