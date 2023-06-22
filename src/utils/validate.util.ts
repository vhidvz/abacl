import { isValidCron } from 'cron-validator';
import { v4, v6 } from 'cidr-regex';
import ipRegex from 'ip-regex';

import { Policy } from '../interfaces';

export function isIP(str: string): boolean {
  return ipRegex({ exact: true }).test(str);
}

export function isCIDR(str: string): boolean {
  return v4({ exact: true }).test(str) || v6({ exact: true }).test(str);
}

export function IP_CIDR(str: string): boolean {
  return isIP(str) || isCIDR(str);
}

export function isCRON(str: string) {
  return !/^(\*\s)+\*$/.test(str) && isValidCron(str, { seconds: true, alias: true });
}

export function validate<Sub = string, Act = string, Obj = string>(policy: Policy<Sub, Act, Obj>): void {
  const { subject, action, object, location, time } = policy;

  if (!subject || !action || !object) throw new Error('Policy is not valid');
  if (!location?.every((l) => IP_CIDR(l))) throw new Error('Policy location is not valid');
  if (!time?.every((t) => isCRON(t.cron_exp) && t.duration > 0)) throw new Error('Policy time is not valid');
}
