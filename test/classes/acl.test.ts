import { AccessControl } from '../../src';
import { Role, policies } from '../mock';

describe('test acl class', () => {
  let acl: AccessControl;

  it('should define acl instance', async () => {
    acl = new AccessControl(policies);

    expect(acl).toBeDefined();
  });

  it('should check exists policy in db', async () => {
    expect(await acl.exists(policies[0])).toBeTruthy();

    expect(await acl.exists({ subject: 'nothing', action: 'nothing', object: 'nothing' })).toBeFalsy();
  });

  it('should delete policy from policies', async () => {
    expect(await acl.delete(policies[1])).toBeTruthy();
    expect(await acl.exists(policies[1])).toBeFalsy();

    expect(async () => await acl.update(policies[1])).not.toThrowError();
    expect(await acl.exists(policies[1])).toBeTruthy();
  });

  it('should return permission by can method', async () => {
    expect((await acl.can([Role.User], 'read', 'article')).granted).toBeFalsy();
    expect((await acl.can([Role.User], 'read:own', 'article')).granted).toBeTruthy();

    expect((await acl.can([Role.User], 'read', 'article:published')).granted).toBeFalsy();
    expect((await acl.can([Role.User], 'read', 'article:published', { strict: true })).granted).toBeFalsy();
    expect((await acl.can([Role.User], 'read', 'article:published', { strict: false })).granted).toBeTruthy();

    expect((await acl.can([Role.User], 'read', 'article:published', { strict: false, callable: () => false })).granted).toBeFalsy();
  });

  it('should return true granted on any/all', async () => {
    expect((await acl.can([Role.Admin], 'read', 'article')).granted).toBeTruthy();
    expect((await acl.can([Role.Manager], 'read', 'article')).granted).toBeTruthy();
  });

  it('should return permission with callable', async () => {
    const article = {
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    };

    const createPermission = await acl.can([Role.Manager], 'create', 'article');
    expect(await createPermission.field(article, () => ({ action: { val: 'create ' } }))).toEqual({
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    const updatePermission = await acl.can([Role.Manager], 'update', 'article', { strict: false });
    expect(await updatePermission.field(article, async () => ({ action: { val: 'update', strict: false } }))).toEqual({
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });
  });

  it('should return permission for scopes any/all', async () => {
    const permission1 = await acl.can([Role.Manager], 'read', 'article:all', { strict: 'a' });
    const permission2 = await acl.can([Role.Manager], 'read:any', 'article', { strict: 'a' });

    expect(permission1.policies).toStrictEqual(permission2.policies);
  });
});
