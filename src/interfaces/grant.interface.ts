/* eslint-disable @typescript-eslint/no-explicit-any */
import { PolicyPattern } from './permission.interface';
import { ControlOptions } from './acl.interface';

export type GrantOptions = ControlOptions;

export interface Grant<Sub = string, Act = string, Obj = string> {
  get(pattern?: PolicyPattern): Grant<Sub, Act, Obj>;

  has(pattern?: PolicyPattern): boolean;
  subjects(pattern?: PolicyPattern): Sub[];

  field<T = any>(data: any, pattern?: PolicyPattern): T;
  filter<T = any>(data: any, pattern?: PolicyPattern): T;
}
export type GrantInterface<Sub = string, Act = string, Obj = string> = Grant<Sub, Act, Obj>;
