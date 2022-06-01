# Attribute Based Access Control Library

[![npm](https://img.shields.io/npm/v/abacl)](https://www.npmjs.com/package/abacl)
[![Coverage](https://raw.githubusercontent.com/vhidvz/abacl/master/coverage-badge.svg)](https://htmlpreview.github.io/?https://github.com/vhidvz/abacl/blob/master/docs/coverage/lcov-report/index.html)
![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/vhidvz/abacl)
![npm](https://img.shields.io/npm/dm/abacl)
![Libraries.io dependency status for latest release](https://img.shields.io/librariesio/release/npm/abacl)
![node-current](https://img.shields.io/node/v/abacl)
[![GitHub](https://img.shields.io/github/license/vhidvz/abacl?style=flat)](https://vhidvz.github.io/abacl/)
[![semantic-release: angular](https://img.shields.io/badge/semantic--release-nodejs-e10079?logo=semantic-release)](https://github.com/semantic-release/semantic-release)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Gitter](https://badges.gitter.im/npm-abacl/community.svg)](https://gitter.im/npm-abacl/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![documentation](https://img.shields.io/badge/documentation-click_to_read-c27cf4)](https://vhidvz.github.io/abacl/)
[![Build, Test and Publish](https://github.com/vhidvz/abacl/actions/workflows/npm-ci.yml/badge.svg)](https://github.com/vhidvz/abacl/actions/workflows/npm-ci.yml)

The Attribute-Based Access-Control Library let you define five `can` access ability:

- Who can? the answer is `role` - Like RBAC a user can have roles.
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
import { AccessAbility } from 'abacl';

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
```

Article and User definition objects:

```ts
const user = {
  id: 1,
  role: 'user',
  ip: '192.168.1.100',
};

const article = {
  id: 1,
  owner: 'user',
  title: 'title',
  content: 'content',
};
```

Create a new access control object, then get the permission grants:

```ts
import AccessControl from 'abacl';

const ac = new AccessControl(abilities);
const permission = ac.can([user.role], 'read', 'article');

if (permission.granted) {

  if (permission.has('own')) {
    // user has read owned article objects
  }

  if (permission.has('shared')) {
    // user can access shared article objects
  }

  // do something ...

  const response = permission.grant('shared').filter(article);

  // Now response has no `id` property so sent it to user
}
```

Time and location access check example:

```ts
import { Permission } from 'abacl';

const ac = new AccessControl(abilities);

const permission = ac.can([user.role], 'create', 'article', (perm: Permission) => {
  return perm.grant().location(user.ip) && perm.grant().time();
});

if (permission.granted) {
  const inputData = permission.grant().field(article);

  // the `inputData` has not `owner` property
  // do something and then return results to user
}
```

## Thanks a lot

[accesscontrol](https://www.npmjs.com/package/accesscontrol) - Role and Attribute based Access Control for Node.js

[CASL](https://casl.js.org/) is an isomorphic authorization JavaScript library which restricts what resources a given user is allowed to access.

## License

[MIT](https://github.com/vhidvz/abacl/blob/master/LICENSE)
