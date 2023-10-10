import { CacheInterface, ControlOptions, Policy, PropValue } from '../types';
import { ALL, ANY, OK, POLICY_NOTATION, STRICT } from '../consts';
import { filterByNotation, validate } from '../utils';
import { Permission } from './permission.class';
import { MemoryDriver } from '../driver';
import { Grant } from './grant.class';

export interface CanOptions<Sub = string, Act = string, Obj = string> extends ControlOptions {
  callable?: (perm: Permission<Sub, Act, Obj>) => boolean | Promise<boolean>;
}

export interface AccessControlOptions<Sub = string, Act = string, Obj = string> extends ControlOptions {
  driver?:
    | 'memory'
    | CacheInterface<Sub, Act, Obj>
    | (() => CacheInterface<Sub, Act, Obj> | Promise<CacheInterface<Sub, Act, Obj>>);
}

export class AccessControl<Sub = string, Act = string, Obj = string> {
  protected driver!: CacheInterface<Sub, Act, Obj>;
  protected readonly options: ControlOptions = {};

  constructor(policies?: Policy<Sub, Act, Obj>[], options?: AccessControlOptions<Sub, Act, Obj>) {
    const { strict, driver } = options ?? {};

    this.setDriver(driver);
    this.options.strict = strict ?? STRICT;

    if (policies?.length) policies.forEach((policy) => this.update(policy));
  }

  protected async setDriver(driver?: AccessControlOptions<Sub, Act, Obj>['driver']) {
    if (!driver || driver === 'memory') {
      this.driver = MemoryDriver.build<Sub, Act, Obj>();
    } else this.driver = typeof driver === 'function' ? await driver() : driver;
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

    return this.driver.set(policy);
  }

  async can(
    subjects: (Sub | (PropValue & ControlOptions))[],
    action: Act | (PropValue & ControlOptions),
    object: Obj | (PropValue & ControlOptions),
    options?: CanOptions<Sub, Act, Obj>,
  ): Promise<Permission<Sub, Act, Obj>> {
    const strict = options?.strict ?? this.options.strict ?? STRICT;

    if (!subjects?.length) throw new Error('No subjects given');

    const keys = subjects.map((subject) => ({ subject, action, object }));
    keys.push(...subjects.map((subject) => ({ subject, action: ANY as Act, object })));
    keys.push(...subjects.map((subject) => ({ subject, action, object: ALL as Obj })));
    keys.push(...subjects.map((subject) => ({ subject, action: ANY as Act, object: ALL as Obj })));

    const policies = (await Promise.all(keys.map((key) => this.driver.get({ strict, ...key })))).flat();

    let granted = !!policies?.length;
    const grant = new Grant<Sub, Act, Obj>(policies, { strict });

    if (granted && options?.callable) granted &&= !!(await options.callable(new Permission(granted, grant)));

    return new Permission<Sub, Act, Obj>(granted, grant);
  }
}
