import { ControlOptions } from './common.type';
import { Policy } from './policy.type';
import { OK } from '../consts';
export type PropType = 'subject' | 'action' | 'object';
export type PropValue<M = string, S = string> = {
    main: M;
    scope?: S;
};
export type CacheKey<Sub = string, Act = string, Obj = string> = {
    subject?: Sub | (PropValue & ControlOptions);
    action?: Act | (PropValue & ControlOptions);
    object?: Obj | (PropValue & ControlOptions);
} & ControlOptions;
export interface CacheInterfaceOptions {
    sep?: string;
    prefix?: string;
}
export interface CacheInterface<Sub = string, Act = string, Obj = string> {
    clear(): typeof OK | Promise<typeof OK>;
    get(cKey: CacheKey<Sub, Act, Obj>): Policy<Sub, Act, Obj>[] | Promise<Policy<Sub, Act, Obj>[]>;
    set(policy: Policy<Sub, Act, Obj>): typeof OK | Promise<typeof OK>;
    del(policy: Policy<Sub, Act, Obj>): typeof OK | Promise<typeof OK>;
    has(policy: Policy<Sub, Act, Obj>, options?: ControlOptions): boolean | Promise<boolean>;
}
