# Attribute Based Access Control Library

[![npm](https://img.shields.io/npm/v/abacl)](https://www.npmjs.com/package/abacl)
[![Coverage](https://raw.githubusercontent.com/vhidvz/abacl/master/coverage-badge.svg)](https://htmlpreview.github.io/?https://github.com/vhidvz/abacl/blob/master/docs/coverage/lcov-report/index.html)
![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/vhidvz/abacl)
![npm](https://img.shields.io/npm/dm/abacl)
![node-current](https://img.shields.io/node/v/abacl)
[![GitHub](https://img.shields.io/github/license/vhidvz/abacl?style=flat)](https://vhidvz.github.io/abacl/)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-nodejs-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Gitter](https://badges.gitter.im/npm-abacl/community.svg)](https://gitter.im/npm-abacl/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![documentation](https://img.shields.io/badge/documentation-click_to_read-c27cf4)](https://vhidvz.github.io/abacl/)
[![Build, Test and Publish](https://github.com/vhidvz/abacl/actions/workflows/npm-ci.yml/badge.svg)](https://github.com/vhidvz/abacl/actions/workflows/npm-ci.yml)

The Attribute-Based Access-Control Library let you define five `can` access ability:

- Who can? the answer is `subject` - Like RBAC a user can have multiple roles.
- How can it? the answer is `action` - You can define `any` actions you want (scoped).
- What can? the answer is `object` - You can define `all` objects you want (scoped).
- Where can? the answer is `location` - With IP and CIDR you can find the location of users.
- When can it? the answer is `time` - objects availabilities with cron expression and a duration.

## Quick Start Guide

> Read more on defining `scoped` `action` and `object` ability in this [link](https://vhidvz.github.io/blog/post-abac/).

### installation

```sh
npm install --save abacl
```

### Usage

Define your user abilities as a json array, so you can store it in your database:

```ts
import { Ability } from 'abacl';

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
        duration: 20 * 60 * 60,
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
const ac = new AccessControl(abilities, { strict: false });
const permission = ac.can([user.subject], 'read', 'article');

// change strict mode dynamically, Example:
// const strictPermission = ac.can([user.subject], 'read', 'article', undefined, { strict: true });

/**
 *   it('should change strict mode dynamically', () => {
 *     const ac = new AccessControl(abilities, { strict: true });
 * 
 *     expect(ac.can([Role.User], 'read', 'article:published').granted).toBeFalsy();
 * 
 *     // After changing strict mode
 *     expect(ac.can([Role.User], 'read', 'article:published', undefined, { strict: false }).granted).toBeTruthy();
 *   });
 * 
 * */

if (permission.granted) {
  // default scope for action and object is `any` and `all`

  if (permission.has('own')) { // Or pattern 'own:.*'
    // user has read owned article objects
  }

  if (permission.has('shared')) { // Or pattern 'shared:.*'
    // user can access shared article objects
  }

  if (permission.has('published')) { // Or pattern '.*:published'
    // user can access shared article objects
  }

  // do something ...

  // get grants by pattern 'shared' or 'shared:.*'
  // pattern: [action_scoped_regex]:[object_scoped_regex]
  const response = permission.grant('shared').filter(article);

  // Now response has no `id` property so sent it to user
}
```

Time and location access check example:

```ts
import { Permission } from 'abacl';

// default `strict` value is true
const ac = new AccessControl(abilities, { strict: true });

const permission = ac.can([user.subject], 'create', 'article', (perm: Permission) => {
  return perm.grant('own').location(user.ip) && perm.grant('own').time();
});

// it('should replace granted on falsy', () => {
//   const ac = new AccessControl<string>(abilities);
//   const permission = ac.can([Role.Guest, Role.User], 'make', 'nothing', () => true);
//   expect(permission.granted).toBeTruthy();
// });

if (permission.granted) {
  const inputData = permission.grant('.*').field(article);

  // the `inputData` has not `owner` property
  // do something and then return results to user
}
```

## Thanks a lot

[accesscontrol](https://www.npmjs.com/package/accesscontrol) - Role and Attribute based Access Control for Node.js

[CASL](https://casl.js.org/) is an isomorphic authorization JavaScript library which restricts what resources a given user is allowed to access.

## License

[MIT](https://github.com/vhidvz/abacl/blob/master/LICENSE)
