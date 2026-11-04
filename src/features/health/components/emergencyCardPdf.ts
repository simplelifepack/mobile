import { Dirs, FileSystem } from 'react-native-file-access';

import type { EmergencyCardRow } from './emergencyCard';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 48;
const LABEL_WIDTH = 150;
const ROW_HEIGHT = 30;
const BAND_HEIGHT = 36;

// Standard Helvetica needs plain ASCII; PDF string escapes cover the rest.
const pdfText = (value: string) =>
  value
    .replace(/[·•]/g, '-')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/[\\()]/g, match => `\\${match}`);

const text = (x: number, y: number, size: number, font: 'F1' | 'F2', value: string) =>
  `BT /${font} ${size} Tf ${x} ${y} Td (${pdfText(value)}) Tj ET`;

function buildContent(rows: EmergencyCardRow[], generated: string) {
  const cardHeight = BAND_HEIGHT + rows.length * ROW_HEIGHT + ROW_HEIGHT;
  const top = PAGE_HEIGHT - MARGIN;
  const width = PAGE_WIDTH - MARGIN * 2;
  const ops: string[] = [
    text(MARGIN, top - 14, 18, 'F2', 'Emergency card'),
    '0.85 0.2 0.2 rg',
    `${MARGIN} ${top - 40 - BAND_HEIGHT} ${width} ${BAND_HEIGHT} re f`,
    '1 1 1 rg',
    text(MARGIN + 14, top - 40 - 23, 12, 'F2', 'EMERGENCY INFO'),
    text(PAGE_WIDTH - MARGIN - 60, top - 40 - 23, 11, 'F2', 'Readines'),
    '0.8 0.8 0.8 RG 0.5 w',
    `${MARGIN} ${top - 40 - cardHeight} ${width} ${cardHeight} re S`,
  ];

  rows.forEach((row, index) => {
    const lineY = top - 40 - BAND_HEIGHT - index * ROW_HEIGHT;
    const baseline = lineY - 19;
    ops.push(
      '0.8 0.8 0.8 RG',
      `${MARGIN} ${lineY} m ${PAGE_WIDTH - MARGIN} ${lineY} l S`,
      '0.4 0.4 0.4 rg',
      text(MARGIN + 14, baseline, 10, 'F1', row.label),
      '0.1 0.1 0.1 rg',
      text(MARGIN + 14 + LABEL_WIDTH, baseline, 11, 'F2', row.value.slice(0, 60)),
    );
  });

  const footerY = top - 40 - BAND_HEIGHT - rows.length * ROW_HEIGHT;
  ops.push(
    '0.8 0.8 0.8 RG',
    `${MARGIN} ${footerY} m ${PAGE_WIDTH - MARGIN} ${footerY} l S`,
    '0.4 0.4 0.4 rg',
    text(MARGIN + 14, footerY - 19, 9, 'F1', 'Assembled facts only - no diagnosis.'),
    text(PAGE_WIDTH - MARGIN - 130, footerY - 19, 9, 'F1', `Generated ${generated}`),
  );
  return ops.join('\n');
}

export function buildEmergencyCardPdf(rows: EmergencyCardRow[], generated: string) {
  const content = buildContent(rows, generated);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`,
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((body, index) => {
    const offset = pdf.length;
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

export async function writeEmergencyCardPdf(rows: EmergencyCardRow[], memberName: string) {
  const generated = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  const safeName = memberName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'member';
  const fileName = `Emergency-card-${safeName}.pdf`;
  const path = `${Dirs.CacheDir}/${fileName}`;
  await FileSystem.writeFile(path, buildEmergencyCardPdf(rows, generated), 'utf8');
  return { path, fileName };
}
