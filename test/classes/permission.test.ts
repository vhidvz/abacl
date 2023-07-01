import { ALL, ANY, Permission, normalize, pattern } from '../../src';
import { Role, policies } from '../mock';

describe('test permission class', () => {
  let perm: Permission;

  it('should define perm instance', () => {
    perm = Permission.build(true, policies);

    expect(perm).toBeDefined();
    expect(perm.policies).toEqual(policies);
  });

  it('should verify has pattern exists', () => {
    expect(perm.has({ subject: pattern({ main: Role.Admin }, 'subject') })).toBeTruthy();

    expect(perm.has({ action: normalize(ANY, 'action'), object: normalize(ALL, 'object') })).toBeTruthy();
  });

  it('should return perm scopes', () => {
    expect(perm.scopes('subject')).toEqual([]);

    expect(perm.scopes('action')).toEqual(['own', 'shared']);
    expect(perm.scopes('object')).toEqual(['published']);

    expect(
      perm.scopes('action', { subject: normalize('user', 'subject'), action: normalize('read', 'action', { strict: true }) }),
    ).toEqual([]);
    expect(
      perm.scopes('action', { subject: normalize('user', 'subject'), action: normalize('read', 'action', { strict: false }) }),
    ).toEqual(['own', 'shared']);
  });

  it('should return perm subjects', () => {
    expect(perm.subjects()).toEqual(['admin', 'guest', 'manager', 'user']);

    expect(perm.subjects({ action: normalize('read', 'action') })).toEqual(['guest']);

    expect(perm.subjects({ action: normalize('read', 'action', { strict: true }) })).toEqual(['guest']);
    expect(perm.subjects({ action: normalize('read', 'action', { strict: false }) })).toEqual(['guest', 'user']);
  });

  it('should check time accessibility', () => {
    const positiveDate = new Date('Fri Jun 23 2023 10:07:34 GMT+0330 (Iran Standard Time)');
    const negativeDate = new Date('Fri Jun 23 2023 19:07:34 GMT+0330 (Iran Standard Time)');

    expect(perm.time({}, { currentDate: positiveDate, tz: 'Asia/Tehran' })).toBeTruthy();
    expect(perm.time({}, { currentDate: negativeDate, tz: 'Asia/Tehran' })).toBeFalsy();

    expect(perm.time({ subject: normalize('admin', 'subject') }, { currentDate: positiveDate, tz: 'Asia/Tehran' })).toBeTruthy();
    expect(perm.time({ subject: normalize('admin', 'subject') }, { currentDate: negativeDate, tz: 'Asia/Tehran' })).toBeTruthy();
  });

  it('should check location accessibility', () => {
    const negativeIP = '192.168.0.10';
    const positiveIP0 = '192.168.2.10';
    const positiveIP1 = '192.168.1.10';

    expect(perm.location(negativeIP)).toBeFalsy();
    expect(perm.location(positiveIP0)).toBeTruthy();
    expect(perm.location(positiveIP1)).toBeTruthy();

    expect(perm.location(negativeIP, { subject: normalize('admin', 'subject') })).toBeTruthy();
    expect(perm.location(positiveIP0, { subject: normalize('admin', 'subject') })).toBeTruthy();
    expect(perm.location(positiveIP1, { subject: normalize('admin', 'subject') })).toBeTruthy();
  });

  it('should field input data', () => {
    const article = {
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    };

    expect(perm.field(article)).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(perm.field(article, { subject: normalize('user', 'subject') })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(perm.field(article, { subject: normalize('user', 'subject'), action: normalize('update', 'action') })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });
    expect(
      perm.field(article, { subject: normalize('user', 'subject'), action: normalize('update', 'action', { strict: false }) }),
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

    expect(perm.filter(article)).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(perm.filter(article, { subject: normalize('user', 'subject') })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    expect(perm.filter(article, { subject: normalize('user', 'subject'), action: normalize('read', 'action') })).toEqual({
      id: '5f4d1e2c-a7b2-40',
      owner: 'vhid.vz@gmail.com',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });
    expect(
      perm.filter(article, { subject: normalize('user', 'subject'), action: normalize('read', 'action', { strict: false }) }),
    ).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    let customAction = 'CreateProcess';
    expect(
      perm.field(article, (_) => {
        if (customAction === 'CreateProcess') return { action: pattern({ main: 'create' }, 'action', { strict: false }) };
        else if (customAction === 'UpdateProcess') return { action: pattern({ main: 'update' }, 'action', { strict: false }) };
        else return {};
      }),
    ).toEqual({
      id: '5f4d1e2c-a7b2-40',
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });

    customAction = 'UpdateProcess';
    expect(
      perm.field(article, (_) => {
        if (customAction === 'CreateProcess') return { action: pattern({ main: 'create' }, 'action', { strict: false }) };
        else if (customAction === 'UpdateProcess') return { action: pattern({ main: 'update' }, 'action', { strict: false }) };
        else return {};
      }),
    ).toEqual({
      title: 'sample title',
      content: 'sample content',
      tags: ['tag'],
    });
  });
});
