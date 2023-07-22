import { ALL, ANY, Permission } from '../../src';
import { Role, policies } from '../mock';

describe('test permission class', () => {
  let perm: Permission;

  it('should define perm instance', () => {
    perm = Permission.build(true, policies);

    expect(perm).toBeDefined();
    expect(perm.policies).toEqual(policies);
  });

  it('should verify has pattern exists', () => {
    expect(perm.has({ subject: { val: Role.Admin } })).toBeTruthy();

    expect(perm.has({ action: { val: ANY }, object: { val: ALL } })).toBeTruthy();
  });

  it('should return perm scopes', () => {
    expect(perm.scopes('subject')).toEqual([]);

    expect(perm.scopes('object')).toEqual(['published']);
    expect(perm.scopes('action')).toEqual(['own', 'shared']);

    expect(perm.scopes('action', { subject: { val: 'user' }, action: { val: 'read', strict: true } })).toEqual([]);
    expect(perm.scopes('action', { subject: { val: 'user' }, action: { val: 'read', strict: false } })).toEqual(['own', 'shared']);
  });

  it('should return perm subjects', () => {
    expect(perm.subjects()).toEqual(['admin', 'guest', 'manager', 'user']);

    expect(perm.subjects({ action: { val: 'read' } })).toEqual(['guest']);

    expect(perm.subjects({ action: { val: 'read', strict: true } })).toEqual(['guest']);
    expect(perm.subjects({ action: { val: 'read', strict: false } })).toEqual(['guest', 'user']);
  });

  it('should check time accessibility', () => {
    const positiveDate = new Date('Fri Jun 23 2023 10:07:34 GMT+0330 (Iran Standard Time)');
    const negativeDate = new Date('Fri Jun 23 2023 19:07:34 GMT+0330 (Iran Standard Time)');

    expect(perm.time({}, { currentDate: positiveDate, tz: 'Asia/Tehran' })).toBeTruthy();
    expect(perm.time({}, { currentDate: negativeDate, tz: 'Asia/Tehran' })).toBeFalsy();

    expect(perm.time({ subject: { val: 'admin' } }, { currentDate: positiveDate, tz: 'Asia/Tehran' })).toBeTruthy();
    expect(perm.time({ subject: { val: 'admin' } }, { currentDate: negativeDate, tz: 'Asia/Tehran' })).toBeTruthy();
  });

  it('should check location accessibility', () => {
    const negativeIP = '192.168.0.10';
    const positiveIP0 = '192.168.2.10';
    const positiveIP1 = '192.168.1.10';

    expect(perm.location(negativeIP)).toBeFalsy();
    expect(perm.location(positiveIP0)).toBeTruthy();
    expect(perm.location(positiveIP1)).toBeTruthy();

    expect(perm.location(negativeIP, { subject: { val: 'admin' } })).toBeTruthy();
    expect(perm.location(positiveIP0, { subject: { val: 'admin' } })).toBeTruthy();
    expect(perm.location(positiveIP1, { subject: { val: 'admin' } })).toBeTruthy();
  });

  it('should field input data', async () => {
    const article = {
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    };

    expect(await perm.field(article)).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(await perm.field(article, { subject: { val: 'user' } })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(await perm.field(article, { subject: { val: 'user' }, action: { val: 'update' } })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });
    expect(await perm.field(article, { subject: { val: 'user' }, action: { val: 'update', strict: false } })).toEqual({
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });
  });

  it('should filter output data', async () => {
    const article = {
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    };

    expect(await perm.filter(article)).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(await perm.filter(article, { subject: { val: 'user' } })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(await perm.filter(article, { subject: { val: 'user' }, action: { val: 'read' } })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });
    expect(await perm.filter(article, { subject: { val: 'user' }, action: { val: 'read', strict: false } })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });
  });
});
