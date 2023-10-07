/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CacheKey, ControlOptions, Pattern, Policy, PropType, PropValue } from '../../types';
import { DefaultMemoryDriverOptions, MemoryDriverOptions } from './memory.driver';
import { ALL, ANY, NULL, SEP, STRICT } from '../../consts';
import { isStrict } from 'utils';

export const memoryIgnore = (sep: string) => `[^${sep}][^${sep}]*`;

export function parse<Prop = string, Main = string, Scope = string>(
  prop: Prop,
  options: MemoryDriverOptions = DefaultMemoryDriverOptions,
): PropValue<Main, Scope> {
  options.sep = options.sep || SEP;
  const { sep, prefix } = options;

  if (prefix) prop = String(prop).replace(prefix + sep, '') as Prop;

  const [main, scope] = String(prop).split(sep) as [Main, Scope];
  return { main, scope };
}

export function key<Sub = string, Act = string, Obj = string>(
  polity: Policy<Sub, Act, Obj>,
  options: MemoryDriverOptions = DefaultMemoryDriverOptions,
): string {
  options.sep = options.sep || SEP;
  const { sep, prefix } = options;

  const subject = parse<Sub>(polity.subject, options);
  const action = parse<Act>(polity.action, options);
  const object = parse<Obj>(polity.object, options);

  const subject_key = `${subject.main}${sep}${subject.scope ?? NULL}`;
  const action_key = `${action.main}${sep}${action.scope ?? ANY}`;
  const object_key = `${object.main}${sep}${object.scope ?? ALL}`;

  if (!prefix) return [subject_key, action_key, object_key].join(sep);
  else return [prefix, subject_key, action_key, object_key].join(sep);
}

export function pattern<Sub = string, Act = string, Obj = string>(
  cKey: CacheKey<Sub, Act, Obj>,
  options: MemoryDriverOptions = DefaultMemoryDriverOptions,
): Pattern {
  options.sep = options.sep || SEP;
  const { sep, prefix } = options;

  const ignore = memoryIgnore(sep);

  const strict = <T = string>(prop: T, options?: ControlOptions) => (options?.strict ?? STRICT ? prop : ignore);

  const regex = (prop?: PropType): string => {
    if (prop && prop in cKey) {
      const { main, scope } = typeof cKey[prop] === 'string' ? parse(cKey[prop]) : (cKey[prop]['val'] as PropValue);

      const val = scope ?? ((prop === 'subject' && NULL) || (prop === 'action' && ANY) || (prop === 'object' && ALL));

      return `${main}${sep}${strict(val, { strict: isStrict(prop, (cKey[prop] ?? {})['strict'] ?? cKey['strict']) })}`;
    } else return [ignore, ignore].join(sep);
  };

  if (!prefix) return RegExp(`^${[regex('subject'), regex('action'), regex('object')].join(sep)}$`);
  else return RegExp(`^${[prefix, regex('subject'), regex('action'), regex('object')].join(sep)}$`);
}
