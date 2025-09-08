export interface Pattern {
    readonly source: string;
    test(val: string): boolean | Promise<boolean>;
}
