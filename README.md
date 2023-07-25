# Attribute-Based Access Control Library

[![npm](https://img.shields.io/npm/v/abacl)](https://www.npmjs.com/package/abacl)
[![Coverage](https://raw.githubusercontent.com/vhidvz/abacl/master/coverage-badge.svg)](https://htmlpreview.github.io/?https://github.com/vhidvz/abacl/blob/master/docs/coverage/lcov-report/index.html)
![npm](https://img.shields.io/npm/dm/abacl)
[![GitHub](https://img.shields.io/github/license/vhidvz/abacl?style=flat)](https://vhidvz.github.io/abacl/)
[![Gitter](https://badges.gitter.im/npm-abacl/community.svg)](https://gitter.im/npm-abacl/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![documentation](https://img.shields.io/badge/documentation-click_to_read-c27cf4)](https://vhidvz.github.io/abacl/)
[![Build, Test and Publish](https://github.com/vhidvz/abacl/actions/workflows/npm-ci.yml/badge.svg)](https://github.com/vhidvz/abacl/actions/workflows/npm-ci.yml)

The Attribute-Based Access-Control Library let you define five `can` access ability:

- Who can? the answer is `subject` - Like RBAC a user can have multiple subjects.
- How can it? the answer is `action` - You can define `any` actions you want (scoped).
- What can? the answer is `object` - You can define `all` objects you want (scoped).
- Where can? the answer is `location` - With IP and CIDR you can find the location of users.
- When can it? the answer is `time` - objects availabilities with cron expression and a duration.

## ABAC vs RBAC?

| **Question**       | **RBAC**                          | **ABAC**                                    |
| ------------------ | --------------------------------- | ------------------------------------------- |
| Who can access?    | :white_check_mark:                | :heavy_check_mark: With more options        |
| How can operate?   | :white_check_mark: CRUD           | :heavy_check_mark: With more options        |
| What resource?     | :white_check_mark: Not Bad At All | :heavy_check_mark: More control on resource |
| Where user can do? | :x:                               | :heavy_check_mark: Supported by IP and CIDR |
| When user can do?  | :x:                               | :heavy_check_mark: Supported by CRON        |
| Best structure?    | Monolithic Apps                   | PWA, Restful, GraphQL                       |
| Suitable for?      | Small and medium projects         | Medium and large projects                   |

### What's Scope?

- look at carefully; scan.
- assess or investigate something.

In this library, We scoped `action`, `object` and `subject` which means you can have more control over these attributes.

## Quick Start Guide

### installation

```sh
npm install --save abacl
```

### Usage and Dangling

Define your user policies as a json array (so you can store it in your database):

```ts
import { Policy } from 'abacl';

enum Role {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
  Manager = 'manager',
}

const policies: Policy<Role>[] = [
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
    location: ['192.168.2.10', '192.168.1.0/24'],
    time: [
      {
        cron_exp: '* * 7 * * *', // from 7 AM
        duration: 9 * 60 * 60, // for 9 hours
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
    filter: ['*', '!owner'],
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
    field: ['*', '!id', '!owner'],
  },
];
```

Article and User definition objects:

```ts
const user = {
  id: 1,
  subject: Role.User,
  ip: '192.168.1.100',
};

const article = {
  id: 1,
  owner: 'user1',
  title: 'title',
  content: 'content',
};
```

Create a new access control object, then get the permission grants:

```ts
import AccessControl from 'abacl';

// The `strict` `AccessControlOption` control the scoped functionality
// default strict value is true, you can change it on the `can` method

const ac = new AccessControl(policies, { strict: false });
const permission = await ac.can([user.subject], 'read', 'article');

// change strict mode dynamically, Example:
// const strictPermission = await ac.can([user.subject], 'read', 'article', { strict: true });

/**
 *   it('should change strict mode dynamically', () => {
 *     const ac = new AccessControl(policies, { strict: true });
 *
 *     expect(await ac.can([Role.User], 'read', 'article:published').granted).toBeFalsy();
 *
 *     // After changing strict mode
 *     expect(await ac.can([Role.User], 'read', 'article:published', { strict: false }).granted).toBeTruthy();
 *   });
 *
 * */

if (permission.granted) {
  // default scope for action and object is `any` and `all`

  if (permission.has({ action: 'read:own' })) {
    // user has read owned article objects
  }

  if (permission.has({ action: 'read:shared' })) {
    // user can access shared article objects
  }

  if (permission.has({ object: 'article:published' })) {
    // user can access shared article objects
  }

  // do something ...

  // return filtered data based on the permission
  const response = await permission.filter(article);
}
```

Time and location access check example:

```ts
import { AccessControl, Permission } from 'abacl';

// default `strict` value is true
const ac = new AccessControl(policies, { strict: true });

const permission = await ac.can([user.subject], 'create', 'article', {
  callable: (perm: Permission) => {
    return perm.location(user.ip) && perm.time();
  },
});

if (permission.granted) {
  const inputData = await permission.field(article);

  // the `inputData` has not `owner` property
  // do something and then return results to user
}
```

## Related Project

- [abacl-redis](https://www.npmjs.com/package/abacl-redis) redis storage driver.

## Thanks a lot

[accesscontrol](https://www.npmjs.com/package/accesscontrol) - Role and Attribute based Access Control for Node.js

[CASL](https://casl.js.org/) is an isomorphic authorization JavaScript library which restricts what resources a given user is allowed to access.

## License

[MIT](https://github.com/vhidvz/abacl/blob/master/LICENSE)
