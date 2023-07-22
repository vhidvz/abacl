import { ControlOptions } from './common.type';
import { Policy } from './policy.type';
import { OK } from '../consts';

export type PropType = 'subject' | 'action' | 'object';
export type PropValue<M = string, S = string> = { main: M; scope?: S };

export type CacheKey<T = string, M = string, S = string> = {
  [K in PropType]?: { val: T | PropValue<M, S> } & ControlOptions;
};

export interface CacheInterfaceOptions {
  sep?: string;
  prefix?: string;
}

export interface CacheInterface<Sub = string, Act = string, Obj = string> {
  clear(): Promise<typeof OK>;

  get<T = string, M = string, S = string>(cKey: CacheKey<T, M, S>): Promise<Policy<Sub, Act, Obj>[]>;

  set(policy: Policy<Sub, Act, Obj>): Promise<typeof OK>;
  del(policy: Policy<Sub, Act, Obj>): Promise<typeof OK>;

  has(policy: Policy<Sub, Act, Obj>, options?: ControlOptions): Promise<boolean>;
}
