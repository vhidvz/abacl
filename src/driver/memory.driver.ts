import { CacheInterface, CacheKey, Policy } from '../types';

export class MemoryDriver<Sub = string, Act = string, Obj = string> implements CacheInterface<Sub, Act, Obj> {
  protected present: Record<string, Policy<Sub, Act, Obj>> = {};

  async flush(): Promise<'OK'> {
    return 'OK' || (this.present = {});
  }

  get(key: CacheKey): Promise<Policy<Sub, Act, Obj>> {
    throw new Error('Method not implemented.');
  }
  set(policy: Policy<Sub, Act, Obj>): Promise<'OK'> {
    throw new Error('Method not implemented.');
  }
  del(policy: Policy<Sub, Act, Obj>): Promise<'OK'> {
    throw new Error('Method not implemented.');
  }
  has(policy: Policy<Sub, Act, Obj>): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  static build<Sub = string, Act = string, Obj = string>() {
    return new MemoryDriver<Sub, Act, Obj>();
  }
}
