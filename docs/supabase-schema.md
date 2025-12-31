# Supabase Table Architecture for Ghana Tax Chatbot

## Architecture: Separate Tables per Domain

Each specialist queries its **own dedicated table** for cleaner isolation and simpler queries:
- `vat_documents` - VAT specialist
- `income_tax_documents` - Income Tax specialist

See `03-specialist-subagent-workflow.md` for full table schemas and search functions.

---

## Why Single Table?

| Aspect | Single Table | Separate Tables |
|--------|-------------|-----------------|
| **Schema changes** | One migration | Multiple migrations |
| **Cross-domain queries** | Easy (remove filter) | Complex (UNION) |
| **Backups** | One table | Multiple tables |
| **Index management** | One index | Index per table |
| **Code complexity** | One query function | Function per domain |
| **Adding new domain** | Add rows | Create new table + function |
| **Supabase dashboard** | One place to check | Multiple places |

**Separate tables would only make sense if:**
- Different domains need different columns (they don't)
- Millions of rows per domain (prototype won't have this)
- Different access permissions per domain (not needed)

---

## Vector Database Scaling Notes

**Row limits and search efficiency:**

- pgvector (Supabase's vector extension) handles **millions of rows** efficiently
- The IVFFlat index we use is designed for large-scale similarity search
- For a tax legislation chatbot with hundreds/thousands of sections, this is well within comfortable limits
- If you ever hit performance issues (unlikely), you can:
  - Increase `lists` parameter in the index
  - Switch to HNSW index (faster but uses more memory)
  - Partition the table by domain (last resort)

**Practical guidance:**
- Under 100K rows: No optimization needed
- 100K - 1M rows: Tune index parameters
- 1M+ rows: Consider partitioning or dedicated vector DB

For Ghana tax legislation (probably <10K sections total), single table is more than adequate.

---

## Table Schema

```sql
-- Enable pgvector extension (run once in Supabase SQL editor)
CREATE EXTENSION IF NOT EXISTS vector;

-- Single table for all tax documents
CREATE TABLE tax_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content & embedding
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  
  -- Domain classification (the key filter)
  domain TEXT NOT NULL,  -- 'vat', 'income_tax', 'import_export', etc.
  
  -- Document identification
  act_name TEXT,
  act_number TEXT,
  document_type TEXT,  -- 'principal_act', 'amendment', 'consolidated'
  
  -- Section identification  
  part_number TEXT,
  part_title TEXT,
  section_number TEXT,
  section_title TEXT,
  subsection TEXT,
  breadcrumb TEXT,  -- "VAT Act 2013 > Part III > Section 15"
  
  -- Generated content
  summary TEXT,
  
  -- Temporal tracking
  effective_date DATE,
  last_amended_by TEXT,
  amendment_history JSONB,
  
  -- Source tracking
  source_file TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Flexible metadata
  metadata JSONB
);

-- Index for domain filtering
CREATE INDEX idx_tax_documents_domain ON tax_documents(domain);

-- Vector similarity search index
-- lists = 100 is good for up to ~100K rows; increase for larger datasets
CREATE INDEX idx_tax_documents_embedding ON tax_documents 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- Optional: index for act lookups
CREATE INDEX idx_tax_documents_act ON tax_documents(act_number);

-- Optional: index for section lookups
CREATE INDEX idx_tax_documents_section ON tax_documents(section_number);
```

---

## Search Function

This function is called by n8n to retrieve relevant documents:

```sql
-- Function for similarity search with domain filter
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_domain TEXT,
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
  FROM tax_documents t
  WHERE t.domain = match_domain
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## Usage from n8n

### VAT Specialist Query

```javascript
// In n8n Supabase node
const result = await supabase.rpc('match_documents', {
  query_embedding: embedding,      // From OpenAI embeddings
  match_domain: 'vat',             // Filter to VAT documents
  match_count: 5                   // Return top 5 matches
});
```

### Income Tax Specialist Query

```javascript
const result = await supabase.rpc('match_documents', {
  query_embedding: embedding,
  match_domain: 'income_tax',      // Filter to Income Tax documents
  match_count: 5
});
```

### Cross-Domain Query (if needed)

```javascript
// For ambiguous queries, search all domains
const result = await supabase.rpc('match_documents_all', {
  query_embedding: embedding,
  match_count: 10
});
```

Would require additional function:

```sql
CREATE OR REPLACE FUNCTION match_documents_all(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  summary TEXT,
  breadcrumb TEXT,
  section_number TEXT,
  section_title TEXT,
  act_name TEXT,
  domain TEXT,
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
    t.domain,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM tax_documents t
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## Domain Values

| Domain Code | Description | Example Acts |
|-------------|-------------|--------------|
| `vat` | Value Added Tax | VAT Act 2013, VAT amendments |
| `income_tax` | Personal & Corporate Income Tax | Income Tax Act 2015, amendments |
| `import_export` | Customs & Import/Export | Customs Act, ECOWAS regulations |
| `e_levy` | Electronic Transfer Levy | E-Levy Act 2022 |
| `general` | Cross-cutting or general | Revenue Administration Act |

---

## Adding a New Domain

Adding a new domain (e.g., "Property Tax") is trivial:

1. **Ingest documents** with `domain: 'property_tax'`
2. **Create specialist workflow** that queries with `match_domain: 'property_tax'`
3. **Update controller** routing to recognize property tax queries

**No schema changes. No new tables. No new functions.**

---

## Chat Logs Table (Separate)

For conversation logging (not RAG), use a separate table:

```sql
CREATE TABLE chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT,
  user_id TEXT,
  user_message TEXT,
  classified_domain TEXT,
  classification_confidence FLOAT,
  response_text TEXT,
  citations JSONB,
  language TEXT,
  was_translated BOOLEAN,
  was_helpful BOOLEAN,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_logs_conversation ON chat_logs(conversation_id);
CREATE INDEX idx_chat_logs_domain ON chat_logs(classified_domain);
CREATE INDEX idx_chat_logs_timestamp ON chat_logs(timestamp);
```

---

## Summary

| Decision | Choice | Reason |
|----------|--------|--------|
| **Table structure** | Single `tax_documents` table | Simpler, flexible, easier to maintain |
| **Domain separation** | `domain` column + filtered queries | Clean separation without table sprawl |
| **Scaling path** | Can partition later if needed | Current scale is well within limits |
| **Chat logs** | Separate `chat_logs` table | Different purpose, different access patterns |
