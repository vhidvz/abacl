import { PropType, ScopeValue } from '../utils';
import { ControlOptions } from './common.type';
import { Policy } from './policy.type';

export type CacheKey = {
  [k in PropType]: ScopeValue & ControlOptions;
};

export interface CacheInterface<Sub = string, Act = string, Obj = string> {
  flush(): Promise<'OK'>;

  get(key: CacheKey): Promise<Policy<Sub, Act, Obj>>;

  set(policy: Policy<Sub, Act, Obj>): Promise<'OK'>;
  del(policy: Policy<Sub, Act, Obj>): Promise<'OK'>;

  has(policy: Policy<Sub, Act, Obj>): Promise<boolean>;
}
