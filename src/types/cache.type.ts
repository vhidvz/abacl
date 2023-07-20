import { ControlOptions } from './common.type';
import { Policy } from './policy.type';
import { OK } from '../consts';

export type PropType = 'subject' | 'action' | 'object';
export type PropValue<M = string, S = string> = { main: M; scope?: S };

export type CacheKey<M = string, S = string> = {
  [P in PropType]?: { val: any | PropValue<M, S> } & ControlOptions;
};

export interface CacheInterfaceOptions {
  sep?: string;
  prefix?: string;
}

export interface CacheInterface<Sub = string, Act = string, Obj = string> {
  clear(): Promise<typeof OK>;

  get<M = string, S = string>(key: CacheKey<M, S>): Promise<Policy<Sub, Act, Obj>[]>;

  set(policy: Policy<Sub, Act, Obj>): Promise<typeof OK>;
  del(policy: Policy<Sub, Act, Obj>): Promise<typeof OK>;

  has(policy: Policy<Sub, Act, Obj>, options?: ControlOptions): Promise<boolean>;
}
