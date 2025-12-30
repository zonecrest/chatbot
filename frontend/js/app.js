/**
 * GRA Taxpayer Chatbot - Main Application
 */

const App = {
  currentLanguage: 'en',

  /**
   * Initialize the application
   */
  init() {
    // Initialize language module
    if (typeof Language !== 'undefined') {
      Language.init();
      this.currentLanguage = Language.getLanguage();

      // Listen for language changes
      window.addEventListener('languageChanged', (e) => {
        this.currentLanguage = e.detail.language;
        this.showToast(`Language: ${e.detail.config.name}`);
      });
    } else {
      this.currentLanguage = Storage.getLanguage();
    }

    // Initialize UI
    this._initOfflineDetection();
    this._initPageSpecific();

    // Initialize voice module
    this._initVoice();

    console.log('App initialized', {
      language: this.currentLanguage,
      demoMode: CONFIG.DEMO_MODE
    });
  },

  /**
   * Initialize voice module
   */
  _initVoice() {
    if (typeof Voice !== 'undefined') {
      Voice.init();

      // Handle voice transcription
      Voice.onTranscript = (text) => {
        const input = document.getElementById('chat-input');
        if (input) {
          input.value = text;
          input.classList.remove('voice-preview');
        }
      };

      // Handle voice errors
      Voice.onError = (message) => {
        this.showToast(message);
      };
    }
  },

  /**
   * Initialize offline detection
   */
  _initOfflineDetection() {
    const banner = document.getElementById('offline-banner');
    const statusDot = document.querySelector('.status-dot');

    const updateStatus = () => {
      const isOnline = navigator.onLine;
      banner?.classList.toggle('show', !isOnline);
      statusDot?.classList.toggle('offline', !isOnline);
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
  },

  /**
   * Initialize page-specific features
   */
  _initPageSpecific() {
    const page = document.body.dataset.page;

    switch (page) {
      case 'chat':
        Chat.init();
        this._initSuggestions();
        break;
      case 'admin':
        this._initAdminPage();
        break;
    }
  },

  /**
   * Initialize suggestions
   */
  _initSuggestions() {
    const container = document.getElementById('suggestions-list');
    if (!container) return;

    container.innerHTML = CONFIG.SUGGESTED_QUESTIONS.map(q =>
      `<button class="suggestion-btn" onclick="Chat.askSuggestion('${q}')">${q}</button>`
    ).join('');
  },

  /**
   * Initialize admin page
   */
  async _initAdminPage() {
    await this.loadAdminStats();
  },

  /**
   * Load admin statistics
   */
  async loadAdminStats() {
    const stats = await API.getStats();

    // Update stat cards
    document.getElementById('stat-conversations').textContent =
      stats.today?.total_conversations || 0;
    document.getElementById('stat-messages').textContent =
      stats.today?.total_messages || 0;
    document.getElementById('stat-total').textContent =
      stats.all_time?.total_conversations || 0;

    // Calculate answered rate
    const total = stats.all_time?.total_messages || 0;
    const unanswered = stats.unanswered?.length || 0;
    const rate = total > 0 ? Math.round(((total - unanswered) / total) * 100) : 100;
    document.getElementById('stat-answered').textContent = rate + '%';

    // Top questions
    const topQuestionsEl = document.getElementById('top-questions');
    if (topQuestionsEl && stats.top_questions) {
      topQuestionsEl.innerHTML = stats.top_questions.map(q => `
        <li class="question-item">
          <span class="question-text">${this._escapeHtml(q.question)}</span>
          <span class="question-count">${q.count}</span>
        </li>
      `).join('') || '<li class="question-item"><span class="text-gray">No questions yet</span></li>';
    }

    // Unanswered questions
    const unansweredEl = document.getElementById('unanswered-questions');
    if (unansweredEl && stats.unanswered) {
      unansweredEl.innerHTML = stats.unanswered.map(q => `
        <li class="question-item">
          <span class="question-text">${this._escapeHtml(q)}</span>
        </li>
      `).join('') || '<li class="question-item"><span class="text-gray">All questions answered!</span></li>';
    }

    // Recent conversations
    const conversationsEl = document.getElementById('conversation-list');
    if (conversationsEl && stats.recent_conversations) {
      conversationsEl.innerHTML = stats.recent_conversations.map(c => {
        const time = new Date(c.started).toLocaleString();
        const badge = c.resolved
          ? '<span class="conversation-badge badge-resolved">Resolved</span>'
          : '<span class="conversation-badge badge-escalated">Open</span>';

        return `
          <div class="conversation-item">
            <div class="conversation-avatar">${c.language?.toUpperCase().substring(0, 2) || 'EN'}</div>
            <div class="conversation-info">
              <div class="conversation-id">${c.id.substring(0, 15)}...</div>
              <div class="conversation-meta">${time} • ${c.messages?.length || 0} messages</div>
            </div>
            ${badge}
          </div>
        `;
      }).join('') || '<div class="text-gray text-center">No conversations yet</div>';
    }
  },

  /**
   * Show citation modal
   */
  showCitationModal(citation) {
    const modal = document.getElementById('citation-modal');
    if (!modal) return;

    document.getElementById('modal-doc-name').textContent = citation.document;
    document.getElementById('modal-section').textContent = citation.section;
    document.getElementById('modal-excerpt').textContent = citation.excerpt;

    modal.classList.add('active');
  },

  /**
   * Close citation modal
   */
  closeCitationModal() {
    const modal = document.getElementById('citation-modal');
    modal?.classList.remove('active');
  },

  /**
   * Start new conversation
   */
  newConversation() {
    Chat.startNewConversation();
  },

  /**
   * Clear all data (admin function)
   */
  clearAllData() {
    if (confirm('Are you sure you want to clear all conversation data? This cannot be undone.')) {
      Storage.clearAll();
      this.showToast('All data cleared');
      location.reload();
    }
  },

  /**
   * Show toast message
   */
  showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  },

  /**
   * Escape HTML
   */
  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    App.closeCitationModal();
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    App.closeCitationModal();
  }
});
