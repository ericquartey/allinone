// ============================================================================
// EJLOG WMS - AI Engine Service
// Integrazione con Claude (Anthropic) e GPT-4 (OpenAI)
// ============================================================================

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * AI Engine Service - Gestisce chiamate ai modelli AI
 */
class AIEngineService {
  constructor() {
    this.anthropicClient = null;
    this.openaiClient = null;
    this.defaultModel = process.env.AI_DEFAULT_MODEL || 'claude';

    this.initializeClients();
  }

  loadKnowledgeBase() {
    if (this.knowledgeBase) {
      return this.knowledgeBase;
    }

    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const kbPath = path.join(__dirname, '..', '..', '..', 'docs', 'PROJECT_API_FULL.md');
      const content = fs.readFileSync(kbPath, 'utf8');
      this.knowledgeBase = content.slice(0, 12000);
      return this.knowledgeBase;
    } catch (error) {
      console.warn('[AI Engine] Knowledge base not available:', error.message);
      this.knowledgeBase = '';
      return this.knowledgeBase;
    }
  }

  /**
   * Inizializza i client AI basati sulle API keys disponibili
   */
  initializeClients() {
    // Anthropic Claude
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        this.anthropicClient = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
      console.log('[AI Engine] Claude client initialized');
      } catch (error) {
      console.error('[AI Engine] Error initializing Claude:', error.message);
      }
    } else {
    console.warn('[AI Engine] ANTHROPIC_API_KEY not configured');
    }

    // OpenAI GPT-4
    if (process.env.OPENAI_API_KEY) {
      try {
        this.openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      console.log('[AI Engine] OpenAI client initialized');
      } catch (error) {
      console.error('[AI Engine] Error initializing OpenAI:', error.message);
      }
    } else {
    console.warn('[AI Engine] OPENAI_API_KEY not configured');
    }

    // Verifica che almeno un client sia disponibile
    if (!this.anthropicClient && !this.openaiClient) {
    console.error('[AI Engine] No AI providers configured! Add ANTHROPIC_API_KEY or OPENAI_API_KEY to .env');
    }
  }

  /**
   * Genera risposta AI completa
   * @param {string} message - Messaggio utente
   * @param {Object} context - Contesto (user, machine, drawer, operation, systemState)
   * @param {string} model - Modello da usare ('claude', 'gpt4', 'auto')
   * @param {string} language - Lingua ('it', 'en')
   * @returns {Promise<Object>} - { response, suggestions, actions }
   */
  async generateResponse(message, context = {}, model = null, language = 'it') {
    const selectedModel = model || this.defaultModel;

    console.log(`[AI Engine] Generating response with ${selectedModel}...`);
    console.log(`[AI Engine] Message: "${message}"`);
    console.log(`[AI Engine] Context keys:`, Object.keys(context));

    try {
      let response;

      if (selectedModel === 'claude' && this.anthropicClient) {
        response = await this.generateClaudeResponse(message, context, language);
      } else if (selectedModel === 'gpt4' && this.openaiClient) {
        response = await this.generateGPTResponse(message, context, language);
      } else {
        // Fallback: prova Claude, poi GPT, poi mock
        if (this.anthropicClient) {
          response = await this.generateClaudeResponse(message, context, language);
        } else if (this.openaiClient) {
          response = await this.generateGPTResponse(message, context, language);
        } else {
          throw new Error('No AI provider available. Configure ANTHROPIC_API_KEY or OPENAI_API_KEY.');
        }
      }

      console.log('[AI Engine] Response generated successfully');
      return response;

    } catch (error) {
      console.error('[AI Engine] Error generating response:', error);
      throw error;
    }
  }

  /**
   * Genera risposta con Claude (Anthropic)
   */
  async generateClaudeResponse(message, context, language) {
    const systemPrompt = this.buildSystemPrompt(context, language);
    const userPrompt = this.buildUserPrompt(message, context, language);

    const response = await this.anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const aiResponse = response.content[0].text;

    return {
      response: aiResponse,
      suggestions: this.extractSuggestions(aiResponse),
      actions: this.extractActions(aiResponse),
    };
  }

  /**
   * Genera risposta con GPT-4 (OpenAI)
   */
  async generateGPTResponse(message, context, language) {
    const systemPrompt = this.buildSystemPrompt(context, language);
    const userPrompt = this.buildUserPrompt(message, context, language);

    const response = await this.openaiClient.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const aiResponse = response.choices[0].message.content;

    return {
      response: aiResponse,
      suggestions: this.extractSuggestions(aiResponse),
      actions: this.extractActions(aiResponse),
    };
  }

  /**
   * Costruisce system prompt con contesto EjLog WMS
   */
  buildSystemPrompt(context, language) {
    const isItalian = language === 'it';
    const assistantName = 'Sofia';
    const knowledgeBase = this.loadKnowledgeBase();

    let systemPrompt = isItalian
      ? `Sei ${assistantName}, l'amica assistente magazzino di EjLog WMS. Parla in italiano, tono umano, professionale e caldo. Aiuti l'utente a conoscere meglio il verticale in ogni sua sfaccettatura. Rispondi in modo chiaro e pratico, con frasi brevi. Comprendi la terminologia tecnica di magazzini verticali (VLM), cassetti/UDC, compartimenti, baia, giacenza, missioni e liste.`
      : `You are ${assistantName}, EjLog WMS warehouse assistant. Respond in a warm, professional, human tone with concise, practical answers. Help the user understand the vertical warehouse system in every facet. Understand vertical warehouse terminology (VLM), drawers/UDC, compartments, bay, stock, missions, and lists.`;

    systemPrompt += isItalian
      ? '\n\nRegole:\n- Usa dati dal contesto quando disponibili.\n- Se mancano informazioni, chiedi 1-2 chiarimenti.\n- Se l\'utente chiede di eseguire una lista, non bloccare per altre liste in IN_PROGRESS: l\'esecuzione di piu liste e consentita.\n- Se l\'utente chiede di richiamare/estrarre un cassetto, usa CALL_DRAWER e, se presente, usa il cassetto selezionato nella pagina.\n- Usa [ACTION:TYPE|param=value] solo se richiesto.\n- Tipi azione supportati: CALL_DRAWER, OPEN_DRAWER, CLOSE_DRAWER, RETURN_TO_CELL, GET_DRAWER_STATUS, FIND_DRAWER, FIND_ARTICLE, GET_MACHINE_STATUS, GET_COMPARTMENT_INFO, SEARCH_PRODUCT, GET_LIST_STATUS, SET_LIST_WAITING, SET_LIST_IN_PROGRESS, SET_LIST_COMPLETED, GET_LISTS_OVERVIEW, GET_ITEMS_OVERVIEW, GET_ITEM_STOCK, GET_DRAWERS_OVERVIEW, EXECUTE_LIST, BOOK_LIST, TERMINATE_LIST, REVIVE_LIST, SET_LIST_UNPROCESSABLE.\n'
      : '\n\nRules:\n- Use context data when available.\n- Ask 1-2 clarifying questions when needed.\n- If the user asks to execute a list, do not block due to other lists being IN_PROGRESS: multiple lists can run at the same time.\n- If the user asks to call/extract a drawer, use CALL_DRAWER and, when available, use the selected drawer from the page.\n- Use [ACTION:TYPE|param=value] only when requested.\n- Supported actions: CALL_DRAWER, OPEN_DRAWER, CLOSE_DRAWER, RETURN_TO_CELL, GET_DRAWER_STATUS, FIND_DRAWER, FIND_ARTICLE, GET_MACHINE_STATUS, GET_COMPARTMENT_INFO, SEARCH_PRODUCT, GET_LIST_STATUS, SET_LIST_WAITING, SET_LIST_IN_PROGRESS, SET_LIST_COMPLETED, GET_LISTS_OVERVIEW, GET_ITEMS_OVERVIEW, GET_ITEM_STOCK, GET_DRAWERS_OVERVIEW, EXECUTE_LIST, BOOK_LIST, TERMINATE_LIST, REVIVE_LIST, SET_LIST_UNPROCESSABLE.\n';

    if (context.clientContext) {
      const page = context.clientContext.page || 'N/A';
      const title = context.clientContext.pageData?.title || 'N/A';
      const url = context.clientContext.pageData?.url || 'N/A';
      const entityId = context.clientContext.entityId || 'N/A';
      const entityType = context.clientContext.entityType || 'N/A';
      systemPrompt += `\nCONTESTO PAGINA:\n- Pagina: ${page}\n- Titolo: ${title}\n- URL: ${url}\n- Entita: ${entityType} ${entityId}\n`;
    }
    if (context.clientContext?.pageState) {
      const pageStateSummary = summarizePageState(context.clientContext.pageState);
      if (pageStateSummary) {
        systemPrompt += `\nDATI PAGINA (snapshot):\n${pageStateSummary}\n`;
      }
    }

    if (context.user) {
      systemPrompt += `\nUTENTE CORRENTE:\n- Nome: ${context.user.userName}\n- Livello: ${context.user.userLevel}\n`;
    }

    if (context.machine) {
      systemPrompt += `\nMACCHINA IN CONTESTO:\n- ID: ${context.machine.machineId}\n- Descrizione: ${context.machine.description || 'N/A'}\n- Stato: ${context.machine.status || 'N/A'}\n`;
      if (context.machine.alarms?.length > 0) {
        systemPrompt += `- Allarmi attivi: ${context.machine.alarms.length}\n`;
      }
    }

    if (context.drawer) {
      systemPrompt += `\nCASSETTO IN CONTESTO:\n- Codice UDC: ${context.drawer.codiceUDC}\n- Compartimenti: ${context.drawer.compartmentCount || 'N/A'}\n- Riempimento: ${context.drawer.fillPercentage || 'N/A'}%\n`;
    }

    if (context.systemState) {
      systemPrompt += `\nSTATO SISTEMA:\n- Macchine totali: ${context.systemState.machines?.total || 0}\n- Macchine attive: ${context.systemState.machines?.active || 0}\n- Liste in esecuzione: ${context.systemState.lists?.inExecution || 0}\n- Liste totali: ${context.systemState.lists?.total || 0}\n`;
    }

    if (context.primaryMachine) {
      systemPrompt += `\nMACCHINA PRINCIPALE:\n- ID: ${context.primaryMachine.machineId}\n- Descrizione: ${context.primaryMachine.description || 'N/A'}\n- Stato: ${context.primaryMachine.status || 'N/A'}\n`;
    }

    if (context.listsOverview?.length) {
      systemPrompt += `\nLISTE RECENTI (TOUCH):\n`;
      context.listsOverview.slice(0, 10).forEach((list) => {
        systemPrompt += `- ${list.listId} (${list.listNumber}) | ${list.type} | ${list.status}\n`;
      });
    }

    if (context.udcOverview?.length) {
      systemPrompt += `\nUDC RECENTI:\n`;
      context.udcOverview.slice(0, 8).forEach((udc) => {
        systemPrompt += `- ${udc.codiceUDC} | ${udc.status} | ${udc.machineId || 'N/A'}\n`;
      });
    }

    if (knowledgeBase) {
      systemPrompt += `\nKNOWLEDGE BASE (EJLOG):\n${knowledgeBase}\n`;
    }

    return systemPrompt;
  }

  /**
   * Costruisce user prompt con messaggio e contesto
   */
  buildUserPrompt(message, context, language) {
    let prompt = message;

    if (context.clientContext?.conversationHistory?.length) {
      const history = context.clientContext.conversationHistory.slice(-8);
      const formatted = history
        .map((entry) => `- ${entry.role}: ${entry.content}`)
        .join('\n');
      prompt += `\n\nCRONOLOGIA RECENTE:\n${formatted}\n`;
    }

    // Aggiungi contesto operazione se disponibile
    if (context.operation) {
      prompt += `\n\nCONTESTO OPERAZIONE:
- Tipo: ${context.operation.type}
- Stato: ${context.operation.status}
`;
      if (context.operation.listId) {
        prompt += `- Lista: ${context.operation.listId}\n`;
      }
    }

    return prompt;
  }

  /**
   * Estrae suggerimenti dalla risposta AI
   */
  extractSuggestions(response) {
    const suggestions = [];

    // Pattern per identificare suggerimenti
    const suggestionPatterns = [
      /suggerisco di (.*?)(?:\.|$)/gi,
      /potresti (.*?)(?:\.|$)/gi,
      /ti consiglio di (.*?)(?:\.|$)/gi,
    ];

    suggestionPatterns.forEach(pattern => {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        suggestions.push({
          title: match[1].trim(),
          priority: 'medium',
        });
      }
    });

    return suggestions;
  }

  /**
   * Estrae azioni dalla risposta AI
   */
  extractActions(response) {
    const actions = [];

    // Pattern per identificare azioni
    if (response.toLowerCase().includes('verifica')) {
      actions.push({ type: 'verify', target: 'system' });
    }
    if (response.toLowerCase().includes('reset')) {
      actions.push({ type: 'reset', target: 'machine' });
    }
    if (response.toLowerCase().includes('controlla')) {
      actions.push({ type: 'check', target: 'status' });
    }

    return actions;
  }

  /**
   * Troubleshooting errore con AI
   */
  async troubleshoot(error, context, language = 'it') {
    const message = `Ho riscontrato questo errore: ${error.code || 'UNKNOWN'} - ${error.message || 'Nessuna descrizione'}.

Cosa puo averlo causato e come posso risolverlo?`;

    const response = await this.generateResponse(message, context, null, language);

    return {
      diagnosis: response.response,
      possibleCauses: response.suggestions,
      suggestedFixes: response.actions,
      priority: this.calculatePriority(error),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calcola priorita errore
   */
  calculatePriority(error) {
    if (error.code?.startsWith('E0')) return 'high';
    if (error.code?.startsWith('W')) return 'medium';
    return 'low';
  }

  /**
   * Verifica disponibilit?? AI
   */
  isAvailable() {
    return !!(this.anthropicClient || this.openaiClient);
  }

  /**
   * Get provider info
   */
  getProviderInfo() {
    return {
      claude: !!this.anthropicClient,
      openai: !!this.openaiClient,
      defaultModel: this.defaultModel,
      available: this.isAvailable(),
    };
  }
}

function summarizePageState(pageState) {
  if (!pageState || typeof pageState !== 'object') return '';

  const summary = {};

  if (pageState.items) {
    summary.items = {
      total: pageState.items.total,
      page: pageState.items.page,
      pageSize: pageState.items.pageSize,
      filters: pageState.items.filters,
      visibleItems: (pageState.items.visibleItems || []).slice(0, 50),
      selectedItems: (pageState.items.selectedItems || []).slice(0, 20),
    };
  }

  if (pageState.drawers) {
    summary.drawers = {
      searchTerm: pageState.drawers.searchTerm,
      drawersCount: pageState.drawers.drawersCount,
      selectedDrawer: pageState.drawers.selectedDrawer,
      selectedCompartment: pageState.drawers.selectedCompartment,
      compartmentsCount: pageState.drawers.compartmentsCount,
      compartments: (pageState.drawers.compartments || []).slice(0, 50),
      productsSample: (pageState.drawers.productsSample || []).slice(0, 50),
    };
  }

  try {
    return JSON.stringify(summary, null, 2);
  } catch (error) {
    console.warn('[AI Engine] Unable to serialize page state:', error?.message || error);
    return '';
  }
}

// Singleton instance
let aiEngineInstance = null;

export function getAIEngine() {
  if (!aiEngineInstance) {
    aiEngineInstance = new AIEngineService();
  }
  return aiEngineInstance;
}

export default AIEngineService;





