# Evidence-on-Demand Bot

An AI-powered audit evidence gathering system that lets auditors and compliance teams query GitHub, JIRA, and uploaded documents using plain English. The system uses Google Gemini to understand natural language, routes the request to the correct data source, fetches structured evidence, and returns an AI-generated audit summary.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Tech Stack](#tech-stack)
- [Environment Variables](#environment-variables)
- [How to Run](#how-to-run)
- [API Reference](#api-reference)
- [Frontend Components](#frontend-components)
- [Backend Services](#backend-services)
- [AI Pipeline](#ai-pipeline)
- [GitHub Use Cases](#github-use-cases)
- [JIRA Use Cases](#jira-use-cases)
- [Document Use Cases](#document-use-cases)
- [Data Flow — End to End](#data-flow--end-to-end)
- [Query Routing Logic](#query-routing-logic)
- [Known Limitations](#known-limitations)

---

## Project Overview

Evidence-on-Demand Bot removes the manual effort of collecting audit evidence. Instead of an auditor opening GitHub and checking each PR's review tab, searching JIRA for access tickets, and downloading spreadsheets — they type one natural language sentence and receive a formatted table plus an AI-written audit summary.

**Core capabilities:**
- Detect PRs merged without code review approval
- Identify which reviewer approved or rejected a PR
- Flag PRs waiting for review beyond SLA thresholds
- Summarise all merges in a given time window with their approvers
- Search JIRA for access management tickets and issue history
- Parse uploaded CSV/Excel files and generate statistical summaries
- Export any result to CSV or Excel for audit report packaging

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        BROWSER (User)                            │
│                    http://localhost:5173                          │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            │ React SPA
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Vite + React)                     │
│                                                                  │
│   ┌─────────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│   │  QueryInput.jsx  │   │   App.jsx    │   │ResultDisplay.jsx│  │
│   │                 │   │              │   │                 │  │
│   │ • Text input    │──▶│ • State mgmt │──▶│ • PR tables     │  │
│   │ • File upload   │   │ • API calls  │   │ • Doc stats     │  │
│   │ • Suggestions   │   │ • Health chk │   │ • AI summary    │  │
│   └─────────────────┘   └──────────────┘   │ • Export btns   │  │
│                                             └─────────────────┘  │
│   services/api.js — Axios instance, baseURL: '/api'              │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            │ Vite proxy: /api → localhost:5000
                            │ Vite proxy: /uploads → localhost:5000
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (Express.js :5000)                    │
│                         server.js                                │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────┐  │
│  │ POST         │  │ GET/POST     │  │ GET        │  │ GET   │  │
│  │ /api/query   │  │ /api/docs/*  │  │ /api/github│  │/api/  │  │
│  │              │  │              │  │ /*         │  │jira/* │  │
│  └──────┬───────┘  └──────┬───────┘  └─────┬──────┘  └───┬───┘  │
│         │                 │                │             │      │
│         ▼                 ▼                ▼             ▼      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────┐  ┌─────────┐  │
│  │  aiService  │  │documentSvc   │  │ github   │  │  jira   │  │
│  │             │  │              │  │ Service  │  │ Service │  │
│  │ • Gemini AI │  │ • parse CSV  │  │          │  │         │  │
│  │ • analyzeQ  │  │ • parse XLSX │  │ • PRs    │  │• search │  │
│  │ • summary   │  │ • export     │  │ • reviews│  │• issues │  │
│  │ • fallback  │  │ • stats      │  │ • issues │  │• access │  │
│  └──────┬──────┘  └──────────────┘  └────┬─────┘  └────┬────┘  │
│         │                                │             │       │
│  middleware/                             │             │       │
│  errorHandler.js                         │             │       │
│  cors.js                                 │             │       │
└─────────────────────────────────────────┼─────────────┼───────┘
                                          │             │
                    ┌─────────────────────┘             │
                    ▼                                   ▼
        ┌─────────────────────┐             ┌──────────────────┐
        │    GitHub REST API  │             │  Jira Cloud      │
        │  api.github.com/v3  │             │  REST API v3     │
        │                     │             │                  │
        │ Bearer token auth   │             │ Basic auth       │
        │ (GITHUB_TOKEN)      │             │ (email:apitoken) │
        └─────────────────────┘             └──────────────────┘
                    ▲
                    │
        ┌─────────────────────┐
        │   Google Gemini AI  │
        │  gemini-2.5-flash   │
        │                     │
        │ • Query analysis    │
        │ • Summary writing   │
        └─────────────────────┘
```

---

## Directory Structure

```
evidence-bot/
│
├── backend/                          # Express.js API server
│   ├── middleware/
│   │   ├── cors.js                   # CORS configuration
│   │   └── errorHandler.js           # Centralised error handling (multer, JWT, validation)
│   │
│   ├── routes/
│   │   ├── query.js                  # POST /api/query — main NL query endpoint + routing logic
│   │   ├── github.js                 # GET /api/github/* — direct GitHub endpoints
│   │   ├── jira.js                   # GET /api/jira/* — JIRA endpoints
│   │   └── documents.js              # POST/GET /api/documents/* — file upload + analysis
│   │
│   ├── services/
│   │   ├── aiService.js              # Google Gemini integration + fallback keyword analysis
│   │   ├── githubService.js          # GitHub API client — PRs, reviews, issues, audit use cases
│   │   ├── jiraService.js            # JIRA API client — search, issues, access, changelog
│   │   └── documentService.js        # CSV/Excel parser, analyser, CSV/Excel exporter
│   │
│   ├── uploads/                      # Uploaded files + exported files stored here
│   ├── server.js                     # Express app entry point, route mounting
│   └── package.json
│
├── frontend/                         # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── QueryInput.jsx        # Search bar, file upload trigger, suggestions dropdown
│   │   │   ├── ResultDisplay.jsx     # Renders GitHub/document/general results + export buttons
│   │   │   └── LoadingSpinner.jsx    # Loading animation
│   │   │
│   │   ├── services/
│   │   │   └── api.js                # Axios instance + all API client functions
│   │   │
│   │   ├── utils/
│   │   │   └── constants.js          # API URLs, query types, status states, example queries
│   │   │
│   │   ├── App.jsx                   # Root component — state, query handler, health check
│   │   ├── App.css                   # Global styles
│   │   └── main.jsx                  # React DOM entry point
│   │
│   ├── index.html
│   ├── vite.config.js                # Vite config — proxy /api and /uploads to :5000
│   └── package.json
│
├── .env.example                      # Environment variable template
├── package.json                      # Root — concurrently runs both servers
└── README.md
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend framework | React 18 | Component-based UI |
| Frontend build tool | Vite 5 | Dev server, HMR, proxy |
| UI icons | Lucide React | Icon set |
| HTTP client | Axios | API calls from frontend |
| Backend framework | Express.js 4 | REST API server |
| AI model | Google Gemini 2.5 Flash | Query understanding + summary generation |
| AI SDK | @google/generative-ai | Gemini API client |
| GitHub integration | Axios + GitHub REST API v3 | PR, review, issue data |
| JIRA integration | Axios + JIRA Cloud REST API v3 | Ticket, access, changelog data |
| CSV parsing | csv-parser | Stream-based CSV reading |
| Excel parsing | xlsx (SheetJS) | .xlsx / .xls read and write |
| File upload | Multer | Multipart form handling |
| Environment config | dotenv | .env file loading |
| Dev runner | nodemon | Backend auto-restart |
| Concurrent runner | concurrently | Run frontend + backend together |

---

## Environment Variables

Create `backend/.env` with the following (copy from `.env.example`):

```env
# AI
GEMINI_API_KEY=your_google_gemini_api_key

# GitHub
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username          # default owner when not specified in query
GITHUB_REPO=your_default_repository_name  # default repo when not specified in query

# JIRA (optional — JIRA features disabled if not set)
JIRA_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your_jira_api_token

# Server
PORT=5000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
```

**Important:** The file must be at `backend/.env`, not the root. `server.js` calls `dotenv.config()` which reads from the current working directory when the backend starts.

**GitHub token scopes required:** `repo` (read access to PRs, reviews, issues)

**JIRA token:** Generate at `https://id.atlassian.com/manage-profile/security/api-tokens`

---

## How to Run

### Install all dependencies
```bash
npm run install-all
```
This runs `npm install` in root, `backend/`, and `frontend/` in sequence.

### Run in development (frontend + backend together)
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Vite automatically proxies `/api/*` and `/uploads/*` to the backend

### Run backend only
```bash
npm run backend
# or
cd backend && npm run dev    # with nodemon auto-restart
cd backend && npm start      # without auto-restart
```

### Run frontend only
```bash
npm run frontend
# or
cd frontend && npm run dev
```

### Build frontend for production
```bash
npm run build
# Output: frontend/dist/
```

---

## API Reference

### Query Endpoint

#### `POST /api/query`
Main entry point. Accepts a natural language query, routes it to the correct service, and returns evidence + AI summary.

**Request body:**
```json
{
  "query": "Show me all PRs merged without approval"
}
```

**Response:**
```json
{
  "query": "Show me all PRs merged without approval",
  "analysis": {
    "queryType": "github",
    "intent": "Find PRs merged without code review approval",
    "parameters": {
      "prNumber": null,
      "repository": null,
      "user": null,
      "dateRange": null
    },
    "source": "github",
    "action": "fetch_github_data",
    "confidence": 0.95
  },
  "evidence": {
    "count": 2,
    "prs": [
      {
        "pr_id": 14,
        "title": "Add payment integration",
        "merged_by": "dev-user",
        "reviews": [],
        "merged_at": "2026-03-18T10:22:00Z",
        "url": "https://github.com/owner/repo/pull/14"
      }
    ]
  },
  "summary": "2 pull requests were merged without any code review approval...",
  "timestamp": "2026-03-21T09:00:00.000Z"
}
```

#### `GET /api/query/suggestions`
Returns categorised example queries for the UI suggestions dropdown.

---

### GitHub Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/github/repos` | Get the configured default repository |
| `GET` | `/api/github/repos/:owner/:repo/pulls?state=all` | List PRs with full review data |
| `GET` | `/api/github/repos/:owner/:repo/pulls/:prNumber` | Single PR with reviews, stats, diff info |
| `GET` | `/api/github/repos/:owner/:repo/issues?state=all` | List issues |
| `GET` | `/api/github/search/repos?q=keyword` | Search GitHub repositories |
| `GET` | `/api/github/rate-limit` | GitHub API rate limit status |
| `GET` | `/api/github/health` | GitHub integration health check |

---

### JIRA Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jira/health` | Test JIRA connection |
| `GET` | `/api/jira/search?jql=...&maxResults=50` | Run JQL query |
| `GET` | `/api/jira/issue/:key` | Full issue with changelog and transitions |
| `GET` | `/api/jira/projects` | List all JIRA projects |
| `GET` | `/api/jira/access/:username` | Find access-related tickets for a user |
| `GET` | `/api/jira/issue/:key/transitions` | Workflow transitions available |
| `GET` | `/api/jira/issue/:key/comments` | All comments on an issue |
| `GET` | `/api/jira/issues?project=X&status=Y&assignee=Z` | Filtered issue list |

---

### Document Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload CSV/Excel file (multipart, field: `document`) |
| `GET` | `/api/documents/analyze/:filename` | Analyse an already-uploaded file |
| `GET` | `/api/documents/files` | List all uploaded files |
| `POST` | `/api/documents/export/csv` | Export data array to CSV file |
| `POST` | `/api/documents/export/excel` | Export data array to Excel file |
| `DELETE` | `/api/documents/files/:filename` | Delete an uploaded file |
| `GET` | `/api/documents/download/:filename` | Download a file |
| `GET` | `/api/documents/health` | Document service health check |

**Upload constraints:** `.csv`, `.xlsx`, `.xls` only. Maximum 50 MB.

---

### Health Endpoint

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend liveness check — returns status, timestamp, version |

---

## Frontend Components

### `App.jsx`
Root component. Owns all application state.

```
State:
  result          — last API response object
  status          — 'idle' | 'loading' | 'success' | 'error'
  error           — error message string
  systemHealth    — health check response from all services
  uploadStatus    — upload-specific loading state

Functions:
  checkSystemHealth()   — calls getSystemHealth() on mount
  handleQuery(text)     — calls processQuery(), sets result/status/error
  handleFileUpload(file)— calls documentAPI.uploadFile(), then auto-runs analyze query
  getHealthStatus(svc)  — reads systemHealth[service].status
  getHealthIcon(status) — returns Lucide icon component based on status string
```

### `QueryInput.jsx`
Search bar with three action buttons:
- **Upload** — opens hidden `<input type="file" accept=".csv">` via ref
- **Lightbulb** — toggles the suggestions dropdown
- **Send** — submits the query

The suggestions dropdown reads from `EXAMPLE_QUERIES` in `constants.js`. Clicking a suggestion pre-fills the input without submitting.

### `ResultDisplay.jsx`
Renders the `result` object returned from `POST /api/query`. Three rendering paths:

| `result.analysis.queryType` | Renderer | Output |
|---|---|---|
| `github` | `renderGitHubResult(evidence)` | PR tables, single PR card, repository list |
| `document` | `renderDocumentResult(evidence)` | Stats cards, column list, data preview table |
| `general` | Inline render | Combines GitHub + document sections |

The GitHub renderer detects evidence shape at runtime:
- `evidence.count + evidence.prs` → "PRs Merged Without Approval" table
- `Array + evidence[0].pr_id` → generic PR analysis table (use cases 2, 3, 4)
- `evidence.number` → single PR detail card
- `Array + evidence[0].number` → multi-PR list with review badges
- `Array + evidence[0].full_name` → repository list

Export buttons appear when `evidence.data` or `Array.isArray(evidence)` is true.

### `LoadingSpinner.jsx`
Accepts `message` and `size` props. Used during query processing and file upload.

---

## Backend Services

### `aiService.js`

Singleton instance of `AIService`. Initialized with Gemini on startup. Falls back to keyword analysis if `GEMINI_API_KEY` is missing.

**`analyzeQuery(userQuery)`**

Sends the following structured prompt to `gemini-2.5-flash`:
```
Determine:
1. queryType: github | jira | document | general
2. intent: brief description
3. parameters: { prNumber, issueKey, repository, fileName, user, dateRange }
4. source: which system to query
5. action: specific action to perform
6. confidence: 0.0–1.0
```
Parses the JSON block from the response using `/\{[\s\S]*\}/` regex. Falls back to `fallbackAnalysis()` on parse failure.

**Fallback keyword detection:**

| Keywords present | queryType |
|---|---|
| `pr`, `pull request`, `github`, `merge` | `github` |
| `jira`, `ticket`, `issue`, `access` | `jira` |
| `csv`, `excel`, `file`, `document` | `document` |
| (none of above) | `general` |

**`generateSummary(data, queryIntent)`**

Sends evidence data as JSON + the intent to Gemini. Gemini writes a professional audit summary including findings, key evidence points, compliance concerns, and recommendations.

---

### `githubService.js`

Singleton instance of `GitHubService`. Reads `GITHUB_TOKEN` on construction. Uses `Bearer` token auth for all requests to `https://api.github.com`.

All use-case methods fall back to `process.env.GITHUB_OWNER` / `process.env.GITHUB_REPO` when `owner`/`repo` are not passed.

**`getPullRequests(owner, repo, state, limit)`**

Fetches up to `limit` (default 50) PRs sorted by `updated desc`. For each PR, makes a second request to `/pulls/:number/reviews` and attaches the review array. Returns the full PR object including:
- `approvals` — count of `APPROVED` reviews
- `request_changes` — count of `CHANGES_REQUESTED` reviews
- `reviews[]` — full review objects with `user`, `state`, `submitted_at`, `body`

This means every use-case method is built on complete review data.

**Audit use case methods:**

| Method | Filter logic |
|---|---|
| `getPRsMergedWithoutApproval()` | `state=closed` → filter `pr.merged && pr.approvals === 0` |
| `getPRsReviewedByUser(reviewer)` | `state=all` → filter `pr.reviews.some(r => r.user === reviewer)` → extract latest review per user |
| `getPRsWaitingForReview()` | `state=open` → filter `created_at < 24h ago && reviews.length === 0` → calculate waiting hours |
| `getPRsMergedLastWeek()` | `state=closed` → filter `merged_at >= 7 days ago` → extract approver usernames |

---

### `jiraService.js`

Singleton instance of `JiraService`. Uses Basic auth (`email:apiToken` base64-encoded). Marks itself as `this.configured = false` if credentials are missing — all methods throw a descriptive error rather than crashing.

Uses JIRA REST API v3 (`/rest/api/3/`).

**`getIssue(issueKey)`** expands `changelog` and `transitions` so the full history of status changes (who changed what field, from what value, to what value, when) is returned. This is the primary evidence for access management audit trails.

**`searchAccessIssues(username)`** builds the JQL:
```
text ~ "username" OR text ~ "access" AND text ~ "username" ORDER BY updated DESC
```

**`generateJQL(params)`** builds a JQL string from structured params (`project`, `status`, `assignee`, `user`, `text`), joining conditions with `AND`.

---

### `documentService.js`

Singleton instance of `DocumentService`. Creates `backend/uploads/` on startup if it does not exist.

**`analyzeDocument(filename)`** dispatches to `parseCSV` or `parseExcel` based on file extension, then calls `generateAnalysis()`.

**`generateAnalysis(parsedData)`** produces:
- `statistics` — total rows, total columns
- `columnAnalysis` — per column: non-empty count, empty count, detected data type, unique value count, min/max/average (numeric columns only)
- `insights[]` — auto-generated text: detected asset-related fields, detected user-related fields
- `summary` — column headers list

**`detectDataType(values)`** samples up to 10 values. If all parse as `parseFloat` → `number`. If all parse as `Date.parse` → `date`. Otherwise → `text`.

---

## AI Pipeline

```
User types: "Show me PRs reviewed by Alice and her decision"
                          │
                          ▼
              aiService.analyzeQuery()
                          │
              Sends structured prompt to
              Gemini gemini-2.5-flash
                          │
              Receives JSON:
              {
                queryType: "github",
                intent: "PRs reviewed by Alice with her decision",
                parameters: { user: "Alice" },
                confidence: 0.95
              }
                          │
                          ▼
              query.js routes to handleGitHubQuery()
                          │
              Matches: query.includes('reviewed by') && params.user
                          │
              githubService.getPRsReviewedByUser("Alice")
                          │
              Returns array of PRs with reviewer decisions
                          │
                          ▼
              aiService.generateSummary(evidence, intent)
                          │
              Sends evidence JSON + intent to Gemini
                          │
              Gemini writes:
              "Alice reviewed 3 pull requests in the repository.
               She approved PR #12 and PR #15, and requested
               changes on PR #9. No compliance concerns found..."
                          │
                          ▼
              Response sent to frontend
              ResultDisplay renders PR table + AI summary
```

**Fallback behaviour:** If `GEMINI_API_KEY` is not set or the API call fails, `fallbackAnalysis()` uses regex keyword matching to determine query type and extract parameters. `fallbackSummary()` generates a basic count-based text response. The system remains functional without AI, just less accurate on ambiguous queries.

---

## GitHub Use Cases

### Use Case 1 — PRs Merged Without Approval

**Trigger phrases:** `"merged without approval"`, `"no approval"`

**Internal call:** `githubService.getPRsMergedWithoutApproval()`

**Output shape:**
```json
{
  "count": 2,
  "prs": [
    {
      "pr_id": 14,
      "title": "Add feature X",
      "merged_by": "dev-username",
      "reviews": [],
      "merged_at": "2026-03-18T10:22:00Z",
      "url": "https://github.com/owner/repo/pull/14"
    }
  ]
}
```

---

### Use Case 2 — PRs Reviewed by a Specific User

**Trigger phrases:** `"reviewed by <name>"`

**Internal call:** `githubService.getPRsReviewedByUser("Alice")`

**Output shape:**
```json
[
  {
    "pr_id": 10,
    "title": "Refactor auth module",
    "reviewer": "Alice",
    "decision": "APPROVED",
    "date": "2026-03-15T14:00:00Z",
    "url": "https://github.com/owner/repo/pull/10"
  },
  {
    "pr_id": 12,
    "title": "Update config parser",
    "reviewer": "Alice",
    "decision": "CHANGES_REQUESTED",
    "date": "2026-03-16T09:30:00Z",
    "url": "https://github.com/owner/repo/pull/12"
  }
]
```

---

### Use Case 3 — PRs Waiting for Review > 24 Hours

**Trigger phrases:** `"waiting for review"`, `"24 hours"`

**Internal call:** `githubService.getPRsWaitingForReview()`

**Output shape:**
```json
[
  {
    "pr_id": 18,
    "title": "Fix null pointer in payment service",
    "created_at": "2026-03-19T08:00:00Z",
    "review_requested": "No",
    "waiting_time": "49 hours",
    "url": "https://github.com/owner/repo/pull/18"
  }
]
```

---

### Use Case 4 — PRs Merged in Last 7 Days with Approvers

**Trigger phrases:** `"last 7 days"`, `"last week"`

**Internal call:** `githubService.getPRsMergedLastWeek()`

**Output shape:**
```json
[
  {
    "pr_id": 15,
    "title": "Deploy v2.1 to production",
    "merged_at": "2026-03-20T11:00:00Z",
    "approvers": ["bob", "carol"],
    "url": "https://github.com/owner/repo/pull/15"
  },
  {
    "pr_id": 16,
    "title": "Hotfix session token bug",
    "merged_at": "2026-03-21T08:00:00Z",
    "approvers": ["No approvers"],
    "url": "https://github.com/owner/repo/pull/16"
  }
]
```

---

## JIRA Use Cases

### Access Management Query
**Example:** `"Show access given to jane for Prod DB"`

**Internal call:** `jiraService.searchAccessIssues("jane")`

**JQL generated:**
```
text ~ "jane" OR text ~ "access" AND text ~ "jane" ORDER BY updated DESC
```

### Specific Issue Lookup
**Example:** `"Get issue ABC-123 details"`

**Internal call:** `jiraService.getIssue("ABC-123")`

Returns full issue with `changelog` expanded — every field change, who made it, and when. Useful for proving an access request went through the correct approval workflow.

### Custom JQL Search
**Example:** `"List all tickets in TODO status for project OPS"`

**Internal call:** `jiraService.searchIssues("project = 'OPS' AND status = 'TODO' ORDER BY updated DESC")`

---

## Document Use Cases

### Upload and Analyse
**File types accepted:** `.csv`, `.xlsx`, `.xls`
**Max size:** 50 MB
**Storage:** `backend/uploads/` with timestamp prefix (e.g. `1742543228447-assets.csv`)

After upload, the file is immediately analysed. The response includes:
- Row count and column count
- Per-column data type, unique value count, min/max/avg (numeric)
- Auto-detected field patterns (asset fields, user fields)
- First 5 rows data preview

### Export
Any query result with array data can be exported via the UI buttons or directly via:
- `POST /api/documents/export/csv` — body: `{ data: [...], filename: "name" }`
- `POST /api/documents/export/excel` — same body

Exported files are saved to `backend/uploads/` as `export_<filename>.csv` or `.xlsx` and served via the `/uploads/` static route.

---

## Data Flow — End to End

```
1. User types query in QueryInput.jsx
   └── onSubmit(query) called

2. App.jsx handleQuery(query)
   └── setStatus('loading')
   └── calls processQuery(query) from services/api.js

3. services/api.js processQuery()
   └── POST /api/query  { query: "..." }
   └── Vite proxy forwards to http://localhost:5000/api/query

4. backend routes/query.js POST /
   └── validates query string is present and is a string
   └── calls aiService.analyzeQuery(query)

5. aiService.analyzeQuery()
   └── sends prompt to Gemini gemini-2.5-flash
   └── parses JSON response with regex
   └── returns { queryType, intent, parameters, confidence }
   [OR falls back to keyword matching if Gemini unavailable]

6. routes/query.js switch(analysis.queryType)
   ├── 'github'   → handleGitHubQuery(analysis)
   ├── 'jira'     → handleJiraQuery(analysis)
   ├── 'document' → handleDocumentQuery(analysis)
   └── 'general'  → handleGeneralQuery(analysis)

7. Service function called (e.g. githubService.getPRsMergedWithoutApproval())
   └── makes HTTP request(s) to external API with auth headers
   └── processes and shapes the response data
   └── returns structured evidence object

8. routes/query.js
   └── calls aiService.generateSummary(evidence, intent)
   └── Gemini writes audit summary paragraph

9. Response sent to frontend:
   { query, analysis, evidence, summary, timestamp }

10. App.jsx
    └── setResult(response)
    └── setStatus('success')

11. ResultDisplay.jsx renders:
    └── reads result.analysis.queryType to choose renderer
    └── detects evidence shape to pick the correct table format
    └── renders AI summary paragraph
    └── shows export buttons if data is exportable
```

---

## Query Routing Logic

The `handleGitHubQuery` function in `routes/query.js` checks the AI-parsed `intent` string against keywords in this priority order:

```
1. intent includes 'merged without approval' OR 'no approval'
   → getPRsMergedWithoutApproval()

2. intent includes 'reviewed by' AND params.user is set
   → getPRsReviewedByUser(params.user)

3. intent includes 'waiting for review' OR '24 hours'
   → getPRsWaitingForReview()

4. intent includes 'last 7 days' OR 'last week'
   → getPRsMergedLastWeek()

5. params.prNumber AND params.repository both set
   → getPullRequest(owner, repo, prNumber)   [single PR detail]

6. params.prNumber set, no repository
   → getPullRequest(GITHUB_OWNER, GITHUB_REPO, prNumber)

7. intent includes 'pull request' OR ('last' AND 'pull')
   → getPullRequests(owner, repo)

8. default
   → getRepositories(params.user)
```

---

## Known Limitations

| Area | Limitation |
|---|---|
| `merged_by` field | Shows PR author, not the user who clicked Merge. GitHub's API returns a separate `merged_by` field that `getPullRequests()` does not currently capture. |
| Single repository | All GitHub use cases operate on one repo defined by `GITHUB_OWNER`/`GITHUB_REPO` env vars. Multi-repo support requires UI changes. |
| Date range filtering | Only "last 7 days" is supported as a hardcoded window. The AI extracts `dateRange` from queries but it is never forwarded to the GitHub API `since` parameter. |
| JIRA UI rendering | `ResultDisplay.jsx` has no JIRA renderer. JIRA query results are fetched correctly by the backend but not displayed in the UI. |
| No query history | The system is fully stateless — no database. Evidence gathered is not stored between sessions. |
| No authentication | All API endpoints are open. Any user with network access to port 5000 can query all connected data sources. |
| File accumulation | Uploaded and exported files accumulate in `backend/uploads/` with no automatic cleanup or retention policy. |
| Document query scope | Document queries always analyse the most recently modified uploaded file. There is no way to select a specific file from the UI. |
