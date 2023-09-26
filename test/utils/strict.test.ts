import { isStrict } from '../../src';

describe('test strict utils', () => {
  it('should check subject', () => {
    // boolean test
    expect(isStrict('subject', true)).toBeTruthy();
    expect(isStrict('subject', false)).toBeFalsy();

    // string type test
    expect(isStrict('subject', 's')).toBeTruthy();
    expect(isStrict('subject', 'sa')).toBeTruthy();
    expect(isStrict('subject', 'sao')).toBeTruthy();

    expect(isStrict('subject', '')).toBeFalsy();
    expect(isStrict('subject', 'a')).toBeFalsy();
    expect(isStrict('subject', 'ao')).toBeFalsy();

    expect(isStrict('subject', undefined)).toBeTruthy();
    expect(isStrict('subject', null as unknown as boolean)).toBeTruthy();
  });

  it('should check action', () => {
    // boolean test
    expect(isStrict('action', true)).toBeTruthy();
    expect(isStrict('action', false)).toBeFalsy();

    // string type test
    expect(isStrict('action', 'a')).toBeTruthy();
    expect(isStrict('action', 'sa')).toBeTruthy();
    expect(isStrict('action', 'sao')).toBeTruthy();

    expect(isStrict('action', '')).toBeFalsy();
    expect(isStrict('action', 's')).toBeFalsy();
    expect(isStrict('action', 'so')).toBeFalsy();

    expect(isStrict('action', undefined)).toBeTruthy();
    expect(isStrict('action', null as unknown as boolean)).toBeTruthy();
  });

  it('should check object', () => {
    // boolean test
    expect(isStrict('object', true)).toBeTruthy();
    expect(isStrict('object', false)).toBeFalsy();

    // string type test
    expect(isStrict('object', 'o')).toBeTruthy();
    expect(isStrict('object', 'so')).toBeTruthy();
    expect(isStrict('object', 'sao')).toBeTruthy();

    expect(isStrict('object', '')).toBeFalsy();
    expect(isStrict('object', 's')).toBeFalsy();
    expect(isStrict('object', 'sa')).toBeFalsy();

    expect(isStrict('object', undefined)).toBeTruthy();
    expect(isStrict('object', null as unknown as boolean)).toBeTruthy();
  });
});
