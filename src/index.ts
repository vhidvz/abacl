import { SomeJSONSchema } from 'ajv/dist/types/json-schema';
import { isValidCron } from 'cron-validator';
import Ajv, { ValidateFunction } from 'ajv';
import { isInSubnet } from 'is-in-subnet';
import parser from 'cron-parser';
import CIDR from 'cidr-regex';
import IP from 'ip-regex';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Notation } = require('notation');

/**
 * `AccessAbility` is a type that represents a permission to do something on something.
 *
 * @property {string} role - The role that the ability is for.
 * @property {string | 'any'} action - The action that the user is trying to perform.
 * @property {string | 'all'} subject - The subject of the permission. This can be a string or the
 * special value 'all'.
 * @property {string[]} field - The field that the user can access.
 * @property {string[]} filter - A list of filters that can be used to filter the data.
 * @property {string[]} environments - IP addresses or CIDR ranges that the rule applies to.
 * @property {{
 *     expression: string; // start cron expression
 *     duration: number; // in seconds
 *   }[]} availabilities - This is an array of objects that contain a cron expression and a duration.
 * The cron expression is used to determine when the ability is available. The duration is used to
 * determine how long the ability is available.
 */
export type AccessAbility = {
  role: string;
  action: string | 'any'; // scoped by separator
  subject: string | 'all'; // scoped by separator
  field?: string[]; // does not affect on grant or deny permission
  filter?: string[]; // does not affect on grant or deny permission
  environments?: string[]; // ip or cidr
  availabilities?: {
    expression: string; // start cron expression
    duration: number; // in seconds
  }[];
};

/**
 * It filters an object or array of objects by a given notation
 *
 * @param {T} data - The data to filter.
 * @param {string[]} notation - The notation to filter by.
 * @param [to_plain=true] - If true, the data will be converted to a plain object.
 *
 * @returns A new object with the notation filtered out.
 */
export function filterByNotation<T = unknown | unknown[]>(
  data: T,
  notation: string[],
  to_plain = true,
): Partial<T> | Partial<T>[] {
  if (to_plain) data = JSON.parse(JSON.stringify(data));
  if (Array.isArray(data)) return data.map((datum) => new Notation(datum).filter(notation).value);
  else return new Notation(data).filter(notation).value;
}

/* It's a wrapper around a map of permission grants, with some convenience methods */
export class Permission {
  private readonly _granted: boolean;
  private readonly _grants: PermissionGrant;

  /**
   * The constructor function takes two parameters, a boolean and a PermissionGrant object. It sets the
   * _grants property to the value of the grants parameter and the _granted property to the value of
   * the granted parameter
   *
   * @param {boolean} granted - boolean - This is a boolean value that indicates whether the permission
   * was granted or not.
   * @param {PermissionGrant} grants - PermissionGrant - This is the permission grant object that
   * contains the permissions that were requested.
   */
  constructor(granted: boolean, grants: PermissionGrant) {
    this._grants = grants;
    this._granted = granted;
  }

  /**
   * It returns the value of the private variable _grants.
   *
   * @returns The grants property is being returned.
   */
  public get grants() {
    return this._grants;
  }

  /**
   * It returns the value of the private variable _granted.
   *
   * @returns The value of the _granted property.
   */
  public get granted() {
    return this._granted;
  }

  /**
   * It returns true if any of the keys in the grants object match the pattern
   *
   * @param {string} pattern - The pattern to match against.
   *
   * @returns A boolean value.
   */
  public has(pattern: string): boolean {
    return Object.keys(this.grants).some((k) => RegExp(pattern).test(k));
  }

  /**
   * > If the pattern is not provided, it defaults to `.*` (which matches everything). If the pattern
   * is not found, throw an error. Otherwise, return the grant
   *
   * @param {string} [pattern] - The pattern to match against. If not provided, it will match against
   * all patterns.
   *
   * @returns The grant object that matches the pattern.
   */
  public get(pattern?: string): Grant {
    if (!pattern) pattern = '.*';
    if (!this.has(pattern)) throw new Error(`No grant found for pattern ${pattern}`);
    return this.grants[Object.keys(this.grants).find((k) => RegExp(pattern ?? '.*').test(k)) ?? pattern];
  }

  /**
   * It returns true if the object has any property
   *
   * @returns A boolean value.
   */
  public hasAny(): boolean {
    return this.has('any:.*');
  }

  /**
   * It returns true if the user has the permission '*:all'
   *
   * @returns A boolean value.
   */
  public hasAll(): boolean {
    return this.has('.*:all');
  }
}

/**
 * `Grant` is an object with a bunch of properties that are functions.
 *
 * @property {string} role - The role that the grant is for.
 * @property {string | 'any'} action - The action that the user is trying to perform.
 * @property {string | 'all'} subject - The subject of the grant. This can be a string or the string
 * 'all'.
 * @property field - This is a function that takes in the data and returns a partial of the data.
 * @property filter - This is a function that will be called on the data that is being returned. It
 * will be called with the data that is being returned and a boolean that indicates whether the data is
 * being returned to the client or not. If the data is being returned to the client, the boolean will
 * be true.
 * @property environments - (ip: string, strict?: boolean) => boolean;
 * @property availabilities - A function that takes in an object with a date and timezone and returns a
 * boolean.
 */
export type Grant = {
  role: string;
  action: string | 'any';
  subject: string | 'all';
  /* A function that takes in the data and returns a partial of the data. */
  field: <T = unknown | unknown[]>(data: T, to_plain?: boolean) => Partial<T> | Partial<T>[];
  /* A function that takes in a data object and returns a partial of the data. */
  filter: <T = unknown | unknown[]>(data: T, to_plain?: boolean) => Partial<T> | Partial<T>[];
  /* A function that takes in an IP address and returns a boolean. */
  environments: (ip: string, strict?: boolean) => boolean;
  /* A function that takes in an object with a date and timezone and returns a boolean. */
  availabilities: (available?: { date?: Date; tz?: string }, strict?: boolean) => boolean;
};

/**
 * `PermissionGrant` is an object whose keys are strings and whose values are `Grant`s.
 *
 * @property {Grant} [key: Grant] - This is the name of the permission.
 */
export type PermissionGrant = {
  [key: string]: Grant;
};

/* If the user has any role that grants access to any action on any subject, or any role that grants
access to the given action on any subject, or any role that grants access to any action on the given
subject, or any role that grants access to the given action on the given subject, then return a
permission object with the granted flag set to true and the grants object set to the union of all
grants for the given action and subject */
export default class AccessControl {
  private _avj: Ajv;
  private _sep: string;

  /* A private property that is used to store the ACL. */
  private _acl: {
    [key: string]: PermissionGrant;
  };

  /* A JSON schema that is used to validate the ACL. */
  private _schema: SomeJSONSchema = {
    type: 'object',
    properties: {
      role: { type: 'string', minLength: 1 },
      action: { type: 'string', minLength: 1 },
      subject: { type: 'string', minLength: 1 },
      field: { type: 'array', items: { type: 'string' } },
      filter: { type: 'array', items: { type: 'string' } },
      environments: { type: 'array', items: { type: 'string', format: 'environment' } },
      availabilities: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            expression: { type: 'string', format: 'cron' },
            duration: { type: 'number' },
          },
          required: ['expression', 'duration'],
        },
      },
    },
    required: ['role', 'action', 'subject'],
    additionalProperties: false,
  };

  /* A protected property that is used to validate the ACL. */
  protected validate: ValidateFunction;

  /**
   * It takes an array of AccessAbility objects and a separator string, and it creates a new
   * AccessAbilityList object
   *
   * @param {AccessAbility[]} acl - AccessAbility[]
   * @param [sep=:] - The separator used to separate the environment from the action.
   */
  constructor(acl: AccessAbility[], sep = ':') {
    this._acl = {};
    this._sep = sep;
    this._avj = new Ajv();

    this._avj.addFormat('environment', {
      type: 'string',
      validate: (env: string) => IP({ exact: true }).test(env) || CIDR({ exact: true }).test(env),
    });

    this._avj.addFormat('cron', {
      type: 'string',
      validate: (cron: string) => !/^(\*\s)+\*$/.test(cron) && isValidCron(cron, { seconds: true, alias: true }),
    });

    this.validate = this._avj.compile(this._schema);
    this.acl = acl;
  }

  /**
   * It takes an AccessAbility object and adds it to the ACL
   *
   * @param {AccessAbility} ability - AccessAbility
   *
   * @returns The return value is a function that takes in a string and returns a boolean.
   */
  public update(ability: AccessAbility): void {
    const sep = this._sep;

    const role = ability.role;
    const action = ability.action.split(sep);
    const subject = ability.subject.split(sep);

    const superKey = `${role}${sep}${action[0]}${sep}${subject[0]}`;
    const scopeKey = `${action[1] ?? 'any'}${sep}${subject[1] ?? 'all'}`;

    if (!this._acl[superKey]) this._acl[superKey] = {};

    this._acl[superKey][scopeKey] = {
      role,
      action: ability.action,
      subject: ability.subject,
      field<T = unknown | unknown[]>(data: T, to_plain = false): Partial<T> | Partial<T>[] {
        return filterByNotation<T>(data, ability.field ?? ['*'], to_plain);
      },
      filter<T = unknown | unknown[]>(data: T, to_plain = false): Partial<T> | Partial<T>[] {
        return filterByNotation<T>(data, ability.filter ?? ['*'], to_plain);
      },
      environments(ip: string, strict = true): boolean {
        const environments = ability.environments ?? [];
        if (!strict && !environments.length) return true;
        return (
          isInSubnet(
            ip,
            environments.filter((e) => CIDR().test(e)),
          ) || environments.includes(ip)
        );
      },
      availabilities(available?: { date?: Date; tz?: string }, strict = true): boolean {
        const availabilities = ability.availabilities ?? [];
        if (!strict && !availabilities.length) return true;

        const options = {
          currentDate: available?.date ?? new Date(),
        };
        if (available?.tz) Object.assign(options, { tz: available.tz });

        function check({ expression, duration }: { expression: string; duration: number }): boolean {
          const prevDate = parser.parseExpression(expression, options).prev();
          const nextDate = new Date(prevDate.getTime() + duration * 1000);
          return options.currentDate >= prevDate.toDate() && options.currentDate < nextDate;
        }

        return availabilities.some(check);
      },
    };
  }

  /**
   * > If the ACL is valid, update the ACL
   *
   * @param {AccessAbility[]} acl - AccessAbility[] - an array of AccessAbility objects
   */
  protected set acl(acl: AccessAbility[]) {
    const valid = acl.reduce((prev, curr) => this.validate(curr) && prev, true);
    if (!valid) throw new Error(`Invalid ACL: ${this._avj.errorsText()}`);

    for (const ability of acl) {
      this.update(ability);
    }
  }

  /**
   * > If the user has any role that grants access to any action on any subject, or any role that
   * grants access to the given action on any subject, or any role that grants access to any action on
   * the given subject, or any role that grants access to the given action on the given subject, then
   * return a permission object with the granted flag set to true and the grants object set to the
   * union of all grants for the given action and subject
   *
   * @param {string[]} roles - string[] - An array of roles to check for.
   * @param {string} action - The action you want to perform.
   * @param {string} subject - The subject of the permission.
   * @param [callable] - A function that takes a Permission object and returns a boolean.
   *
   * @returns A Permission object
   */
  public can(roles: string[], action: string, subject: string, callable?: (perm: Permission) => boolean): Permission {
    const sep = this._sep;

    const _action = action.split(sep);
    const _subject = subject.split(sep);

    const hasAny = roles.some((r) => Object.keys(this._acl).some((k) => RegExp(`${r}${sep}any${sep}.*`).test(k)));
    const hasAll = roles.some((r) => Object.keys(this._acl).some((k) => RegExp(`${r}${sep}.*${sep}all`).test(k)));

    const superKeys = roles.map((r) => `${r}${sep}${hasAny ? '.*' : _action[0]}${sep}${hasAll ? '.*' : _subject[0]}`);
    const scopePerm = superKeys.map((k) => this._acl[Object.keys(this._acl).find((_k) => RegExp(k).test(_k)) ?? k]);

    const grants = scopePerm.reduce((prev, curr) => ({ ...prev, ...curr }), {});

    let granted = !!Object.keys(grants).length || (hasAny && hasAll);
    if (callable) granted &&= !!callable(new Permission(granted, grants));

    return new Permission(granted, grants);
  }
}
