/* eslint-disable @typescript-eslint/no-explicit-any */
import { ControlOptions, TimeOptions } from './acl.interface';
import { PolicyPattern } from './permission.interface';

export type GrantOptions = ControlOptions;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface IGrant<Sub = string, Act = string, Obj = string> {
  has(pattern: PolicyPattern): boolean;
  subjects(pattern?: PolicyPattern): Sub[];

  location(ip: string, pattern?: PolicyPattern): boolean;
  time(pattern?: PolicyPattern, options?: TimeOptions): boolean;

  field<T = any>(data: any, pattern?: PolicyPattern, deep_copy?: boolean): T;
  filter<T = any>(data: any, pattern?: PolicyPattern, deep_copy?: boolean): T;
}
export type GrantInterface<Sub = string, Act = string, Obj = string> = IGrant<Sub, Act, Obj>;
