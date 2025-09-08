import { ControlOptions, Policy, TimeOptions, PropType, CacheKey } from '../types';
export declare class Grant<Sub = string, Act = string, Obj = string> {
    protected readonly options: ControlOptions;
    protected present: Record<string, Policy<Sub, Act, Obj>>;
    constructor(policies?: Policy<Sub, Act, Obj>[], options?: ControlOptions);
    set policies(policies: Policy<Sub, Act, Obj>[]);
    get policies(): Policy<Sub, Act, Obj>[];
    update(policy: Policy<Sub, Act, Obj>): void;
    exists(policy: Policy<Sub, Act, Obj>): boolean;
    delete(policy: Policy<Sub, Act, Obj>): boolean;
    has(cKey: CacheKey<Sub, Act, Obj>): boolean;
    scopes<S = string>(prop: PropType, cKey?: CacheKey<Sub, Act, Obj>): S[];
    subjects(cKey?: CacheKey<Sub, Act, Obj>): Sub[];
    time(options?: TimeOptions, cKey?: CacheKey<Sub, Act, Obj>): boolean;
    location(ip: string, cKey?: CacheKey<Sub, Act, Obj>): boolean;
    field<Data = any>(data: any, cKey?: CacheKey<Sub, Act, Obj> | ((data: any) => CacheKey<Sub, Act, Obj> | Promise<CacheKey<Sub, Act, Obj>>)): Promise<Data>;
    filter<Data = any>(data: any, cKey?: CacheKey<Sub, Act, Obj> | ((data: any) => CacheKey<Sub, Act, Obj> | Promise<CacheKey<Sub, Act, Obj>>)): Promise<Data>;
    protected notations(policies: Policy<Sub, Act, Obj>[], data: any, type: 'filter' | 'field', cKey?: CacheKey<Sub, Act, Obj> | ((data: any) => CacheKey<Sub, Act, Obj> | Promise<CacheKey<Sub, Act, Obj>>)): Promise<string[][]>;
}
