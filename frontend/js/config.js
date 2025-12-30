/**
 * GRA Taxpayer Chatbot - Configuration
 */

const CONFIG = {
  // n8n webhook base URL (user will replace this)
  N8N_WEBHOOK_URL: 'https://zonecrest.app.n8n.cloud/webhook',

  // Demo mode - uses local simulation when n8n is not configured
  DEMO_MODE: true,

  // Bot persona
  BOT_NAME: 'Kofi',
  BOT_AVATAR: 'K',
  BOT_GREETING: "Akwaaba! I'm Kofi, your GRA tax assistant. How can I help you today?",

  // Supported languages
  LANGUAGES: {
    'en': {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇬🇧',
      voiceSupported: true,
      greeting: "Hello! I'm Kofi, your GRA tax assistant. How can I help you today?"
    },
    'pidgin': {
      code: 'pidgin',
      name: 'Pidgin',
      nativeName: 'Pidgin',
      flag: '🇬🇭',
      voiceSupported: true,
      greeting: "Chale! I be Kofi, your GRA tax assistant. How I fit help you today?"
    },
    'twi': {
      code: 'twi',
      name: 'Twi',
      nativeName: 'Twi',
      flag: '🇬🇭',
      voiceSupported: false,
      greeting: "Akwaaba! Me din de Kofi, wo GRA tax assistant. Ɛdeɛn na metumi de aboa wo ɛnnɛ?"
    },
    'ga': {
      code: 'ga',
      name: 'Ga',
      nativeName: 'Ga',
      flag: '🇬🇭',
      voiceSupported: false,
      greeting: "Ojekoo! Mi ŋmɛlɛ Kofi, wo GRA tax assistant. Nyɛ lɛ mi ko bo wo enyɛ?"
    },
    'ewe': {
      code: 'ewe',
      name: 'Ewe',
      nativeName: 'Eʋe',
      flag: '🇬🇭',
      voiceSupported: false,
      greeting: "Woezɔ! Nye ŋkɔe nye Kofi, wò GRA tax assistant. Aleke makpe ɖe ŋuwò egbea?"
    }
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

  // Voice settings
  VOICE: {
    // Speech recognition language (browser's Web Speech API)
    STT_LANG: 'en-GH',  // Ghana English

    // Speech synthesis settings
    TTS: {
      lang: 'en-GH',
      rate: 0.9,        // Slightly slower for clarity
      pitch: 1.0,
      volume: 1.0
    },

    // Auto-play TTS on new responses
    AUTO_PLAY: false,

    // Supported languages for STT
    STT_SUPPORTED: ['en', 'pidgin'],

    // Supported languages for TTS (all, but quality varies)
    TTS_SUPPORTED: ['en', 'pidgin', 'twi', 'ga', 'ewe']
  },

  // Local storage keys
  STORAGE_KEYS: {
    CONVERSATIONS: 'gra_conversations',
    CURRENT_CONVERSATION: 'gra_current_conversation',
    LANGUAGE: 'gra_language',
    USER_ID: 'gra_user_id',
    VOICE_ENABLED: 'askgra_voice_enabled',
    AUTO_PLAY_TTS: 'askgra_auto_play_tts'
  },

  // Check if n8n is configured
  isN8nConfigured() {
    return !this.N8N_WEBHOOK_URL.includes('YOUR-N8N-INSTANCE');
  },

  // Get full endpoint URL
  getEndpoint(endpoint) {
    return this.N8N_WEBHOOK_URL + endpoint;
  }
};

// Freeze config
Object.freeze(CONFIG);
Object.freeze(CONFIG.LANGUAGES);
Object.keys(CONFIG.LANGUAGES).forEach(key => Object.freeze(CONFIG.LANGUAGES[key]));
Object.freeze(CONFIG.ENDPOINTS);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.VOICE);
Object.freeze(CONFIG.VOICE.TTS);
