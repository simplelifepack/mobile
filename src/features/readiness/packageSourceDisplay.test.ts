import { sourceProviderName, sourceHostname } from './packageSourceDisplay';
it('matches web provider names with hostname fallbacks instead of generic source labels', () => {
  expect(
    sourceProviderName({
      organization: 'IIT Madras',
      title: 'Admission rules',
      url: 'https://www.iitm.ac.in/admissions',
    }),
  ).toBe('IIT Madras');
  expect(
    sourceProviderName({ name: 'Government', url: 'https://www.gov.uk/visa' }),
  ).toBe('GOV.UK');
  expect(
    sourceProviderName({
      name: 'Official',
      url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada.html',
    }),
  ).toBe('IRCC');
  expect(
    sourceProviderName({
      name: 'Source',
      url: 'https://www.example.test/checklist',
    }),
  ).toBe('example.test');
  expect(sourceHostname('')).toBe('');
});
