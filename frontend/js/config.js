/**
 * GRA Taxpayer Chatbot - Configuration
 */

const CONFIG = {
  // n8n webhook base URL (user will replace this)
  N8N_WEBHOOK_URL: 'https://zonecrest.app.n8n.cloud/webhook',

  // Demo mode - uses local simulation when n8n is not configured
  DEMO_MODE: false,

  // Bot persona
  BOT_NAME: 'Kofi',
  BOT_AVATAR: 'K',
  BOT_GREETING: "Akwaaba! I'm Kofi, your GRA tax assistant. How can I help you today?",

  // Supported languages
  LANGUAGES: {
    'en': 'English',
    'pidgin': 'Pidgin',
    'twi': 'Twi',
    'ga': 'Ga',
    'ewe': 'Ewe'
  },

  // Default language
  DEFAULT_LANGUAGE: 'en',

  // GRA contact info (for fallback)
  GRA_PHONE: '0800-900-110',
  GRA_WEBSITE: 'https://gra.gov.gh',

  // Suggested questions by category
  SUGGESTED_QUESTIONS: [
    'What is the VAT rate in Ghana?',
    'Do I need to register for VAT?',
    'How much is E-Levy?',
    'How do I get a TIN number?'
  ],

  // Questions by category (for more options)
  QUESTION_CATEGORIES: {
    'VAT': [
      'What is the VAT rate in Ghana?',
      'Do I need to register for VAT?',
      'Are food items exempt from VAT?',
      'Do I pay VAT on exported goods?'
    ],
    'Income Tax': [
      'What are the income tax bands?',
      'How do I file my annual returns?',
      'What expenses can I deduct?'
    ],
    'E-Levy': [
      'What is E-Levy?',
      'How much is E-Levy on mobile money?',
      'Who is exempt from E-Levy?'
    ],
    'Registration': [
      'How do I get a TIN?',
      'What documents do I need to register my business?'
    ]
  },

  // API endpoints
  ENDPOINTS: {
    CHAT: '/chat',
    STATS: '/stats',
    CONVERSATIONS: '/conversations'
  },

  // Local storage keys
  STORAGE_KEYS: {
    CONVERSATIONS: 'gra_conversations',
    CURRENT_CONVERSATION: 'gra_current_conversation',
    LANGUAGE: 'gra_language',
    USER_ID: 'gra_user_id'
  },

  // Check if n8n is configured
  isN8nConfigured() {
    return !this.N8N_WEBHOOK_URL.includes('https://zonecrest.app.n8n.cloud/webhook');
  },

  // Get full endpoint URL
  getEndpoint(endpoint) {
    return this.N8N_WEBHOOK_URL + endpoint;
  }
};

// Freeze config
Object.freeze(CONFIG);
Object.freeze(CONFIG.LANGUAGES);
Object.freeze(CONFIG.ENDPOINTS);
Object.freeze(CONFIG.STORAGE_KEYS);
