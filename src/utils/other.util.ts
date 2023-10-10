/* eslint-disable @typescript-eslint/no-explicit-any */
import parser from 'cron-parser';

import { Time } from '../types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Notation } = require('notation');

export function accumulate(...notations: string[][]): string[] {
  notations = notations.filter((f) => f.length > 0);

  const first = notations.shift();
  if (!first) return [];

  let neg = first.filter((f) => f.startsWith('!'));
  let pos = first.filter((f) => !f.startsWith('!'));

  for (const notation of notations) {
    pos = [...new Set([...pos, ...notation.filter((f) => !f.startsWith('!'))])];
    neg = neg.filter((n) => notation.filter((f) => f.startsWith('!')).includes(n));
  }

  return [...pos, ...neg];
}

export function accessibility(time: Time, options?: { currentDate?: Date; tz?: string }): boolean {
  const { cron_exp, duration } = time;

  const currentDate = options?.currentDate ?? new Date();

  const prevDate = parser.parseExpression(cron_exp, options).prev();
  const nextDate = new Date(prevDate.getTime() + duration * 1000);

  return currentDate >= prevDate.toDate() && currentDate < nextDate;
}

export function filterByNotation(data: any, notation: string[], deep_copy = false) {
  if (!notation.length) throw new Error('Notation should not empty');

  if (deep_copy) data = JSON.parse(JSON.stringify(data));

  if (Array.isArray(data)) return data.map((datum) => new Notation(datum).filter(notation).value);
  else return new Notation(data).filter(notation).value;
}
