import IP from 'ip-regex';
import { Ability, AccessControlOption, PermissionGrant } from './interface';
import CIDR from 'cidr-regex';
import { isValidCron } from 'cron-validator';
import { Grant } from './grant';
import { Permission } from './permission';
import { AbilityRegex, GrantRegex } from './utils';

/* The Attribute-Based Access Control Main Class */
export class AccessControl<S = string, Act = string, Obj = string> {
  protected readonly sep: string;
  public readonly strict: boolean;

  /* A private property that is used to store the abilities. */
  private _abilities: {
    [key: string]: PermissionGrant<S, Act, Obj>;
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
   * @param {Ability<S, Act, Obj>[]} abilities - An array of Ability objects.
   * @param {AccessControlOption}  - `abilities` - An array of `Ability` objects.
   */
  constructor(abilities: Ability<S, Act, Obj>[] = [], options?: AccessControlOption) {
    this.sep = options?.sep ?? ':';
    this.strict = options?.strict ?? true;

    this.abilities = abilities;
  }

  /**
   * "If the ability is not valid, throw an error."
   *
   * The first line of the function calls the `_validate` function, which returns a boolean. If the
   * boolean is false, the second line of the function throws an error
   *
   * @param ability - Ability<S, Act, Obj>
   */
  public validate(ability: Ability<S, Act, Obj>): void {
    if (!ability.subject || !ability.action || !ability.object) throw new Error('Ability object is not valid');

    if (ability?.location?.length && !ability.location.every((i) => this._validators.ip_cidr(i))) throw new Error('Ability locations is not valid');

    if (ability?.time?.length && !ability.time.every((i) => this._validators.cron(i.cron_exp) && i.duration > 0)) throw new Error('Ability times is not valid');
  }

  /**
   * It takes in an `Ability` object and validates it, then it adds it to the `_abilities` object
   *
   * @param ability - Ability<S, Act, Obj>
   */
  public update(ability: Ability<S, Act, Obj>): void {
    this.validate(ability);

    const sep = this.sep;

    const subject = ability.subject;
    const action = (ability.action as unknown as string).split(sep);
    const object = (ability.object as unknown as string).split(sep);

    const superKey = `${subject}${sep}${action[0]}${sep}${object[0]}`;
    const scopeKey = `${action[1] ?? 'any'}${sep}${object[1] ?? 'all'}`;

    if (!this._abilities[superKey]) this._abilities[superKey] = {};

    this._abilities[superKey][scopeKey] = Grant.build<S, Act, Obj>(ability);
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
   * @param {Ability<S, Act, Obj>[]} abilities - Ability<S, Act, Obj>[]
   */
  public set abilities(abilities: Ability<S, Act, Obj>[]) {
    if (!abilities.length) this._abilities = {};

    for (const ability of abilities) {
      this.update(ability);
    }
  }

  /**
   * It checks if the given subjects have the given action on the given object
   *
   * @param {S[]} subjects - An array of subjects that the user has.
   * @param {Act} action - The action you want to perform on the object.
   * @param {Obj} object - The object you want to check permissions for.
   * @param [callable] - A function that takes a Permission object and returns a boolean.
   *
   * @returns A Permission object
   */
  public can(
    subjects: S[],
    action: Act,
    object: Obj,
    callable?: null | ((perm: Permission<S, Act, Obj>) => boolean),
    options?: Omit<AccessControlOption, 'sep'>,
  ): Permission<S, Act, Obj> {
    const sep = this.sep;
    const strict = options?.strict ?? this.strict;

    if (!subjects?.length) throw new Error('No subjects given');

    const _action = (action as unknown as string).split(sep);
    const _object = (object as unknown as string).split(sep);

    const scopePerm = subjects.flatMap((s) =>
      Object.entries(this._abilities)
        .filter(([key]) => AbilityRegex({ subject: `${s}`, action: `${_action[0]}`, object: `${_object[0]}`, sep }).test(key))
        .map((a) => a[1]),
    );
    const grants = scopePerm.reduce((prev, curr) => ({ ...prev, ...curr }), {});

    let granted = !!Object.keys(grants).length;

    if (granted && strict === true && (_action[1] || _object[1])) {
      console.log(grants, _action[1], _object[1]);
      const obj = _object[1];
      const act = _action[1];
      granted &&= Object.keys(grants).some((k) => GrantRegex({ action: act, object: obj, sep }).test(k));

      if (obj) {
        granted &&= Object.values(grants).some((g) => [object, 'all'].includes(g.object) && [action, 'any'].includes(g.action));
      }
    }

    if (granted && callable) granted &&= !!callable(new Permission<S, Act, Obj>(granted, grants));

    // if (!granted)
    // console.log(hasAny, hasAll, '====', subjects, action, object, granted, grants, this._abilities);
    return new Permission<S, Act, Obj>(granted, grants);
  }
}
