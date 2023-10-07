import { ControlOptions } from './common.type';
import { Policy } from './policy.type';
import { OK } from '../consts';

export type PropType = 'subject' | 'action' | 'object';
export type PropValue<M = string, S = string> = { main: M; scope?: S };

export type CacheKey<Sub = string, Act = string, Obj = string> = {
  strict?: boolean | string; // true is default value

  subject?: Sub | { val: Sub; strict?: boolean } | (PropValue & { strict?: boolean });
  action?: Act | { val: Act; strict?: boolean } | (PropValue & { strict?: boolean });
  object?: Obj | { val: Obj; strict?: boolean } | (PropValue & { strict?: boolean });
};

export interface CacheInterfaceOptions {
  sep?: string;
  prefix?: string;
}

export interface CacheInterface<Sub = string, Act = string, Obj = string> {
  clear(): Promise<typeof OK>;

  get(cKey: CacheKey<Sub, Act, Obj>): Promise<Policy<Sub, Act, Obj>[]>;

  set(policy: Policy<Sub, Act, Obj>): Promise<typeof OK>;
  del(policy: Policy<Sub, Act, Obj>): Promise<typeof OK>;

  has(policy: Policy<Sub, Act, Obj>, options?: ControlOptions): Promise<boolean>;
}
