import { Time } from '../types';
export declare function accumulate(...notations: string[][]): string[];
export declare function accessibility(time: Time, options?: {
    currentDate?: Date;
    tz?: string;
}): boolean;
export declare function filterByNotation(data: any, notation: string[], deep_copy?: boolean): any;
