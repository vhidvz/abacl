import { ControlOptions, GrantInterface, Policy, PolicyPattern } from '../interfaces';
import { filterByNotation, key, log, validate } from '../utils';
import { POLICY_NOTATION, SEP, STRICT } from '../consts';

export class Grant<Sub = string, Act = string, Obj = string> implements GrantInterface<Sub, Act, Obj> {
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

  get(pattern?: PolicyPattern): Grant<Sub, Act, Obj> {
    if (!pattern || !Object.keys(pattern).length) return this;

    // for (const type in pattern) {
    //   if (type === 'subject') val.scope = val.scope ?? NULL;
    //   else if (type === 'action') val.scope = val.scope ?? ANY;
    //   else if (type === 'object') val.scope = val.scope ?? ALL;
    //   else throw new Error('Pattern type is not valid');
    // }

    throw new Error('Method not implemented.');
  }

  has(pattern?: PolicyPattern): boolean {
    throw new Error('Method not implemented.');
  }

  subjects(pattern?: PolicyPattern): Sub[] {
    throw new Error('Method not implemented.');
  }

  field<T>(data: any, pattern?: PolicyPattern): T {
    throw new Error('Method not implemented.');
  }

  filter<T>(data: any, pattern?: PolicyPattern): T {
    throw new Error('Method not implemented.');
  }

  update(policy: Policy<Sub, Act, Obj>, deep_copy = true) {
    validate(policy);

    policy = filterByNotation(policy, POLICY_NOTATION, deep_copy);

    const add = (key: string) => {
      if (key in this.present) {
        const { subject, action, object } = policy;
        log('update-policies').warn(`policy with subject ${subject}, action ${action} and object ${object} already exists`);

        this.present[key] = policy;
      } else this.present[key] = policy;
    };

    add(key(policy, this.options.sep));
    add(key(policy, this.options.sep));
  }
}
