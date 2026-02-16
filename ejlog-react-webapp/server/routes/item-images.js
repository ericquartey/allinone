/**
 * Item images settings and file serving
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { readImageConfig, writeImageConfig, resolveImageFile } from '../utils/item-images.js';

const router = express.Router();

router.get('/settings', (_req, res) => {
  const config = readImageConfig();
  res.json({ success: true, data: config });
});

router.put('/settings', (req, res) => {
  const { basePath } = req.body || {};

  if (!basePath || typeof basePath !== 'string') {
    return res.status(400).json({ success: false, error: 'basePath required' });
  }

  let stats;
  try {
    stats = fs.statSync(basePath);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'Base path not found',
      details: error.message,
    });
  }

  if (!stats.isDirectory()) {
    return res.status(400).json({ success: false, error: 'basePath must be a directory' });
  }

  writeImageConfig({ basePath });
  return res.json({ success: true, data: { basePath } });
});

router.get('/file/:itemCode', (req, res) => {
  const { itemCode } = req.params;
  const { basePath } = readImageConfig();
  const filePath = resolveImageFile(basePath, itemCode);

  if (!filePath) {
    return res.status(404).json({ success: false, error: 'Image not found' });
  }

  return res.sendFile(path.resolve(filePath));
});

export default router;
