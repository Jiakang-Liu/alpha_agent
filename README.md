# AlphaAgent

AlphaAgent is a full-stack, multi-agent financial research system that collects market and company data, retrieves relevant financial context, generates structured analysis, audits its own conclusions, and streams the execution process to a web interface in real time.

The project is designed to explore a practical engineering question:

> How can a multi-agent AI system produce financial research that is observable, recoverable, testable, and grounded in retrieved data rather than relying entirely on an LLM?

---

## Live Demo

> Demo deployment coming soon.

* Frontend: React + Vite
* Backend: FastAPI
* Database: PostgreSQL / Supabase
* Agent Orchestration: LangGraph
* Observability: LangSmith
* Data Sources: SEC filings and financial market APIs

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                        React Frontend                       │
│                                                             │
│  Dashboard   Agent Timeline   Report Viewer   Run History   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Server-Sent Events
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        FastAPI Backend                      │
│                                                             │
│  Request Validation   SSE Streaming   Run Persistence       │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     LangGraph Workflow                      │
│                                                             │
│  Supervisor → Data Agent → Analyst → Critic → Finish        │
│       ▲                                      │              │
│       └──────────── Revision Feedback ────────┘              │
└───────────────┬───────────────────────┬─────────────────────┘
                │                       │
                ▼                       ▼
┌──────────────────────────┐  ┌───────────────────────────────┐
│ Financial Data Pipelines │  │      Retrieval System         │
│                          │  │                               │
│ SEC Filings              │  │ Vector Search                 │
│ Market Data APIs         │  │ Trigram Search                │
│ Financial Statements     │  │ Reciprocal Rank Fusion        │
└──────────────┬───────────┘  └──────────────┬────────────────┘
               │                             │
               └──────────────┬──────────────┘
                              ▼
                 ┌──────────────────────────┐
                 │ PostgreSQL Knowledge Base│
                 │                          │
                 │ Financial Documents      │
                 │ Embeddings               │
                 │ Run History              │
                 │ Error and Duration Data  │
                 └──────────────────────────┘
```

---

## Overview

Traditional financial analysis applications often treat an LLM as a single black-box endpoint:

```text
User Question → LLM → Final Answer
```

This approach is fast to prototype, but it introduces several engineering problems:

* The model may answer without enough financial evidence.
* Retrieval quality is difficult to inspect.
* Long-running requests provide no execution feedback.
* Routing mistakes can create agent loops.
* Failed runs are difficult to diagnose.
* Generated reports have no automated quality gate.
* System quality cannot be measured consistently.

AlphaAgent separates the workflow into specialized components:

```text
Request Validation
        ↓
Data Collection
        ↓
Knowledge Retrieval
        ↓
Financial Analysis
        ↓
Automated Critique
        ↓
Revision or Completion
```

Each stage has a defined responsibility, structured state, observable events, and explicit failure handling.

---

## System Design

AlphaAgent is divided into four primary layers.

### 1. Presentation Layer

The React frontend provides:

* Analysis request controls
* Real-time agent execution status
* Incremental log rendering
* Markdown report rendering
* Historical run inspection
* Error visibility
* Duration metrics
* Basic system health information

The UI is intentionally designed to expose the execution process instead of showing only a loading spinner followed by a final answer.

### 2. API and Streaming Layer

FastAPI provides the interface between the frontend and the agent workflow.

Responsibilities include:

* Request validation
* Ticker normalization
* Run ID generation
* Workflow execution
* Server-Sent Events streaming
* Error propagation
* Run status persistence
* Duration measurement
* Historical run APIs

Each analysis request creates an `analysis_runs` record before graph execution begins.

The record is updated as the graph moves through different nodes and is finalized with either:

```text
SUCCESS
```

or:

```text
FAILED
```

### 3. Agent Orchestration Layer

LangGraph manages the multi-agent state machine.

The graph coordinates:

* Supervisor routing
* Data acquisition
* Retrieval
* Report generation
* Automated critique
* Revision
* Completion

The workflow uses explicit state transitions instead of allowing agents to call one another freely.

This makes the execution path easier to debug, test, and constrain.

### 4. Data and Retrieval Layer

PostgreSQL stores:

* Parsed financial documents
* Document metadata
* Vector embeddings
* Ticker-to-CIK mappings
* Analysis run records
* Final reports
* Error messages
* Execution duration

Financial documents are retrieved using a hybrid search pipeline that combines semantic and lexical retrieval.

---

## Multi-Agent Workflow

AlphaAgent currently uses four primary nodes.

### Supervisor

The Supervisor decides which node should execute next.

Its routing decision is based on the current graph state:

* Has financial data been collected?
* Has a report been generated?
* Has the report been reviewed?
* Has the maximum critique count been reached?

The Supervisor returns structured output rather than unvalidated natural-language routing instructions.

Example routing schema:

```python
class SupervisorRouter(BaseModel):
    next_action: Literal[
        "data_agent",
        "analyst_agent",
        "critic",
        "FINISH",
    ]
    reasoning: str
```

### Data Agent

The Data Agent is responsible for grounding the analysis.

It:

1. Checks whether relevant financial data already exists.
2. Fetches missing SEC or market data.
3. Chunks and stores financial documents.
4. Generates a query embedding.
5. Executes hybrid retrieval.
6. Formats retrieved evidence for the Analyst.

The Data Agent does not generate the final investment analysis.

Its responsibility is to supply high-quality context.

### Analyst

The Analyst converts retrieved financial evidence into a structured Markdown report.

Its output may include:

* Company overview
* Financial performance
* Balance-sheet observations
* Cash-flow analysis
* Growth drivers
* Risk factors
* Valuation considerations
* Final synthesis

The Analyst is expected to reason from the supplied context rather than invent unsupported financial facts.

### Critic

The Critic audits the generated report.

It checks for issues such as:

* Missing financial evidence
* Unsupported claims
* Incomplete cash-flow discussion
* Weak risk analysis
* Internal inconsistency
* Failure to address the user’s question

The Critic returns either:

```text
PASS
```

or structured revision feedback.

When a report is rejected, the graph routes back to the Analyst.

---

## Hybrid Search

Financial research requires both semantic matching and exact financial terminology.

Vector search performs well for conceptually similar queries, but it may miss exact matches involving:

* Filing terminology
* Financial ratios
* Product names
* Accounting terms
* Ticker-specific language
* Exact phrases

Lexical search handles exact terms well, but it may miss conceptually related passages.

AlphaAgent combines both approaches.

### Vector Retrieval

Embeddings are stored using PostgreSQL vector support.

Vector similarity search identifies passages that are semantically related to the user’s question.

### Trigram Retrieval

PostgreSQL trigram search retrieves passages with strong lexical similarity.

This is useful for exact company terms and financial phrases.

### Reciprocal Rank Fusion

The result lists are merged using Reciprocal Rank Fusion.

A simplified scoring function is:

```text
RRF Score = Σ 1 / (k + rank)
```

RRF combines ranked results without requiring vector scores and lexical scores to use the same numerical scale.

### Metadata Filtering

Retrieval can be filtered using metadata such as:

* Ticker
* Fiscal year
* Document type
* Filing type

This reduces the chance that semantically similar but irrelevant documents enter the model context.

---

## Self-Correction

AlphaAgent includes an automated report review loop.

```text
Analyst
   ↓
Critic
   ├── PASS → Finish
   └── REJECT → Analyst Revision
```

The goal is not to make the system indefinitely autonomous.

The goal is to introduce a bounded quality-control stage.

To prevent unlimited revision cycles, the graph tracks the critique count and enforces a maximum threshold.

This creates a controlled self-correction mechanism:

```text
Generate → Audit → Revise → Complete
```

instead of:

```text
Generate → Return Immediately
```

---

## Streaming Architecture

A complete financial analysis may involve:

* External API requests
* SEC data processing
* Database writes
* Embedding generation
* Retrieval
* Multiple LLM calls
* Report critique
* Report revision

Waiting for the entire workflow to complete before updating the interface creates poor perceived latency.

AlphaAgent uses Server-Sent Events to stream workflow activity to the frontend.

### Event Contract

The backend emits structured events such as:

```text
GRAPH_START
NODE_START
NODE_LOG
REPORT_GENERATED
NODE_END
GRAPH_END
ERROR
```

Example:

```json
{
  "type": "node_start",
  "node": "data_agent",
  "message": "Starting financial data retrieval"
}
```

The frontend consumes these events incrementally and updates:

* Active agent state
* Execution timeline
* Logs
* Report content
* Loading status
* Error state

### Why SSE

SSE was selected because the primary communication pattern is:

```text
Backend → Frontend
```

The server continuously sends workflow updates while the client mainly listens.

Compared with polling, SSE provides:

* Lower update latency
* Fewer repeated HTTP requests
* A simpler event model
* Native browser support
* Easy integration with FastAPI streaming responses

---

## Evaluation

AlphaAgent includes multiple testing layers.

### Unit Tests

Unit tests validate individual components such as:

* Supervisor routing
* Critic pass and reject behavior
* Data formatting
* Repository methods
* Event generation
* Request validation

### Integration Tests

Integration tests execute larger application paths:

```text
FastAPI Endpoint
      ↓
LangGraph Workflow
      ↓
Agent State Transitions
      ↓
Streaming Response
      ↓
Final Report
```

External model calls can be replaced with deterministic test implementations so the workflow can be tested without consuming production API credits.

### SSE Contract Tests

Streaming tests verify that:

* Every SSE line starts with `data:`
* Every event contains valid JSON
* Every event contains a `type`
* `GRAPH_START` is the first event
* `GRAPH_END` is the final successful event
* A report event contains report content
* Successful runs do not emit error events

### Evaluation Cases

The evaluation layer is designed to measure more than whether the system returned a response.

Evaluation dimensions include:

* Financial evidence coverage
* Factual grounding
* Cash-flow discussion
* Risk identification
* Report completeness
* Retrieval relevance
* Critic consistency
* Workflow completion
* Latency
* Error rate

The long-term goal is to maintain a repeatable set of financial research cases and compare system changes against a stable baseline.

---

## Engineering Challenges

The most important work in AlphaAgent was not adding more supported tickers.

The main engineering value came from identifying and solving failure modes that appear in real multi-agent systems.

---

### Challenge 1: Graph Routing Loops

#### Problem

An LLM-based Supervisor can produce unstable routing behavior.

Without clear constraints, the graph may:

* Route repeatedly to the same node
* Ask for data after data has already been collected
* Send an incomplete report directly to completion
* Continue the Analyst-Critic loop indefinitely
* Return an invalid node name

This can create non-terminating or unpredictable executions.

#### Solution

AlphaAgent constrains routing through:

* Structured model output
* Pydantic validation
* Explicit graph state
* Deterministic routing rules
* Critique counters
* Maximum revision thresholds
* A dedicated `FINISH` state

The Supervisor does not decide from conversation history alone.

It evaluates explicit state fields such as:

```text
raw_data
financial_report
critique_feedback
critique_count
```

This reduced open-ended agent autonomy in favor of a controlled state machine.

#### Engineering Lesson

Multi-agent systems need termination conditions and validated transitions.

Agent intelligence does not replace workflow invariants.

---

### Challenge 2: Retrieval Quality

#### Problem

Pure vector retrieval was not sufficient for financial documents.

Semantically similar results could still be wrong because they came from:

* Another company
* Another fiscal year
* Another filing type
* A conceptually related but numerically irrelevant section

At the same time, exact keyword retrieval could miss passages that expressed the same idea using different terminology.

#### Solution

AlphaAgent uses:

* Vector search
* Trigram lexical search
* Reciprocal Rank Fusion
* Ticker filtering
* Fiscal-year filtering
* Document-type metadata
* Controlled chunking
* Retrieval result formatting

This allows the system to balance semantic relevance with exact financial terminology.

#### Engineering Lesson

Retrieval quality depends on more than the embedding model.

Chunk structure, metadata, filtering, ranking, and context formatting are equally important.

---

### Challenge 3: Perceived Latency

#### Problem

The complete analysis pipeline may take tens of seconds.

A traditional request-response design would show no progress until the final report was ready.

Even when actual execution time was acceptable, the application felt unresponsive.

#### Solution

AlphaAgent streams structured execution events through SSE.

The frontend renders:

* The current node
* Agent transitions
* Log messages
* Report generation status
* Errors
* Completion state

This turns a long blocking request into an observable process.

#### Engineering Lesson

Latency is partly a backend performance problem and partly a product-design problem.

When a workflow cannot complete instantly, progress visibility becomes a core system feature.

---

### Challenge 4: Observability

#### Problem

A multi-agent workflow is difficult to debug when the only available output is the final report.

A failed or low-quality response may originate from:

* Incorrect routing
* Missing data
* Poor chunking
* Weak retrieval
* Prompt construction
* Model latency
* Critic rejection
* Database errors
* Streaming errors

Without observability, these failure modes appear identical.

#### Solution

AlphaAgent adds observability at multiple levels:

* LangSmith traces
* Per-node execution timing
* Node input and output inspection
* Persistent run history
* Current-node tracking
* Final status tracking
* Error-message persistence
* Total-duration metrics
* Frontend logs
* Structured SSE events

Each run receives a unique run ID and is persisted in the `analysis_runs` table.

#### Engineering Lesson

Observability should be designed into an agent system before production deployment.

Logs alone are insufficient when execution spans multiple agents, tools, and external services.

---

### Challenge 5: Reliable Streaming Contracts

#### Problem

SSE is simple conceptually, but small formatting errors can break the frontend stream parser.

Potential failures include:

* Missing `data:` prefixes
* Invalid JSON
* Inconsistent event names
* Partial event frames
* Missing graph completion events
* Errors that close the stream without context
* Concurrent React state updates overwriting one another

#### Solution

AlphaAgent defines a fixed event vocabulary and validates the streaming contract through integration tests.

The frontend:

* Splits complete SSE frames
* Parses JSON defensively
* Uses functional state updates
* Tracks streaming state separately
* Handles error events explicitly
* Preserves incremental logs

#### Engineering Lesson

Streaming protocols should be treated as public API contracts, not implementation details.

---

### Challenge 6: Testing Without Production LLM Calls

#### Problem

End-to-end testing with real LLM calls introduces:

* API cost
* Slow tests
* Non-deterministic responses
* Rate-limit failures
* Difficult assertions
* Dependence on external services

However, mocking the entire graph would fail to test the actual workflow.

#### Solution

AlphaAgent separates model-dependent behavior from workflow orchestration.

During tests, LLM-backed components can be replaced with deterministic implementations while preserving:

* FastAPI request handling
* Graph execution
* State transitions
* SSE generation
* Persistence behavior
* Error handling
* Final report flow

#### Engineering Lesson

The goal is not to mock everything.

The goal is to isolate non-deterministic boundaries while testing the real application path around them.

---

### Challenge 7: Data Caching and Duplicate Ingestion

#### Problem

Repeatedly downloading and processing the same SEC and financial data would increase:

* API latency
* External API usage
* Database writes
* Embedding costs
* Duplicate document risk

#### Solution

Before downloading data, the Data Agent checks whether relevant ticker data already exists in the knowledge base.

Database uniqueness constraints and metadata checks reduce duplicate ingestion.

The pipeline only performs expensive collection work when required.

#### Engineering Lesson

LLM applications still require conventional backend engineering:

* Caching
* Idempotency
* Uniqueness constraints
* Resource management
* Failure recovery

---

### Challenge 8: Run Persistence Without Full Checkpointing

#### Problem

LangGraph checkpointing can preserve complete workflow state, but full checkpointing introduces additional complexity:

* More database storage
* State cleanup
* Serialization concerns
* Version compatibility
* Recovery logic

For a workflow that usually completes in under one minute, full state recovery was not initially necessary.

#### Solution

AlphaAgent uses lightweight run persistence.

It stores:

* Run ID
* Ticker
* User query
* Status
* Current node
* Final report
* Error message
* Start time
* Finish time
* Duration

This provides operational visibility without introducing full workflow-resume complexity.

#### Engineering Lesson

Infrastructure should match the current failure model.

Not every agent workflow needs full checkpointing from the first version.

---

## Database Design

The primary financial knowledge table stores document content and embeddings.

```sql
CREATE TABLE financial_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker VARCHAR(12) NOT NULL,
    fiscal_year INTEGER,
    doc_type VARCHAR(50),
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

The system also stores execution history.

```sql
CREATE TABLE analysis_runs (
    run_id UUID PRIMARY KEY,
    ticker TEXT NOT NULL,
    user_query TEXT NOT NULL,
    status TEXT NOT NULL,
    current_node TEXT,
    final_report TEXT,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Indexes support:

* Vector similarity search
* Trigram search
* Ticker and fiscal-year filtering
* Duplicate prevention
* Historical run queries

---

## Technology Stack

### Backend

* Python 3.11
* FastAPI
* LangGraph
* Pydantic
* AsyncOpenAI
* LangChain
* Psycopg
* PostgreSQL
* pgvector
* pg_trgm
* LangSmith
* Pytest
* HTTPX

### Frontend

* React
* JavaScript
* Vite
* Tailwind CSS
* React Markdown
* Lucide React

### Infrastructure

* Supabase PostgreSQL
* Render
* Environment-based configuration
* Asynchronous database connection pooling

---

## Project Structure

```text
alpha_agent/
├── backend/
│   ├── agents/
│   │   ├── supervisor.py
│   │   ├── data_agent.py
│   │   ├── analyst_agent.py
│   │   └── critic.py
│   │
│   ├── services/
│   │   ├── data_service.py
│   │   └── critic_service.py
│   │
│   ├── infrastructure/
│   │   ├── database.py
│   │   ├── schema_initializer.py
│   │   ├── analysis_run_repository.py
│   │   ├── cik_repository.py
│   │   └── hybrid_search.py
│   │
│   ├── pipelines/
│   │   ├── sec_pipeline.py
│   │   └── market_data_pipeline.py
│   │
│   ├── tests/
│   │   ├── unit_test/
│   │   ├── integration_test/
│   │   └── evaluation/
│   │
│   ├── events.py
│   ├── graph.py
│   ├── state.py
│   └── server.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
│
├── pyproject.toml
└── README.md
```

---

## Local Development

### Prerequisites

* Python 3.11
* Poetry
* Node.js
* PostgreSQL
* OpenAI API key
* LangSmith API key
* Financial data API credentials

### Backend Setup

```bash
poetry install
```

Create an environment file:

```env
OPENAI_API_KEY=
LANGSMITH_API_KEY=
LANGSMITH_TRACING=true
DATABASE_URL=
POLYGON_API_KEY=
TWELVE_DATA_KEY=
```

Start the backend:

```bash
poetry run uvicorn backend.server:app --reload
```

The API will be available at:

```text
http://localhost:8000
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will typically be available at:

```text
http://localhost:5173
```

---

## API

### Start an Analysis

```http
POST /api/analyze
```

Example request:

```json
{
  "ticker": "TSLA",
  "user_query": "Analyze Tesla's financial performance, cash flow, and major risks."
}
```

The endpoint returns a Server-Sent Events stream.

### Retrieve Run History

```http
GET /api/runs
```

The response includes historical execution information such as:

* Run ID
* Ticker
* Status
* Current node
* Start time
* Completion time
* Duration
* Error message
* Final report

---

## Design Decisions

### Why LangGraph Instead of a Single Agent?

LangGraph provides explicit control over:

* Agent transitions
* Shared state
* Retry paths
* Completion conditions
* Revision loops

The workflow is easier to inspect than a single prompt containing every responsibility.

### Why PostgreSQL Instead of an Independent Vector Database?

PostgreSQL allows the system to store:

* Financial documents
* Metadata
* Embeddings
* Run history
* Operational state

inside one transactional system.

It also supports both vector retrieval and trigram search.

### Why JavaScript Instead of Migrating the Frontend to TypeScript?

The frontend remained in JavaScript to keep the scope focused on system behavior, observability, retrieval, and backend architecture.

A TypeScript migration would be valuable as the interface grows, but it was not required to validate the core product architecture.

### Why Bounded Self-Correction?

Unlimited agent revision increases:

* Latency
* Cost
* Loop risk
* Operational uncertainty

AlphaAgent uses a critique threshold so the quality-control loop remains predictable.

---

## Future Roadmap

### 1. Daily Market Intelligence

Expand AlphaAgent from on-demand company analysis into a daily research briefing system that summarizes:

* Major market movements
* Company-specific news
* Macroeconomic events
* Earnings updates
* Analyst revisions
* SEC filing activity
* Market sentiment
* Risk alerts

### 2. Source-Level Citations

Attach retrieved document references directly to report claims so users can inspect the original evidence.

### 3. Retrieval Evaluation

Create a labeled retrieval dataset and measure:

* Precision at K
* Recall at K
* Ranking quality
* Metadata-filter accuracy

### 4. Full Evaluation Pipeline

Build a repeatable evaluation suite with:

* Fixed financial questions
* Expected evidence categories
* Report scoring rubrics
* Regression tracking
* Model comparison

### 5. Background Data Ingestion

Move expensive ingestion tasks into asynchronous workers and scheduled jobs.

### 6. Authentication and User Workspaces

Add:

* User accounts
* Saved watchlists
* Saved reports
* Personalized alerts
* Private research history

### 7. Production Reliability

Improve:

* Retry policies
* Rate-limit handling
* Connection recovery
* Timeout management
* Structured logging
* Alerting
* Deployment health checks

### 8. Human-in-the-Loop Review

Allow a user to:

* Approve retrieved sources
* Modify analysis scope
* Reject unsupported claims
* Request targeted revisions
* Compare report versions

---

## What This Project Demonstrates

AlphaAgent demonstrates practical experience with:

* Multi-agent orchestration
* State-machine design
* Retrieval-augmented generation
* Hybrid search
* PostgreSQL vector search
* Asynchronous Python
* FastAPI streaming
* React state management
* LLM output validation
* Self-correction workflows
* Observability
* Integration testing
* Evaluation design
* Failure handling
* Production-oriented AI architecture

The project focuses less on adding more AI-generated features and more on making an AI workflow controllable, measurable, and understandable.

---

## Status

AlphaAgent is under active development.

Current capabilities include:

* Multi-agent financial analysis
* SEC and market-data ingestion
* Hybrid retrieval
* Automated report critique
* Real-time SSE streaming
* Persistent run history
* Error tracking
* Duration metrics
* LangSmith tracing
* Unit and integration testing

The next development phase focuses on evaluation quality, source citations, deployment, and daily market intelligence.
