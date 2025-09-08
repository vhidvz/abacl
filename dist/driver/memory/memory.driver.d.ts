import { CacheInterface, CacheInterfaceOptions, CacheKey, Policy } from '../../types';
import { OK } from '../../consts';
export type MemoryDriverOptions = CacheInterfaceOptions;
export declare const DefaultMemoryDriverOptions: MemoryDriverOptions;
export declare class MemoryDriver<Sub = string, Act = string, Obj = string> implements CacheInterface<Sub, Act, Obj> {
    protected options: MemoryDriverOptions;
    protected present: Record<string, Policy<Sub, Act, Obj>>;
    constructor(options?: MemoryDriverOptions);
    clear(): typeof OK;
    get(cKey: CacheKey<Sub, Act, Obj>): Policy<Sub, Act, Obj>[];
    set(policy: Policy<Sub, Act, Obj>): typeof OK;
    del(policy: Policy<Sub, Act, Obj>): typeof OK;
    has(policy: Policy<Sub, Act, Obj>): boolean;
    static build<Sub = string, Act = string, Obj = string>(options?: MemoryDriverOptions): MemoryDriver<Sub, Act, Obj>;
}
