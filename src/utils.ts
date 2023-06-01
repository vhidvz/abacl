import parser from 'cron-parser';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Notation } = require('notation');

export const NameRegex = '[a-zA-Z_][\\w-]*\\w';

export const GrantRegex = (options: { sep?: string; action?: string; object?: string; scope?: string; strict?: boolean }) => {
  const object = options.object ?? NameRegex;
  const action = options.action ?? NameRegex;
  const scope = options.scope ?? NameRegex;
  const strict = options.strict ?? false;
  const finalScope = strict ? scope : `(:${scope})?`;

  const sep = options.sep ?? ':';

  return RegExp(`^${object}${sep}${action}${finalScope}$`);
};

/**
 * It checks if the current date is between the previous date and the next date.
 *
 * @param  - cron_exp: string;
 * @param  - duration: number;
 *
 * @returns A boolean value
 */
export function check({ cron_exp, duration }: { cron_exp: string; duration: number }, options?: { currentDate?: Date; tz?: string }): boolean {
  const currentDate = options?.currentDate ?? new Date();

  const prevDate = parser.parseExpression(cron_exp, options).prev();
  const nextDate = new Date(prevDate.getTime() + duration * 1000);

  return currentDate >= prevDate.toDate() && currentDate < nextDate;
}

/**
 * It takes an array of arrays of filters, and returns an array of filter
 *
 * @param {string[][]} filters - string[][]
 *
 * @returns An array of strings.
 */
export function accumulate(...filters: string[][]): string[] {
  filters = filters.filter((f) => f.length > 0);

  const result = filters.shift();
  if (!result) return [];

  let neg = result.filter((f) => f.startsWith('!'));
  let pos = result.filter((f) => !f.startsWith('!'));

  for (const filter of filters) {
    pos = [...new Set([...pos, ...filter.filter((f) => !f.startsWith('!'))])];
    neg = neg.filter((n) => filter.filter((f) => f.startsWith('!')).includes(n));
  }

  return [...pos, ...neg];
}
/**
 * It filters an object or array of objects by a given notation
 *
 * @param {T} data - The data to filter.
 * @param {string[]} notation - The notation to filter by.
 * @param [deep_copy=true] - If true, the data will be converted to a plain object.
 *
 * @returns A new object with the notation filtered out.
 */
export function filterByNotation<T = unknown | unknown[]>(data: T, notation: string[], deep_copy = true): Partial<T> | Partial<T>[] {
  if (deep_copy) data = JSON.parse(JSON.stringify(data));
  if (Array.isArray(data)) return data.map((datum) => new Notation(datum).filter(notation).value);
  else return new Notation(data).filter(notation).value;
}
