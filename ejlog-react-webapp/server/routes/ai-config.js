// ============================================================================
// EJLOG WMS - AI Configuration API Routes
// Gestione configurazione AI e API keys (solo admin)
// ============================================================================

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAIEngine } from '../services/ai/ai-engine-service.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Admin middleware - solo admin possono modificare configurazione AI
const adminMiddleware = (req, res, next) => {
  // In development or when NODE_ENV not set, skip check
  if (process.env.NODE_ENV !== 'production') {
    req.user = { userName: 'admin', userLevel: 3, isAdmin: true };
    return next();
  }

  // In production, verify admin level
  if (!req.user || req.user.userLevel < 3) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Solo amministratori possono modificare la configurazione AI'
    });
  }

  next();
};

// ============================================================================
// GET /api/ai-config - Get current AI configuration (masked API keys)
// ============================================================================
router.get('/', adminMiddleware, async (req, res) => {
  try {
    console.log('[AI Config] Getting AI configuration');

    const aiEngine = getAIEngine();
    const providerInfo = aiEngine.getProviderInfo();

    // Maschera API keys per sicurezza
    const config = {
      aiEnabled: process.env.AI_ENABLED === 'true',
      defaultModel: process.env.AI_DEFAULT_MODEL || 'claude',
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1024'),
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      contextDepth: process.env.AI_CONTEXT_DEPTH || 'standard',

      // Provider availability
      providers: {
        claude: {
          available: providerInfo.claude,
          apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
          apiKeyMasked: process.env.ANTHROPIC_API_KEY
            ? `sk-ant-***${process.env.ANTHROPIC_API_KEY.slice(-8)}`
            : null,
        },
        openai: {
          available: providerInfo.openai,
          apiKeyConfigured: !!process.env.OPENAI_API_KEY,
          apiKeyMasked: process.env.OPENAI_API_KEY
            ? `sk-***${process.env.OPENAI_API_KEY.slice(-8)}`
            : null,
        },
      },

      // System status
      systemStatus: {
        aiAvailable: providerInfo.available,
        activeProvider: providerInfo.defaultModel,
      },
    };

    res.json(config);
  } catch (error) {
    console.error('[AI Config] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/ai-config/api-key - Save API key
// ============================================================================
router.post('/api-key', adminMiddleware, async (req, res) => {
  try {
    const { provider, apiKey, testConnection } = req.body;
    const userId = req.user.userName;

    console.log(`[AI Config] Setting API key for provider: ${provider}, user: ${userId}`);

    // Validate provider
    if (!['claude', 'openai'].includes(provider)) {
      return res.status(400).json({
        error: 'Invalid provider',
        message: 'Provider must be "claude" or "openai"',
      });
    }

    // Validate API key format
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({
        error: 'Invalid API key',
        message: 'API key is required',
      });
    }

    if (provider === 'claude' && !apiKey.startsWith('sk-ant-')) {
      return res.status(400).json({
        error: 'Invalid API key format',
        message: 'Claude API key should start with "sk-ant-"',
      });
    }

    if (provider === 'openai' && !apiKey.startsWith('sk-')) {
      return res.status(400).json({
        error: 'Invalid API key format',
        message: 'OpenAI API key should start with "sk-"',
      });
    }

    // Test connection if requested
    if (testConnection) {
      console.log('[AI Config] Testing API connection...');
      const testResult = await testAPIConnection(provider, apiKey);

      if (!testResult.success) {
        return res.status(400).json({
          error: 'API key test failed',
          message: testResult.error,
          details: testResult.details,
        });
      }

      console.log('[AI Config] ✅ API test successful');
    }

    // Save to .env file
    const envPath = path.join(__dirname, '../../.env');
    const result = await updateEnvFile(envPath, provider, apiKey);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to save API key',
        message: result.error,
      });
    }

    // Reinitialize AI engine with new key
    if (provider === 'claude') {
      process.env.ANTHROPIC_API_KEY = apiKey;
    } else {
      process.env.OPENAI_API_KEY = apiKey;
    }

    // Trigger AI engine reinitialization
    const aiEngine = getAIEngine();
    aiEngine.initializeClients();

    console.log('[AI Config] ✅ API key saved and AI engine reinitialized');

    res.json({
      success: true,
      message: 'API key configurata con successo',
      provider,
      apiKeyMasked: `${apiKey.substring(0, 10)}***${apiKey.slice(-8)}`,
      testResult: testConnection ? 'passed' : 'skipped',
    });

  } catch (error) {
    console.error('[AI Config] Error saving API key:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// ============================================================================
// POST /api/ai-config/test - Test API connection
// ============================================================================
router.post('/test', adminMiddleware, async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    console.log(`[AI Config] Testing ${provider} API connection`);

    const testResult = await testAPIConnection(provider, apiKey || null);

    if (testResult.success) {
      res.json({
        success: true,
        message: 'Connessione API riuscita',
        provider,
        details: testResult.details,
      });
    } else {
      res.status(400).json({
        success: false,
        error: testResult.error,
        details: testResult.details,
      });
    }

  } catch (error) {
    console.error('[AI Config] Test error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error.message
    });
  }
});

// ============================================================================
// PUT /api/ai-config/settings - Update AI settings
// ============================================================================
router.put('/settings', adminMiddleware, async (req, res) => {
  try {
    const { aiEnabled, defaultModel, maxTokens, temperature, contextDepth } = req.body;

    console.log('[AI Config] Updating AI settings');

    const envPath = path.join(__dirname, '../../.env');
    const updates = {};

    if (aiEnabled !== undefined) updates.AI_ENABLED = aiEnabled.toString();
    if (defaultModel) updates.AI_DEFAULT_MODEL = defaultModel;
    if (maxTokens) updates.AI_MAX_TOKENS = maxTokens.toString();
    if (temperature !== undefined) updates.AI_TEMPERATURE = temperature.toString();
    if (contextDepth) updates.AI_CONTEXT_DEPTH = contextDepth;

    const result = await updateEnvFileMultiple(envPath, updates);

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to update settings',
        message: result.error,
      });
    }

    // Update process.env
    Object.keys(updates).forEach(key => {
      process.env[key] = updates[key];
    });

    res.json({
      success: true,
      message: 'Configurazione AI aggiornata',
      settings: updates,
    });

  } catch (error) {
    console.error('[AI Config] Error updating settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Test API connection
 */
async function testAPIConnection(provider, apiKey = null) {
  try {
    const keyToTest = apiKey || (provider === 'claude'
      ? process.env.ANTHROPIC_API_KEY
      : process.env.OPENAI_API_KEY);

    if (!keyToTest) {
      return {
        success: false,
        error: 'API key not configured',
        details: 'No API key provided',
      };
    }

    if (provider === 'claude') {
      // Test Claude API
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: keyToTest });

      const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Test' }],
      });

      return {
        success: true,
        details: {
          model: response.model,
          provider: 'claude',
          responseReceived: true,
        },
      };

    } else if (provider === 'openai') {
      // Test OpenAI API
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ apiKey: keyToTest });

      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Test' }],
      });

      return {
        success: true,
        details: {
          model: response.model,
          provider: 'openai',
          responseReceived: true,
        },
      };
    }

  } catch (error) {
    console.error(`[AI Config] Test failed for ${provider}:`, error);
    return {
      success: false,
      error: error.message,
      details: {
        code: error.code,
        status: error.status,
      },
    };
  }
}

/**
 * Update single value in .env file
 */
async function updateEnvFile(envPath, provider, apiKey) {
  try {
    const envVarName = provider === 'claude' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';

    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Check if variable exists
    const regex = new RegExp(`^${envVarName}=.*$`, 'm');

    if (regex.test(envContent)) {
      // Update existing
      envContent = envContent.replace(regex, `${envVarName}=${apiKey}`);
    } else {
      // Add new
      envContent += `\n${envVarName}=${apiKey}\n`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');

    return { success: true };
  } catch (error) {
    console.error('[AI Config] Error updating .env file:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update multiple values in .env file
 */
async function updateEnvFileMultiple(envPath, updates) {
  try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    Object.keys(updates).forEach(key => {
      const value = updates[key];
      const regex = new RegExp(`^${key}=.*$`, 'm');

      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}\n`;
      }
    });

    fs.writeFileSync(envPath, envContent, 'utf8');

    return { success: true };
  } catch (error) {
    console.error('[AI Config] Error updating .env file:', error);
    return { success: false, error: error.message };
  }
}

export default router;
