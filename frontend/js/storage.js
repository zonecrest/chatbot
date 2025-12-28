/**
 * GRA Taxpayer Chatbot - Local Storage Manager
 */

const Storage = {
  /**
   * Generate unique ID
   */
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  },

  /**
   * Get or create user ID
   */
  getUserId() {
    let userId = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_ID);
    if (!userId) {
      userId = this.generateId('user');
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_ID, userId);
    }
    return userId;
  },

  /**
   * Get current language
   */
  getLanguage() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.LANGUAGE) || CONFIG.DEFAULT_LANGUAGE;
  },

  /**
   * Set current language
   */
  setLanguage(lang) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.LANGUAGE, lang);
  },

  /**
   * Get all conversations
   */
  getConversations() {
    const data = localStorage.getItem(CONFIG.STORAGE_KEYS.CONVERSATIONS);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Save conversations
   */
  saveConversations(conversations) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  },

  /**
   * Get current conversation ID
   */
  getCurrentConversationId() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT_CONVERSATION);
  },

  /**
   * Set current conversation ID
   */
  setCurrentConversationId(id) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_CONVERSATION, id);
  },

  /**
   * Get current conversation
   */
  getCurrentConversation() {
    const id = this.getCurrentConversationId();
    if (!id) return null;

    const conversations = this.getConversations();
    return conversations.find(c => c.id === id) || null;
  },

  /**
   * Create new conversation
   */
  createConversation() {
    const conversation = {
      id: this.generateId('conv'),
      userId: this.getUserId(),
      started: new Date().toISOString(),
      language: this.getLanguage(),
      messages: [],
      resolved: false
    };

    const conversations = this.getConversations();
    conversations.unshift(conversation);
    this.saveConversations(conversations);
    this.setCurrentConversationId(conversation.id);

    return conversation;
  },

  /**
   * Add message to current conversation
   */
  addMessage(message) {
    const conversations = this.getConversations();
    const currentId = this.getCurrentConversationId();
    const conversation = conversations.find(c => c.id === currentId);

    if (conversation) {
      message.id = this.generateId('msg');
      message.timestamp = new Date().toISOString();
      conversation.messages.push(message);
      this.saveConversations(conversations);
    }

    return message;
  },

  /**
   * Get messages for current conversation
   */
  getMessages() {
    const conversation = this.getCurrentConversation();
    return conversation ? conversation.messages : [];
  },

  /**
   * Update message feedback
   */
  updateFeedback(messageId, helpful) {
    const conversations = this.getConversations();
    const currentId = this.getCurrentConversationId();
    const conversation = conversations.find(c => c.id === currentId);

    if (conversation) {
      const message = conversation.messages.find(m => m.id === messageId);
      if (message) {
        message.feedback = helpful;
        this.saveConversations(conversations);
      }
    }
  },

  /**
   * Get statistics
   */
  getStats() {
    const conversations = this.getConversations();
    const today = new Date().toDateString();

    const todayConversations = conversations.filter(c =>
      new Date(c.started).toDateString() === today
    );

    const allMessages = conversations.flatMap(c => c.messages);
    const todayMessages = todayConversations.flatMap(c => c.messages);

    const languageCounts = {};
    conversations.forEach(c => {
      languageCounts[c.language] = (languageCounts[c.language] || 0) + 1;
    });

    // Count questions
    const questionCounts = {};
    allMessages
      .filter(m => m.role === 'user')
      .forEach(m => {
        const q = m.content.toLowerCase().trim();
        questionCounts[q] = (questionCounts[q] || 0) + 1;
      });

    const topQuestions = Object.entries(questionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([question, count]) => ({ question, count }));

    // Find unanswered (where bot said "I don't have")
    const unanswered = allMessages
      .filter(m => m.role === 'bot' && m.content.includes("don't have"))
      .map((m, idx) => {
        const conv = conversations.find(c => c.messages.includes(m));
        const msgIdx = conv?.messages.indexOf(m);
        const userMsg = conv?.messages[msgIdx - 1];
        return userMsg?.content || 'Unknown question';
      });

    return {
      today: {
        total_conversations: todayConversations.length,
        total_messages: todayMessages.length,
        languages: languageCounts
      },
      all_time: {
        total_conversations: conversations.length,
        total_messages: allMessages.length
      },
      top_questions: topQuestions,
      unanswered: [...new Set(unanswered)].slice(0, 5),
      recent_conversations: conversations.slice(0, 20)
    };
  },

  /**
   * Clear all data
   */
  clearAll() {
    Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};
