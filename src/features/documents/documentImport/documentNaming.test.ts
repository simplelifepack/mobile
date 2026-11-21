import type { DocumentAnalysisResponse } from '../../../api/types';
import { isGenericDocumentName, suggestDocumentTitle } from './documentNaming';

const analysis = (document: Partial<DocumentAnalysisResponse['document']>, originalName = 'IMG_1234567.jpg'): DocumentAnalysisResponse => ({
  success: true,
  document: { title: originalName, documentType: 'Unknown', category: 'Other', confidence: 0, ...document },
  files: [{ tempFileId: 't', originalName, mimeType: 'image/jpeg', size: 1 }],
  warnings: [],
});

it.each([
  'WhatsApp Image 2026-11-10 at 3.12.45 PM.jpeg', 'IMG_20261110_101010.jpg', 'PXL_20261110.jpg',
  'Screenshot 2026-11-10 at 9.00.00 AM.png', '1731234567890.pdf', 'scan0001.pdf', 'document.pdf',
])('treats %s as generic', name => expect(isGenericDocumentName(name)).toBe(true));

it.each(['Divya blood report.pdf', 'Aadhaar front.jpg'])('keeps %s', name =>
  expect(isGenericDocumentName(name)).toBe(false));

it('names handwritten health documents from the patient, type and date', () => {
  const result = suggestDocumentTitle(analysis({
    title: 'WhatsApp Image 2026-11-10 at 3.12.45 PM.jpeg',
    documentType: 'Prescription',
    category: 'Medical',
    healthExtraction: {
      documentType: 'prescription', patient: { name: 'Divya' }, documentDate: '2026-11-12',
      measurements: [], medications: [], followUps: [],
    },
  }, 'WhatsApp Image 2026-11-10 at 3.12.45 PM.jpeg'));
  expect(result).toBe('Prescription – Divya (12 Nov 2026)');
});

it('adds the holder to a bare document type and keeps meaningful titles', () => {
  expect(suggestDocumentTitle(analysis({ title: 'PAN Card', documentType: 'PAN Card', fields: { nameOnDocument: 'Ravi' } })))
    .toBe('PAN Card – Ravi');
  expect(suggestDocumentTitle(analysis({ title: 'Ravi PAN card scan' }))).toBe('Ravi PAN card scan');
});

it('falls back to the category, a readable file name, then a plain label', () => {
  expect(suggestDocumentTitle(analysis({ category: 'Finance' }))).toBe('Finance document');
  expect(suggestDocumentTitle(analysis({ title: 'IMG_1234567.jpg' }, 'Lease agreement.pdf'))).toBe('Lease agreement');
  expect(suggestDocumentTitle(analysis({ title: 'IMG_1234567.jpg' }, 'IMG_1234567.jpg'))).toBe('Document');
});
