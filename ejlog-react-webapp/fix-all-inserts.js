/**
 * Script per correggere TUTTI gli INSERT INTO Liste
 * Aggiunge i campi NOT NULL mancanti
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Campi NOT NULL che devono essere presenti in TUTTI gli INSERT
const requiredFields = {
  daVerificare: '0',
  prenotazioneIncrementale: '0'
};

// Pattern per trovare INSERT INTO Liste
const insertPattern = /INSERT INTO Liste\s*\(([\s\S]*?)\)\s*(?:OUTPUT[\s\S]*?)?\s*VALUES\s*\(([\s\S]*?)\)/gi;

// File da controllare
const filesToCheck = [
  'server/controllers/item-lists-enhanced.controller.js',
  'server/routes/item-lists.js',
  'server/routes/lists.js'
];

let totalFixed = 0;

filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File non trovato: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let fileFixed = 0;

  content = content.replace(insertPattern, (match, columns, values) => {
    // Controlla se i campi richiesti sono presenti
    const hasAllFields = Object.keys(requiredFields).every(field =>
      columns.toLowerCase().includes(field.toLowerCase())
    );

    if (hasAllFields) {
      return match; // Già corretto
    }

    // Aggiungi i campi mancanti
    let newColumns = columns.trim();
    let newValues = values.trim();

    Object.entries(requiredFields).forEach(([field, defaultValue]) => {
      if (!columns.toLowerCase().includes(field.toLowerCase())) {
        // Aggiungi il campo
        if (!newColumns.endsWith(',')) newColumns += ',';
        newColumns += `\n        ${field}`;

        if (!newValues.endsWith(',')) newValues += ',';
        newValues += ` ${defaultValue}`;

        fileFixed++;
        totalFixed++;
      }
    });

    const outputMatch = match.match(/OUTPUT[\s\S]*?(?=VALUES)/);
    const output = outputMatch ? outputMatch[0] : '';

    return `INSERT INTO Liste (\n${newColumns}\n      )\n      ${output}VALUES (\n${newValues}\n      )`;
  });

  if (fileFixed > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath}: ${fileFixed} INSERT corretti`);
  } else {
    console.log(`✓ ${filePath}: Già corretto`);
  }
});

console.log(`\n📊 Totale INSERT corretti: ${totalFixed}`);
