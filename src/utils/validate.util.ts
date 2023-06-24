/* eslint-disable @typescript-eslint/no-var-requires */
import { isValidCron } from 'cron-validator';

import { cidrRegex, ipRegex } from './regex.util';
import { Policy } from '../types';

export function isIP(str: string): boolean {
  return ipRegex.test(str);
}

export function isCIDR(str: string): boolean {
  return cidrRegex.test(str);
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
  if (location?.length && !location?.every((l) => IP_CIDR(l))) throw new Error('Policy location is not valid');
  if (time?.length && !time?.every((t) => isCRON(t.cron_exp) && t.duration > 0)) throw new Error('Policy time is not valid');
}
