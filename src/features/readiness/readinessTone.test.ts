import { readinessLabel, readinessTone } from './readinessTone';

describe('readinessTone', () => {
  it.each([
    [0, 'danger'],
    [39, 'danger'],
    [40, 'warning'],
    [69, 'warning'],
    [70, 'success'],
    [100, 'success'],
  ])('%i%% is %s', (percent, tone) => {
    expect(readinessTone(percent)).toBe(tone);
  });

  it('never labels 0% as ready', () => {
    expect(readinessLabel(0)).toBe('Needs attention');
  });
});
