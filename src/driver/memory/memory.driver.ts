import { CacheInterface, CacheInterfaceOptions, CacheKey, Policy } from '../../types';
import { key, pattern } from './memory.tools';
import { OK, SEP } from '../../consts';

export type MemoryDriverOptions = CacheInterfaceOptions;
export const DefaultMemoryDriverOptions: MemoryDriverOptions = { sep: SEP };

export class MemoryDriver<Sub = string, Act = string, Obj = string> implements CacheInterface<Sub, Act, Obj> {
  protected present: Record<string, Policy<Sub, Act, Obj>> = {};

  constructor(protected options: MemoryDriverOptions = DefaultMemoryDriverOptions) {
    options.sep = options.sep || SEP;
  }

  async clear(): Promise<typeof OK> {
    this.present = {};
    return OK;
  }

  async get(cKey: CacheKey<Sub, Act, Obj>): Promise<Policy<Sub, Act, Obj>[]> {
    const p = pattern<Sub, Act, Obj>(cKey, this.options);

    const policies: Policy<Sub, Act, Obj>[] = [];
    for (const index of Object.keys(this.present)) {
      if (p.test(index)) policies.push(this.present[index]);
    }

    return policies;
  }

  async set(policy: Policy<Sub, Act, Obj>): Promise<typeof OK> {
    this.present[key(policy, this.options)] = policy;
    return OK;
  }

  async del(policy: Policy<Sub, Act, Obj>): Promise<typeof OK> {
    delete this.present[key(policy, this.options)];
    return OK;
  }

  async has(policy: Policy<Sub, Act, Obj>): Promise<boolean> {
    return key(policy, this.options) in this.present;
  }

  static build<Sub = string, Act = string, Obj = string>(options?: MemoryDriverOptions) {
    return new MemoryDriver<Sub, Act, Obj>(options);
  }
}
