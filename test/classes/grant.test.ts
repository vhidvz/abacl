import { Role, policies } from '../mock';
import { Grant, pattern } from '../../src';

describe('test grant class', () => {
  let grant: Grant;

  it('should define grant instance', () => {
    grant = new Grant(policies);

    expect(grant).toBeDefined();
    expect(grant.policies).toEqual(policies);
  });

  it('should throw exception on duplication', () => {
    const arrowFn = () => grant.update({ subject: Role.Admin, action: 'any', object: 'all' });
    expect(() => arrowFn()).toThrowError('policy with subject "admin", action "any" and object "all" already exists');
  });

  it('should verify has pattern exists', () => {
    expect(grant.has({ subject: pattern({ main: Role.Admin }, 'subject') })).toBeTruthy();
  });
});
