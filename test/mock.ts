import { Policy } from '../src';

export enum Role {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
  Manager = 'manager',
}

export const policies: Policy<Role>[] = [
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
    subject: Role.Manager,
    action: 'read',
    object: 'article:published',
  },
  {
    subject: Role.Manager,
    action: 'update:shared',
    object: 'article',
    field: ['*', '!id', '!owner'],
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
