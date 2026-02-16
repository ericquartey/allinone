/**
 * Item image utilities
 * Resolves image files from a configured local folder.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG_PATH = path.join(__dirname, '..', 'config', 'item-images.json');
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.mpeg'];

const normalizeCode = (value) => value.trim().toLowerCase();

export const readImageConfig = () => {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      basePath: parsed?.basePath || '',
    };
  } catch {
    return { basePath: '' };
  }
};

export const writeImageConfig = (config) => {
  const payload = {
    basePath: config.basePath || '',
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(payload, null, 2), 'utf8');
};

export const resolveImageFile = (basePath, itemCode) => {
  if (!basePath || !itemCode) {
    return null;
  }

  let entries;
  try {
    entries = fs.readdirSync(basePath);
  } catch {
    return null;
  }

  const normalizedCode = normalizeCode(itemCode);
  const match = entries.find((entry) => {
    const ext = path.extname(entry).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return false;
    }
    const baseName = path.basename(entry, ext);
    return normalizeCode(baseName) === normalizedCode;
  });

  return match ? path.join(basePath, match) : null;
};

export const getImageUrlForItem = (itemCode) => {
  const { basePath } = readImageConfig();
  const filePath = resolveImageFile(basePath, itemCode);
  if (!filePath) {
    return null;
  }
  return `/api/item-images/file/${encodeURIComponent(itemCode)}`;
};

export const getImageFileNameForItem = (itemCode) => {
  const { basePath } = readImageConfig();
  const filePath = resolveImageFile(basePath, itemCode);
  if (!filePath) {
    return null;
  }
  return path.basename(filePath);
};

export const getImageListForItem = (itemCode) => {
  const { basePath } = readImageConfig();
  const filePath = resolveImageFile(basePath, itemCode);
  if (!filePath) {
    return [];
  }

  const ext = path.extname(filePath);
  const baseName = path.basename(filePath);
  return [
    {
      id: `${itemCode}${ext}`,
      filename: baseName,
      url: `/api/item-images/file/${encodeURIComponent(itemCode)}`,
      isPrimary: true,
    },
  ];
};
