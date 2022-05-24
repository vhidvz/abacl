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
 * @property {string | 'all'} object - The object of the permission. This can be a string or the
 * special value 'all'.
 * @property {string[]} field - The field filters that can be used to filter the user input data.
 * @property {string[]} filter - A list of filters that can be used to filter the output data.
 * @property {string[]} location - IP addresses or CIDR ranges that the rule applies to.
 * @property {{
 *     cron_exp: string; // start cron cron_exp
 *     duration: number; // in seconds
 *   }[]} time - This is an array of objects that contain a cron expression and a duration.
 * The cron expression is used to determine when the ability is available. The duration is used to
 * determine how long the ability is available.
 */
export type AccessAbility = {
  role: string;
  action: string | 'any'; // scoped by separator
  object: string | 'all'; // scoped by separator
  field?: string[]; // does not affect on grant or deny permission
  filter?: string[]; // does not affect on grant or deny permission
  location?: string[]; // ip or cidr
  time?: {
    cron_exp: string; // start cron expression
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
  public grant(pattern?: string): Grant {
    if (!pattern) pattern = '.*';
    if (!this.has(pattern)) throw new Error(`No grant found for pattern ${pattern}`);
    return this.grants[Object.keys(this.grants).find((k) => RegExp(pattern ?? '.*').test(k)) ?? pattern];
  }

  /**
   * It returns true if the user has the any action
   *
   * @returns A boolean value.
   */
  public hasAny(): boolean {
    return this.has('any:.*');
  }

  /**
   * It returns true if the user has the all object
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
 * @property {string | 'any'} action - The action that the user has it.
 * @property {string | 'all'} object - The object of the user has it.
 * @property field - This is a function that takes input data and returns a partial of the data.
 * @property filter - This is a function that will be called on the data that is being returned.
 * @property location - This is a function that takes an IP address and returns a boolean based
 * on location constraints defined already by the IP and CIDRs.
 * @property time - A function that takes in an object with a date and timezone and returns a
 * boolean based on the user time availabilities.
 */
export type Grant = {
  role: string;
  action: string | 'any';
  object: string | 'all';
  /* A function that takes in the data and returns a partial of the data. */
  field: <T = unknown | unknown[]>(data: T, to_plain?: boolean) => Partial<T> | Partial<T>[];
  /* A function that takes in a data object and returns a partial of the data. */
  filter: <T = unknown | unknown[]>(data: T, to_plain?: boolean) => Partial<T> | Partial<T>[];
  /* A function that takes in an IP address and returns a boolean. */
  location: (ip: string, strict?: boolean) => boolean;
  /* A function that takes in an object with a date and timezone and returns a boolean. */
  time: (available?: { date?: Date; tz?: string }, strict?: boolean) => boolean;
};

/**
 * `PermissionGrant` is an object whose keys are strings and whose values are `Grant`s.
 *
 * @property {Grant} [key: Grant] - This is the name of the permission.
 */
export type PermissionGrant = {
  [key: string]: Grant;
};

/* The Attribute-Based Access Control Class */
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
      object: { type: 'string', minLength: 1 },
      field: { type: 'array', items: { type: 'string' } },
      filter: { type: 'array', items: { type: 'string' } },
      location: { type: 'array', items: { type: 'string', format: 'ip_cidr' } },
      time: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            cron_exp: { type: 'string', format: 'cron' },
            duration: { type: 'number' },
          },
          required: ['cron_exp', 'duration'],
        },
      },
    },
    required: ['role', 'action', 'object'],
    additionalProperties: false,
  };

  /* A protected property that is used to validate the ACL. */
  protected validate: ValidateFunction;

  /**
   * It takes an array of AccessAbility objects and a separator string, and it creates a new
   * AccessAbilityList object
   *
   * @param {AccessAbility[]} acl - AccessAbility[]
   * @param [sep=:] - The separator used to separate the scoped action and object's.
   */
  constructor(acl: AccessAbility[], sep = ':') {
    this._acl = {};
    this._sep = sep;
    this._avj = new Ajv();

    this._avj.addFormat('ip_cidr', {
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
   */
  public update(ability: AccessAbility): void {
    const sep = this._sep;

    const role = ability.role;
    const action = ability.action.split(sep);
    const object = ability.object.split(sep);

    const superKey = `${role}${sep}${action[0]}${sep}${object[0]}`;
    const scopeKey = `${action[1] ?? 'any'}${sep}${object[1] ?? 'all'}`;

    if (!this._acl[superKey]) this._acl[superKey] = {};

    this._acl[superKey][scopeKey] = {
      role,
      action: ability.action,
      object: ability.object,
      /* A function that takes two parameters, data and to_plain. The data parameter is of type T,
      which is a generic type. The to_plain parameter is of type boolean and has a default value of
      false. The function returns a Partial<T> or Partial<T>[] */
      field<T = unknown | unknown[]>(data: T, to_plain = false): Partial<T> | Partial<T>[] {
        return filterByNotation<T>(data, ability.field ?? ['*'], to_plain);
      },
      /* Filtering the data based on the ability.filter notation. */
      filter<T = unknown | unknown[]>(data: T, to_plain = false): Partial<T> | Partial<T>[] {
        return filterByNotation<T>(data, ability.filter ?? ['*'], to_plain);
      },
      /* Checking if the ip address is in the subnet or not. */
      location(ip: string, strict = true): boolean {
        const location = ability.location ?? [];
        if (!strict && !location.length) return true;
        return (
          isInSubnet(
            ip,
            location.filter((e) => CIDR().test(e)),
          ) || location.includes(ip)
        );
      },
      /* Checking if the current date is within the availability of the ability. */
      time(available?: { date?: Date; tz?: string }, strict = true): boolean {
        const time = ability.time ?? [];
        if (!strict && !time.length) return true;

        const options = {
          currentDate: available?.date ?? new Date(),
        };
        if (available?.tz) Object.assign(options, { tz: available.tz });

        /**
         * It checks if the current date is between the previous date and the next date of cron expression.
         *
         * @param  - cron_exp: string;
         *
         * @returns A boolean value
         */
        function check({ cron_exp, duration }: { cron_exp: string; duration: number }): boolean {
          const prevDate = parser.parseExpression(cron_exp, options).prev();
          const nextDate = new Date(prevDate.getTime() + duration * 1000);
          return options.currentDate >= prevDate.toDate() && options.currentDate < nextDate;
        }

        return time.some(check);
      },
    };
  }

  /**
   * It clears the ACL
   */
  public clear(): void {
    this.acl = [];
  }

  /**
   * > If the ACL is valid, update the ACL
   *
   * @param {AccessAbility[]} acl - AccessAbility[] - an array of AccessAbility objects
   */
  protected set acl(acl: AccessAbility[]) {
    const valid = acl.reduce((prev, curr) => this.validate(curr) && prev, true);
    if (!valid) throw new Error(`Invalid ACL: ${this._avj.errorsText()}`);

    if (!acl.length) this._acl = {};

    for (const ability of acl) {
      this.update(ability);
    }
  }

  /**
   * check user access ability
   *
   * @param {string[]} roles - string[] - An array of user roles.
   * @param {string} action - The action you want to perform.
   * @param {string} object - The object of the permission.
   * @param [callable] - A function that takes a Permission object and returns a boolean that effect on grant.
   *
   * @returns A Permission object
   */
  public can(roles: string[], action: string, object: string, callable?: (perm: Permission) => boolean): Permission {
    const sep = this._sep;

    const _action = action.split(sep);
    const _subject = object.split(sep);

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
