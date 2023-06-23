import AccessControl, { Ability, Permission, accumulate } from '../src';

enum Role {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
  Manager = 'manager',
}

const abilities: Ability<Role>[] = [
  {
    subject: Role.Admin,
    action: 'any',
    object: 'all',
  },
  {
    subject: Role.Guest,
    action: 'read',
    object: 'article:published',
  },
  {
    subject: Role.Guest,
    action: 'create:own',
    object: 'article:published',
  },
  {
    subject: Role.Manager,
    action: 'any',
    object: 'article',
  },
  {
    subject: Role.User,
    action: 'create:own',
    object: 'article',
    field: ['*', '!owner'],
    location: ['127.0.0.1', '192.168.1.0/24'],
    time: [
      {
        cron_exp: '* * 8 * * *',
        duration: 24 * 60 * 60,
      },
    ],
  },
  {
    subject: Role.User,
    action: 'read:own',
    object: 'article',
  },
  {
    subject: Role.User,
    action: 'read:shared',
    object: 'article',
    filter: ['*', '!id'],
  },
  {
    subject: Role.User,
    action: 'delete:own',
    object: 'article',
  },
  {
    subject: Role.User,
    action: 'update:own',
    object: 'article',
    field: ['*', '!owner'],
  },
];

describe('test access control', () => {
  it('should define', () => {
    expect(new AccessControl(abilities)).toBeDefined();

    const ac = new AccessControl(abilities);
    const perm = ac.can([Role.Admin], 'any', 'all');

    expect(perm.abilities()).toMatchObject([abilities[0]]);
  });

  it('should throw error on invalid update', () => {
    const ac = new AccessControl([]);

    expect(() =>
      ac.update({
        subject: '',
        action: 'r',
        object: 'a',
      }),
    ).toThrowError('Ability object is not valid');
  });

  it('should check access strictly', () => {
    const ac = new AccessControl(abilities, { strict: true });

    expect(ac.can([Role.Guest], 'read', 'article').granted).toBeTruthy();

    expect(ac.can([Role.User], 'read', 'article').granted).toBeTruthy();

    expect(ac.can([Role.User], 'read:own', 'article').granted).toBeTruthy();
    expect(ac.can([Role.User], 'read', 'article:published').granted).toBeFalsy();
  });

  it('should change strict mode dynamically', () => {
    const ac = new AccessControl(abilities, { strict: true });

    expect(ac.can([Role.User], 'read', 'article:published').granted).toBeFalsy();

    // After changing strict mode
    expect(ac.can([Role.User], 'read', 'article:published', undefined, { strict: false }).granted).toBeTruthy();
  });

  it('should check access without callable', () => {
    const ac = new AccessControl<Role>(abilities);

    // check non scoped access without callable for admin
    expect(ac.can([Role.Admin], 'any', 'all').granted).toBeTruthy();
    expect(ac.can([Role.Admin], 'read', 'all').granted).toBeTruthy();
    expect(ac.can([Role.Admin], 'any', 'article').granted).toBeTruthy();
    expect(ac.can([Role.Admin], 'read', 'article').granted).toBeTruthy();
    expect(ac.can([Role.Admin], 'read', 'article:published').granted).toBeTruthy();
    expect(ac.can([Role.Admin], 'read:own', 'article:published').granted).toBeTruthy();

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
    const ac = new AccessControl<string>(abilities);

    // check non scoped access with callable for admin
    expect(
      ac.can(['admin'], 'any', 'all', (perm) => {
        expect(perm).toBeDefined();
        expect(perm.granted).toBeTruthy();
        expect(perm.grants).toStrictEqual(
          expect.objectContaining({
            'any:all': expect.objectContaining({
              subject: 'admin',
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
    const ac = new AccessControl<string>(abilities);
    const permission = ac.can(['user'], 'read', 'article');

    expect(permission.hasAny()).toBeFalsy();
    expect(permission.hasAll()).toBeFalsy();

    expect(permission.hasScopeAny()).toBeFalsy();
    expect(permission.hasScopeAll()).toBeTruthy();

    expect(permission.grant('own')).toBeDefined();
    expect(permission.grant('own:.*')).toBeDefined();
    expect(permission.grant('own:all')).toBeDefined();
    expect(permission.grant('shared')).toBeDefined();
    expect(permission.grant('shared:.*')).toBeDefined();
    expect(permission.grant('shared:all')).toBeDefined();

    expect(() => permission.grant()).toThrowError();
    expect(() => permission.grant('share:all')).toThrowError();
    expect(() => permission.grant('published')).toThrowError();

    const grantOwn = permission.grant('own');
    expect(grantOwn).toStrictEqual(
      expect.objectContaining({
        subject: 'user',
        action: 'read:own',
        object: 'article',
      }),
    );

    const grantShared = permission.grant('shared');
    expect(grantShared).toStrictEqual(
      expect.objectContaining({
        subject: 'user',
        action: 'read:shared',
        object: 'article',
      }),
    );
  });

  it('should check filtering (field, filter)', () => {
    const ac = new AccessControl<string>(abilities);

    const article = {
      id: 1,
      owner: 'user',
      title: 'title',
      content: 'content',
    };

    // check field filtering for user article creation
    const permissionCreate = ac.can(['user'], 'create', 'article');
    const fieldedArticle = permissionCreate.grant('own').field(article);

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

  it('should check permission filtering (field, filter)', () => {
    const ac = new AccessControl<string>(abilities);

    const article = {
      id: 1,
      owner: 'user',
      title: 'title',
      content: 'content',
    };

    // fielding
    let permission = ac.can(['user'], 'create', 'article');
    const fieldedArticle = permission.field(article);

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

    // filtering
    permission = ac.can(['user'], 'read', 'article');
    const filteredArticle = permission.filter(article);

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
    const ac = new AccessControl<string>(abilities);

    const permission = ac.can(['user'], 'create', 'article', (perm) => {
      return perm.grant('own').location('127.0.0.1');
    });

    expect(permission.granted).toBeTruthy();

    expect(permission.location('192.168.2.1')).toBeFalsy();
    expect(permission.location('192.168.1.100')).toBeTruthy();
    expect(permission.location('192.168.1.200')).toBeTruthy();

    expect(permission.grant('.*').location('192.168.2.1')).toBeFalsy();
    expect(permission.grant('.*').location('192.168.1.100')).toBeTruthy();
    expect(permission.grant('.*').location('192.168.1.200')).toBeTruthy();

    expect(
      ac.can(['user'], 'create', 'article', (perm) => {
        return perm.location('192.168.2.100') && perm.grant('.*').location('192.168.2.100');
      }).granted,
    ).toBeFalsy();

    expect(
      ac.can(['user'], 'read', 'article', (perm) => {
        return perm.location('192.168.2.100') && perm.grant('own').location('192.168.2.100');
      }).granted,
    ).toBeTruthy();

    expect(
      ac.can(['user'], 'read', 'article', (perm) => {
        return perm.location('192.168.2.100', true) && perm.grant('shared').location('192.168.2.100', true);
      }).granted,
    ).toBeFalsy();
  });

  it('should check time', () => {
    const ac = new AccessControl<string>(abilities);

    const permission = ac.can(['user'], 'create', 'article', (perm) => {
      return perm.grant('own').time();
    });

    expect(permission.time()).toBeTruthy();
    expect(permission.granted).toBeTruthy();

    expect(permission.grant('.*').time()).toBeTruthy();
  });

  it('should clear abilities', () => {
    const ac = new AccessControl<string>(abilities);

    ac.clear();
    expect(ac.can(['admin'], 'any', 'all').granted).toBeFalsy();
  });

  it('should have multiple subject', () => {
    const ac = new AccessControl<string>(abilities);

    expect(ac.can([Role.Guest, Role.User], 'create', 'article').granted).toBeTruthy();
    expect(ac.can([Role.Guest, Role.User], 'create', 'article:published').granted).toBeFalsy();
    expect(ac.can([Role.Guest, Role.User], 'read', 'article').granted).toBeTruthy();
    expect(ac.can([Role.Guest, Role.User], 'read', 'article:published').granted).toBeTruthy();
    expect(ac.can([Role.Guest, Role.User], 'read', 'arti:pub').granted).toBeFalsy();
    expect(ac.can([Role.Guest, Role.User], 'read', 'artic:published').granted).toBeFalsy();
    expect(ac.can([Role.Guest, Role.User], 'read', 'article:pub').granted).toBeFalsy();

    expect(ac.can([Role.Guest, Role.User], 'read', 'article:unpublished', null, { strict: true }).granted).toBeFalsy();
    expect(ac.can([Role.Guest, Role.User], 'read', 'article:unpublished', null, { strict: false }).granted).toBeTruthy();

    expect(ac.can([Role.Guest, Role.User, Role.Manager], 'read', 'article').granted).toBeTruthy();
    expect(ac.can([Role.Guest, Role.User, Role.Manager], 'read', 'art').granted).toBeFalsy();
    expect(ac.can([Role.Guest, Role.User, Role.Manager], 'read', 'article:published').granted).toBeTruthy();
    expect(ac.can([Role.Guest, Role.User, Role.Manager], 'read', 'article:publ').granted).toBeFalsy();
    expect(ac.can([Role.Guest, Role.User, Role.Manager], 'read', 'arti:publ').granted).toBeFalsy();
  });

  it('should accumulate filters', () => {
    const filter0 = ['*', 'owner', 'status', 'test', '!id', '!all'];
    const filter1 = ['*', '!owner', '!status', 'test', '!id', 'any'];

    const acc0 = accumulate(filter0, filter1);
    const acc1 = accumulate(filter1, filter0);

    expect(acc0).toEqual(['*', 'owner', 'status', 'test', 'any', '!id']);
    expect(acc1).toEqual(['*', 'test', 'any', 'owner', 'status', '!id']);
  });

  it('should have build permission from abilities', () => {
    const ac = new AccessControl(abilities);

    const perm = ac.can([Role.Guest, Role.User], 'read', 'article');

    const permission = Permission.build(perm.granted, perm.abilities());

    expect(permission).toEqual(perm);
    expect(permission).toStrictEqual(perm);
  });
});
