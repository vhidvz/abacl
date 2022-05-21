import AccessControl, { AccessAbility } from '../src';

const acl: AccessAbility[] = [
  {
    role: 'admin',
    action: 'any',
    subject: 'all',
  },
  {
    role: 'guest',
    action: 'read',
    subject: 'article',
  },
  {
    role: 'manager',
    action: 'any',
    subject: 'article',
  },
  {
    role: 'user',
    action: 'create:own',
    subject: 'article',
    field: ['*', '!owner'],
    location: ['127.0.0.1', '192.168.1.0/24'],
    time: [
      {
        cron_exp: '* * 6 * * *',
        duration: 18 * 60 * 60,
      },
    ],
  },
  {
    role: 'user',
    action: 'read:own',
    subject: 'article',
  },
  {
    role: 'user',
    action: 'read:shared',
    subject: 'article',
    filter: ['*', '!id'],
  },
  {
    role: 'user',
    action: 'delete:own',
    subject: 'article',
  },
  {
    role: 'user',
    action: 'update:own',
    subject: 'article',
    field: ['*', '!owner'],
  },
];

describe('test access control', () => {
  it('should define', () => {
    expect(new AccessControl(acl)).toBeDefined();
  });

  it('should check access without callable', () => {
    const ac = new AccessControl(acl);

    // check non scoped access without callable for admin
    expect(ac.can(['admin'], 'any', 'all').granted).toBeTruthy();
    expect(ac.can(['admin'], 'read', 'all').granted).toBeTruthy();
    expect(ac.can(['admin'], 'any', 'article').granted).toBeTruthy();
    expect(ac.can(['admin'], 'read', 'article').granted).toBeTruthy();

    // check non scoped access without callable for guest
    expect(ac.can(['guest'], 'any', 'all').granted).toBeFalsy();
    expect(ac.can(['guest'], 'read', 'all').granted).toBeFalsy();
    expect(ac.can(['guest'], 'any', 'article').granted).toBeFalsy();
    expect(ac.can(['guest'], 'read', 'article').granted).toBeTruthy();

    // check non scoped access without callable for manager
    expect(ac.can(['manager'], 'any', 'all').granted).toBeFalsy();
    expect(ac.can(['manager'], 'read', 'all').granted).toBeFalsy();
    expect(ac.can(['manager'], 'any', 'article').granted).toBeTruthy();
    expect(ac.can(['manager'], 'read', 'article').granted).toBeTruthy();

    // check non scoped access without callable for user
    expect(ac.can(['user'], 'create', 'article').granted).toBeTruthy();
    expect(ac.can(['user'], 'read', 'article').granted).toBeTruthy();
    expect(ac.can(['user'], 'delete', 'article').granted).toBeTruthy();
    expect(ac.can(['user'], 'update', 'article').granted).toBeTruthy();
  });

  it('should check access with callable', () => {
    const ac = new AccessControl(acl);

    // check non scoped access with callable for admin
    expect(
      ac.can(['admin'], 'any', 'all', (perm) => {
        expect(perm).toBeDefined();
        expect(perm.granted).toBeTruthy();
        expect(perm.grants).toStrictEqual(
          expect.objectContaining({
            'any:all': expect.objectContaining({
              role: 'admin',
              action: 'any',
              subject: 'all',
              field: expect.any(Function),
              filter: expect.any(Function),
              location: expect.any(Function),
              time: expect.any(Function),
            }),
          }),
        );

        return true;
      }).granted,
    ).toBeTruthy();

    expect(ac.can(['admin'], 'read', 'article', () => false).granted).toBeFalsy();

    // check scoped access with callable for user
    expect(ac.can(['user'], 'read', 'article', () => false).granted).toBeFalsy();
    expect(ac.can(['user'], 'create', 'article', () => true).granted).toBeTruthy();
  });

  it('should check get grants from permission', () => {
    const ac = new AccessControl(acl);
    const permission = ac.can(['user'], 'read', 'article');

    expect(permission.grant()).toBeDefined();
    expect(permission.grant('own')).toBeDefined();
    expect(permission.grant('own:.*')).toBeDefined();
    expect(permission.grant('own:all')).toBeDefined();
    expect(permission.grant('shared')).toBeDefined();
    expect(permission.grant('shared:.*')).toBeDefined();
    expect(permission.grant('shared:all')).toBeDefined();

    expect(() => permission.grant('share:any')).toThrowError();

    const grantOwn = permission.grant('own');
    expect(grantOwn).toStrictEqual(
      expect.objectContaining({
        role: 'user',
        action: 'read:own',
        subject: 'article',
      }),
    );

    const grantShared = permission.grant('shared');
    expect(grantShared).toStrictEqual(
      expect.objectContaining({
        role: 'user',
        action: 'read:shared',
        subject: 'article',
      }),
    );
  });

  it('should check filtering (field, filter)', () => {
    const ac = new AccessControl(acl);

    const article = {
      id: 1,
      owner: 'user',
      title: 'title',
      content: 'content',
    };

    // check field filtering for user article creation
    const permissionCreate = ac.can(['user'], 'create', 'article');
    const fieldedArticle = permissionCreate.grant().field(article);

    expect(fieldedArticle).not.toStrictEqual(
      expect.objectContaining({
        owner: expect.anything(),
      }),
    );

    expect(fieldedArticle).toStrictEqual(
      expect.objectContaining({
        id: 1,
        title: 'title',
        content: 'content',
      }),
    );

    // check filter filtering for user article reading
    const permissionRead = ac.can(['user'], 'read', 'article');
    const filteredArticle = permissionRead.grant('shared').filter(article);

    expect(filteredArticle).not.toStrictEqual(
      expect.objectContaining({
        id: expect.anything(),
      }),
    );

    expect(filteredArticle).toStrictEqual(
      expect.objectContaining({
        owner: 'user',
        title: 'title',
        content: 'content',
      }),
    );
  });

  it('should check location', () => {
    const ac = new AccessControl(acl);

    const permission = ac.can(['user'], 'create', 'article', (perm) => {
      return perm.grant().location('127.0.0.1');
    });

    expect(permission.granted).toBeTruthy();
    expect(permission.grant().location('192.168.2.1')).toBeFalsy();
    expect(permission.grant().location('192.168.1.100')).toBeTruthy();
    expect(permission.grant().location('192.168.1.200')).toBeTruthy();

    expect(
      ac.can(['user'], 'create', 'article', (perm) => {
        return perm.grant().location('192.168.2.100');
      }).granted,
    ).toBeFalsy();

    expect(
      ac.can(['user'], 'read', 'article', (perm) => {
        return perm.grant().location('192.168.2.100');
      }).granted,
    ).toBeFalsy();

    expect(
      ac.can(['user'], 'read', 'article', (perm) => {
        return perm.grant().location('192.168.2.100', false);
      }).granted,
    ).toBeTruthy();
  });

  it('should check time', () => {
    const ac = new AccessControl(acl);

    const permission = ac.can(['user'], 'create', 'article', (perm) => {
      return perm.grant().time();
    });

    expect(permission.granted).toBeTruthy();
    expect(permission.grant().time()).toBeTruthy();
  });
});
