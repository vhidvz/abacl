import AccessControl, { AccessAbility } from '../src';

enum Role {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
  Manager = 'manager',
}

const acl: AccessAbility<Role>[] = [
  {
    role: Role.Admin,
    action: 'any',
    object: 'all',
  },
  {
    role: Role.Guest,
    action: 'read',
    object: 'article',
  },
  {
    role: Role.Manager,
    action: 'any',
    object: 'article',
  },
  {
    role: Role.User,
    action: 'create:own',
    object: 'article',
    field: ['*', '!owner'],
    location: ['127.0.0.1', '192.168.1.0/24'],
    time: [
      {
        cron_exp: '* * 8 * * *',
        duration: 20 * 60 * 60,
      },
    ],
  },
  {
    role: Role.User,
    action: 'read:own',
    object: 'article',
  },
  {
    role: Role.User,
    action: 'read:shared',
    object: 'article',
    filter: ['*', '!id'],
  },
  {
    role: Role.User,
    action: 'delete:own',
    object: 'article',
  },
  {
    role: Role.User,
    action: 'update:own',
    object: 'article',
    field: ['*', '!owner'],
  },
];

describe('test access control', () => {
  it('should define', () => {
    expect(new AccessControl(acl)).toBeDefined();
  });

  it('should throw error on invalid update', () => {
    const ac = new AccessControl([]);

    expect(() =>
      ac.update({
        role: '',
        action: 'r',
        object: 'a',
      }),
    ).toThrowError('data/role must NOT have fewer than 1 characters');
  });

  it('should check access without callable', () => {
    const ac = new AccessControl<Role>(acl);

    // check non scoped access without callable for admin
    expect(ac.can([Role.Admin], 'any', 'all').granted).toBeTruthy();
    expect(ac.can([Role.Admin], 'read', 'all').granted).toBeTruthy();
    expect(ac.can([Role.Admin], 'any', 'article').granted).toBeTruthy();
    expect(ac.can([Role.Admin], 'read', 'article').granted).toBeTruthy();

    // check non scoped access without callable for guest
    expect(ac.can([Role.Guest], 'any', 'all').granted).toBeFalsy();
    expect(ac.can([Role.Guest], 'read', 'all').granted).toBeFalsy();
    expect(ac.can([Role.Guest], 'any', 'article').granted).toBeFalsy();
    expect(ac.can([Role.Guest], 'read', 'article').granted).toBeTruthy();

    // check non scoped access without callable for manager
    expect(ac.can([Role.Manager], 'any', 'all').granted).toBeFalsy();
    expect(ac.can([Role.Manager], 'read', 'all').granted).toBeFalsy();
    expect(ac.can([Role.Manager], 'any', 'article').granted).toBeTruthy();
    expect(ac.can([Role.Manager], 'read', 'article').granted).toBeTruthy();

    // check non scoped access without callable for user
    expect(ac.can([Role.User], 'create', 'article').granted).toBeTruthy();
    expect(ac.can([Role.User], 'read', 'article').granted).toBeTruthy();
    expect(ac.can([Role.User], 'delete', 'article').granted).toBeTruthy();
    expect(ac.can([Role.User], 'update', 'article').granted).toBeTruthy();
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
              object: 'all',
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

    expect(permission.hasAny()).toBeFalsy();
    expect(permission.hasAll()).toBeFalsy();

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
        object: 'article',
      }),
    );

    const grantShared = permission.grant('shared');
    expect(grantShared).toStrictEqual(
      expect.objectContaining({
        role: 'user',
        action: 'read:shared',
        object: 'article',
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

    // filter single object
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

    // filter array objects
    const filteredArticles = permissionRead.grant('shared').filter([article]);

    expect(filteredArticles).not.toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.anything(),
        }),
      ]),
    );

    expect(filteredArticles).toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({
          owner: 'user',
          title: 'title',
          content: 'content',
        }),
      ]),
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

  it('should clear acl', () => {
    const ac = new AccessControl(acl);

    ac.clear();
    expect(ac.can(['admin'], 'any', 'all').granted).toBeFalsy();
  });
});
