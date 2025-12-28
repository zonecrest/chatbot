# n8n Workflow Setup for Ask GRA Chatbot

This directory contains n8n workflows for the GRA Taxpayer Chatbot backend.

## Prerequisites

1. n8n Cloud account or self-hosted n8n instance
2. OpenAI API key OR Anthropic API key
3. (Optional) Google Sheets for conversation logging

## Workflows

### 1. chat-workflow.json
Main chat endpoint that handles user questions.

**Endpoint:** `POST /webhook/chat`

**Flow:**
1. Receive user message
2. Retrieve relevant documents from vector store
3. Generate response using AI with context
4. Format response with citations
5. Return to frontend

### 2. ingest-workflow.json (Create manually)
For loading Ghana tax PDFs into the vector store.

**Documents to ingest:**
- Value Added Tax Act, 2013 (Act 870)
- Income Tax Act, 2015 (Act 896)
- Revenue Administration Act, 2016 (Act 915)
- Electronic Transfer Levy Act, 2022 (Act 1075)

## Setup Instructions

### 1. Import Workflow

1. Open n8n
2. Go to Workflows > Import from File
3. Select `chat-workflow.json`
4. Click Import

### 2. Configure Credentials

**OpenAI (recommended):**
1. Go to Credentials
2. Add "OpenAI API" credential
3. Enter your API key
4. Connect to AI Agent node

**OR Anthropic:**
1. Add "Anthropic" credential
2. Enter your API key
3. Update AI Agent to use Claude

### 3. Set Up Vector Store

**Option A: In-Memory (for demo)**
1. Add "In-Memory Vector Store" node
2. Connect to retriever
3. Note: Data lost on restart

**Option B: Supabase (for production)**
1. Create Supabase project
2. Enable pgvector extension
3. Add Supabase credentials
4. Use "Supabase Vector Store" node

### 4. Load Documents

To add real Ghana tax documents:

1. Create an ingestion workflow:
   - File Read node (PDF)
   - PDF Loader node
   - Text Splitter (500 tokens, 50 overlap)
   - Embeddings (OpenAI)
   - Vector Store Insert

2. Run for each document

### 5. Configure Frontend

Update `frontend/js/config.js`:

```javascript
const CONFIG = {
  N8N_WEBHOOK_URL: 'https://your-instance.app.n8n.cloud/webhook',
  DEMO_MODE: false,
  // ...
};
```

### 6. Test

1. Activate the workflow
2. Open the frontend
3. Ask: "What is the VAT rate?"
4. Verify response includes citation

## API Reference

### POST /webhook/chat

**Request:**
```json
{
  "message": "What is the VAT rate?",
  "conversation_id": "conv_123",
  "language": "en",
  "user_id": "user_456"
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "text": "The standard VAT rate in Ghana is 15%...",
    "citations": [{
      "document": "VAT Act 2013",
      "section": "Section 3",
      "excerpt": "...",
      "page": 5
    }],
    "confidence": 0.92,
    "suggested_followups": ["How do I register for VAT?"]
  }
}
```

## Troubleshooting

**No response from AI:**
- Check API credentials
- Verify webhook is active
- Check n8n execution logs

**No citations returned:**
- Ensure vector store has documents
- Check retriever connection
- Verify embeddings are working

**CORS errors:**
- Webhook has `Access-Control-Allow-Origin: *` set
- If issues persist, configure specific origins

## System Prompt

The AI uses this system prompt (customize as needed):

```
You are Kofi, a helpful and friendly GRA tax assistant.

RULES:
1. Only answer from provided context
2. Always cite sources: [Source: Document, Section]
3. Never make up tax rates
4. Use simple language
5. Be warm and encouraging

LANGUAGE:
- Match user's language style (English/Pidgin/Twi)
- Respond in Pidgin if user writes in Pidgin
```
