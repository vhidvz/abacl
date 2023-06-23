import { IPermission } from './permission.interface';
import { ANY, ALL } from '../consts';

export interface Time {
  cron_exp: string;
  duration: number;
}

export interface TimeOptions {
  currentDate?: Date;
  tz?: string;
}

export interface Policy<Sub = string, Act = string, Obj = string> {
  subject: Sub;

  action: Act | typeof ANY;
  object: Obj | typeof ALL;

  time?: Time[];
  field?: string[];
  filter?: string[];
  location?: string[];
}

export interface ControlOptions {
  sep?: string;
  strict?: boolean;
}
export type AccessControlOptions = ControlOptions;

export interface AccessControlCanOptions<Sub = string, Act = string, Obj = string> {
  strict?: boolean;
  deep_copy?: boolean;
  callable?: (perm: IPermission<Sub, Act, Obj>) => boolean;
}

export interface IAccessControl<Sub = string, Act = string, Obj = string> {
  can(subjects: Sub[], action: Act, object: Obj, options?: AccessControlCanOptions<Sub, Act, Obj>): IPermission<Sub, Act, Obj>;
}
export type AccessControlInterface<Sub = string, Act = string, Obj = string> = IAccessControl<Sub, Act, Obj>;
