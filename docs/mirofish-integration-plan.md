# MiroFish Integration Plan for NEXUS RCM

**Author:** NEXUS RCM Architecture Team
**Date:** 2026-03-27
**Status:** Draft

---

## 1. CONSTITUTION -- MiroFish's Role in NEXUS RCM

### Why MiroFish Exists in This System

MiroFish is a **multi-agent simulation engine** built on Zep knowledge graphs and OASIS social simulation. Its original purpose was social media opinion simulation (Twitter/Reddit). We are repurposing its core architecture -- graph-based entity modeling, LLM-powered agent profiles, round-based simulation execution, and report generation -- for **Revenue Cycle Management scenario planning**.

### What MiroFish is NOT For

| Capability | Why Not MiroFish | What We Use Instead |
|---|---|---|
| Basic analytics (denial counts, AR aging) | Overkill. SQL queries answer these in milliseconds. | `diagnostic_service.py` -- deterministic SQL analytics |
| Time-series forecasting (next month's denial rate) | Prophet/statistical models are faster and cheaper. | Prophet-based forecasting in analytics module |
| Root cause classification (why was this claim denied?) | Our 7-step graph traversal engine is purpose-built for this. | `root_cause_service.py` -- graph traversal over claim/payer/provider nodes |
| Real-time claim processing decisions | Too slow (minutes per simulation), too expensive (LLM calls per agent per round). | `prevention_service.py` -- rule-based pre-submission scanning |

### What MiroFish IS For

1. **"What-If" Simulation**: "If we auto-appeal all CODING_MISMATCH denials, what happens to revenue over 90 days?" -- Run a multi-agent simulation where payer agents react to our changed behavior, modeling cascading effects (e.g., payers tightening scrutiny after increased appeals).

2. **Payer Behavior Modeling**: Create digital twin agents for each payer (UnitedHealthcare, Medicare, Humana, etc.) that simulate how they adjudicate claims, respond to appeals, change policies, and adjust payment timelines. These agents carry memory via Zep graphs, so they learn from historical behavior.

3. **Policy Change Impact Analysis**: "If Humana changes their auth policy to cover 40% more procedure codes, how many claims get denied and what's the revenue impact?" -- Simulate the policy change propagating through our claim volume over 60-90 days.

4. **Automation Rule Testing (Simulate Before Activate)**: Before enabling a new automation rule (e.g., AUTO-007: Appeal Auto-Generation), run a simulation to project its impact on revenue, denial rates, and payer relationships. Only activate rules that pass simulation thresholds.

5. **Revenue Scenario Planning**: Monte Carlo-style projections where multiple variables change simultaneously (payer mix shifts, denial trends increase, new automation rules activate) to produce confidence-bounded revenue forecasts.

---

## 2. WHAT MIROFISH ACTUALLY PROVIDES (Code Analysis)

### 2.1 Ontology Generator (`ontology_generator.py`)

**What it does:** Uses an LLM to analyze input text and generate a knowledge graph schema (entity types + relationship types). Outputs a JSON ontology with up to 10 entity types and 10 edge types, including attributes and source/target mappings.

**Key function:**
```python
OntologyGenerator.generate(document_texts, simulation_requirement, additional_context) -> Dict
```

**Inputs:** List of document texts, a simulation requirement string, optional context.
**Outputs:** `{ entity_types: [...], edge_types: [...], analysis_summary: "..." }`

**RCM mapping:** We need a custom RCM ontology (not LLM-generated) that maps our DB schema. Entity types: `Payer`, `Provider`, `DenialCategory`, `AutomationRule`, `ClaimCohort`, `PolicyRule`. Edge types: `DENIES`, `APPEALS_TO`, `PREVENTS`, `ADJUDICATES`, `TRIGGERS`.

### 2.2 Graph Builder (`graph_builder.py`)

**What it does:** Builds a Zep Cloud knowledge graph from text. Chunks text, sends batches to Zep API, waits for processing, and returns graph metadata (node count, edge count, entity types).

**Key functions:**
- `GraphBuilderService.build_graph_async(text, ontology, graph_name, chunk_size, batch_size) -> task_id` -- Async graph construction in background thread
- `GraphBuilderService.create_graph(name) -> graph_id` -- Creates a named Zep graph
- `GraphBuilderService.set_ontology(graph_id, ontology)` -- Dynamically creates Pydantic entity/edge models from ontology JSON and registers them with Zep
- `GraphBuilderService.get_graph_data(graph_id) -> { nodes, edges, node_count, edge_count }` -- Full graph retrieval with attributes, timestamps, and episode links

**RCM mapping:** Instead of ingesting raw text, we will serialize our DB state (denials, claims, payer metrics, automation rules) into structured text for graph ingestion. The graph becomes a living snapshot of the RCM state that agents can reason over.

### 2.3 Simulation Manager (`simulation_manager.py`)

**What it does:** Orchestrates the full simulation lifecycle: create -> prepare -> ready -> run. Preparation involves reading Zep graph entities, generating OASIS agent profiles (with LLM-enhanced personas), and generating simulation config parameters via LLM.

**Key functions:**
- `SimulationManager.create_simulation(project_id, graph_id, enable_twitter, enable_reddit) -> SimulationState`
- `SimulationManager.prepare_simulation(simulation_id, simulation_requirement, document_text, ...) -> SimulationState` -- 3-stage pipeline: (1) read/filter entities from Zep, (2) generate agent profiles via `OasisProfileGenerator`, (3) LLM-generate simulation config via `SimulationConfigGenerator`
- `SimulationManager.get_profiles(simulation_id, platform)` -- Returns generated agent profiles
- `SimulationManager.get_simulation_config(simulation_id)` -- Returns the generated config
- `SimulationManager.get_run_instructions(simulation_id)` -- Returns shell commands to execute the simulation

**RCM mapping:** We adapt this to create payer agent simulations. Instead of Twitter/Reddit personas, we generate payer adjudication agents with denial rate behaviors, payment timing patterns, and appeal response logic.

### 2.4 OASIS Profile Generator (`oasis_profile_generator.py`)

**What it does:** Converts Zep graph entities into OASIS agent profiles with detailed personas. Uses LLM to enrich basic entity data into full personality profiles (bio, persona, MBTI, interests). Supports parallel generation and real-time saving.

**Key class:** `OasisAgentProfile` -- Contains user_id, name, bio, persona, karma/follower counts, age, gender, MBTI, profession, interested_topics, and source entity metadata.

**Key methods:**
- `generate_profiles_from_entities(entities, use_llm, graph_id, parallel_count)` -- Batch generation with progress tracking
- `save_profiles(profiles, file_path, platform)` -- Saves as CSV (Twitter) or JSON (Reddit)

**RCM mapping:** We repurpose this to generate payer agent profiles. A "Humana" agent profile would include: denial_rate=11.4%, top denial categories, avg payment days=35, appeal response pattern, auto-adjudication rate=58%. The LLM enhances this with behavioral nuance.

### 2.5 Simulation Runner (`simulation_runner.py`)

**What it does:** Executes OASIS simulations as background subprocesses. Manages lifecycle (start/pause/stop), tracks per-round agent actions, records round summaries, updates Zep graph memory after simulation via `ZepGraphMemoryManager`. Communicates with OASIS subprocess via IPC.

**Key classes:**
- `SimulationRunner` -- Process management, IPC communication
- `AgentAction` -- Records: round_num, platform, agent_id, agent_name, action_type, action_args, result, success
- `RoundSummary` -- Per-round: simulated_hour, action counts
- `RunnerStatus` -- States: IDLE, STARTING, RUNNING, PAUSED, STOPPING, STOPPED, COMPLETED, FAILED

**RCM mapping:** We replace OASIS social actions (CREATE_POST, LIKE_POST, REPOST) with RCM actions: `ADJUDICATE_CLAIM`, `DENY_CLAIM`, `APPROVE_CLAIM`, `REQUEST_AUTH`, `PROCESS_APPEAL`, `ADJUST_PAYMENT`, `CHANGE_POLICY`. Each round simulates one processing cycle.

### 2.6 Report Agent (`report_agent.py`)

**What it does:** ReAct-pattern report generator using LLM + Zep tools. Plans a report outline, then generates each section through multi-round think-and-reflect loops. Has access to Zep search tools (SearchResult, InsightForgeResult, PanoramaResult, InterviewResult) for data retrieval during generation. Logs every step to `agent_log.jsonl`.

**RCM mapping:** After a simulation completes, the Report Agent generates a simulation impact report: projected revenue change, denial rate impact, payer-by-payer breakdown, risk assessment, and actionable recommendations.

### 2.7 MiroFish API Endpoints (Flask, port 5001)

| Blueprint | Endpoint | Method | Purpose |
|---|---|---|---|
| `graph_bp` | `/project/<id>` | GET | Get project details |
| `graph_bp` | `/project/list` | GET | List all projects |
| `graph_bp` | `/ontology/generate` | POST | Generate ontology from text |
| `graph_bp` | `/graph/build` | POST | Build knowledge graph |
| `graph_bp` | `/graph/<id>/data` | GET | Get graph nodes/edges |
| `simulation_bp` | `/entities/<graph_id>` | GET | Get filtered graph entities |
| `simulation_bp` | `/simulation/create` | POST | Create simulation |
| `simulation_bp` | `/simulation/prepare` | POST | Prepare simulation (profiles + config) |
| `simulation_bp` | `/simulation/run` | POST | Start simulation execution |
| `simulation_bp` | `/simulation/<id>/status` | GET | Get simulation status |
| `report_bp` | `/generate` | POST | Generate simulation report |
| `report_bp` | `/status` | GET | Check report generation progress |

### 2.8 Configuration (`config.py` + `.env`)

MiroFish requires:
- **LLM_API_KEY / LLM_BASE_URL / LLM_MODEL_NAME**: Currently configured for Ollama (`http://localhost:11434/v1`, model `llama3`). Used by ontology generator, profile generator, simulation config generator, and report agent.
- **ZEP_API_KEY**: Zep Cloud API key for knowledge graph CRUD. Currently set to placeholder.
- **OASIS config**: Max rounds (default 10), Twitter actions (CREATE_POST, LIKE_POST, REPOST, FOLLOW, DO_NOTHING, QUOTE_POST), Reddit actions (13 action types including SEARCH_POSTS, TREND, MUTE).
- **Report Agent config**: Max tool calls (5), max reflection rounds (2), temperature (0.5).

---

## 3. SCOPE -- What's In vs. Out

### IN SCOPE

| Capability | MiroFish Component | RCM Application |
|---|---|---|
| RCM Knowledge Graph | `graph_builder.py` + custom ontology | Build a knowledge graph from DB data: payers, denial patterns, automation rules, claim cohorts |
| Payer Agent Simulation | `simulation_manager.py` + `simulation_runner.py` | Digital twin payer agents that simulate claim adjudication behavior over time |
| What-If Scenario Execution | `simulation_runner.py` + custom RCM actions | Run pre-built scenarios (SIM-001 through SIM-005) and custom user scenarios |
| Simulation Reporting | `report_agent.py` | Generate impact analysis reports from simulation results |
| Simulation Dashboard API | `mirofish_bridge.py` + `simulation.py` (NEXUS side) | REST endpoints for frontend to trigger, monitor, and consume simulations |

### OUT OF SCOPE (Not Relevant to RCM)

| MiroFish Feature | Why Out of Scope |
|---|---|
| Twitter/Reddit social simulation | MiroFish's original use case. We do not simulate social media. All OASIS platform-specific code (Twitter actions, Reddit karma, follower counts) is unused. |
| Fiction narrative prediction | MiroFish supports opinion simulation for fictional scenarios. Not applicable to financial claim processing. |
| Real-time simulation during claim processing | A single simulation takes minutes (multiple LLM calls per agent per round). Cannot be used in the claim submission hot path. Simulations are batch/async only. |
| Ontology auto-generation from raw text | Our RCM ontology is fixed and domain-specific. We hardcode the ontology rather than asking LLM to discover entity types. |
| Agent interview/chat post-simulation | Interesting capability (chat with a payer agent to understand its denial reasoning) but deferred to a future sprint. |

---

## 4. INTEGRATION ARCHITECTURE

```
+-------------------------------------------------------------------+
|                      NEXUS RCM Frontend                           |
|  Simulation Dashboard  |  Automation Dashboard  |  Analytics      |
+----------+-------------+-----------+------------+-------+---------+
           |                         |                    |
           v                         v                    v
+-------------------------------------------------------------------+
|                     NEXUS RCM Backend (FastAPI)                   |
|                                                                   |
|  simulation.py (API)     automation_engine.py    diagnostic_svc   |
|       |                        |                       |          |
|       v                        v                       |          |
|  mirofish_bridge.py ───────────────────────────────────┘          |
|       |                                                           |
|  Functions:                                                       |
|    export_rcm_state(db)      ── Queries DB, builds seed data      |
|    _build_payer_agents(db)   ── Builds payer profiles from DB     |
|    run_what_if_analysis(db)  ── Orchestrates full simulation      |
|    create_simulation(scenario)─ Sends to MiroFish                 |
|    get_simulation_results()  ── Fetches results                   |
+----------+--------------------------------------------------------+
           |
           | HTTP (localhost:5001)
           v
+-------------------------------------------------------------------+
|                   MiroFish Backend (Flask, port 5001)             |
|                                                                   |
|  API Layer:                                                       |
|    graph.py    ── /ontology/generate, /graph/build, /graph/data   |
|    simulation.py─ /simulation/create, /prepare, /run, /status     |
|    report.py   ── /report/generate, /report/status                |
|                                                                   |
|  Service Layer:                                                   |
|    ontology_generator ── RCM ontology (hardcoded, not LLM)        |
|    graph_builder      ── Builds Zep knowledge graph               |
|    simulation_manager ── Lifecycle: create -> prepare -> run      |
|    oasis_profile_gen  ── Generates payer agent profiles            |
|    simulation_runner  ── Executes rounds, records actions          |
|    report_agent       ── ReAct report generation                  |
|                                                                   |
|  External Dependencies:                                           |
|    Zep Cloud API      ── Knowledge graph storage + retrieval      |
|    Ollama (local LLM) ── Profile enrichment, config gen, reports  |
+-------------------------------------------------------------------+
```

### Data Flow: "What-If" Simulation

```
1. User clicks "Simulate" on Simulation Dashboard
       |
2. Frontend POST /api/v1/simulation/run { scenario_id: "SIM-001" }
       |
3. NEXUS simulation.py loads scenario from simulation_scenarios.json
       |
4. mirofish_bridge.export_rcm_state(db) queries:
   - Denial distribution by category (denials table)
   - Claim status distribution (claims table)
   - Payer mix with volumes (payer_master + claims)
       |
5. mirofish_bridge._build_payer_agents(db) queries:
   - Per-payer: denial_rate, adtp_days, denial_count, total_denied
   - Builds agent profiles with behavioral parameters
       |
6. Bridge POST to MiroFish /api/simulation/create
   Payload: { type, seed_data, parameters, agents }
       |
7. MiroFish simulation_manager.create_simulation()
   -> simulation_manager.prepare_simulation()
      -> Reads entities from Zep graph
      -> Generates OASIS agent profiles (payer personas)
      -> LLM generates simulation config (rounds, activity levels)
       |
8. MiroFish simulation_runner starts execution
   -> Per round: each payer agent decides actions
      (ADJUDICATE_CLAIM, DENY_CLAIM, APPROVE_CLAIM, etc.)
   -> Actions recorded as AgentAction objects
   -> Round summaries aggregated
       |
9. Simulation completes -> results stored
       |
10. report_agent generates impact analysis
       |
11. NEXUS GET /api/simulation/{id}/results
    -> Results displayed on Simulation Dashboard
    -> If positive impact: recommend rule activation
```

### Data Flow: "Simulate Before Activate"

```
1. Automation Engine has a new rule candidate (e.g., AUTO-007)
       |
2. Before enabling, system triggers simulation:
   POST /api/v1/simulation/run {
     type: "automation_test",
     parameters: {
       rule_id: "AUTO-007",
       rule_trigger: "denial AND appeal_eligible AND ...",
       rule_action: "Generate appeal letter with supporting docs",
       test_period_days: 90
     }
   }
       |
3. Simulation runs with current payer agents
   -> Models how payers react to increased appeal volume
   -> Tracks projected revenue recovery vs. appeal costs
       |
4. Results returned with verdict:
   {
     projected_roi: 31.8,
     confidence: 85,
     recommendation: "ACTIVATE"
   }
       |
5. If recommendation = ACTIVATE and confidence >= threshold:
   -> Rule moves from "pending_simulation" to "ready_to_activate"
   -> Dashboard shows green "Simulation Passed" badge
```

---

## 5. TASKS (Prioritized, Actionable)

### Task 1: Get MiroFish Running Locally

**Goal:** MiroFish backend starts on port 5001 and responds to health check.

**Steps:**
1. Install MiroFish Python dependencies: `cd mirofish/backend && pip install -r requirements.txt`
2. Install and start Ollama locally: `ollama pull llama3`
3. Configure `mirofish/.env` with a valid Zep Cloud API key (sign up at zep.ai for free tier)
4. Start MiroFish: `cd mirofish/backend && python run.py`
5. Verify: `curl http://localhost:5001/api/graph/project/list`

**Blockers:** Zep Cloud API key required. Ollama must be running with llama3 model pulled.

**Acceptance:** `curl localhost:5001/api/graph/project/list` returns `{ success: true, data: [] }`

---

### Task 2: Create RCM Ontology (Hardcoded, Not LLM-Generated)

**Goal:** Define a fixed RCM knowledge graph schema that maps our database entities.

**Deliverable:** `/mirofish/rcm_seeds/rcm_ontology.json`

**Entity Types (8 domain-specific + 2 fallbacks):**

| Entity Type | Maps To | Key Attributes |
|---|---|---|
| `Payer` | `payer_master` table | payer_name, payer_type, denial_rate, adtp_days |
| `Provider` | `providers` table | provider_name, specialty, npi |
| `DenialCategory` | denial_category enum | category_name, carc_code, preventable, avg_resolution_days |
| `AutomationRule` | `automation_actions` table | rule_name, trigger_condition, action_description, success_rate |
| `ClaimCohort` | Aggregated from `claims` | cohort_label, claim_count, total_amount, date_range |
| `PolicyRule` | Payer-specific rules | policy_name, effective_date, affected_cpt_codes |
| `RootCause` | `root_cause_analyses` table | cause_category, evidence_count, confidence |
| `ServiceLine` | Derived from `claim_lines` | cpt_code, service_description, avg_allowed_amount |
| `Person` | Fallback | full_name, role |
| `Organization` | Fallback | org_name, org_type |

**Edge Types:**

| Edge Type | Source -> Target | Description |
|---|---|---|
| `DENIES` | Payer -> ClaimCohort | Payer denies claims in this cohort |
| `APPEALS_TO` | ClaimCohort -> Payer | Claims appealed to this payer |
| `PREVENTS` | AutomationRule -> DenialCategory | Rule prevents this denial type |
| `CAUSED_BY` | DenialCategory -> RootCause | Denial traced to root cause |
| `ADJUDICATES` | Payer -> ServiceLine | Payer processes this service type |
| `TRIGGERS` | DenialCategory -> AutomationRule | Denial triggers this rule |
| `CONTRACTED_WITH` | Payer -> Provider | Payer has contract with provider |
| `ENFORCES` | Payer -> PolicyRule | Payer enforces this policy |

---

### Task 3: Build Payer Agent Profiles from Live DB Data

**Goal:** Replace static `payer_agents.json` with dynamic agent generation from `payer_master` + `denials` + `claims` tables.

**Steps:**
1. Extend `mirofish_bridge._build_payer_agents(db)` to include:
   - Top 3 denial categories per payer (from `denials` joined to `claims`)
   - Appeal success rate per payer (from `denials` where appeal_status = 'WON')
   - Payment timing variance (from `era_payments`)
   - Auto-adjudication rate estimate (claims paid within 3 days)
   - Contract compliance metrics (underpayment detection from `era_payments` vs expected)
2. Generate behavioral personality strings from enriched data
3. Output format matches `OasisAgentProfile` structure but with RCM-specific fields

**Acceptance:** `GET /api/v1/simulation/payer-agents` returns agents built from live DB data with behavioral profiles, not static seed JSON.

---

### Task 4: Create Simulation Runner Wrapper for RCM Scenarios

**Goal:** Adapt MiroFish's simulation infrastructure to accept our scenario format and execute with RCM-specific agent actions.

**Steps:**
1. Create `RCMSimulationAdapter` class in `mirofish_bridge.py` that:
   - Translates NEXUS scenario format to MiroFish's `create_simulation` + `prepare_simulation` inputs
   - Maps RCM seed data (denial distribution, claim status, payer mix) to structured text for graph ingestion
   - Configures simulation rounds to represent time periods (1 round = 1 week for 90-day scenario = 13 rounds)
2. Define RCM-specific agent actions to replace social media actions:
   - `ADJUDICATE_CLAIM` -- approve or deny with reason code
   - `PROCESS_APPEAL` -- approve or deny appeal
   - `CHANGE_POLICY` -- modify auth requirements or fee schedules
   - `ADJUST_PAYMENT` -- partial payment, underpayment
   - `DO_NOTHING` -- no action this round
3. Create result parser that converts simulation output (AgentActions, RoundSummaries) into RCM metrics:
   - Total claims processed, approved, denied per payer
   - Revenue recovered vs. revenue at risk
   - Per-payer behavioral changes across rounds
   - Final recommendation: `ACTIVATE` | `DO_NOT_ACTIVATE` | `NEEDS_REVIEW`

**Acceptance:** `POST /api/v1/simulation/run { scenario_id: "SIM-001" }` returns simulation results with projected revenue impact numbers.

---

### Task 5: Wire Simulation Results Back to Automation Engine

**Goal:** When a simulation proves a rule is effective, automatically update the rule's status in the automation engine.

**Steps:**
1. Add `simulation_status` field to `AutomationAction` model: `pending_simulation` | `simulation_passed` | `simulation_failed` | `activated`
2. After simulation completes, bridge calls `automation_engine.update_rule_simulation_status(rule_id, results)`
3. Rules with `simulation_passed` appear in Automation Dashboard with green badge and projected ROI
4. Admin can one-click activate rules that passed simulation

**Acceptance:** After running SIM-001, automation rule AUTO-007 shows "Simulation Passed: 31.8x ROI projected".

---

### Task 6: Build "Simulate Before Activate" Flow on Dashboard

**Goal:** Frontend flow where activating any automation rule first triggers a simulation.

**Steps:**
1. Add "Simulate Impact" button next to each automation rule in Automation Dashboard
2. Clicking triggers `POST /api/v1/simulation/run` with rule parameters
3. Show simulation progress (polling on `/simulation/{id}/status`)
4. Display results inline: projected revenue impact, confidence score, risk level
5. If passed: show "Activate Rule" button. If failed: show warning with risk details.

**Acceptance:** End-to-end flow from clicking "Simulate Impact" to seeing results and activating a rule.

---

## 6. TIMELINE -- Now vs. Later

### NOW -- This Sprint (Weeks 1-2)

| Task | Effort | Dependencies | Deliverable |
|---|---|---|---|
| Task 1: Get MiroFish running locally | 1 day | Ollama installed, Zep API key | MiroFish responds on port 5001 |
| Task 2: Create RCM ontology JSON | 1 day | None | `rcm_ontology.json` with 10 entity types, 8 edge types |
| Task 3: Dynamic payer agents from DB | 2 days | Task 1, DB seeded | `GET /payer-agents` returns enriched profiles from live data |

**Sprint Goal:** MiroFish is running, connected to a Zep knowledge graph populated with RCM data, and payer agent profiles are generated from live database state.

**Validation Checkpoint:** Run `GET /api/v1/simulation/payer-agents` and see 10 payer agents with behavioral profiles derived from actual denial/claim/payment data.

### NEXT SPRINT (Weeks 3-4)

| Task | Effort | Dependencies | Deliverable |
|---|---|---|---|
| Task 4: RCM simulation runner wrapper | 3 days | Tasks 1-3 complete | SIM-001 runs end-to-end with projected revenue |
| Task 5: Wire results to automation engine | 2 days | Task 4 | Rules show simulation status badges |
| Task 6: "Simulate Before Activate" UI | 3 days | Task 5 | Full frontend flow |

**Sprint Goal:** Full simulation pipeline operational. Users can run scenarios, see projected impact, and activate automation rules based on simulation evidence.

**Validation Checkpoint:** Run scenario SIM-001 (auto-appeal CODING_MISMATCH) end-to-end. See projected revenue recovery of ~$42M. Click "Activate" on AUTO-007. Rule status changes to active.

### FUTURE (Backlog)

| Feature | Description | Priority |
|---|---|---|
| Agent interviews | Chat with a payer agent post-simulation to understand its denial reasoning | Medium |
| Custom scenario builder | UI for creating new what-if scenarios without editing JSON | Medium |
| Continuous simulation | Nightly cron re-runs key scenarios with latest data, alerts on changes | Low |
| Multi-facility simulation | Simulate across multiple provider locations simultaneously | Low |
| Historical validation | Compare past predictions against actual outcomes to calibrate agents | Medium |

---

## Appendix A: Existing Integration Code Map

| File | Purpose | Status |
|---|---|---|
| `/backend/app/services/mirofish_bridge.py` | HTTP bridge to MiroFish backend | Built -- needs enrichment (Tasks 3-5) |
| `/backend/app/api/v1/simulation.py` | FastAPI routes for simulation | Built -- needs expansion (Tasks 4-5) |
| `/mirofish/rcm_seeds/rcm_knowledge_base.json` | Static RCM domain knowledge (7 process stages, 10 CARC codes, 5 payer profiles, 7 root causes, 7 automation rules) | Built -- used as reference for ontology |
| `/mirofish/rcm_seeds/simulation_scenarios.json` | 5 pre-built what-if scenarios (SIM-001 through SIM-005) | Built -- ready to use |
| `/mirofish/rcm_seeds/payer_agents.json` | 10 static payer agent profiles with payment behavior and contract compliance | Built -- to be replaced by dynamic generation |
| `/mirofish/.env` | MiroFish config (Ollama endpoint, Zep API key placeholder) | Built -- needs valid Zep API key |

## Appendix B: NEXUS Services That Feed Simulation

| Service | What It Provides to Simulation |
|---|---|
| `diagnostic_service.py` | System-wide diagnostic findings (denial patterns, payment anomalies, AR aging issues) -- seeds the "current state" of the simulation |
| `automation_engine.py` | Current automation rules and their success rates -- tells simulation which rules exist and how effective they are |
| `prevention_service.py` | Pre-submission risk alerts (eligibility, auth expiry, timely filing, duplicates) -- validates simulation predictions against actual prevention |
| `root_cause_service.py` | 7-step graph traversal root cause analysis -- provides ground truth for why denials happen, which simulation must be consistent with |

## Appendix C: Key Configuration Values

| Variable | Current Value | Required For |
|---|---|---|
| `LLM_API_KEY` | `ollama` | Profile generation, config generation, report agent |
| `LLM_BASE_URL` | `http://localhost:11434/v1` | Ollama API endpoint |
| `LLM_MODEL_NAME` | `llama3` | Default model for all LLM calls |
| `ZEP_API_KEY` | `placeholder_configure_later` | Knowledge graph storage -- **MUST be configured with real key** |
| `FLASK_PORT` | `5001` | MiroFish backend port (NEXUS bridge connects here) |
| `OASIS_DEFAULT_MAX_ROUNDS` | `10` | Default simulation rounds per run |
| `REPORT_AGENT_MAX_TOOL_CALLS` | `5` | Max Zep tool calls per report section |
| `REPORT_AGENT_MAX_REFLECTION_ROUNDS` | `2` | Max think-reflect cycles per section |
