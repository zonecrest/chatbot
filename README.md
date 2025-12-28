# Ask GRA - Taxpayer Chatbot Prototype

An AI-powered chatbot that helps Ghanaian citizens understand tax law using RAG (Retrieval-Augmented Generation) with verifiable citations.

## Overview

"Ask GRA" is a friendly tax assistant named Kofi that answers questions about Ghana's tax laws. Every answer includes citations to the actual legislation, building trust by proving the AI isn't making things up.

**Key Features:**
- Natural language Q&A about Ghana taxes
- Citations from official tax documents (VAT Act, Income Tax Act, E-Levy Act)
- Multi-language support (English, Pidgin, Twi, Ga, Ewe)
- Mobile-first WhatsApp-style interface
- Admin dashboard for monitoring

## Quick Start

### Option 1: Local Demo (No Backend Required)

1. Open `frontend/index.html` in a web browser
2. The chatbot runs in demo mode with sample Q&A
3. Try asking: "What is the VAT rate in Ghana?"

### Option 2: Deploy to Netlify

1. Push this repo to GitHub
2. Connect to Netlify
3. Deploy the `frontend/` directory
4. Access your live URL

### Option 3: Full Setup with n8n + AI

See [n8n/README.md](n8n/README.md) for backend setup with:
- OpenAI/Anthropic for AI responses
- Vector store for document retrieval
- Real Ghana tax PDFs

## Project Structure

```
ghana-chatbot-prototype/
├── frontend/
│   ├── index.html          # Main chat interface
│   ├── admin.html          # Admin dashboard
│   ├── css/styles.css      # GRA-branded styling
│   ├── js/
│   │   ├── config.js       # Configuration
│   │   ├── storage.js      # LocalStorage handling
│   │   ├── api.js          # Backend API + demo mode
│   │   ├── chat.js         # Chat functionality
│   │   └── app.js          # Main application
│   ├── assets/             # Icons and images
│   └── manifest.json       # PWA manifest
├── n8n/
│   └── chat-workflow.json  # n8n AI workflow
├── knowledge-base/
│   ├── sample-vat-qa.json  # Sample VAT Q&A
│   └── sample-e-levy-qa.json
└── README.md
```

## Demo Scenarios

### 1. Basic Tax Question
> "What is the VAT rate in Ghana?"

Bot responds with 15% rate explanation + citation to VAT Act Section 3.

### 2. Pidgin English
> "Chale, I dey sell phones for Circle, I for pay VAT?"

Bot responds in Pidgin style while still providing accurate legal information.

### 3. Citation Verification
Click "View Source" on any answer to see:
- Document name
- Section number
- Relevant excerpt

### 4. Unknown Question
> "What are the transfer pricing rules for mining?"

Bot gracefully admits it doesn't have that info and provides GRA contact details.

## Sample Questions

**VAT:**
- What is the VAT rate in Ghana?
- Do I need to register for VAT?
- Are food items exempt from VAT?

**E-Levy:**
- What is E-Levy?
- How much is E-Levy on mobile money?
- Who is exempt from E-Levy?

**Registration:**
- How do I get a TIN number?
- What documents do I need to register my business?

## Configuration

Edit `frontend/js/config.js`:

```javascript
const CONFIG = {
  // Connect to n8n backend (replace with your URL)
  N8N_WEBHOOK_URL: 'https://your-instance.app.n8n.cloud/webhook',

  // Set to false when n8n is configured
  DEMO_MODE: true,

  // Bot settings
  BOT_NAME: 'Kofi',
  GRA_PHONE: '0800-900-110'
};
```

## Design

The interface uses Ghana government colors:
- **GRA Blue** (#003366) - Primary brand
- **Ghana Gold** (#FCD116) - Accent
- **Ghana Green** (#006B3F) - Success states
- WhatsApp-style chat bubbles for familiarity

## Success Criteria

- [x] Users can ask tax questions in natural language
- [x] Bot responds with accurate answers from knowledge base
- [x] Every answer includes viewable citations
- [x] Bot gracefully handles unknown questions
- [x] Multi-language support (English + Pidgin + Twi)
- [x] Conversation history persists in browser
- [x] Admin panel shows usage stats
- [x] Mobile-first, works on Ghana smartphones
- [x] Demo mode works without backend

## Technology

**Frontend:** Plain HTML, CSS, JavaScript (no build tools)
**Backend:** n8n workflow automation
**AI:** OpenAI GPT-4 or Anthropic Claude (via n8n)
**Vector Store:** n8n In-Memory or Supabase

---

Built for Ghana's digital transformation initiative.
