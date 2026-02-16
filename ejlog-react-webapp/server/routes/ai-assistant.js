// ============================================================================
// EJLOG WMS - AI Assistant API Routes
// Backend endpoints for AI chat, context, and suggestions
// ============================================================================

import express from 'express';
import { getAIEngine } from '../services/ai/ai-engine-service.js';
import { getAIContext } from '../services/ai/ai-context-service.js';
import { getActionExecutor } from '../services/ai/ai-action-executor.js';

const router = express.Router();

// Middleware per autenticazione (opzionale in dev)
const authMiddleware = (req, res, next) => {
  // In development, skip auth (check multiple env variants)
  const isDev = process.env.NODE_ENV === 'development' ||
                process.env.VITE_APP_ENV === 'development' ||
                !process.env.NODE_ENV;

  if (isDev) {
    req.user = { userName: 'dev_user', userLevel: 3 };
    console.log('[AI Assistant] Dev mode - auth bypassed');
    return next();
  }

  // In production, verify JWT token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // TODO: Implement JWT verification
  // For now, mock user
  req.user = { userName: 'operator01', userLevel: 2 };
  next();
};

// ============================================================================
// POST /api/ai/chat - Main chat endpoint
// ============================================================================
router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, context: clientContext, model, language } = req.body;
    const userId = req.user.userName;

    console.log(`[AI Chat] User: ${userId}, Message: "${message}"`);

    // Validate input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Message is required',
      });
    }

    // Get AI services
    const aiEngine = getAIEngine();
    const aiContext = await getAIContext();

    // Check if AI is available
    if (!aiEngine.isAvailable()) {
      console.warn('[AI Chat] AI engine not available, using mock response');
      const mockResponse = generateMockResponse(message, language || 'it');
      let finalResponse = mockResponse;
      let executedActions = [];

      try {
        const parsedActions = parseActions(mockResponse);
        if (parsedActions.length > 0) {
          executedActions = await executeActions(parsedActions);
          finalResponse = enrichResponseWithResults(mockResponse, executedActions);
        }
      } catch (actionError) {
        console.error('[AI Chat] Error processing mock actions:', actionError);
      }

      return res.json({
        response: stripActionTags(finalResponse),
        suggestions: [],
        actions: [],
        executedActions,
        mockMode: true,
      });
    }

    // Build full context from database + client context
    const fullContext = await aiContext.buildContext({
      userId,
      page: clientContext?.page,
      entityId: clientContext?.entityId,
      entityType: clientContext?.entityType,
    });
    if (clientContext) {
      fullContext.clientContext = clientContext;
    }

    // Generate AI response
    const aiResponse = await aiEngine.generateResponse(
      message,
      fullContext,
      model || null,
      language || 'it'
    );

    // Parse and execute actions from AI response
    let finalResponse = aiResponse.response;
    let executedActions = [];

    try {
      const parsedActions = parseActions(aiResponse.response);

      if (parsedActions.length > 0) {
        console.log(`[AI Chat] Found ${parsedActions.length} actions to execute`);
        executedActions = await executeActions(parsedActions);

        // Enrich response with action results
        finalResponse = enrichResponseWithResults(aiResponse.response, executedActions);

        console.log(`[AI Chat] Actions executed successfully:`, executedActions.length);
        finalResponse = appendActionErrors(finalResponse, executedActions, language || 'it');
      } else {
        const directAction = getDirectListAction(message, clientContext);
        if (directAction) {
          console.log('[AI Chat] No action tags found. Executing direct list action.');
          executedActions = await executeActions([directAction]);
          finalResponse = buildDirectActionResponse(directAction, executedActions, language || 'it');
        }
      }
    } catch (actionError) {
      console.error('[AI Chat] Error processing actions:', actionError);
      // Continue with original response even if actions fail
    }

    // Log conversation (optional)
    try {
      await aiContext.logConversation(userId, message, finalResponse, fullContext);
    } catch (logError) {
      console.log('[AI Chat] Conversation logging skipped');
    }

    res.json({
      response: stripActionTags(finalResponse),
      suggestions: aiResponse.suggestions || [],
      actions: aiResponse.actions || [],
      executedActions: executedActions,
      mockMode: false,
    });

  } catch (error) {
    console.error('[AI Chat] Error:', error);

    // Fallback to mock on error
    try {
      const mockResponse = generateMockResponse(req.body.message, req.body.language || 'it');
      let finalResponse = mockResponse;
      let executedActions = [];

      try {
        const parsedActions = parseActions(mockResponse);
        if (parsedActions.length > 0) {
          executedActions = await executeActions(parsedActions);
          finalResponse = enrichResponseWithResults(mockResponse, executedActions);
        }
      } catch (actionError) {
        console.error('[AI Chat] Error processing fallback actions:', actionError);
      }

      return res.json({
        response: stripActionTags(finalResponse),
        suggestions: [],
        actions: [],
        executedActions,
        mockMode: true,
        error: 'AI temporarily unavailable, using fallback',
      });
    } catch (fallbackError) {
      res.status(500).json({
        error: 'AI service error',
        message: error.message,
      });
    }
  }
});

// ============================================================================
// GET /api/ai/context - Get current context
// ============================================================================
router.get('/context', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userName;
    const { page, entityId, entityType } = req.query;

    console.log(`[AI Context] User: ${userId}, Page: ${page}`);

    // Get AI context service
    const aiContext = await getAIContext();

    // Build context from database
    const context = await aiContext.buildContext({
      userId,
      page,
      entityId,
      entityType,
    });

    res.json(context);
  } catch (error) {
    console.error('[AI Context] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/ai/command - Execute AI command
// ============================================================================
router.post('/command', authMiddleware, async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const userId = req.user.userName;

    console.log(`[AI Command] User: ${userId}, Prompt: "${prompt}"`);

    // TODO: Implement command execution
    res.json({
      intent: 'unknown',
      entities: [],
      action: null,
      explanation: 'Comando non ancora implementato',
      confidence: 0,
    });
  } catch (error) {
    console.error('[AI Command] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// GET /api/ai/suggestions - Get contextual suggestions
// ============================================================================
router.get('/suggestions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userName;
    const { context, type } = req.query;

    console.log(`[AI Suggestions] User: ${userId}, Type: ${type}`);

    // TODO: Implement smart suggestions based on context
    const suggestions = [
      {
        title: 'Esempio Suggerimento',
        description: 'Questo e un suggerimento di esempio',
        action: 'example_action',
        priority: 'medium',
        reason: 'Suggerimento generato per testing',
      },
    ];

    res.json(suggestions);
  } catch (error) {
    console.error('[AI Suggestions] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// POST /api/ai/troubleshoot - Troubleshoot error
// ============================================================================
router.post('/troubleshoot', authMiddleware, async (req, res) => {
  try {
    const { error, context, systemState } = req.body;
    const userId = req.user.userName;

    console.log(`[AI Troubleshoot] User: ${userId}, Error: ${error?.code}`);

    // Get AI services
    const aiEngine = getAIEngine();
    const aiContext = await getAIContext();

    // Build context
    const fullContext = await aiContext.buildContext({
      userId,
      page: context?.page,
      entityId: context?.entityId,
      entityType: context?.entityType,
    });
    if (context) {
      fullContext.clientContext = context;
    }

    // Add system state to context
    if (systemState) {
      fullContext.systemState = systemState;
    }

    // Use AI troubleshooting if available
    if (aiEngine.isAvailable()) {
      const diagnosis = await aiEngine.troubleshoot(error, fullContext, 'it');
      res.json(diagnosis);
    } else {
      // Fallback diagnosis
      const diagnosis = {
        diagnosis: `Analisi errore ${error?.code || 'sconosciuto'} in corso...`,
        possibleCauses: [
          'AI engine non disponibile. Configurare ANTHROPIC_API_KEY o OPENAI_API_KEY',
        ],
        suggestedFixes: [
          'Configurare API keys nell\'ambiente',
          'Riavviare il server dopo la configurazione',
        ],
        priority: 'medium',
        timestamp: new Date().toISOString(),
        mockMode: true,
      };
      res.json(diagnosis);
    }
  } catch (error) {
    console.error('[AI Troubleshoot] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse action tags from AI response
 * Format: [ACTION:TYPE|param1=value1|param2=value2]
 * @param {string} text - AI response text
 * @returns {Array} - Array of parsed actions
 */
function parseActions(text) {
  const actionRegex = /\[ACTION:([A-Z_]+)(?:\|([^\]]+))?\]/g;
  const actions = [];

  let match;
  while ((match = actionRegex.exec(text)) !== null) {
    const actionType = match[1];
    const paramsString = match[2];
    const params = {};

    // Parse parameters
    if (paramsString) {
      const paramPairs = paramsString.split('|');
      paramPairs.forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
          params[key.trim()] = value.trim();
        }
      });
    }

    actions.push({
      type: actionType,
      params: params,
      originalTag: match[0],
    });
  }

  return actions;
}

/**
 * Execute parsed actions via Action Executor
 * @param {Array} actions - Parsed actions
 * @returns {Promise<Array>} - Action execution results
 */
async function executeActions(actions) {
  const actionExecutor = await getActionExecutor();
  const results = [];

  for (const action of actions) {
    try {
      const normalized = normalizeAction(action);
      console.log(`[AI Actions] Executing ${normalized.type} with params:`, normalized.params);
      const result = await actionExecutor.executeAction(normalized.type, normalized.params);
      results.push({
        action: normalized.type,
        params: normalized.params,
        result: result,
      });
    } catch (error) {
      console.error(`[AI Actions] Error executing ${action.type}:`, error);
      results.push({
        action: action.type,
        params: action.params,
        result: {
          success: false,
          error: error.message,
        },
      });
    }
  }

  return results;
}

function normalizeAction(action) {
  if (!action || !action.type) {
    return action;
  }

  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE'];
  if (!httpMethods.includes(action.type)) {
    return action;
  }

  const rawId = action.params?.id;
  if (typeof rawId !== 'string') {
    return action;
  }

  const [entityId, operation] = rawId.split('/');
  if (!entityId || !operation) {
    return action;
  }

  if (operation === 'execute' && action.type === 'PUT') {
    return {
      type: 'EXECUTE_LIST',
      params: { listId: entityId },
    };
  }

  if (operation === 'book' && action.type === 'PUT') {
    return {
      type: 'BOOK_LIST',
      params: { listId: entityId },
    };
  }

  if (operation === 'terminate' && action.type === 'POST') {
    return {
      type: 'TERMINATE_LIST',
      params: { listId: entityId },
    };
  }

  if (operation === 'revive' && action.type === 'POST') {
    return {
      type: 'REVIVE_LIST',
      params: { listId: entityId },
    };
  }

  if (operation === 'unprocessable' && action.type === 'POST') {
    return {
      type: 'SET_LIST_UNPROCESSABLE',
      params: { listId: entityId },
    };
  }

  return action;
}

/**
 * Replace action tags in response with execution results
 * @param {string} text - Original AI response
 * @param {Array} actionResults - Results from action execution
 * @returns {string} - Enhanced response with results
 */
function enrichResponseWithResults(text, actionResults) {
  let enrichedText = text;

  actionResults.forEach(({ action, result }) => {
    if (result.success && result.data) {
      // Append formatted result data to response
      let resultText = '\n\n';

      if (Array.isArray(result.data)) {
        // Multiple results (e.g., search results)
        result.data.forEach((item, idx) => {
          resultText += `${idx + 1}. ${JSON.stringify(item, null, 2)}\n`;
        });
      } else {
        // Single result
        resultText += JSON.stringify(result.data, null, 2);
      }

      enrichedText += resultText;
    }
  });

  return enrichedText;
}

function stripActionTags(text) {
  if (!text) return text;
  return text.replace(/\[ACTION:[^\]]+\]\s*/g, '').trim();
}

function appendActionErrors(text, executedActions, language = 'it') {
  if (!executedActions?.length) return text;
  const failures = executedActions.filter((action) => !action?.result?.success);
  if (failures.length === 0) return text;

  const details = failures
    .map((action) => action?.result?.message || action?.result?.error || 'Operazione non riuscita')
    .join('; ');

  if (language === 'it') {
    return `${text}\n\nNota: non sono riuscita a completare alcune azioni: ${details}.`;
  }
  return `${text}\n\nNote: I could not complete some actions: ${details}.`;
}

function getDirectListAction(message = '', clientContext = null) {
  const raw = String(message);
  const normalized = raw.toLowerCase();
  const listMatch = raw.match(/(?:lista|list)\s*#?\s*(\d+)/i);
  const drawerMatch = raw.match(/(?:cassetto|udc|drawer)\s*([a-z0-9-]+)/i);
  const articleMatch = raw.match(/(?:articolo|item|codice)\s*([a-z0-9-]+)/i);
  const contextListId =
    clientContext?.entityType === 'list' ? clientContext?.entityId : null;
  const listId = listMatch?.[1] || contextListId;
  const articleCode = articleMatch?.[1] || null;
  const drawerCode = drawerMatch?.[1] || null;
  const selectedDrawer = clientContext?.pageState?.drawers?.selectedDrawer || null;
  const selectedDrawerId = selectedDrawer?.id ?? null;

  const wantsExecute =
    /\b(esegui|avvia|start|lancia)\b/i.test(normalized) ||
    /metti\s+in\s+esecuzione/i.test(normalized) ||
    /in\s+esecuzione/i.test(normalized);
  const wantsWaiting =
    /attesa/i.test(normalized) ||
    /metti\s+in\s+attesa/i.test(normalized) ||
    /\bpausa\b/i.test(normalized) ||
    /\bsospendi\b/i.test(normalized);
  const wantsComplete =
    /\bcompleta\b/i.test(normalized) ||
    /\btermina\b/i.test(normalized) ||
    /chiudi\s+lista/i.test(normalized);
  const wantsStock =
    /giacenza/i.test(normalized) ||
    /\bstock\b/i.test(normalized) ||
    /disponibil/i.test(normalized) ||
    /quantit/i.test(normalized);
  const wantsCallDrawer =
    /chiama/i.test(normalized) ||
    /richiama/i.test(normalized) ||
    /estrai/i.test(normalized) ||
    /porta\s+in\s+baia/i.test(normalized);

  if (wantsStock && articleCode) {
    return {
      type: 'GET_ITEM_STOCK',
      params: { itemCode: articleCode },
    };
  }

  if (wantsCallDrawer && (selectedDrawerId || drawerCode)) {
    return {
      type: 'CALL_DRAWER',
      params: {
        drawerId: selectedDrawerId || undefined,
        drawerCode: drawerCode || selectedDrawer?.code || selectedDrawer?.barcode,
      },
    };
  }

  if (wantsWaiting && listId) {
    return {
      type: 'SET_LIST_WAITING',
      params: { listId },
    };
  }

  if (wantsExecute && listId) {
    return {
      type: 'EXECUTE_LIST',
      params: { listId },
    };
  }

  if (wantsComplete && listId) {
    return {
      type: 'SET_LIST_COMPLETED',
      params: { listId },
    };
  }

  return null;
}

function buildDirectActionResponse(action, executedActions, language = 'it') {
  const result = executedActions?.[0]?.result;
  if (result?.success) {
    const actionLabel = action?.type;
    if (language === 'it') {
      if (actionLabel === 'CALL_DRAWER') {
        return `Ok, ho richiamato il cassetto ${action.params.drawerCode || action.params.drawerId}.`;
      }
      if (actionLabel === 'GET_ITEM_STOCK') {
        return `Ok, ho recuperato la giacenza per l'articolo ${action.params.itemCode}.`;
      }
      if (actionLabel === 'SET_LIST_WAITING') {
        return `Ok, ho messo in attesa la lista ${action.params.listId}.`;
      }
      if (actionLabel === 'SET_LIST_COMPLETED') {
        return `Ok, ho completato la lista ${action.params.listId}.`;
      }
      return `Ok, ho messo in esecuzione la lista ${action.params.listId}.`;
    }
    if (actionLabel === 'CALL_DRAWER') {
      return `Ok, I called drawer ${action.params.drawerCode || action.params.drawerId}.`;
    }
    if (actionLabel === 'GET_ITEM_STOCK') {
      return `Ok, I retrieved stock for item ${action.params.itemCode}.`;
    }
    if (actionLabel === 'SET_LIST_WAITING') {
      return `Ok, I put list ${action.params.listId} on hold.`;
    }
    if (actionLabel === 'SET_LIST_COMPLETED') {
      return `Ok, I completed list ${action.params.listId}.`;
    }
    return `Ok, I started list ${action.params.listId}.`;
  }

  const errorText = result?.message || result?.error || 'Operazione non riuscita';
  if (language === 'it') {
    if (action?.type === 'CALL_DRAWER') {
      return `Non riesco a richiamare il cassetto ${action.params.drawerCode || action.params.drawerId}: ${errorText}.`;
    }
    if (action?.type === 'GET_ITEM_STOCK') {
      return `Non riesco a recuperare la giacenza per l'articolo ${action.params.itemCode}: ${errorText}.`;
    }
    return `Non riesco a mettere in esecuzione la lista ${action.params.listId}: ${errorText}.`;
  }
  if (action?.type === 'CALL_DRAWER') {
    return `I couldn't call drawer ${action.params.drawerCode || action.params.drawerId}: ${errorText}.`;
  }
  if (action?.type === 'GET_ITEM_STOCK') {
    return `I couldn't retrieve stock for item ${action.params.itemCode}: ${errorText}.`;
  }
  return `I couldn't start list ${action.params.listId}: ${errorText}.`;
}

/**
 * Generate mock AI response (temporary until real AI is integrated)
 */
function generateMockResponse(message, language = 'it') {
  const msg = (message || '').toLowerCase();
  const assistantName = 'Sofia';
  const raw = message || '';

  const drawerMatch = raw.match(/(?:cassetto|udc|drawer)\s*([a-z0-9-]+)/i);
  const machineMatch = raw.match(/\b(ms-\d+)\b/i);
  const articleMatch = raw.match(/(?:articolo|item|codice)\s*([a-z0-9-]+)/i);
  const listMatch = raw.match(/(?:lista|list)\s*#?\s*(\d+)/i);

  const drawerCode = drawerMatch?.[1]?.toUpperCase() || null;
  const machineId = machineMatch?.[1]?.toUpperCase() || null;
  const articleCode = articleMatch?.[1]?.toUpperCase() || null;
  const listId = listMatch?.[1] || null;

  const wantsOpen = msg.includes('apri') || msg.includes('open');
  const wantsClose = msg.includes('chiudi') || msg.includes('close');
  const wantsReturn = msg.includes('riporta') || msg.includes('ritorna') || msg.includes('return');
  const wantsCallDrawer = msg.includes('chiama') || msg.includes('richiama') || msg.includes('estrai');
  const wantsStatus = msg.includes('stato') || msg.includes('status') || msg.includes('compartimenti') || msg.includes('giacenza');
  const wantsStartList =
    msg.includes('avvia') ||
    msg.includes('start') ||
    msg.includes('esegui') ||
    msg.includes('in esecuzione');
  const wantsWaitList =
    msg.includes('attesa') ||
    msg.includes('pausa') ||
    msg.includes('sospendi');
  const wantsCompleteList =
    msg.includes('completa') ||
    msg.includes('termina') ||
    msg.includes('chiudi lista');

  if (language === 'it') {
    if (drawerCode && wantsOpen) {
      return `Ok, apro il cassetto ${drawerCode}. [ACTION:OPEN_DRAWER|drawerCode=${drawerCode}]`;
    }

    if (drawerCode && wantsCallDrawer) {
      return `Ok, richiamo il cassetto ${drawerCode}. [ACTION:CALL_DRAWER|drawerCode=${drawerCode}]`;
    }

    if (drawerCode && wantsClose) {
      return `Ok, chiudo il cassetto ${drawerCode}. [ACTION:CLOSE_DRAWER|drawerCode=${drawerCode}]`;
    }

    if (drawerCode && wantsReturn) {
      return `Ok, riporto in cella il cassetto ${drawerCode}. [ACTION:RETURN_TO_CELL|drawerCode=${drawerCode}]`;
    }

    if (drawerCode && wantsStatus) {
      return `Ti mostro lo stato del cassetto ${drawerCode}. [ACTION:GET_DRAWER_STATUS|drawerCode=${drawerCode}]`;
    }

    if (listId && (wantsStatus || msg.includes('stato lista'))) {
      return `Controllo lo stato della lista ${listId}. [ACTION:GET_LIST_STATUS|listId=${listId}]`;
    }

    if (listId && wantsStartList) {
      return `Avvio la lista ${listId}. [ACTION:SET_LIST_IN_PROGRESS|listId=${listId}]`;
    }

    if (listId && wantsWaitList) {
      return `Imposto la lista ${listId} in attesa. [ACTION:SET_LIST_WAITING|listId=${listId}]`;
    }

    if (listId && wantsCompleteList) {
      return `Completo la lista ${listId}. [ACTION:SET_LIST_COMPLETED|listId=${listId}]`;
    }

    if (articleCode && (msg.includes('giacenza') || msg.includes('stock'))) {
      return `Controllo la giacenza per l'articolo ${articleCode}. [ACTION:GET_ITEM_STOCK|itemCode=${articleCode}]`;
    }

    if ((msg.includes('articoli') || msg.includes('items') || msg.includes('prodotti')) && !articleCode) {
      return 'Ti mostro gli articoli disponibili. [ACTION:GET_ITEMS_OVERVIEW|limit=50]';
    }

    if ((msg.includes('cassetti') || msg.includes('udc') || msg.includes('drawers')) && !drawerCode) {
      return 'Ti mostro i cassetti disponibili. [ACTION:GET_DRAWERS_OVERVIEW|limit=50]';
    }

    if (drawerCode) {
      return `Ho trovato il cassetto ${drawerCode}. Vuoi lo stato o aprirlo/chiuderlo? [ACTION:FIND_DRAWER|drawerCode=${drawerCode}]`;
    }

    if (machineId) {
      return `Controllo lo stato della macchina ${machineId}. [ACTION:GET_MACHINE_STATUS|machineId=${machineId}]`;
    }

    if (articleCode) {
      return `Cerco l'articolo ${articleCode}. [ACTION:FIND_ARTICLE|articleCode=${articleCode}]`;
    }

    if (msg.includes('ciao') || msg.includes('salve') || msg.includes('buongiorno')) {
      return `Ciao, sono ${assistantName}. Come posso aiutarti oggi?`;
    }

    if (msg.includes('macchina') || msg.includes('ms-')) {
      return 'Posso aiutarti con stato macchina, allarmi e missioni in corso.\n' +
        'Dimmi il codice macchina (esempio: MS-100).';
    }

    if (msg.includes('cassetto') || msg.includes('udc') || msg.includes('drawer')) {
      return 'Posso mostrarti compartimenti, giacenza e stato del cassetto.\n' +
        'Dimmi il codice cassetto (esempio: UDC-042) e cosa vuoi fare.';
    }

    if (msg.includes('errore') || msg.includes('allarme') || msg.includes('e001')) {
      return 'Hai un codice errore specifico? Posso aiutarti con cause e passi di verifica.\n' +
        'Esempio: E001 o ALL-12.';
    }

    if (msg.includes('picking') || msg.includes('prelievo') || msg.includes('lista')) {
      if (!listId) {
        return 'Ti mostro le liste piu recenti. [ACTION:GET_LISTS_OVERVIEW|limit=20]';
      }
      return 'Posso controllare lo stato liste e gli articoli rimanenti.\n' +
        'Dimmi il numero lista o il tipo (picking, refilling, inventario).';
    }

    if (msg.includes('aiuto') || msg.includes('help') || msg.includes('cosa puoi fare')) {
      return `Sono ${assistantName}, il supporto EjLog. Posso aiutarti con macchine, cassetti, liste e errori.\n` +
        'Se mi dai un codice (macchina, cassetto o lista) posso essere piu precisa.';
    }

    return `Ho ricevuto: "${message}". Dimmi su quale macchina, cassetto o lista vuoi lavorare.`;
  }

  if (msg.includes('hello') || msg.includes('hi')) {
    return `Hi, I'm ${assistantName}. How can I help you today?`;
  }

  if (msg.includes('machine')) {
    return 'I can help with machine status, alarms, and current missions.\n' +
      'Tell me the machine code (e.g., MS-100).';
  }

  if (msg.includes('drawer') || msg.includes('udc')) {
    return 'I can show drawer compartments, stock, and status.\n' +
      'Tell me the drawer code (e.g., UDC-042).';
  }

  return `I received: "${message}". Tell me which machine, drawer, or list you need.`;
}

export default router;





