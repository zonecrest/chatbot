# n8n Workflow Setup for GRA Tax Chatbot

This directory contains n8n workflows for the Ghana Revenue Authority Tax Chatbot backend.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHAT CONTROLLER                               │
│                                                                  │
│  [Webhook /chat]                                                │
│        │                                                        │
│        ▼                                                        │
│  [Validate Input]                                               │
│        │                                                        │
│        ▼                                                        │
│  [Check Language] ─── English/Pidgin? ───▶ Skip translation     │
│        │                                                        │
│        ▼ (Twi/Ga/Ewe)                                          │
│  [TRANSLATE INPUT → ENGLISH]                                    │
│        │                                                        │
│        ▼                                                        │
│  [Classify Domain]                                              │
│        │                                                        │
│        ├─── VAT ────────▶ [Call VAT Specialist]                │
│        │                          │                             │
│        ├─── Income Tax ─▶ [Call Income Tax Specialist]         │
│        │                          │                             │
│        └─── Greeting ───▶ [Handle Greeting]                    │
│                                   │                             │
│        ◀──────────────────────────┘                            │
│        │ (English response from specialist)                     │
│        │                                                        │
│  [TRANSLATE RESPONSE → TARGET LANGUAGE]                         │
│        │                                                        │
│        ▼                                                        │
│  [Return to Frontend]                                           │
└─────────────────────────────────────────────────────────────────┘
```

**Key Design Decision**: Translation logic is centralized in the Controller (DRY principle). Specialists work in English only.

## Prerequisites

1. n8n Cloud account or self-hosted n8n instance
2. OpenAI API key
3. Supabase project with pgvector extension
4. (Optional) Google Sheets for conversation logging

## Workflows

### 1. chat-controller.json (Main Entry Point)

The main chat controller that handles:
- Receiving queries from frontend (any language)
- Translating non-English input to English (Twi/Ga/Ewe)
- Classifying query domain (VAT, Income Tax, Greeting, General)
- Routing to appropriate specialist sub-workflow
- Translating response back to user's language
- Returning compiled response

**Endpoint:** `POST /webhook/chat`

**Supported Languages:**
- English (en) - no translation
- Pidgin (pidgin) - no translation
- Twi (twi) - translated
- Ga (ga) - translated
- Ewe (ewe) - translated

### 2. vat-specialist.json

Handles VAT-specific queries in English only.

**Endpoint:** `POST /webhook/vat-specialist`

**Features:**
- Query expansion for better retrieval
- Vector search on `vat_documents` table
- VAT-specific system prompt with expertise areas
- Citation extraction from retrieved documents

**Database:**
- Table: `vat_documents`
- Function: `match_vat_documents(embedding, count)`

### 3. income-tax-specialist.json

Handles Income Tax queries in English only.

**Endpoint:** `POST /webhook/income-tax-specialist`

**Features:**
- Query expansion for better retrieval
- Vector search on `income_tax_documents` table
- Income Tax-specific system prompt with current tax bands
- Citation extraction from retrieved documents

**Database:**
- Table: `income_tax_documents`
- Function: `match_income_tax_documents(embedding, count)`

### 4. chat-workflow.json (Legacy)

Original single-workflow implementation. Kept for reference.

## Supabase Schema

### VAT Documents Table

```sql
CREATE TABLE vat_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  act_name TEXT,
  act_number TEXT,
  document_type TEXT,
  section_number TEXT,
  section_title TEXT,
  breadcrumb TEXT,
  summary TEXT,
  effective_date DATE,
  source_file TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_vat_docs_embedding ON vat_documents
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE OR REPLACE FUNCTION match_vat_documents(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  summary TEXT,
  breadcrumb TEXT,
  section_number TEXT,
  section_title TEXT,
  act_name TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.content,
    t.summary,
    t.breadcrumb,
    t.section_number,
    t.section_title,
    t.act_name,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM vat_documents t
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### Income Tax Documents Table

```sql
CREATE TABLE income_tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  act_name TEXT,
  act_number TEXT,
  document_type TEXT,
  section_number TEXT,
  section_title TEXT,
  breadcrumb TEXT,
  summary TEXT,
  effective_date DATE,
  source_file TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_income_tax_docs_embedding ON income_tax_documents
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE OR REPLACE FUNCTION match_income_tax_documents(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  summary TEXT,
  breadcrumb TEXT,
  section_number TEXT,
  section_title TEXT,
  act_name TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.content,
    t.summary,
    t.breadcrumb,
    t.section_number,
    t.section_title,
    t.act_name,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM income_tax_documents t
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

## Setup Instructions

### 1. Import Workflows

1. Open n8n
2. Go to Workflows > Import from File
3. Import in this order:
   - `vat-specialist.json`
   - `income-tax-specialist.json`
   - `chat-controller.json`
4. Click Import for each

### 2. Configure Credentials

**OpenAI:**
1. Go to Credentials
2. Add "OpenAI API" credential
3. Enter your API key
4. Connect to all OpenAI nodes

**Supabase:**
1. Add "Supabase" credential
2. Enter your project URL and API key
3. Connect to Search Documents nodes

### 3. Update Specialist URLs

In `chat-controller.json`, update the HTTP Request nodes with your n8n instance URL:
- `Call VAT Specialist`: Update URL to your instance
- `Call Income Tax Specialist`: Update URL to your instance

Or set the `N8N_WEBHOOK_BASE_URL` environment variable.

### 4. Configure Frontend

Update `frontend/js/config.js`:

```javascript
const CONFIG = {
  N8N_WEBHOOK_URL: 'https://your-instance.app.n8n.cloud/webhook',
  DEMO_MODE: false,
  // ...
};
```

### 5. Test

1. Activate all three workflows
2. Open the frontend
3. Test queries:
   - English VAT: "What is the VAT rate?"
   - Twi VAT: "Mepɛ sɛ menya VAT ho nsɛm"
   - English Income Tax: "What are the tax bands?"
4. Verify response includes citation and correct language

## API Reference

### POST /webhook/chat

**Request:**
```json
{
  "message": "What is the VAT rate?",
  "conversation_id": "conv_123",
  "language": "en",
  "user_id": "user_456",
  "history": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hello! How can I help?"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "response": {
    "text": "The standard VAT rate in Ghana is 15%...",
    "text_english": "The standard VAT rate in Ghana is 15%...",
    "citations": [{
      "document": "Value Added Tax Act, 2013 (Act 870)",
      "section": "Section 3",
      "breadcrumb": "Part II > Section 3 - Rate of Tax",
      "excerpt": "The rate of value added tax is 15%..."
    }],
    "domain": "vat",
    "language": "en",
    "was_translated": false,
    "suggested_followups": [
      "How do I register for VAT?",
      "What items are VAT exempt?"
    ]
  },
  "conversation_id": "conv_123",
  "metadata": {
    "classified_as": "vat",
    "classification_confidence": 0.95,
    "input_translated": false,
    "output_translated": false,
    "processed_at": "2024-01-15T10:30:00Z"
  }
}
```

## Testing Checklist

### Input Translation
- [ ] English input passes through without translation
- [ ] Pidgin input passes through without translation
- [ ] Twi input translated to English
- [ ] Ga input translated to English
- [ ] Ewe input translated to English

### Domain Routing
- [ ] VAT queries route to VAT specialist
- [ ] Income Tax queries route to Income Tax specialist
- [ ] Greetings handled locally (no specialist call)
- [ ] Ambiguous queries prompt for clarification

### Output Translation
- [ ] English users get English response
- [ ] Twi users get Twi response
- [ ] Technical terms (VAT, TIN) stay in English
- [ ] Citations remain in English

### End-to-End
- [ ] Twi VAT question → Twi response with English citations
- [ ] English Income Tax question → English response
- [ ] Error handling works if specialist times out

## Troubleshooting

**No response from AI:**
- Check API credentials
- Verify webhook is active
- Check n8n execution logs

**No citations returned:**
- Ensure vector store has documents
- Check Supabase connection
- Verify embeddings are working

**CORS errors:**
- Webhook has `Access-Control-Allow-Origin: *` set
- If issues persist, configure specific origins

**Translation not working:**
- Check language field in request
- Verify OpenAI credentials for translation nodes
- Check if language is in supported list (twi, ga, ewe)

## Credentials Required

- OpenAI API Key
- Supabase connection (URL + API Key)

## Adding New Specialists (Future)

To add a new domain (e.g., Import/Export):

1. Create `import_export_documents` table in Supabase
2. Create `match_import_export_documents` function
3. Copy specialist workflow, change:
   - Webhook path: `/import-export-specialist`
   - Supabase function: `match_import_export_documents`
   - System prompt: Import/Export expertise
   - Domain: `'import_export'`
4. Update Controller routing to include new domain
