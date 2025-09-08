import { CacheKey, ControlOptions, Policy, PropType, TimeOptions } from '../types';
import { Grant } from './grant.class';
export declare class Permission<Sub = string, Act = string, Obj = string> {
    readonly granted: boolean;
    readonly grant: Grant<Sub, Act, Obj>;
    constructor(granted: boolean, grant: Grant<Sub, Act, Obj>);
    get policies(): Policy<Sub, Act, Obj>[];
    has(cKey: CacheKey<Sub, Act, Obj>): boolean;
    scopes<Scope = string>(prop: PropType, cKey?: CacheKey<Sub, Act, Obj>): Scope[];
    subjects(cKey?: CacheKey<Sub, Act, Obj>): Sub[];
    time(options?: TimeOptions, cKey?: CacheKey<Sub, Act, Obj>): boolean;
    location(ip: string, cKey?: CacheKey<Sub, Act, Obj>): boolean;
    field<Data = any>(data: any, cKey?: CacheKey<Sub, Act, Obj> | ((data: any) => CacheKey<Sub, Act, Obj> | Promise<CacheKey<Sub, Act, Obj>>)): Promise<Data>;
    filter<Data = any>(data: any, cKey?: CacheKey<Sub, Act, Obj> | ((data: any) => CacheKey<Sub, Act, Obj> | Promise<CacheKey<Sub, Act, Obj>>)): Promise<Data>;
    static build<Sub = string, Act = string, Obj = string>(granted: boolean, policies: Policy<Sub, Act, Obj>[], options?: ControlOptions): Permission<Sub, Act, Obj>;
}
