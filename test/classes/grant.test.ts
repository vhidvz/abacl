import { ALL, ANY, Grant } from '../../src';
import { Role, policies } from '../mock';

describe('test grant class', () => {
  let grant: Grant;

  it('should define grant instance', () => {
    grant = new Grant(policies);

    expect(grant).toBeDefined();
    expect(grant.policies).toEqual(policies);
  });

  it('should check exists policy in db', () => {
    expect(grant.exists(policies[0])).toBeTruthy();

    expect(grant.exists({ subject: 'nothing', action: 'nothing', object: 'nothing' })).toBeFalsy();
  });

  it('should delete policy from policies', () => {
    expect(grant.delete(policies[1])).toBeTruthy();
    expect(grant.exists(policies[1])).toBeFalsy();

    expect(() => grant.update(policies[1])).not.toThrowError();
    expect(grant.exists(policies[1])).toBeTruthy();
  });

  it('should verify has pattern exists', () => {
    expect(grant.has({ subject: { val: Role.Admin } })).toBeTruthy();
    expect(grant.has({ subject: { val: { main: Role.Admin } } })).toBeTruthy();

    expect(grant.has({ action: { val: ANY }, object: { val: ALL } })).toBeTruthy();
  });

  it('should return grant scopes', () => {
    expect(grant.scopes('subject')).toEqual([]);

    expect(grant.scopes('object')).toEqual(['published']);
    expect(grant.scopes('action')).toEqual(['own', 'shared']);

    expect(grant.scopes('action', { subject: { val: 'user' }, action: { val: 'read', strict: true } })).toEqual([]);
    expect(grant.scopes('action', { subject: { val: 'user' }, action: { val: 'read', strict: false } })).toEqual(['own', 'shared']);
  });

  it('should return grant subjects', () => {
    expect(grant.subjects()).toEqual(['admin', 'guest', 'manager', 'user']);

    expect(grant.subjects({ action: { val: 'read' } })).toEqual(['manager', 'guest']);

    expect(grant.subjects({ action: { val: 'read', strict: true } })).toEqual(['manager', 'guest']);
    expect(grant.subjects({ action: { val: 'read', strict: false } })).toEqual(['manager', 'user', 'guest']);
  });

  it('should check time accessibility', () => {
    const positiveDate = new Date('Fri Jun 23 2023 10:07:34 GMT+0330 (Iran Standard Time)');
    const negativeDate = new Date('Fri Jun 23 2023 19:07:34 GMT+0330 (Iran Standard Time)');

    expect(grant.time({}, { currentDate: positiveDate, tz: 'Asia/Tehran' })).toBeTruthy();
    expect(grant.time({}, { currentDate: negativeDate, tz: 'Asia/Tehran' })).toBeFalsy();

    expect(grant.time({ subject: { val: 'admin' } }, { currentDate: positiveDate, tz: 'Asia/Tehran' })).toBeTruthy();
    expect(grant.time({ subject: { val: 'admin' } }, { currentDate: negativeDate, tz: 'Asia/Tehran' })).toBeTruthy();
  });

  it('should check location accessibility', () => {
    const negativeIP = '192.168.0.10';
    const positiveIP0 = '192.168.2.10';
    const positiveIP1 = '192.168.1.10';

    expect(grant.location(negativeIP)).toBeFalsy();
    expect(grant.location(positiveIP0)).toBeTruthy();
    expect(grant.location(positiveIP1)).toBeTruthy();

    expect(grant.location(negativeIP, { subject: { val: 'admin' } })).toBeTruthy();
    expect(grant.location(positiveIP0, { subject: { val: 'admin' } })).toBeTruthy();
    expect(grant.location(positiveIP1, { subject: { val: 'admin' } })).toBeTruthy();
  });

  it('should field input data', async () => {
    const article = {
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    };

    expect(await grant.field(article)).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(await grant.field(article, { subject: { val: 'user' } })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(await grant.field(article, { subject: { val: 'user' }, action: { val: 'update' } })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });
    expect(await grant.field(article, { subject: { val: 'user' }, action: { val: 'update', strict: false } })).toEqual({
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

    expect(await grant.filter(article)).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(await grant.filter(article, { subject: { val: 'user' } })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(await grant.filter(article, { subject: { val: 'user' }, action: { val: 'read' } })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });
    expect(await grant.filter(article, { subject: { val: 'user' }, action: { val: 'read', strict: false } })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });
  });
});
