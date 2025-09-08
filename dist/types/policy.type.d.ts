export interface Time {
    cron_exp: string;
    duration: number;
}
export interface Policy<Sub = string, Act = string, Obj = string> {
    subject: Sub;
    action: Act;
    object: Obj;
    time?: Time[];
    field?: string[];
    filter?: string[];
    location?: string[];
}
