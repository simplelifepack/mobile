import { readinessLabel, readinessTone } from './readinessTone';

describe('readinessTone', () => {
  it.each([
    [0, 'danger'],
    [49, 'danger'],
    [50, 'warning'],
    [99, 'warning'],
    [100, 'success'],
  ])('%i%% is %s', (percent, tone) => {
    expect(readinessTone(percent)).toBe(tone);
  });

  it('never labels 0% as ready', () => {
    expect(readinessLabel(0)).toBe('Needs work');
  });
});
