/**
 * Language Selection Module
 * Handles language preference storage and UI
 */

const Language = {
  currentLanguage: null,

  /**
   * Initialize language module
   */
  init() {
    // Load saved preference or use default
    const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.LANGUAGE);
    this.currentLanguage = saved && CONFIG.LANGUAGES[saved]
      ? saved
      : CONFIG.DEFAULT_LANGUAGE;

    // Initialize UI
    this._createLanguageSelector();
    this._updateUI();
  },

  /**
   * Get current language code
   */
  getLanguage() {
    return this.currentLanguage;
  },

  /**
   * Get current language config
   */
  getLanguageConfig() {
    return CONFIG.LANGUAGES[this.currentLanguage];
  },

  /**
   * Set language
   * @param {string} langCode - Language code (en, pidgin, twi, ga, ewe)
   */
  setLanguage(langCode) {
    if (!CONFIG.LANGUAGES[langCode]) {
      console.error(`Unknown language: ${langCode}`);
      return;
    }

    this.currentLanguage = langCode;
    localStorage.setItem(CONFIG.STORAGE_KEYS.LANGUAGE, langCode);
    this._updateUI();

    // Dispatch event for other modules to react
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: langCode, config: CONFIG.LANGUAGES[langCode] }
    }));
  },

  /**
   * Create language selector dropdown
   */
  _createLanguageSelector() {
    const container = document.getElementById('language-selector');
    if (!container) return;

    let html = `
      <div class="language-dropdown">
        <button class="language-btn" id="language-btn" type="button" aria-label="Select language">
          <span class="language-flag" id="current-flag"></span>
          <span class="language-code" id="current-lang-code"></span>
          <span class="dropdown-arrow">▼</span>
        </button>
        <div class="language-menu" id="language-menu">
    `;

    for (const [code, lang] of Object.entries(CONFIG.LANGUAGES)) {
      html += `
        <button class="language-option" type="button" data-lang="${code}">
          <span class="language-flag">${lang.flag}</span>
          <span class="language-name">${lang.name}</span>
          ${!lang.voiceSupported ? '<span class="no-voice-badge" title="Voice input not available">🔇</span>' : ''}
        </button>
      `;
    }

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Event listeners
    const btn = document.getElementById('language-btn');
    const menu = document.getElementById('language-menu');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('show');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        menu.classList.remove('show');
      }
    });

    // Language option clicks
    container.querySelectorAll('.language-option').forEach(option => {
      option.addEventListener('click', () => {
        this.setLanguage(option.dataset.lang);
        menu.classList.remove('show');
      });
    });
  },

  /**
   * Update UI to reflect current language
   */
  _updateUI() {
    const config = this.getLanguageConfig();

    // Update selector button
    const flag = document.getElementById('current-flag');
    const code = document.getElementById('current-lang-code');

    if (flag) flag.textContent = config.flag;
    if (code) code.textContent = config.code.toUpperCase();

    // Update active state in menu
    document.querySelectorAll('.language-option').forEach(option => {
      option.classList.toggle('active', option.dataset.lang === this.currentLanguage);
    });
  },

  /**
   * Get greeting for current language
   */
  getGreeting() {
    return this.getLanguageConfig().greeting;
  },

  /**
   * Check if voice is supported for current language
   */
  isVoiceSupported() {
    return this.getLanguageConfig().voiceSupported;
  }
};
