import { isValidCron } from 'cron-validator';
import { isInSubnet } from 'is-in-subnet';
import parser from 'cron-parser';
import CIDR from 'cidr-regex';
import IP from 'ip-regex';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Notation } = require('notation');

/**
 * `Ability` is a type that represents a single access ability.
 *
 * @property {R} role - The role that is allowed to perform the action on the object.
 * @property {Act | 'any'} action - The action that the role is allowed to perform on the object.
 * @property {Obj | 'all'} object - The object that the user is trying to access.
 * @property {string[]} field - The field property is used to specify the fields that are allowed to be
 * accessed.
 * @property {string[]} filter - A list of filters that can be applied to the object.
 * @property {string[]} location - IP address or CIDR
 * @property {{
 *     cron_exp: string; // start cron expression
 *     duration: number; // in seconds
 *   }[]} time - This is an array of objects that contain a cron expression and a duration. The cron
 * expression is used to determine when the access ability is valid. The duration is used to determine
 * how long the access ability is valid.
 */
export type Ability<R = string, Act = string, Obj = string> = {
  role: R;
  action: Act | 'any'; // scoped by separator
  object: Obj | 'all'; // scoped by separator
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

/* It takes a boolean and a PermissionGrant object and returns a Permission object */
export class Permission<R = string, Act = string, Obj = string> {
  private readonly _granted: boolean;
  private readonly _grants: PermissionGrant<R, Act, Obj>;

  /**
   * The constructor function takes two arguments, a boolean and a PermissionGrant object. The boolean
   * is assigned to the _granted property and the PermissionGrant object is assigned to the _grants
   * property
   *
   * @param {boolean} granted - boolean - This is the result of the permission check.
   * @param grants - PermissionGrant<R, Act, Obj>
   */
  constructor(granted: boolean, grants: PermissionGrant<R, Act, Obj>) {
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
   * If the pattern is not provided, set it to 'any:all' (which matches everything). If the pattern is not
   * found in the grants, throw an error. Otherwise, return the grant that matches the pattern
   *
   * @param {string} [pattern] - The pattern to match against. If not provided, it will match against
   * all patterns.
   *
   * @returns A Grant object
   */
  public grant(pattern?: string): Grant<R, Act, Obj> {
    if (!pattern) pattern = 'any:all';
    if (!this.has(pattern)) throw new Error(`No grant found for pattern ${pattern}`);
    return this.grants[Object.keys(this.grants).find((k) => RegExp(pattern ?? 'any:all').test(k)) ?? pattern];
  }

  /**
   * If any of the grants have an action of 'any', return true
   *
   * @returns A boolean value.
   */
  public hasAny(): boolean {
    return Object.values(this.grants).some((g) => g.action === 'any');
  }

  /**
   * It returns true if the grants object has a grant with an object of 'all'
   *
   * @returns A boolean value.
   */
  public hasAll(): boolean {
    return Object.values(this.grants).some((g) => g.object === 'all');
  }

  /**
   * It returns an array of all the abilities that the role grants
   *
   * @returns An array of Ability objects.
   */
  public abilities(): Ability<R, Act, Obj>[] {
    return Object.values(this.grants).map((g) => g.ability);
  }
}

/* Defining the interface for the Grant object. */
export interface Grant<R = string, Act = string, Obj = string> {
  readonly role: R;
  readonly action: Act | 'any';
  readonly object: Obj | 'all';
  /* A function that takes two parameters, data and to_plain. The data parameter is of type T,
  which is a generic type. The to_plain parameter is of type boolean and has a default value of
  false. The function returns a Partial<T> or Partial<T>[] */
  field: <T = unknown | unknown[]>(data: T, to_plain?: boolean) => Partial<T> | Partial<T>[];
  /* A function that takes two parameters, data and to_plain. The data parameter is of type T,
  which is a generic type. The to_plain parameter is of type boolean and has a default value of
  false. The function returns a Partial<T> or Partial<T>[] */
  filter: <T = unknown | unknown[]>(data: T, to_plain?: boolean) => Partial<T> | Partial<T>[];
  /* A function that takes in an IP address and returns a boolean. */
  location: (ip: string, strict?: boolean) => boolean;
  /* A function that takes in an object with a date and timezone and returns a boolean. */
  time: (available?: { date?: Date; tz?: string }, strict?: boolean) => boolean;
  /* Defining a generic type called Ability. It takes three type parameters: R, Act, and Obj. */
  ability: Ability<R, Act, Obj>;
}

/**
 * `PermissionGrant` is an object whose keys are strings and whose values are `Grant`s.
 *
 * @property [key: undefined] - Grant<R, Act, Obj>;
 */
export type PermissionGrant<R = string, Act = string, Obj = string> = {
  [key: string]: Grant<R, Act, Obj>;
};

export interface AccessControlOption {
  sep?: string;
  strict?: boolean;
}

/* The Attribute-Based Access Control Main Class */
export default class AccessControl<R = string, Act = string, Obj = string> {
  private _sep: string;
  private _strict: boolean;

  /* A private property that is used to store the abilities. */
  private _abilities: {
    [key: string]: PermissionGrant<R, Act, Obj>;
  } = {};

  /* It is an object with two properties: ip_cidr and cron. The value of each property is a function. */
  private _validators = {
    ip_cidr: (val: string) => IP({ exact: true }).test(val) || CIDR({ exact: true }).test(val),
    cron: (val: string) => !/^(\*\s)+\*$/.test(val) && isValidCron(val, { seconds: true, alias: true }),
  };

  /**
   * The constructor function takes in an array of abilities and an object with two properties, sep and
   * strict.
   * The sep property is a string that represents the separator between the action and the object.
   * The strict property is a boolean that represents whether or not the access control should be
   * strict.
   *
   * @param {Ability<R, Act, Obj>[]} abilities - An array of Ability objects.
   * @param {AccessControlOption}  - `abilities` - An array of `Ability` objects.
   */
  constructor(abilities: Ability<R, Act, Obj>[] = [], options?: AccessControlOption) {
    this._sep = options?.sep ?? ':';
    this._strict = options?.strict ?? true;

    this.abilities = abilities;
  }

  /**
   * "If the ability is not valid, throw an error."
   *
   * The first line of the function calls the `_validate` function, which returns a boolean. If the
   * boolean is false, the second line of the function throws an error
   *
   * @param ability - Ability<R, Act, Obj>
   */
  public validate(ability: Ability<R, Act, Obj>): void {
    if (!ability.role || !ability.action || !ability.object) throw new Error('Ability object is not valid');

    if (ability?.location?.length && !ability.location.every((i) => this._validators.ip_cidr(i)))
      throw new Error('Ability locations is not valid');

    if (ability?.time?.length && !ability.time.every((i) => this._validators.cron(i.cron_exp) && i.duration > 0))
      throw new Error('Ability times is not valid');
  }

  /**
   * It takes in an `Ability` object and validates it, then it adds it to the `_abilities` object
   *
   * @param ability - Ability<R, Act, Obj>
   */
  public update(ability: Ability<R, Act, Obj>): void {
    this.validate(ability);

    const sep = this._sep;

    const role = ability.role;
    const action = (ability.action as unknown as string).split(sep);
    const object = (ability.object as unknown as string).split(sep);

    const superKey = `${role}${sep}${action[0]}${sep}${object[0]}`;
    const scopeKey = `${action[1] ?? 'any'}${sep}${object[1] ?? 'all'}`;

    if (!this._abilities[superKey]) this._abilities[superKey] = {};

    this._abilities[superKey][scopeKey] = {
      role,
      action: ability.action,
      object: ability.object,
      /* A function that takes in a data object and returns a partial of the data. */
      field<T = unknown | unknown[]>(data: T, to_plain = false): Partial<T> | Partial<T>[] {
        return filterByNotation<T>(data, ability.field ?? ['*'], to_plain);
      },
      /* Filtering the data based on the ability.filter notation. */
      filter<T = unknown | unknown[]>(data: T, to_plain = false): Partial<T> | Partial<T>[] {
        return filterByNotation<T>(data, ability.filter ?? ['*'], to_plain);
      },
      /* Checking if the IP address is in the subnet or not. */
      location(ip: string, strict = false): boolean {
        const location = ability.location ?? [];
        if (!strict && !location.length) return true;
        return (
          isInSubnet(
            ip,
            location.filter((e) => CIDR().test(e)),
          ) || location.includes(ip)
        );
      },
      /* Checking if the current date is within the availability of the `ability.time`. */
      time(available?: { date?: Date; tz?: string }, strict = false): boolean {
        const time = ability.time ?? [];
        if (!strict && !time.length) return true;

        const options = {
          currentDate: available?.date ?? new Date(),
        };
        if (available?.tz) Object.assign(options, { tz: available.tz });

        /**
         * It checks if the current date is between the previous date and the next date.
         *
         * @param  - cron_exp: string;
         * @param  - duration: number;
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
      ability,
    };
  }

  /**
   * It clears the abilities array
   */
  public clear(): void {
    this.abilities = [];
  }

  /**
   * It takes an array of abilities, and updates the internal abilities object with the new abilities
   *
   * @param {Ability<R, Act, Obj>[]} abilities - Ability<R, Act, Obj>[]
   */
  public set abilities(abilities: Ability<R, Act, Obj>[]) {
    if (!abilities.length) this._abilities = {};

    for (const ability of abilities) {
      this.update(ability);
    }
  }

  /**
   * It checks if the given roles have the given action on the given object
   *
   * @param {R[]} roles - An array of roles that the user has.
   * @param {Act} action - The action you want to perform on the object.
   * @param {Obj} object - The object you want to check permissions for.
   * @param [callable] - A function that takes a Permission object and returns a boolean.
   *
   * @returns A Permission object
   */
  public can(
    roles: R[],
    action: Act,
    object: Obj,
    callable?: (perm: Permission<R, Act, Obj>) => boolean,
  ): Permission<R, Act, Obj> {
    const sep = this._sep;
    const strict = this._strict;

    if (!roles?.length) throw new Error('No roles given');

    const _action = (action as unknown as string).split(sep);
    const _object = (object as unknown as string).split(sep);

    const hasAny = roles.some((r) => Object.keys(this._abilities).some((k) => RegExp(`${r}${sep}any${sep}.*`).test(k)));
    const hasAll = roles.some((r) => Object.keys(this._abilities).some((k) => RegExp(`${r}${sep}.*${sep}all`).test(k)));

    const superKeys = roles.map((r) => `${r}${sep}${hasAny ? 'any' : _action[0]}${sep}${hasAll ? 'all' : _object[0]}`);

    const scopePerm = superKeys.map(
      (k) => this._abilities[Object.keys(this._abilities).find((_k) => RegExp(k).test(_k)) ?? k],
    );

    const grants = scopePerm.reduce((prev, curr) => ({ ...prev, ...curr }), {});

    let granted = !!Object.keys(grants).length || (hasAny && hasAll);

    if (strict === true && (_action[1] || _object[1])) {
      const pattern = `${_action[1] ?? 'any'}${sep}${_object[1] ?? 'all'}`;
      granted &&= Object.keys(grants).some((k) => RegExp(pattern).test(k));
    }

    if (callable) granted &&= !!callable(new Permission<R, Act, Obj>(granted, grants));

    return new Permission<R, Act, Obj>(granted, grants);
  }
}
