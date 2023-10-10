import { CacheInterface, CacheInterfaceOptions, CacheKey, Policy } from '../../types';
import { key, pattern } from './memory.tools';
import { OK, SEP } from '../../consts';

export type MemoryDriverOptions = CacheInterfaceOptions;
export const DefaultMemoryDriverOptions: MemoryDriverOptions = { sep: SEP };

export class MemoryDriver<Sub = string, Act = string, Obj = string> implements CacheInterface<Sub, Act, Obj> {
  protected present: Record<string, Policy<Sub, Act, Obj>> = {};

  constructor(protected options: MemoryDriverOptions = DefaultMemoryDriverOptions) {
    this.options.sep = options.sep || SEP;
  }

  clear(): typeof OK {
    this.present = {};
    return OK;
  }

  get(cKey: CacheKey<Sub, Act, Obj>): Policy<Sub, Act, Obj>[] {
    const p = pattern<Sub, Act, Obj>(cKey, this.options);

    const policies: Policy<Sub, Act, Obj>[] = [];
    for (const index of Object.keys(this.present)) {
      if (p.test(index)) policies.push(this.present[index]);
    }

    return policies;
  }

  set(policy: Policy<Sub, Act, Obj>): typeof OK {
    this.present[key(policy, this.options)] = policy;
    return OK;
  }

  del(policy: Policy<Sub, Act, Obj>): typeof OK {
    delete this.present[key(policy, this.options)];
    return OK;
  }

  has(policy: Policy<Sub, Act, Obj>): boolean {
    return key(policy, this.options) in this.present;
  }

  static build<Sub = string, Act = string, Obj = string>(options: MemoryDriverOptions = DefaultMemoryDriverOptions) {
    return new MemoryDriver<Sub, Act, Obj>(options);
  }
}
