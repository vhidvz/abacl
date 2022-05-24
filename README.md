# Attribute Based Access Control Library

[![npm](https://img.shields.io/npm/v/abacl)](https://www.npmjs.com/package/abacl)
[![GitHub](https://img.shields.io/github/license/vhidvz/abacl?style=flat)](https://vhidvz.github.io/abacl/)
![Snyk Vulnerabilities for GitHub Repo](https://img.shields.io/snyk/vulnerabilities/github/vhidvz/abacl)
[![Coverage](https://raw.githubusercontent.com/vhidvz/abacl/master/coverage-badge.svg)](https://htmlpreview.github.io/?https://github.com/vhidvz/abacl/blob/master/docs/coverage/lcov-report/index.html)
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

const abilities: AccessAbility[] = [
  { // the admin ability can do `any`thing with `all` objects
    role: 'admin',
    action: 'any',
    object: 'all',
  },
  { // ability scoped by published articles
    role: 'guest',
    action: 'read',
    object: 'article:published',
  },
  { // the manager can to `any`thing with articles
    role: 'manager',
    action: 'any',
    object: 'article',
  },
  { // the user can create own articles (scoped by own)
    role: 'user',
    action: 'create:own',
    object: 'article',
    field: ['*', '!owner'], // filters the input data of the user 
    location: ['127.0.0.1', '192.168.1.0/24'],
    time: [
      { // from 8AM to 6PM
        cron_exp: '* * 8 * * *', // every day from 8AM
        duration: 10 * 60 * 60, // 10 hours in seconds
      },
    ],
  },
  {
    role: 'user',
    action: 'read:own',
    object: 'article',
  },
  { // the user can read shared articles without `id` properties 
    role: 'user',
    action: 'read:shared',
    object: 'article',
    filter: ['*', '!id'], // filters output data
  },
  {
    role: 'user',
    action: 'delete:own',
    object: 'article',
  },
  {
    role: 'user',
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
