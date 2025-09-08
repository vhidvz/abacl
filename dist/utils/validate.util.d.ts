import { Policy } from '../types';
export declare function isIP(str: string): boolean;
export declare function isCIDR(str: string): boolean;
export declare function IP_CIDR(str: string): boolean;
export declare function isCRON(str: string): boolean;
export declare function validate<Sub = string, Act = string, Obj = string>(policy: Policy<Sub, Act, Obj>): void;
