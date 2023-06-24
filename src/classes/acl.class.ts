import { AccessControlCanOptions, AccessControlInterface, ControlOptions, Policy } from '../types';
import { filterByNotation, key, log, regex, validate } from '../utils';
import { POLICY_NOTATION, SEP, STRICT } from '../consts';
import { Permission } from './permission.class';
import { Grant } from './grant.class';

export class AccessControl<Sub = string, Act = string, Obj = string> implements AccessControlInterface<Sub, Act, Obj> {
  protected readonly options: ControlOptions = {};
  protected present: Record<string, Policy<Sub, Act, Obj>> = {};

  constructor(policies: Policy<Sub, Act, Obj>[], options?: ControlOptions) {
    const { sep, strict } = options ?? {};

    this.options.sep = sep ?? SEP;
    this.options.strict = strict ?? STRICT;

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

  can(subjects: Sub[], action: Act, object: Obj, options?: AccessControlCanOptions<Sub, Act, Obj>): Permission<Sub, Act, Obj> {
    const sep = this.options.sep ?? SEP;
    const strict = options?.strict ?? this.options.strict ?? STRICT;

    if (!subjects?.length) throw new Error('No subjects given');

    const start = Date.now();

    let granted = false;
    const grant = new Grant<Sub, Act, Obj>([], { sep, strict });
    for (const key in this.present)
      subjects.forEach(
        (subject) =>
          regex({ subject, action, object }, { sep, strict }).test(key) && (granted = true) && grant.update(this.present[key]),
      );

    if (granted && options?.callable) granted &&= !!options.callable(grant);

    log('can-method').info(`can method execution time is ${Date.now() - start}ms`);

    return new Permission<Sub, Act, Obj>(granted, grant);
  }
}
