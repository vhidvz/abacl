import { key, normalize, parse, pattern, regex, scope } from '../../src';

describe('test policy utils', () => {
  it('should parse scoped value', () => {
    expect(() => parse(null)).toThrowError('Value is not parsable');
    expect(parse('create:own')).toEqual({ main: 'create', scope: 'own' });
  });

  it('should return scope pattern', () => {
    expect(scope('own', { strict: true })).toEqual('own');
    expect(scope('own', { strict: false })).toEqual('[^:][^:]*');
  });

  it('should return full pattern of policy', () => {
    expect(pattern({ main: 'root' }, 'subject')).toEqual('root:null');

    expect(pattern({ main: 'read', scope: 'own' }, 'action', { strict: true })).toEqual('read:own');
    expect(pattern({ main: 'read', scope: 'own' }, 'action', { strict: false })).toEqual('read:[^:][^:]*');

    expect(pattern({ main: 'article', scope: 'published' }, 'object', { sep: '#' })).toEqual('article#published');
  });

  it('should return full normal pattern of policy', () => {
    expect(normalize('root', 'subject')).toEqual('root:null');

    expect(normalize('read:own', 'action', { strict: true })).toEqual('read:own');
    expect(normalize('read:own', 'action', { strict: false })).toEqual('read:[^:][^:]*');

    expect(normalize('article#published', 'object', { sep: '#' })).toEqual('article#published');
  });

  it('should generate key for indexing', () => {
    expect(key({ subject: 'vhid.vz@gmail.com:author', action: 'any', object: 'all' })).toEqual(
      'vhid.vz@gmail.com:author:any:any:all:all',
    );

    expect(key({ subject: 'vahid@wenex.org', action: 'read:group', object: 'articles' })).toEqual(
      'vahid@wenex.org:null:read:group:articles:all',
    );
    expect(key({ subject: 'vahid@wenex.org', action: 'read', object: 'articles#published' }, '#')).toEqual(
      'vahid@wenex.org#null#read#any#articles#published',
    );
  });

  it('should return regex of indexed policies', () => {
    expect(regex({ subject: 'vhid.vz@gmail.com:author', action: 'any', object: 'all' })).toEqual(
      /^vhid.vz@gmail.com:author:any:any:all:all$/,
    );

    expect(regex({ subject: 'vhid.vz@gmail.com:author', action: 'any', object: 'all' }, { strict: true })).toEqual(
      /^vhid.vz@gmail.com:author:any:any:all:all$/,
    );
    expect(regex({ subject: 'vhid.vz@gmail.com:author', action: 'any', object: 'all' }, { strict: false })).toEqual(
      /^vhid.vz@gmail.com:[^:][^:]*:any:[^:][^:]*:all:[^:][^:]*$/,
    );
  });
});
