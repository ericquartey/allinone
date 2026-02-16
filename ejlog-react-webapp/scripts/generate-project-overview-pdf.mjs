import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { jsPDF } from 'jspdf';

const root = process.cwd();
const inputPath = join(root, 'docs', 'PROJECT_OVERVIEW_FERRETTO.md');
const outputPath = join(root, 'docs', 'PROJECT_OVERVIEW_FERRETTO.pdf');
const logoPath = join(root, 'public', 'ferretto-logo.png');

const doc = new jsPDF({ unit: 'pt', format: 'a4' });
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const marginX = 40;
const marginY = 40;
let cursorY = marginY;

const addPageIfNeeded = (lineHeight) => {
  if (cursorY + lineHeight > pageHeight - marginY) {
    doc.addPage();
    cursorY = marginY;
  }
};

const addLine = (text, fontSize, isBold = false, indent = 0) => {
  doc.setFont('helvetica', isBold ? 'bold' : 'normal');
  doc.setFontSize(fontSize);
  const maxWidth = pageWidth - marginX * 2 - indent;
  const lines = doc.splitTextToSize(text, maxWidth);
  lines.forEach((line) => {
    const lineHeight = fontSize + 6;
    addPageIfNeeded(lineHeight);
    doc.text(line, marginX + indent, cursorY);
    cursorY += lineHeight;
  });
};

const addSpacer = (height = 10) => {
  cursorY += height;
};

const addCover = () => {
  try {
    const logoBase64 = readFileSync(logoPath).toString('base64');
    const logoWidth = 220;
    const logoHeight = 80;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', logoX, 110, logoWidth, logoHeight);
  } catch (error) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('EJLOG WMS', marginX, 140);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('EJLOG WMS', marginX, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.text('Warehouse Management System per Magazzini Verticali', marginX, 265);
  doc.text('Tema Ferretto (ferretto.com)', marginX, 285);

  doc.setFontSize(11);
  doc.text(`Documento di sintesi - ${new Date().toISOString().slice(0, 10)}`, marginX, 320);

  doc.addPage();
  cursorY = marginY;
};

addCover();

const content = readFileSync(inputPath, 'utf8');
const lines = content.split(/\r?\n/);
let started = false;

for (const rawLine of lines) {
  const line = rawLine.trim();
  if (!started) {
    if (line.startsWith('## ')) started = true;
    else continue;
  }
  if (!line) {
    addSpacer(8);
    continue;
  }
  if (line.startsWith('## ')) {
    addSpacer(6);
    addLine(line.replace(/^## /, ''), 14, true);
    addSpacer(2);
    continue;
  }
  if (line.startsWith('### ')) {
    addSpacer(4);
    addLine(line.replace(/^### /, ''), 12, true);
    continue;
  }
  if (line.startsWith('- ')) {
    addLine(`- ${line.slice(2)}`, 11, false, 12);
    continue;
  }
  if (/^\d+\)/.test(line)) {
    addLine(line, 11, false, 12);
    continue;
  }
  addLine(line, 11, false);
}

const pdfBytes = doc.output('arraybuffer');
writeFileSync(outputPath, Buffer.from(pdfBytes));
console.log(`PDF generated: ${outputPath}`);
