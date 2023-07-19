import { filterByNotation, key, log, regex, validate } from '../utils';
import { ALL, ANY, POLICY_NOTATION, SEP, STRICT } from '../consts';
import { CacheInterface, ControlOptions, Policy } from '../types';
import { Permission } from './permission.class';
import { MemoryDriver } from '../driver';
import { Grant } from './grant.class';

export interface CanOptions<Sub = string, Act = string, Obj = string> {
  strict?: boolean;
  callable?: (perm: Permission<Sub, Act, Obj>) => boolean | Promise<boolean>;
}

export interface AccessControlOptions<Sub = string, Act = string, Obj = string> extends ControlOptions {
  driver?: 'memory' | CacheInterface<Sub, Act, Obj> | (() => CacheInterface<Sub, Act, Obj>);
}

export class AccessControl<Sub = string, Act = string, Obj = string> {
  protected driver: CacheInterface<Sub, Act, Obj>;
  protected readonly options: ControlOptions = {};

  constructor(policies: Policy<Sub, Act, Obj>[], options?: AccessControlOptions<Sub, Act, Obj>) {
    const { sep, strict, driver } = options ?? {};

    this.options.sep = sep ?? SEP;
    this.options.strict = strict ?? STRICT;

    if (!driver || driver === 'memory') {
      this.driver = MemoryDriver.build<Sub, Act, Obj>();
    } else this.driver = typeof driver === 'function' ? driver() : driver;

    if (policies.length) this.policies = policies;
  }

  set policies(policies: Policy<Sub, Act, Obj>[]) {
    if (!policies.length) this.present = {};

    for (const policy of policies) this.update(policy);
  }

  get policies() {
    return Object.values(this.present);
  }

  exists(policy: Policy<Sub, Act, Obj>): boolean {
    return key(policy, this.options.sep) in this.present;
  }

  delete(policy: Policy<Sub, Act, Obj>): boolean {
    return delete this.present[key(policy, this.options.sep)];
  }

  update(policy: Policy<Sub, Act, Obj>, deep_copy = true) {
    validate(policy);

    policy = filterByNotation(policy, POLICY_NOTATION, deep_copy);

    const add = (key: string) => {
      if (key in this.present) {
        const { subject, action, object } = policy;
        throw new Error(`policy with subject "${subject}", action "${action}" and object "${object}" already exists`);
      } else this.present[key] = policy;
    };

    add(key(policy, this.options.sep));
  }

  can(subjects: Sub[], action: Act, object: Obj, options?: CanOptions<Sub, Act, Obj>): Permission<Sub, Act, Obj> {
    const sep = this.options.sep ?? SEP;
    const strict = options?.strict ?? this.options.strict ?? STRICT;

    if (!subjects?.length) throw new Error('No subjects given');

    const start = Date.now();

    let granted = false;
    const grant = new Grant<Sub, Act, Obj>([], { sep, strict });
    for (const key in this.present)
      subjects.forEach((subject) => {
        const pattern = regex({ subject, action, object }, { sep, strict });

        const pattern_all = regex({ subject, action: ANY, object: ALL }, { sep, strict });
        const pattern_action = regex({ subject, action: ANY, object }, { sep, strict });
        const pattern_object = regex({ subject, action, object: ALL }, { sep, strict });

        if ([pattern, pattern_all, pattern_action, pattern_object].some((p) => p.test(key)))
          (granted = true) && !grant.exists(this.present[key]) && grant.update(this.present[key]);
      });

    if (granted && options?.callable) granted &&= !!options.callable(new Permission(granted, grant));

    log('can').info(`can method execution time is ${Date.now() - start}ms`);

    return new Permission<Sub, Act, Obj>(granted, grant);
  }
}
