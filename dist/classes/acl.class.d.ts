import { CacheInterface, ControlOptions, Policy, PropValue } from '../types';
import { OK } from '../consts';
import { Permission } from './permission.class';
export interface CanOptions<Sub = string, Act = string, Obj = string> extends ControlOptions {
    callable?: (perm: Permission<Sub, Act, Obj>) => boolean | Promise<boolean>;
}
export interface AccessControlOptions<Sub = string, Act = string, Obj = string> extends ControlOptions {
    driver?: 'memory' | CacheInterface<Sub, Act, Obj> | (() => CacheInterface<Sub, Act, Obj> | Promise<CacheInterface<Sub, Act, Obj>>);
}
export declare class AccessControl<Sub = string, Act = string, Obj = string> {
    protected driver: CacheInterface<Sub, Act, Obj>;
    protected readonly options: ControlOptions;
    constructor(policies?: Policy<Sub, Act, Obj>[], options?: AccessControlOptions<Sub, Act, Obj>);
    protected setDriver(driver?: AccessControlOptions<Sub, Act, Obj>['driver']): Promise<void>;
    clear(): Promise<typeof OK>;
    exists(policy: Policy<Sub, Act, Obj>): Promise<boolean>;
    delete(policy: Policy<Sub, Act, Obj>): Promise<typeof OK>;
    update(policy: Policy<Sub, Act, Obj>): Promise<typeof OK>;
    can(subjects: (Sub | (PropValue & ControlOptions))[], action: Act | (PropValue & ControlOptions), object: Obj | (PropValue & ControlOptions), options?: CanOptions<Sub, Act, Obj>): Promise<Permission<Sub, Act, Obj>>;
}
