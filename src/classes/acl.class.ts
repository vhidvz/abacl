import { CacheInterface, ControlOptions, Policy } from '../types';
import { ALL, ANY, OK, POLICY_NOTATION, STRICT } from '../consts';
import { filterByNotation, isStrict, validate } from '../utils';
import { Permission } from './permission.class';
import { MemoryDriver } from '../driver';
import { Grant } from './grant.class';

export interface CanOptions<Sub = string, Act = string, Obj = string> {
  strict?: boolean | string;
  callable?: (perm: Permission<Sub, Act, Obj>) => boolean | Promise<boolean>;
}

export interface AccessControlOptions<Sub = string, Act = string, Obj = string> extends ControlOptions {
  driver?: 'memory' | CacheInterface<Sub, Act, Obj> | (() => CacheInterface<Sub, Act, Obj>);
}

export class AccessControl<Sub = string, Act = string, Obj = string> {
  protected driver: CacheInterface<Sub, Act, Obj>;
  protected readonly options: ControlOptions = {};

  constructor(policies?: Policy<Sub, Act, Obj>[], options?: AccessControlOptions<Sub, Act, Obj>) {
    const { strict, driver } = options ?? {};

    this.options.strict = strict ?? STRICT;

    if (!driver || driver === 'memory') {
      this.driver = MemoryDriver.build<Sub, Act, Obj>();
    } else this.driver = typeof driver === 'function' ? driver() : driver;

    if (policies?.length) policies.forEach((policy) => this.update(policy));
  }

  async clear(): Promise<typeof OK> {
    return this.driver.clear();
  }

  async exists(policy: Policy<Sub, Act, Obj>): Promise<boolean> {
    return this.driver.has(policy);
  }

  async delete(policy: Policy<Sub, Act, Obj>): Promise<typeof OK> {
    return this.driver.del(policy);
  }

  async update(policy: Policy<Sub, Act, Obj>): Promise<typeof OK> {
    validate(policy);

    policy = filterByNotation(policy, POLICY_NOTATION, true);

    return await this.driver.set(policy);
  }

  async can(subjects: Sub[], action: Act, object: Obj, options?: CanOptions<Sub, Act, Obj>): Promise<Permission<Sub, Act, Obj>> {
    const strict = options?.strict ?? this.options.strict ?? STRICT;

    if (!subjects?.length) throw new Error('No subjects given');

    const wrapSub = (prop: Sub) => ({ strict: isStrict('subject', strict), val: prop });
    const wrapAct = (prop: Act) => ({ strict: isStrict('action', strict), val: prop });
    const wrapObj = (prop: Obj) => ({ strict: isStrict('object', strict), val: prop });

    const keys = subjects.map((subject) => ({ subject: wrapSub(subject), action: wrapAct(action), object: wrapObj(object) }));
    keys.push(...subjects.map((subject) => ({ subject: wrapSub(subject), action: wrapAct(ANY as Act), object: wrapObj(object) })));
    keys.push(...subjects.map((subject) => ({ subject: wrapSub(subject), action: wrapAct(action), object: wrapObj(ALL as Obj) })));
    keys.push(
      ...subjects.map((subject) => ({ subject: wrapSub(subject), action: wrapAct(ANY as Act), object: wrapObj(ALL as Obj) })),
    );

    const policies = (await Promise.all(keys.map((key) => this.driver.get(key)))).flat();

    let granted = !!policies?.length;
    const grant = new Grant<Sub, Act, Obj>(policies, { strict });

    if (granted && options?.callable) granted &&= !!(await options.callable(new Permission(granted, grant)));

    return new Permission<Sub, Act, Obj>(granted, grant);
  }
}
