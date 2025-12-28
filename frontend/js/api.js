/**
 * GRA Taxpayer Chatbot - API Module
 * Handles communication with n8n backend and local demo mode
 */

const API = {
  /**
   * Send chat message
   * @param {string} message - User's message
   * @param {string} conversationId - Conversation ID
   * @param {string} language - Current language
   * @returns {Promise<Object>} Bot response
   */
  async sendMessage(message, conversationId, language) {
    if (CONFIG.DEMO_MODE || !CONFIG.isN8nConfigured()) {
      return this._demoResponse(message, conversationId, language);
    }

    try {
      const response = await fetch(CONFIG.getEndpoint(CONFIG.ENDPOINTS.CHAT), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          conversation_id: conversationId,
          language: language,
          user_id: Storage.getUserId()
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return this._demoResponse(message, conversationId, language);
    }
  },

  /**
   * Get admin statistics
   * @returns {Promise<Object>} Statistics data
   */
  async getStats() {
    if (CONFIG.DEMO_MODE || !CONFIG.isN8nConfigured()) {
      return Storage.getStats();
    }

    try {
      const response = await fetch(CONFIG.getEndpoint(CONFIG.ENDPOINTS.STATS));
      if (!response.ok) throw new Error('Network error');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return Storage.getStats();
    }
  },

  // ==================== Demo Mode - Knowledge Base ====================

  /**
   * Sample knowledge base for demo mode
   */
  _knowledgeBase: {
    // VAT Questions
    'vat rate': {
      answer: "The standard VAT rate in Ghana is 15% (comprising 12.5% VAT and 2.5% NHIL/GETFund levies). This applies to most goods and services unless specifically exempted or zero-rated.",
      citation: {
        document: "Value Added Tax Act, 2013 (Act 870)",
        section: "Section 3",
        excerpt: "There is imposed a tax to be known as value added tax on the supply of goods and services and the importation of goods at the rate of twelve and a half percent of the value of the supply or importation.",
        page: 5
      },
      keywords: ['vat', 'rate', 'percent', '15', '12.5', 'tax rate']
    },
    'vat registration': {
      answer: "You must register for VAT if your annual taxable turnover exceeds GH₵200,000. You can also voluntarily register if your turnover is below this threshold. Registration can be done at any GRA office or online at the GRA portal.",
      citation: {
        document: "Value Added Tax Act, 2013 (Act 870)",
        section: "Section 6(1)",
        excerpt: "A person who makes taxable supplies and whose taxable turnover during any period of twelve months exceeds the threshold is required to apply for registration.",
        page: 8
      },
      keywords: ['register', 'registration', 'vat', 'threshold', '200000', 'turnover']
    },
    'food exempt': {
      answer: "Yes, basic food items are exempt from VAT! This includes unprocessed cereals (rice, maize, millet), tubers (yam, cassava, cocoyam), fresh fruits and vegetables, and fresh fish. However, processed or packaged foods may be subject to VAT.",
      citation: {
        document: "Value Added Tax Act, 2013 (Act 870)",
        section: "First Schedule - Exempt Supplies",
        excerpt: "The following supplies of goods are exempt from VAT: (a) agricultural products in their raw state including cereals, tubers, fruits, vegetables, groundnuts, and palm produce...",
        page: 42
      },
      keywords: ['food', 'exempt', 'exemption', 'rice', 'yam', 'fish', 'vegetables']
    },
    'export vat': {
      answer: "Great news for exporters! Exported goods, including cocoa, are zero-rated for VAT purposes. This means you don't charge VAT on exports, but you can still claim input VAT credits on your business expenses.",
      citation: {
        document: "Value Added Tax Act, 2013 (Act 870)",
        section: "Section 15(1)(a)",
        excerpt: "The following supplies of goods or services are zero-rated: (a) the export of goods or services;",
        page: 12
      },
      keywords: ['export', 'zero', 'rated', 'cocoa', 'goods']
    },

    // E-Levy Questions
    'e-levy': {
      answer: "E-Levy (Electronic Transfer Levy) is a tax on electronic transactions in Ghana. The current rate is 1% on transfers above GH₵100 per day. It applies to mobile money transfers, bank transfers, and other electronic payments.",
      citation: {
        document: "Electronic Transfer Levy Act, 2022 (Act 1075)",
        section: "Section 1",
        excerpt: "There is imposed on the transfer of money by electronic means a levy to be known as the Electronic Transfer Levy.",
        page: 1
      },
      keywords: ['e-levy', 'elevy', 'electronic', 'transfer', 'levy', 'mobile money']
    },
    'e-levy rate': {
      answer: "The E-Levy rate is currently 1% on electronic transfers above GH₵100 per day. Transfers of GH₵100 or below per day are exempt from the levy.",
      citation: {
        document: "Electronic Transfer Levy Act, 2022 (Act 1075) as amended",
        section: "Section 2",
        excerpt: "The rate of the levy imposed under section 1 is one percent of the value of the electronic transfer above the threshold.",
        page: 2
      },
      keywords: ['e-levy', 'rate', 'percent', '1%', 'momo', 'mobile']
    },
    'e-levy exempt': {
      answer: "Several transfers are exempt from E-Levy:\n• Transfers of GH₵100 or less per day\n• Cumulative transfers up to GH₵100 daily\n• Transfers for payment of taxes\n• Transfers between accounts of the same person\n• Transfers for payment of social security contributions",
      citation: {
        document: "Electronic Transfer Levy Act, 2022 (Act 1075)",
        section: "Section 4",
        excerpt: "The following electronic transfers are exempt from the levy: (a) transfers of one hundred Ghana cedis or less per day...",
        page: 3
      },
      keywords: ['e-levy', 'exempt', 'exemption', 'free']
    },

    // Income Tax Questions
    'income tax bands': {
      answer: "Ghana uses a graduated income tax system:\n• First GH₵4,380: 0%\n• Next GH₵1,320: 5%\n• Next GH₵1,560: 10%\n• Next GH₵36,000: 17.5%\n• Next GH₵196,740: 25%\n• Above GH₵240,000: 30%\n\nThese are annual figures. Monthly PAYE is calculated proportionally.",
      citation: {
        document: "Income Tax Act, 2015 (Act 896) - First Schedule",
        section: "First Schedule - Tax Rates",
        excerpt: "The rates of income tax for resident individuals are as specified in the table...",
        page: 89
      },
      keywords: ['income', 'tax', 'bands', 'rates', 'paye', 'salary']
    },
    'file returns': {
      answer: "Annual tax returns must be filed by April 30th each year for the previous tax year. You can file:\n• Online via the GRA Taxpayer Portal (taxpayersportal.com)\n• At any GRA office\n• Through a registered tax agent\n\nLate filing attracts penalties, so file on time!",
      citation: {
        document: "Income Tax Act, 2015 (Act 896)",
        section: "Section 124",
        excerpt: "A person who is required to file a return shall file the return not later than four months after the end of the basis period.",
        page: 78
      },
      keywords: ['file', 'returns', 'annual', 'deadline', 'april']
    },

    // TIN Questions
    'tin': {
      answer: "A TIN (Taxpayer Identification Number) is a unique 11-digit number that identifies you for all tax purposes in Ghana. To get a TIN:\n\n1. Visit any GRA office or go online\n2. Complete the TIN registration form\n3. Provide: Ghana Card/Passport, proof of residence\n4. For businesses: add certificate of registration\n\nIt's FREE and takes about 2-3 working days!",
      citation: {
        document: "Revenue Administration Act, 2016 (Act 915)",
        section: "Section 10",
        excerpt: "The Commissioner-General shall assign a taxpayer identification number to each person who is required to file a return or pay tax.",
        page: 12
      },
      keywords: ['tin', 'taxpayer', 'identification', 'number', 'register']
    },
    'business registration': {
      answer: "To register your business with GRA, you'll need:\n\n1. Certificate of Incorporation/Registration from Registrar General\n2. TIN of the business and directors\n3. Business commencement form\n4. Bank details\n5. Ghana Card of directors/owners\n6. Proof of business location\n\nVisit any GRA office or register online at gra.gov.gh",
      citation: {
        document: "Revenue Administration Act, 2016 (Act 915)",
        section: "Section 15",
        excerpt: "A person required to pay tax shall register with the Commissioner-General within the time and in the manner prescribed.",
        page: 15
      },
      keywords: ['business', 'register', 'registration', 'documents', 'company']
    }
  },

  /**
   * Demo mode response generator
   */
  _demoResponse(message, conversationId, language) {
    const lowerMessage = message.toLowerCase().trim();

    // Check for greetings
    if (this._isGreeting(lowerMessage)) {
      return this._formatGreeting(language);
    }

    // Search knowledge base
    const match = this._findBestMatch(lowerMessage);

    if (match) {
      return this._formatResponse(match, language);
    }

    // No match found - fallback
    return this._formatFallback(language);
  },

  /**
   * Check if message is a greeting
   */
  _isGreeting(message) {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon',
      'good evening', 'akwaaba', 'chale', 'charley'];
    return greetings.some(g => message.includes(g));
  },

  /**
   * Format greeting response
   */
  _formatGreeting(language) {
    const greetings = {
      'en': "Hello! I'm Kofi, your GRA tax assistant. I can help you with questions about VAT, income tax, E-Levy, TIN registration, and more. What would you like to know?",
      'pidgin': "Chale! I be Kofi, your GRA tax assistant. I fit help you with VAT, income tax, E-Levy, TIN registration, and plenty more. Wetin you wan know?",
      'twi': "Akwaaba! Me din de Kofi, wo GRA tax assistant. Metumi aboa wo VAT, income tax, E-Levy, TIN registration ne nea aka nyinaa ho. Dɛn na wopɛ sɛ wohunu?"
    };

    return {
      success: true,
      response: {
        text: greetings[language] || greetings['en'],
        citations: [],
        confidence: 1.0,
        language_detected: language,
        suggested_followups: CONFIG.SUGGESTED_QUESTIONS.slice(0, 3)
      }
    };
  },

  /**
   * Find best match in knowledge base
   */
  _findBestMatch(message) {
    let bestMatch = null;
    let bestScore = 0;

    for (const [key, value] of Object.entries(this._knowledgeBase)) {
      let score = 0;

      // Check key match
      if (message.includes(key)) {
        score += 10;
      }

      // Check keywords
      for (const keyword of value.keywords) {
        if (message.includes(keyword)) {
          score += 2;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = value;
      }
    }

    return bestScore >= 2 ? bestMatch : null;
  },

  /**
   * Format response with citation
   */
  _formatResponse(match, language) {
    let answer = match.answer;

    // Adapt to Pidgin if needed
    if (language === 'pidgin') {
      answer = this._toPidgin(answer);
    }

    return {
      success: true,
      response: {
        text: answer,
        citations: [match.citation],
        confidence: 0.92,
        language_detected: language,
        suggested_followups: [
          'How do I register for VAT?',
          'What is the E-Levy rate?'
        ]
      }
    };
  },

  /**
   * Simple Pidgin conversion (demo only)
   */
  _toPidgin(text) {
    return text
      .replace(/You must/g, 'You go need to')
      .replace(/You can/g, 'You fit')
      .replace(/This means/g, 'Dis mean sey')
      .replace(/Great news/g, 'Good news')
      .replace(/Yes,/g, 'Yes o,');
  },

  /**
   * Format fallback response
   */
  _formatFallback(language) {
    const fallbacks = {
      'en': `I don't have specific information about that in my knowledge base. For detailed assistance, please:\n\n• Call GRA: ${CONFIG.GRA_PHONE}\n• Visit: ${CONFIG.GRA_WEBSITE}\n• Visit any GRA office near you\n\nIs there something else about VAT, income tax, or E-Levy I can help with?`,
      'pidgin': `I no get answer for dat one for my head o. Abeg try:\n\n• Call GRA: ${CONFIG.GRA_PHONE}\n• Check: ${CONFIG.GRA_WEBSITE}\n• Go any GRA office wey dey near you\n\nAnything else about VAT, income tax or E-Levy wey I fit help?`,
      'twi': `Menni nkɔmɔ pa bi wɔ me nkyerɛwde mu. Mesrɛ wo:\n\n• Frɛ GRA: ${CONFIG.GRA_PHONE}\n• Kɔ: ${CONFIG.GRA_WEBSITE}\n• Kɔ GRA ofisi biara a ɛbɛn wo\n\nBiribi foforo wɔ VAT, income tax anaa E-Levy ho a metumi aboa wo?`
    };

    return {
      success: true,
      response: {
        text: fallbacks[language] || fallbacks['en'],
        citations: [],
        confidence: 0.1,
        language_detected: language,
        suggested_followups: CONFIG.SUGGESTED_QUESTIONS
      }
    };
  }
};
