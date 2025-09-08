import { CacheKey, Pattern, Policy, PropValue } from '../../types';
import { MemoryDriverOptions } from './memory.driver';
export declare const memoryIgnore: (sep: string) => string;
export declare function parse<Prop = string, Main = string, Scope = string>(prop: Prop, options?: MemoryDriverOptions): PropValue<Main, Scope>;
export declare function key<Sub = string, Act = string, Obj = string>(polity: Policy<Sub, Act, Obj>, options?: MemoryDriverOptions): string;
export declare function pattern<Sub = string, Act = string, Obj = string>(cKey: CacheKey<Sub, Act, Obj>, options?: MemoryDriverOptions): Pattern;
