import { check, filterByNotation } from './utils';
import { Ability } from './interface';
import { isInSubnet } from 'is-in-subnet';
import CIDR from 'cidr-regex';

/* Defining the interface for the Grant object. */
export class Grant<S = string, Act = string, Obj = string> {
  readonly subject: S;
  readonly action: Act | 'any';
  readonly object: Obj | 'all';

  readonly ability: Ability<S, Act, Obj>;

  /**
   * The constructor function takes an ability object and sets the ability, action, object, and subject
   * properties of the new instance to the corresponding properties of the ability object
   *
   * @param ability - Ability<S, Act, Obj>
   */
  constructor(ability: Ability<S, Act, Obj>) {
    const { action, object, subject, field, filter, location, time } = ability;
    this.ability = { action, object, subject, field, filter, location, time };

    this.action = ability.action;
    this.object = ability.object;
    this.subject = ability.subject;
  }

  /**
   * It takes a data object and returns a filtered version of it based on the field notation
   *
   * @param {T} data - The data to filter.
   * @param [deep_copy=false] - If true, the returned data will be a deep copy of the original data.
   *
   * @returns The return type is a Partial<T> | Partial<T>[].
   */
  field<T = unknown | unknown[]>(data: T, deep_copy = false): Partial<T> | Partial<T>[] {
    return filterByNotation<T>(data, this.ability.field ?? ['*'], deep_copy);
  }

  /**
   * It takes a data object and returns a filtered version of it based on the filter notation
   *
   * @param {T} data - The data to be filtered.
   * @param [deep_copy=false] - If true, the data will be deep copied before filtering.
   *
   * @returns A partial of the data that is passed in.
   */
  filter<T = unknown | unknown[]>(data: T, deep_copy = false): Partial<T> | Partial<T>[] {
    return filterByNotation<T>(data, this.ability.filter ?? ['*'], deep_copy);
  }

  /**
   * It checks if the IP address is in the list of allowed IP addresses
   *
   * @param {string} ip - The IP address to check.
   * @param [strict=false] - If true, the user must be in the location list. If false, the user must be
   * in the location list or the list must be empty.
   *
   * @returns A boolean value.
   */
  location(ip: string, strict = false): boolean {
    const location = this.ability.location ?? [];
    if (!strict && !location.length) return true;
    return (
      isInSubnet(
        ip,
        location.filter((e) => CIDR().test(e)),
      ) || location.includes(ip)
    );
  }

  /**
   * If the ability has a time property, check if the current time matches any of the time objects in
   * the array
   *
   * @param [options] - An object with the following properties:
   * @param [strict=false] - If true, the ability will only be active if the time is explicitly set. If
   * false, the ability will be active if the time is not explicitly set.
   *
   * @returns A boolean value.
   */
  time(options?: { currentDate?: Date; tz?: string }, strict = false): boolean {
    const time = this.ability.time ?? [];
    if (!strict && !time.length) return true;

    return time.some((time) => check(time, options));
  }

  /**
   * "This function takes an ability and returns a grant."
   *
   * The function is generic, which means that it can be used with any ability. The generic parameters
   * are the types of the ability's subject, action, and object
   *
   * @param ability - The ability to grant.
   *
   * @returns A new Grant object.
   */
  public static build<S = string, Act = string, Obj = string>(ability: Ability<S, Act, Obj>) {
    return new Grant<S, Act, Obj>(ability);
  }
}
