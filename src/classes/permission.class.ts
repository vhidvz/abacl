import { PermissionInterface, PolicyPattern } from '../interfaces';
import { Grant } from './grant.class';

export class Permission<Sub = string, Act = string, Obj = string> implements PermissionInterface<Sub, Act, Obj> {
  readonly granted: boolean;
  readonly grant: Grant<Sub, Act, Obj>;

  constructor(granted: boolean, grant: Grant<Sub, Act, Obj>) {
    this.granted = granted;
    this.grant = grant;
  }

  get policies() {
    return this.grant.policies;
  }

  get(pattern?: PolicyPattern): Permission<Sub, Act, Obj> {
    throw new Error('Method not implemented.');
  }
  has(pattern?: PolicyPattern): boolean {
    throw new Error('Method not implemented.');
  }
  subjects(pattern?: PolicyPattern): Sub[] {
    throw new Error('Method not implemented.');
  }
  field<T = any>(data: any, pattern?: PolicyPattern): T {
    throw new Error('Method not implemented.');
  }
  filter<T = any>(data: any, pattern?: PolicyPattern): T {
    throw new Error('Method not implemented.');
  }
}
