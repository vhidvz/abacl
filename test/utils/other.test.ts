import { accumulate, accessibility, filterByNotation, Time } from '../../src';

describe('test other utils', () => {
  it('should accumulate array of filter', () => {
    const filter0 = ['*', 'owner', 'status', 'test', '!id', '!all'];
    const filter1 = ['*', '!owner', '!status', 'test', '!id', 'any'];

    const acc0 = accumulate(filter0, filter1);
    const acc1 = accumulate(filter1, filter0);

    expect(acc0).toEqual(['*', 'owner', 'status', 'test', 'any', '!id']);
    expect(acc1).toEqual(['*', 'test', 'any', 'owner', 'status', '!id']);
  });

  it('should check time for accessibility', () => {
    const time: Time = {
      cron_exp: '* * 6 * * *',
      duration: 28800,
    };

    const positiveDate = new Date('Fri Jun 23 2023 10:07:34 GMT+0330 (Iran Standard Time)');
    const negativeDate = new Date('Fri Jun 23 2023 19:07:34 GMT+0330 (Iran Standard Time)');

    expect(accessibility(time, { currentDate: positiveDate, tz: 'Asia/Tehran' })).toBeTruthy();
    expect(accessibility(time, { currentDate: negativeDate, tz: 'Asia/Tehran' })).toBeFalsy();
  });

  it('should filter article by notations', () => {
    const article = {
      id: 1,
      owner: 'user',
      title: 'title',
      content: 'content',
    };

    expect(filterByNotation(article, ['*', '!id', '!owner'])).toEqual({
      title: 'title',
      content: 'content',
    });
    expect(filterByNotation([article], ['*', '!id', '!owner'])).toEqual([
      {
        title: 'title',
        content: 'content',
      },
    ]);
  });
});
