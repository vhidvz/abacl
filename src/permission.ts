import { isInSubnet } from 'is-in-subnet';
import CIDR from 'cidr-regex';
import { Ability, PermissionGrant, Time } from './interface';
import { GrantRegex, accumulate, check, filterByNotation } from './utils';
import { AccessControl } from './acl';
import { Grant } from './grant';

/* It takes a boolean and a PermissionGrant object and returns a Permission object */
export class Permission<S = string, Act = string, Obj = string> {
  private times: Time[] | undefined;
  private fields: string[] | undefined;
  private filters: string[] | undefined;
  private locations: string[] | undefined;

  /**
   * It checks if the IP address is in the list of allowed locations
   *
   * @param {string} ip - The IP address to check.
   * @param [strict=false] - If true, the user must have a location set. If false, the user can have no
   * location set.
   *
   * @returns A boolean value
   */
  public location(ip: string, strict = false): boolean {
    if (!this.locations)
      this.locations = [
        ...new Set(
          Object.values(this.grants)
            .map((g) => g.ability.location ?? [])
            .flat(),
        ),
      ];

    if (!strict && !this.locations.length) return true;

    return (
      isInSubnet(
        ip,
        this.locations.filter((e) => CIDR().test(e)),
      ) || this.locations.includes(ip)
    );
  }

  /**
   * It checks if the current time is within the time range of any of the user's grants
   *
   * @param [options] - currentDate?: Date; tz?: string
   *
   * @param [strict=false] - If true, the user must have at least one time restriction. If false, the
   * user can have no time restrictions.
   *
   * @returns A boolean value.
   */
  public time(options?: { currentDate?: Date; tz?: string }, strict = false): boolean {
    if (!this.times) {
      const result: { [x: string]: Time } = {};

      for (const time of Object.values(this.grants)
        .map((g) => g.ability.time ?? [])
        .flat()) {
        result[`${time.cron_exp}:${time.duration}`] = time;
      }

      this.times = Object.values(result);
    }

    if (!strict && !this.times.length) return true;

    return this.times.some((time) => check(time, options));
  }

  /**
   * It takes a data object and returns a filtered version of it based on the fields that the user is
   * allowed to see
   *
   * @param {T} data - The data to filter.
   * @param [deep_copy=false] - If true, the returned object will be a deep copy of the original
   * object.
   *
   * @returns A partial of the data passed in.
   */
  public field<T = unknown | unknown[]>(data: T, deep_copy = false): Partial<T> | Partial<T>[] {
    if (!this.fields) this.fields = accumulate(...Object.values(this.grants).map((g) => g.ability.field ?? []));
    return filterByNotation<T>(data, !this.fields.length ? ['*'] : this.fields, deep_copy);
  }

  /**
   * It takes a data object and returns a filtered version of it based on the user's permissions
   *
   * @param {T} data - The data to filter.
   * @param [deep_copy=false] - If true, the data will be deep copied before filtering.
   *
   * @returns A partial of the data passed in.
   */
  public filter<T = unknown | unknown[]>(data: T, deep_copy = false): Partial<T> | Partial<T>[] {
    if (!this.filters) this.filters = accumulate(...Object.values(this.grants).map((g) => g.ability.filter ?? []));
    return filterByNotation<T>(data, !this.filters.length ? ['*'] : this.filters, deep_copy);
  }

  /**
   * It returns the value of the private variable _granted.
   *
   * @returns The value of the _granted property.
   */
  public readonly granted: boolean;

  /**
   * It returns the value of the private variable _grants.
   *
   * @returns The grants property is being returned.
   */
  public readonly grants: PermissionGrant<S, Act, Obj>;

  /**
   * The constructor function takes two arguments, a boolean and a PermissionGrant object. The boolean
   * is assigned to the _granted property and the PermissionGrant object is assigned to the _grants
   * property
   *
   * @param {boolean} granted - boolean - This is the result of the permission check.
   * @param grants - PermissionGrant<S, Act, Obj>
   */
  constructor(granted: boolean, grants: PermissionGrant<S, Act, Obj>) {
    this.grants = grants;
    this.granted = granted;
  }

  /**
   * It returns true if any of the scope in the grants object match the pattern
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
  public grant(pattern?: string, sep = ':'): Grant<S, Act, Obj> {
    if (!pattern) pattern = `any${sep}all`;
    if (!this.has(pattern)) throw new Error(`No grant found for pattern ${pattern}`);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.grants[Object.keys(this.grants).find((k) => RegExp(pattern!).test(k)) ?? pattern];
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
   * If any of the grants have an scoped action of 'any', return true
   *
   * @returns A boolean value.
   */
  public hasScopeAny(sep = ':'): boolean {
    return Object.keys(this.grants).some((k) => GrantRegex({ action: 'any', sep }).test(k));
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
   * It returns true if the grants object has a scope with an object of 'all'
   *
   * @returns A boolean value.
   */
  public hasScopeAll(sep = ':'): boolean {
    return Object.keys(this.grants).some((k) => GrantRegex({ object: 'all', sep }).test(k));
  }

  /**
   * It returns an array of all the abilities that the subject grants
   *
   * @returns An array of Ability objects.
   */
  public abilities(): Ability<S, Act, Obj>[] {
    return Object.values(this.grants).map((g) => g.ability);
  }

  /**
   * It takes an array of abilities, and returns a permission object
   *
   * @param {boolean} granted - boolean - whether the permission is granted or not.
   * @param {Ability<S, Act, Obj>[]} abilities - An array of Ability objects.
   * @param [sep=:] - The separator used to split the action and object.
   *
   * @returns A Permission object
   */
  public static build<S = string, Act = string, Obj = string>(granted: boolean, abilities: Ability<S, Act, Obj>[], sep = ':'): Permission<S, Act, Obj> {
    const grants: PermissionGrant<S, Act, Obj> = abilities
      .map((ability) => {
        new AccessControl<S, Act, Obj>().validate(ability);

        const action = (ability.action as unknown as string).split(sep);
        const object = (ability.object as unknown as string).split(sep);

        const scopeKey = `${action[1] ?? 'any'}${sep}${object[1] ?? 'all'}`;

        return { [scopeKey]: Grant.build<S, Act, Obj>(ability) };
      })
      .reduce((prev, curr) => ({ ...prev, ...curr }), {});

    return new Permission<S, Act, Obj>(granted, grants);
  }
}
