/**
 * GRA Taxpayer Chatbot - Chat Module
 */

const Chat = {
  messagesContainer: null,
  inputField: null,
  sendButton: null,
  typingIndicator: null,
  isWaiting: false,

  /**
   * Initialize chat
   */
  init() {
    this.messagesContainer = document.getElementById('chat-messages');
    this.inputField = document.getElementById('chat-input');
    this.sendButton = document.getElementById('send-btn');
    this.typingIndicator = document.getElementById('typing-indicator');

    if (!this.messagesContainer) return;

    // Event listeners
    this.sendButton?.addEventListener('click', () => this.sendMessage());

    this.inputField?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    this.inputField?.addEventListener('input', () => {
      this.inputField.style.height = 'auto';
      this.inputField.style.height = Math.min(this.inputField.scrollHeight, 120) + 'px';
    });

    // Load conversation
    this.loadConversation();
  },

  /**
   * Load existing conversation or create new
   */
  loadConversation() {
    let conversation = Storage.getCurrentConversation();

    if (!conversation) {
      conversation = Storage.createConversation();
      // Add greeting based on current language
      const greeting = typeof Language !== 'undefined' ? Language.getGreeting() : CONFIG.BOT_GREETING;
      this.addBotMessage({
        text: greeting,
        citations: [],
        suggested_followups: CONFIG.SUGGESTED_QUESTIONS
      });
    } else {
      // Render existing messages
      conversation.messages.forEach(msg => {
        if (msg.role === 'user') {
          this.renderUserMessage(msg.content, msg.timestamp, false);
        } else {
          this.renderBotMessage(msg, false);
        }
      });
    }

    this.scrollToBottom();
  },

  /**
   * Send user message
   */
  async sendMessage() {
    if (this.isWaiting) return;

    const message = this.inputField?.value?.trim();
    if (!message) return;

    // Clear input
    this.inputField.value = '';
    this.inputField.style.height = 'auto';

    // Add user message
    const userMsg = {
      role: 'user',
      content: message
    };
    Storage.addMessage(userMsg);
    this.renderUserMessage(message);

    // Show typing indicator
    this.showTyping(true);
    this.isWaiting = true;

    try {
      // Get response from API
      const conversationId = Storage.getCurrentConversationId();
      const language = typeof Language !== 'undefined' ? Language.getLanguage() : Storage.getLanguage();
      const response = await API.sendMessage(message, conversationId, language);

      // Hide typing
      this.showTyping(false);

      if (response.success) {
        // Add bot message
        const botMsg = {
          role: 'bot',
          content: response.response.text,
          citations: response.response.citations,
          confidence: response.response.confidence,
          suggested_followups: response.response.suggested_followups
        };
        const savedMsg = Storage.addMessage(botMsg);
        this.renderBotMessage({ ...botMsg, id: savedMsg.id });
      } else {
        this.renderErrorMessage('Sorry, something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Chat error:', error);
      this.showTyping(false);
      this.renderErrorMessage('Unable to connect. Please check your connection.');
    }

    this.isWaiting = false;
  },

  /**
   * Add bot message directly
   */
  addBotMessage(response) {
    const botMsg = {
      role: 'bot',
      content: response.text,
      citations: response.citations || [],
      suggested_followups: response.suggested_followups || []
    };
    const savedMsg = Storage.addMessage(botMsg);
    this.renderBotMessage({ ...botMsg, id: savedMsg.id });
  },

  /**
   * Render user message
   */
  renderUserMessage(content, timestamp = null, scroll = true) {
    const time = timestamp ? new Date(timestamp) : new Date();
    const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const html = `
      <div class="message user">
        <div class="message-content">
          <div class="message-text">${this.escapeHtml(content)}</div>
          <div class="message-time">${timeStr}</div>
        </div>
        <div class="message-avatar">You</div>
      </div>
    `;

    this.messagesContainer.insertAdjacentHTML('beforeend', html);
    if (scroll) this.scrollToBottom();
  },

  /**
   * Render bot message
   */
  renderBotMessage(msg, scroll = true) {
    const time = msg.timestamp ? new Date(msg.timestamp) : new Date();
    const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    let citationHtml = '';
    if (msg.citations && msg.citations.length > 0) {
      const citation = msg.citations[0];
      citationHtml = `
        <div class="message-citation">
          <div class="citation-header" onclick="Chat.toggleCitation('${msg.id}')">
            <span class="citation-icon">📄</span>
            <span>Source: ${citation.document}, ${citation.section}</span>
          </div>
          <div id="citation-${msg.id}" class="citation-details">
            <div class="citation-doc">${citation.document}</div>
            <div class="citation-section">${citation.section}</div>
            <div class="citation-excerpt">"${citation.excerpt}"</div>
          </div>
        </div>
      `;
    }

    let feedbackHtml = '';
    if (msg.id) {
      feedbackHtml = `
        <div class="message-feedback">
          <span>Was this helpful?</span>
          <button class="feedback-btn" onclick="Chat.sendFeedback('${msg.id}', true)">👍</button>
          <button class="feedback-btn" onclick="Chat.sendFeedback('${msg.id}', false)">👎</button>
        </div>
      `;
    }

    const messageId = msg.id || 'msg-' + Date.now();
    const html = `
      <div class="message bot" data-message-id="${messageId}">
        <div class="message-avatar">${CONFIG.BOT_AVATAR}</div>
        <div class="message-content">
          <div class="message-text">${this.formatText(msg.content)}</div>
          ${citationHtml}
          ${feedbackHtml}
          <div class="message-time">${timeStr}</div>
        </div>
      </div>
    `;

    this.messagesContainer.insertAdjacentHTML('beforeend', html);

    // Add speak button if voice is available
    if (typeof Voice !== 'undefined' && Voice.isTTSAvailable()) {
      const messageEl = this.messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
      if (messageEl) {
        Voice.addSpeakButton(messageEl, msg.content);
      }
    }

    // Render suggestions if present
    if (msg.suggested_followups && msg.suggested_followups.length > 0) {
      this.updateSuggestions(msg.suggested_followups);
    }

    if (scroll) this.scrollToBottom();
  },

  /**
   * Render error message
   */
  renderErrorMessage(text) {
    const html = `
      <div class="message bot">
        <div class="message-avatar">!</div>
        <div class="message-content" style="background: #ffebee;">
          <div class="message-text" style="color: #c62828;">${text}</div>
        </div>
      </div>
    `;

    this.messagesContainer.insertAdjacentHTML('beforeend', html);
    this.scrollToBottom();
  },

  /**
   * Toggle citation visibility
   */
  toggleCitation(messageId) {
    const details = document.getElementById(`citation-${messageId}`);
    if (details) {
      details.classList.toggle('show');
    }
  },

  /**
   * Show citation modal
   */
  showCitationModal(citation) {
    App.showCitationModal(citation);
  },

  /**
   * Send feedback
   */
  sendFeedback(messageId, helpful) {
    Storage.updateFeedback(messageId, helpful);

    // Visual feedback
    const feedbackDiv = document.querySelector(`[onclick*="'${messageId}'"]`)?.parentElement;
    if (feedbackDiv) {
      feedbackDiv.innerHTML = `<span style="color: #4CAF50;">Thank you for your feedback!</span>`;
    }
  },

  /**
   * Update suggestions
   */
  updateSuggestions(suggestions) {
    const container = document.getElementById('suggestions-list');
    if (!container) return;

    container.innerHTML = suggestions.map(q =>
      `<button class="suggestion-btn" onclick="Chat.askSuggestion('${this.escapeHtml(q)}')">${q}</button>`
    ).join('');
  },

  /**
   * Ask a suggested question
   */
  askSuggestion(question) {
    if (this.inputField) {
      this.inputField.value = question;
      this.sendMessage();
    }
  },

  /**
   * Show/hide typing indicator
   */
  showTyping(show) {
    if (this.typingIndicator) {
      this.typingIndicator.classList.toggle('hidden', !show);
      if (show) this.scrollToBottom();
    }
  },

  /**
   * Scroll to bottom of messages
   */
  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  },

  /**
   * Start new conversation
   */
  startNewConversation() {
    if (confirm('Start a new conversation? Your current chat will be saved.')) {
      Storage.createConversation();
      this.messagesContainer.innerHTML = '';
      const greeting = typeof Language !== 'undefined' ? Language.getGreeting() : CONFIG.BOT_GREETING;
      this.addBotMessage({
        text: greeting,
        citations: [],
        suggested_followups: CONFIG.SUGGESTED_QUESTIONS
      });
    }
  },

  /**
   * Format text with line breaks
   */
  formatText(text) {
    return this.escapeHtml(text)
      .replace(/\n/g, '<br>')
      .replace(/•/g, '&bull;');
  },

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
