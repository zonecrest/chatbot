/**
 * Voice Module - Speech-to-Text and Text-to-Speech
 * Uses browser Web Speech API
 */

const Voice = {
  // State
  recognition: null,
  synthesis: window.speechSynthesis,
  isListening: false,
  isSpeaking: false,
  isSupported: false,
  sttSupported: false,

  // Callbacks
  onTranscript: null,
  onListeningChange: null,
  onSpeakingChange: null,
  onError: null,

  /**
   * Initialize voice module
   */
  init() {
    // Check browser support
    this.isSupported = 'speechSynthesis' in window;
    this.sttSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

    if (!this.isSupported) {
      console.warn('Voice: Speech synthesis not supported in this browser');
    }

    if (!this.sttSupported) {
      console.warn('Voice: Speech recognition not supported in this browser');
    }

    // Initialize speech recognition if supported
    if (this.sttSupported) {
      this._initRecognition();
    }

    // Create UI elements
    this._createVoiceUI();

    // Update UI based on current language
    this._updateVoiceAvailability();

    // Listen for language changes
    window.addEventListener('languageChanged', () => {
      this._updateVoiceAvailability();
    });

    console.log('Voice module initialized', {
      synthesis: this.isSupported,
      recognition: this.sttSupported
    });
  },

  /**
   * Initialize speech recognition
   */
  _initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = CONFIG.VOICE.STT_LANG;

    this.recognition.onstart = () => {
      this.isListening = true;
      this._updateListeningUI(true);
      if (this.onListeningChange) this.onListeningChange(true);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this._updateListeningUI(false);
      if (this.onListeningChange) this.onListeningChange(false);
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Update input field with interim results
      if (interimTranscript) {
        this._updateInputPreview(interimTranscript);
      }

      // Call callback with final result
      if (finalTranscript && this.onTranscript) {
        this.onTranscript(finalTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.isListening = false;
      this._updateListeningUI(false);

      let message = 'Voice input error';
      switch (event.error) {
        case 'not-allowed':
          message = 'Microphone access denied. Please allow microphone permissions.';
          break;
        case 'no-speech':
          message = 'No speech detected. Please try again.';
          break;
        case 'network':
          message = 'Network error. Please check your connection.';
          break;
      }

      if (this.onError) this.onError(message);
    };
  },

  /**
   * Start listening for speech
   */
  startListening() {
    if (!this.sttSupported || !this.recognition) {
      console.error('Speech recognition not supported');
      return false;
    }

    // Check if current language supports STT
    const currentLang = typeof Language !== 'undefined' ? Language.getLanguage() : Storage.getLanguage();
    if (!CONFIG.VOICE.STT_SUPPORTED.includes(currentLang)) {
      if (this.onError) {
        this.onError(`Voice input not available for ${CONFIG.LANGUAGES[currentLang]?.name || CONFIG.LANGUAGES[currentLang] || currentLang}. Try English or Pidgin.`);
      }
      return false;
    }

    if (this.isListening) {
      this.stopListening();
      return false;
    }

    try {
      this.recognition.start();
      return true;
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      return false;
    }
  },

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  },

  /**
   * Speak text using TTS
   * @param {string} text - Text to speak
   * @param {Object} options - Optional settings
   */
  speak(text, options = {}) {
    if (!this.isSupported) {
      console.error('Speech synthesis not supported');
      return;
    }

    // Stop any current speech
    this.stopSpeaking();

    // Clean text for speech (remove markdown, citations, etc.)
    const cleanText = this._cleanTextForSpeech(text);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = options.lang || CONFIG.VOICE.TTS.lang;
    utterance.rate = options.rate || CONFIG.VOICE.TTS.rate;
    utterance.pitch = options.pitch || CONFIG.VOICE.TTS.pitch;
    utterance.volume = options.volume || CONFIG.VOICE.TTS.volume;

    // Select a voice (prefer female voice for accessibility)
    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.lang.startsWith('en') && v.name.includes('Female')
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this._updateSpeakingUI(true);
      if (this.onSpeakingChange) this.onSpeakingChange(true);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this._updateSpeakingUI(false);
      if (this.onSpeakingChange) this.onSpeakingChange(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.isSpeaking = false;
      this._updateSpeakingUI(false);
    };

    this.synthesis.speak(utterance);
  },

  /**
   * Stop speaking
   */
  stopSpeaking() {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this._updateSpeakingUI(false);
      if (this.onSpeakingChange) this.onSpeakingChange(false);
    }
  },

  /**
   * Clean text for speech (remove markdown, etc.)
   */
  _cleanTextForSpeech(text) {
    return text
      // Remove markdown bold/italic
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Remove markdown links
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      // Remove citation brackets
      .replace(/\[.*?\]/g, '')
      // Remove multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Create voice UI elements
   */
  _createVoiceUI() {
    // Add microphone button to input area
    const inputWrapper = document.querySelector('.chat-input-wrapper');
    if (inputWrapper && !document.getElementById('voice-mic-btn')) {
      const micBtn = document.createElement('button');
      micBtn.id = 'voice-mic-btn';
      micBtn.className = 'voice-btn mic-btn';
      micBtn.type = 'button';
      micBtn.setAttribute('aria-label', 'Voice input');
      micBtn.innerHTML = `
        <span class="mic-icon">🎤</span>
        <span class="listening-indicator"></span>
      `;
      micBtn.addEventListener('click', () => this.startListening());

      // Insert at the beginning of the input wrapper
      inputWrapper.insertBefore(micBtn, inputWrapper.firstChild);
    }
  },

  /**
   * Add speak button to a message
   * @param {HTMLElement} messageElement - The message container
   * @param {string} text - Text content of the message
   */
  addSpeakButton(messageElement, text) {
    if (!this.isSupported) return;
    if (!messageElement || messageElement.querySelector('.speak-btn')) return;

    const speakBtn = document.createElement('button');
    speakBtn.className = 'voice-btn speak-btn';
    speakBtn.type = 'button';
    speakBtn.setAttribute('aria-label', 'Read aloud');
    speakBtn.innerHTML = '🔊';
    speakBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.isSpeaking) {
        this.stopSpeaking();
      } else {
        this.speak(text);
      }
    });

    // Add to message actions area (or create one)
    let actionsArea = messageElement.querySelector('.message-actions');
    if (!actionsArea) {
      actionsArea = document.createElement('div');
      actionsArea.className = 'message-actions';
      const messageContent = messageElement.querySelector('.message-content');
      if (messageContent) {
        messageContent.appendChild(actionsArea);
      }
    }
    actionsArea.appendChild(speakBtn);
  },

  /**
   * Update listening UI state
   */
  _updateListeningUI(isListening) {
    const micBtn = document.getElementById('voice-mic-btn');
    if (micBtn) {
      micBtn.classList.toggle('listening', isListening);
      micBtn.setAttribute('aria-pressed', isListening);
    }
  },

  /**
   * Update speaking UI state
   */
  _updateSpeakingUI(isSpeaking) {
    document.querySelectorAll('.speak-btn').forEach(btn => {
      btn.classList.toggle('speaking', isSpeaking);
      btn.innerHTML = isSpeaking ? '⏹️' : '🔊';
    });
  },

  /**
   * Update input preview during speech recognition
   */
  _updateInputPreview(text) {
    const input = document.getElementById('chat-input');
    if (input) {
      input.value = text;
      input.classList.add('voice-preview');
    }
  },

  /**
   * Update voice availability based on current language
   */
  _updateVoiceAvailability() {
    const currentLang = typeof Language !== 'undefined' ? Language.getLanguage() : Storage.getLanguage();
    const sttAvailable = CONFIG.VOICE.STT_SUPPORTED.includes(currentLang);

    const micBtn = document.getElementById('voice-mic-btn');
    if (micBtn) {
      micBtn.disabled = !sttAvailable;
      micBtn.classList.toggle('disabled', !sttAvailable);

      if (!sttAvailable) {
        micBtn.setAttribute('title', `Voice input not available for ${CONFIG.LANGUAGES[currentLang] || currentLang}. Try English or Pidgin.`);
      } else {
        micBtn.setAttribute('title', 'Voice input');
      }
    }
  },

  /**
   * Check if STT is available for current language
   */
  isSTTAvailable() {
    const currentLang = typeof Language !== 'undefined' ? Language.getLanguage() : Storage.getLanguage();
    return this.sttSupported && CONFIG.VOICE.STT_SUPPORTED.includes(currentLang);
  },

  /**
   * Check if TTS is available
   */
  isTTSAvailable() {
    return this.isSupported;
  }
};
