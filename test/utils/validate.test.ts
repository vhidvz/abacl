import { IP_CIDR, Policy, isCIDR, isIP, validate } from '../../src';

describe('test validate utils', () => {
  it('should verify ip address', () => {
    expect(isIP('192.168.1.1')).toBeTruthy();
    expect(isIP('192.168.1.1/24')).toBeFalsy();

    expect(isIP('fe80:1e15:1fff:fecc')).toBeFalsy();
    expect(isIP('fe80::1e15:1fff:fecc:d300')).toBeTruthy();
  });

  it('should verify cidr address', () => {
    expect(isCIDR('192.168.1.1')).toBeFalsy();
    expect(isCIDR('192.168.1.1/24')).toBeTruthy();

    expect(isCIDR('fe80::1e15:1fff:fecc:d300')).toBeFalsy();
    expect(isCIDR('fe80::1e15:1fff:fecc:d300/36')).toBeTruthy();
  });

  it('should verify ip/cidr address', () => {
    expect(IP_CIDR('192.168.1.1')).toBeTruthy();
    expect(IP_CIDR('192.168.1.1/24')).toBeTruthy();

    expect(IP_CIDR('fe80::1e15:1fff:fecc:d300')).toBeTruthy();
    expect(IP_CIDR('fe80::1e15:1fff:fecc:d300/36')).toBeTruthy();
  });

  it('should validate policy with location and time', () => {
    const policy: Policy = {
      subject: 'vhid.vz@gmail.com:author',
      action: 'read:shared',
      object: 'articles:published',
      time: [
        {
          cron_exp: '* * 7 * * *', // from 7 AM
          duration: 9 * 60 * 60, // for 9 hours
        },
      ],
      location: ['192.168.2.10', '192.168.1.0/24'],
    };

    expect(() => validate(policy)).not.toThrow();

    expect(() => validate({ ...policy, action: '' })).toThrowError('Policy is not valid');

    const time = [
      {
        cron_exp: '* * * * *',
        duration: 28800,
      },
    ];
    expect(() => validate({ ...policy, time })).toThrowError('Policy time is not valid');

    const location = ['192.168.1.', '::::'];
    expect(() => validate({ ...policy, location })).toThrowError('Policy location is not valid');
  });
});
