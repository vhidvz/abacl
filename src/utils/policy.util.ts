/* eslint-disable @typescript-eslint/no-explicit-any */
import { ALL, ANY, NULL, SEP, STRICT } from '../consts';
import { ControlOptions, Policy } from '../types';

export type PropType = 'subject' | 'action' | 'object';
export type ScopeValue = { main: string; scope?: string };

export function parse(str: any, sep: string = SEP): ScopeValue {
  if (typeof str !== 'string') throw new Error('Value is not parsable');

  const [main, scope] = str.split(sep);
  return { main, scope };
}

export function scope(str: string, options?: ControlOptions) {
  options = options ?? {};
  options.sep = options.sep ?? SEP;
  options.strict = options.strict ?? STRICT;

  return options.strict ? str : `[^${options.sep}][^${options.sep}]*`;
}

export function pattern(val: ScopeValue, type: PropType, options?: ControlOptions) {
  if (type === 'subject') val.scope = val.scope ?? NULL;
  else if (type === 'action') val.scope = val.scope ?? ANY;
  else if (type === 'object') val.scope = val.scope ?? ALL;
  else throw new Error('Pattern type is not valid');

  return `${val.main}${options?.sep ?? SEP}${scope(val.scope, options)}`;
}

export function normalize(str: any, type: PropType, options?: ControlOptions) {
  return pattern(parse(str, options?.sep ?? SEP), type, options);
}

export function key<Sub = string, Act = string, Obj = string>(polity: Policy<Sub, Act, Obj>, sep = SEP) {
  const subject = parse(polity.subject, sep);
  const action = parse(polity.action, sep);
  const object = parse(polity.object, sep);

  const subject_key = `${subject.main}${sep}${subject.scope ?? NULL}`;
  const action_key = `${action.main}${sep}${action.scope ?? ANY}`;
  const object_key = `${object.main}${sep}${object.scope ?? ALL}`;

  return [subject_key, action_key, object_key].join(sep);
}

export function regex<Sub = string, Act = string, Obj = string>(polity: Policy<Sub, Act, Obj>, options?: ControlOptions) {
  const sep = options?.sep ?? SEP;

  const subject = parse(polity.subject, sep);
  const action = parse(polity.action, sep);
  const object = parse(polity.object, sep);

  const subject_pattern = pattern(subject, 'subject', options);
  const action_pattern = pattern(action, 'action', options);
  const object_pattern = pattern(object, 'object', options);

  return RegExp(`^${[subject_pattern, action_pattern, object_pattern].join(sep)}$`);
}
