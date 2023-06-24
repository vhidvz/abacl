import { ALL, ANY, Grant, normalize, pattern } from '../../src';
import { Role, policies } from '../mock';

describe('test grant class', () => {
  let grant: Grant;

  it('should define grant instance', () => {
    grant = new Grant(policies);

    expect(grant).toBeDefined();
    expect(grant.policies).toEqual(policies);
  });

  it('should throw exception on duplication', () => {
    const arrowFn = () => grant.update({ subject: Role.Admin, action: 'any', object: 'all' });
    expect(() => arrowFn()).toThrowError('policy with subject "admin", action "any" and object "all" already exists');
  });

  it('should verify has pattern exists', () => {
    expect(grant.has({ subject: pattern({ main: Role.Admin }, 'subject') })).toBeTruthy();

    expect(grant.has({ action: normalize(ANY, 'action'), object: normalize(ALL, 'object') })).toBeTruthy();
  });

  it('should return grant subjects', () => {
    expect(grant.subjects()).toEqual(['admin', 'guest', 'manager', 'user']);

    expect(grant.subjects({ action: normalize('read', 'action') })).toEqual(['guest']);

    expect(grant.subjects({ action: normalize('read', 'action', { strict: true }) })).toEqual(['guest']);
    expect(grant.subjects({ action: normalize('read', 'action', { strict: false }) })).toEqual(['guest', 'user']);
  });

  it('should check time accessibility', () => {
    const positiveDate = new Date('Fri Jun 23 2023 10:07:34 GMT+0330 (Iran Standard Time)');
    const negativeDate = new Date('Fri Jun 23 2023 19:07:34 GMT+0330 (Iran Standard Time)');

    expect(grant.time({}, { currentDate: positiveDate, tz: 'Asia/Tehran' })).toBeTruthy();
    expect(grant.time({}, { currentDate: negativeDate, tz: 'Asia/Tehran' })).toBeFalsy();

    expect(grant.time({ subject: normalize('admin', 'subject') }, { currentDate: positiveDate, tz: 'Asia/Tehran' })).toBeTruthy();
    expect(grant.time({ subject: normalize('admin', 'subject') }, { currentDate: negativeDate, tz: 'Asia/Tehran' })).toBeTruthy();
  });

  it('should check location accessibility', () => {
    const negativeIP = '192.168.0.10';
    const positiveIP0 = '192.168.2.10';
    const positiveIP1 = '192.168.1.10';

    expect(grant.location(negativeIP)).toBeFalsy();
    expect(grant.location(positiveIP0)).toBeTruthy();
    expect(grant.location(positiveIP1)).toBeTruthy();

    expect(grant.location(negativeIP, { subject: normalize('admin', 'subject') })).toBeTruthy();
    expect(grant.location(positiveIP0, { subject: normalize('admin', 'subject') })).toBeTruthy();
    expect(grant.location(positiveIP1, { subject: normalize('admin', 'subject') })).toBeTruthy();
  });

  it('should field input data', () => {
    const article = {
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    };

    expect(grant.field(article)).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(grant.field(article, { subject: normalize('user', 'subject') })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(grant.field(article, { subject: normalize('user', 'subject'), action: normalize('update', 'action') })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });
    expect(
      grant.field(article, { subject: normalize('user', 'subject'), action: normalize('update', 'action', { strict: false }) }),
    ).toEqual({
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });
  });

  it('should filter output data', () => {
    const article = {
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    };

    expect(grant.filter(article)).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(grant.filter(article, { subject: normalize('user', 'subject') })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(grant.filter(article, { subject: normalize('user', 'subject'), action: normalize('read', 'action') })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });
    expect(
      grant.filter(article, { subject: normalize('user', 'subject'), action: normalize('read', 'action', { strict: false }) }),
    ).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });
  });
});
