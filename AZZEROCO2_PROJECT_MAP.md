# AZZEROCO2 ENERGY - MAPPA COMPLETA DEL PROGETTO

> **Nome app**: AzzeroCO2 Energy
> **Tagline**: "il clima nelle nostre mani"
> **Progetto**: Piattaforma SaaS per audit energetici, ottimizzazione sistemi energetici e pianificazione della decarbonizzazione
> **Riferimento**: Analisi di J4Energy (app.j4energy.app)
> **Design reference**: dashboard-demoazzero.vercel.app (landing) + nexus-beta-sooty.vercel.app (splash/dark mode)
> **Infrastruttura**: Supabase Premium + Vercel Pro
> **Data creazione**: 2026-02-27
> **Versione**: 1.1

---

## INDICE

1. [Visione e Obiettivi](#1-visione-e-obiettivi)
2. [Brand & Design System](#2-brand--design-system)
3. [Architettura Generale](#3-architettura-generale)
4. [Stack Tecnologico](#4-stack-tecnologico)
5. [I 13 Agenti - Ruoli e Responsabilita'](#5-i-13-agenti---ruoli-e-responsabilita)
6. [Fasi di Sviluppo](#6-fasi-di-sviluppo)
7. [Moduli Applicativi Dettagliati](#7-moduli-applicativi-dettagliati)
8. [Schema Database](#8-schema-database)
9. [API Endpoints](#9-api-endpoints)
10. [Dipendenze tra Moduli](#10-dipendenze-tra-moduli)
11. [Skills Mappate per Agente](#11-skills-mappate-per-agente)
12. [Miglioramenti rispetto a J4Energy](#12-miglioramenti-rispetto-a-j4energy)
13. [Criteri di Qualita' e Acceptance](#13-criteri-di-qualita-e-acceptance)

---

## 1. VISIONE E OBIETTIVI

### 1.1 Cosa costruiamo
Una piattaforma web moderna che permette a consulenti energetici, energy manager e aziende di:

- **Modellare** la situazione energetica attuale di un impianto (AS_IS)
- **Simulare** scenari di intervento (fotovoltaico, pompe di calore, batterie, cappotti termici, ecc.)
- **Ottimizzare** la scelta delle tecnologie per costo minimo O decarbonizzazione massima
- **Generare** report professionali con analisi tecnico-finanziaria
- **Gestire** piu' impianti/clienti da un'unica dashboard

### 1.2 Differenziatori rispetto a J4Energy
| Area | J4Energy | AzzeroCO2 Energy |
|------|----------|------------------|
| UI/UX | Enterprise datata (2018-2020) | Moderna, dark mode nativo, shimmer loading, Framer Motion |
| Landing | Nessuna | Landing page con video background + hero animato |
| Splash | Nessuno | Logo shimmer 7-8s (effetto wave come Nexus) |
| AI | Nessuna | LLM per suggerimenti, OCR bollette, analisi automatica |
| Collaborazione | Nessuna | Multi-utente, commenti, condivisione |
| Mobile | Solo desktop | Responsive + PWA per sopralluoghi |
| Calcolo | Batch lento | Incrementale + preview real-time |
| Report | Solo Word | PDF, Word, Excel, PowerPoint |
| Integrazioni | Chiuso | API pubblica, webhook, import automatico |
| Infra | Sconosciuta | Supabase Premium + Vercel Pro |

### 1.3 Target utenti
- **Energy Manager** aziendali (utente principale)
- **Consulenti energetici** (freelance e aziende di consulenza)
- **Progettisti impiantistici**
- **Direzione aziendale** (consumer di report e dashboard)

---

## 2. BRAND & DESIGN SYSTEM

### 2.1 Identita' visiva
- **Nome**: AzzeroCO2 Energy
- **Tagline**: "il clima nelle nostre mani"
- **Font**: Inter (Google Fonts, pesi 300-800)
- **Icon set**: Lucide React
- **Design reference completo**: vedi `DESIGN_REFERENCE.md`

### 2.2 Colori brand
| Nome | Hex | HSL | Uso |
|------|-----|-----|-----|
| Primary Blue | `#0097D7` | 198 100% 42% | Colore principale, CTA, link, accent |
| Primary Dark | `#0284C7` | 201 96% 32% | Variante profonda per dark mode |
| Secondary Green | `#00B894` | 169 100% 36% | Successo, trend positivi, decarbonizzazione |
| Accent Cyan | `#22D3EE` | 186 94% 57% | Highlight, badge, evidenziazione |
| Dark Text | `#1D1D1B` | - | Testo su sfondo chiaro |
| Background Light | `#F4F7FA` | 210 40% 98% | Sfondo pagine light mode |
| Background Dark | `#121827` | 222 47% 11% | Sfondo pagine dark mode |
| Card Dark | `#1E293B` | 217 33% 17% | Card/elevated surface dark mode |
| Warning Coral | `#E17055` | - | Trend negativi, alert |
| Governance Purple | `#7C3AED` | - | Sezione governance ESG |
| Amber | `#FFB020` | - | Medium priority, chart accent |

### 2.3 Loghi
| File | Sfondo | Colori |
|------|--------|--------|
| `Loghi e video/AZZEROCO2_LOGO_PAYOFF_ITA_POS.svg` | Scuro | Tutto #FFF |
| `Loghi e video/AzzeroCO2_LOGO_PAYOFF_ITA.svg` | Chiaro | #0097D7 (CO2) + #1D1D1B (Azzero) |

### 2.4 Video di sfondo
| File | Risoluzione | FPS | Uso |
|------|-------------|-----|-----|
| `12808704_1920_1080_25fps.mp4` | 1080p | 25 | Hero landing |
| `13578301-uhd_3840_2160_30fps.mp4` | 4K | 30 | Background |
| `14044733_1080_1920_48fps.mp4` | 1080x1920 | 48 | Mobile vertical |
| `4249216-uhd_3840_2160_24fps.mp4` | 4K | 24 | Background UHD |

### 2.5 Splash Screen (7-8 secondi)
Effetto shimmer wave sul logo bianco su sfondo #0F172A.
Due layer sovrapposti:
- Layer ghost: logo opacity 15% + testo "Caricamento in corso..." opacity 20%
- Layer shimmer: stessa immagine mascherata con gradient diagonale 110deg animato
- Animazione `logo-wave`: 3.5s ease-in-out infinite, mask sweep da 200% a -100%

### 2.6 Landing Page
Video background in hero + overlay gradient scuro + CTA.
Sezioni: Hero, Features (4 card), Come Funziona (3 step), Preview Dashboard, Footer.
Animazioni Framer Motion: fade-in dal basso (opacity:0,y:20 -> opacity:1,y:0).

---

## 3. ARCHITETTURA GENERALE

### 2.1 Architettura ad alto livello

```
                    +-----------------------+
                    |     CDN / Edge        |
                    |   (Vercel/Cloudflare) |
                    +-----------+-----------+
                                |
                    +-----------v-----------+
                    |    FRONTEND (Next.js)  |
                    |    App Router + RSC    |
                    |    Tailwind + Shadcn   |
                    +-----------+-----------+
                                |
                    +-----------v-----------+
                    |    API GATEWAY         |
                    |    (Next.js API Routes |
                    |     + tRPC/REST)       |
                    +-----------+-----------+
                                |
              +-----------------+-----------------+
              |                 |                 |
    +---------v------+  +------v--------+  +-----v----------+
    | BACKEND CORE   |  | OPTIMIZATION  |  | REPORT ENGINE  |
    | (Node.js/TS)   |  | ENGINE        |  | (Python)       |
    | - Auth         |  | (Python)      |  | - DOCX/PDF     |
    | - CRUD         |  | - PuLP/Pyomo  |  | - Charts       |
    | - Business     |  | - HiGHS/GLPK  |  | - Templates    |
    | - Validation   |  | - FastAPI     |  |                |
    +--------+-------+  +------+--------+  +-------+--------+
             |                 |                    |
    +--------v-----------------v--------------------v--------+
    |                    PostgreSQL                           |
    |              (Supabase / Self-hosted)                   |
    +-----------+-------------------+-----------+------------+
                |                   |           |
          +-----v-----+    +-------v----+  +---v---------+
          | Redis      |    | S3/MinIO   |  | BullMQ      |
          | (Cache +   |    | (Files +   |  | (Job Queue) |
          |  Sessions) |    |  Reports)  |  |             |
          +-----------+    +------------+  +-------------+
```

### 2.2 Pattern architetturali

- **Frontend**: Next.js App Router con React Server Components
- **Backend**: Hybrid - Node.js/TypeScript per CRUD + Python per ottimizzazione/report
- **Database**: Supabase PostgreSQL (Premium) con row-level security per multi-tenancy
- **Queue**: Supabase Edge Functions + pg_cron / BullMQ per job asincroni
- **Auth**: Supabase Auth con multi-tenant support
- **Real-time**: Supabase Realtime per progress tracking calcoli
- **File Storage**: Supabase Storage (S3-compatible, incluso nel premium)

---

## 3. STACK TECNOLOGICO

### 3.1 Frontend
| Tecnologia | Ruolo | Motivazione |
|-----------|-------|-------------|
| **Next.js 15+** | Framework | App Router, RSC, SSR/SSG, API Routes |
| **React 19** | UI Library | Concurrent features, Suspense, Server Components |
| **TypeScript** | Linguaggio | Type safety end-to-end |
| **Tailwind CSS 4** | Styling | Utility-first, design system veloce |
| **Shadcn/UI** | Component Library | Componenti accessibili, personalizzabili, non opinionati |
| **Recharts / Apache ECharts** | Grafici | Profili energetici, duration curves, dashboard |
| **Mapbox GL JS** | Mappe | Mappa impianti, vista satellitare per FV |
| **React Hook Form + Zod** | Form | Validazione type-safe, performance |
| **TanStack Table** | Tabelle | Tabelle dati avanzate con sort, filter, editing |
| **Zustand** | State Management | Leggero, semplice, TypeScript-first |
| **Framer Motion** | Animazioni | Micro-animazioni, transizioni pagina |

### 3.2 Backend
| Tecnologia | Ruolo | Motivazione |
|-----------|-------|-------------|
| **Supabase (Premium)** | BaaS | Auth, DB, Storage, Realtime, Edge Functions - tutto integrato |
| **PostgreSQL 16 (Supabase)** | Database | JSONB, RLS, partitioning, maturo, gestito |
| **Supabase Auth** | Autenticazione | Multi-tenant, social login, 2FA, email templates |
| **Supabase Storage** | File Storage | Upload bollette, report, immagini satellitari |
| **Supabase Realtime** | Real-time | Progress tracking calcoli, notifiche |
| **Supabase Edge Functions** | Serverless | Logica server-side, webhook, cron jobs |
| **Drizzle ORM** | Database ORM | Type-safe, leggero, SQL-like per query complesse |
| **Zod** | Validazione | Schema validation condivisa frontend/backend |

### 3.3 Optimization Engine (Python)
| Tecnologia | Ruolo | Motivazione |
|-----------|-------|-------------|
| **Python 3.12** | Linguaggio | Ecosystem scientifico, PuLP/Pyomo |
| **FastAPI** | API Server | Async, OpenAPI auto-docs, performante |
| **PuLP + HiGHS** | MILP Solver | Open-source, performante, industriale |
| **Pyomo** | Modellazione alternativa | Per problemi piu' complessi |
| **NumPy / Pandas** | Data processing | Manipolazione dati energetici |
| **python-docx** | Report Word | Generazione documenti Word |
| **WeasyPrint** | Report PDF | Conversione HTML->PDF di alta qualita' |

### 3.4 Infrastruttura
| Tecnologia | Ruolo | Motivazione |
|-----------|-------|-------------|
| **Vercel (Pro)** | Frontend hosting | Deploy automatico, edge network, preview deploys |
| **Supabase (Premium)** | Backend completo | Auth, DB, Storage, Realtime, Edge Functions |
| **Docker** | Dev + Python service | Containerizzazione optimizer Python |
| **Railway / Fly.io** | Python optimizer | Hosting FastAPI optimizer service |
| **GitHub Actions** | CI/CD | Build, test, deploy automatici |

### 3.5 Credenziali (in `.env`, MAI committare)
```
NEXT_PUBLIC_SUPABASE_URL=https://jnxhhjjywwxdahgqgrod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=***  (in .env)
SUPABASE_SERVICE_ROLE_KEY=***      (in .env)
SUPABASE_JWT_SECRET=***            (in .env)
```

---

## 5. I 13 AGENTI - RUOLI E RESPONSABILITA'

### Panoramica Team

```
+------------------------------------------------------------------+
|                    AGENT 01: ARCHITECT LEAD                       |
|          Architettura, scaffolding, coordinamento                 |
+------+---------------------------+-------------------------------+
       |                           |
+------v--------+    +------------v-----------+    +---------------+
| FRONTEND TEAM |    |     BACKEND TEAM       |    | CROSS-CUTTING |
+---------------+    +------------------------+    +---------------+
| AG02: Core    |    | AG05: API Core         |    | AG11: Auth    |
| AG03: Design  |    | AG06: Database         |    | AG12: Testing |
| AG04: DataViz |    | AG07: Optimizer        |    | AG13: DevOps  |
| AG10: Wizard  |    | AG08: Scenarios        |    |   & Cleanup   |
+---------------+    | AG09: Reports          |    +---------------+
                     +------------------------+
```

---

### AGENT 01 - ARCHITECT LEAD
**Nome**: `architect-lead`
**Responsabilita'**:
- Definizione architettura complessiva
- Scaffolding progetto (monorepo structure)
- Setup Docker Compose per ambiente di sviluppo
- Definizione interfacce e contratti tra moduli
- Code review architetturale
- Coordinamento dipendenze tra agenti

**Deliverable principali**:
- `docker-compose.yml` completo
- Struttura monorepo con workspaces
- `CLAUDE.md` del progetto con convenzioni
- Schema contratti API (OpenAPI spec)
- Documentazione architetturale (ADR)

**Skills rilevanti**:
- `architecture-patterns`
- `architecture-decision-records`
- `clean-architecture`
- `monorepo-management`
- `docker-expert`
- `api-design-principles`
- `microservices-patterns`
- `context-driven-development`
- `software-architecture`

---

### AGENT 02 - FRONTEND CORE
**Nome**: `frontend-core`
**Responsabilita'**:
- Setup Next.js App Router
- Routing e layout (sidebar, header, area contenuto)
- Navigation system con menu gerarchico ad albero
- Page scaffolding per ogni sezione
- State management globale (Zustand)
- Integrazioni API (fetch, mutation, caching)
- Responsive layout e PWA setup

**Deliverable principali**:
- `/app` directory con routing completo
- Layout component (sidebar collassabile + header + content area)
- Navigation tree component
- API client layer (fetch wrapper / tRPC client)
- Loading states, error boundaries, suspense
- Mobile responsive breakpoints

**Pagine da creare**:
```
/                           -> Landing page pubblica (video hero, features, CTA)
/login                      -> Login con Supabase Auth
/register                   -> Registrazione
/forgot-password            -> Reset password
/dashboard                  -> Dashboard principale (con splash screen al primo accesso)
/dashboard/map              -> Mappa impianti
/analysis/[id]              -> Analisi specifica
/analysis/[id]/data-input   -> Input dati
  /general-settings
  /demand
  /lighting
  /resources
  /technologies
  /storage
  /custom-code
  /time-series
/analysis/[id]/scenarios    -> Gestione scenari
  /manage
  /[scenarioId]/config
/analysis/[id]/results      -> Risultati
  /summary
  /comparison
  /subsidy
/analysis/[id]/report       -> Report
/settings                   -> Impostazioni utente
/admin                      -> Admin panel
```

**Skills rilevanti**:
- `nextjs-app-router`
- `nextjs-app-router-patterns`
- `next-best-practices`
- `nextjs-performance`
- `react-patterns`
- `react-state-management`
- `responsive-design`
- `nextjs-data-fetching`
- `typescript-advanced-types`

---

### AGENT 03 - UI / DESIGN SYSTEM
**Nome**: `ui-design-system`
**Responsabilita'**:
- Design system completo basato su Shadcn/UI
- Tema colore AzzeroCO2 (variante dark mode)
- Componenti custom riutilizzabili
- Form components con validazione
- Tabelle dati avanzate (edit inline, sort, filter, azioni)
- Modal, dialog, drawer
- Stepper/wizard component
- Drag & drop area
- Slider range component
- Chip/pill selectors
- Toggle tabs

**Deliverable principali**:
- `/components/ui/` - Componenti base Shadcn customizzati
- `/components/shared/` - Componenti business riutilizzabili
- `/styles/` - Design tokens, tema, variabili CSS
- Storybook o catalogo componenti
- Dark mode completo

**Componenti chiave**:
| Componente | Descrizione | Complessita' |
|-----------|-------------|-------------|
| `DataTable` | Tabella CRUD con inline edit, sort, filter, actions | Alta |
| `RangeSlider` | Slider min/max MW per tecnologie | Media |
| `TechModal` | Modal dettaglio tecnologia con tab multipli | Alta |
| `StepperWizard` | Wizard multi-step con progress bar | Media |
| `FileDropZone` | Area upload bollette con drag & drop | Media |
| `SearchableSelect` | Dropdown con ricerca (codici NACE/Ateco) | Media |
| `DaySelector` | Chip selector per giorni lavorativi | Bassa |
| `TreeNavigation` | Menu sidebar ad albero collassabile | Media |
| `KPICard` | Card per KPI dashboard con icona e trend | Bassa |
| `ProgressTracker` | Barra progresso calcolo scenari | Bassa |

**Skills rilevanti**:
- `shadcn-ui`
- `tailwind-css-patterns`
- `tailwind-design-system`
- `design-system-patterns`
- `frontend-design`
- `visual-design-foundations`
- `interaction-design`
- `accessibility-compliance`
- `web-component-design`
- `responsive-design`

---

### AGENT 04 - DASHBOARD & DATA VISUALIZATION
**Nome**: `dataviz-dashboard`
**Responsabilita'**:
- Dashboard homepage con KPI widgets
- Grafici profili energetici (giornalieri, orari)
- Duration curves
- Grafici confronto scenari (bar chart, radar)
- Mappa interattiva impianti con marker
- Vista satellitare per valutazione FV
- Grafici finanziari (CAPEX breakdown, ROI, payback)
- Widget circolari (grafici a torta per energy mix)

**Deliverable principali**:
- `/components/charts/` - Componenti grafici riutilizzabili
- `/components/maps/` - Componenti mappa
- `/components/dashboard/` - Widget dashboard
- Dashboard configurabile con layout a griglia

**Grafici da implementare**:
| Grafico | Tipo | Dati |
|---------|------|------|
| `EnergyProfileChart` | Line chart multi-serie | Profilo giornaliero per end-use (Cold, Elec, Heat) |
| `DurationCurve` | Line chart sorted | Curva durata carico elettrico/termico |
| `HourlyProfile` | Heatmap / line | Profilo orario 8760h tecnologie |
| `EnergyMixPie` | Pie/Donut chart | Ripartizione consumi per fonte |
| `ScenarioComparisonBar` | Grouped bar chart | CAPEX, OPEX, CO2 per scenario |
| `TechSizingWaterfall` | Waterfall chart | Sizing tecnologie per scenario |
| `FinancialTimeline` | Line + area chart | Cashflow cumulativo, ROI, payback |
| `CO2ReductionGauge` | Gauge / radial | % riduzione CO2 vs AS_IS |
| `MarketPricesChart` | Line chart + tooltip | Prezzi elettricita'/gas nel tempo |
| `SatelliteMapView` | Mapbox satellite + draw | Area disegno poligoni per FV |

**Skills rilevanti**:
- `data-visualization`
- `data-storytelling`
- `kpi-dashboard-design`
- `recharts` (via `react-patterns`)
- `interaction-design`
- `frontend-design`

---

### AGENT 05 - BACKEND API CORE
**Nome**: `backend-api`
**Responsabilita'**:
- Setup Next.js API Routes o server separato
- REST API per tutti i moduli CRUD
- Validazione input con Zod
- Error handling standardizzato
- Rate limiting e security headers
- File upload (bollette, documenti)
- Integrazione con servizi esterni (prezzi mercato, meteo, irradiazione solare)
- WebSocket / SSE per progress tracking

**Deliverable principali**:
- `/api/` - Tutti gli endpoint REST
- Middleware stack (auth, validation, error handling, logging)
- OpenAPI spec auto-generata
- Upload service per file
- SSE endpoint per progress calcoli

**Endpoint macro-aree**:
```
/api/auth/*           -> Autenticazione (delegato ad Agent 11)
/api/organizations/*  -> Gestione organizzazioni/tenant
/api/sites/*          -> Impianti/siti
/api/analyses/*       -> Analisi energetiche
/api/demand/*         -> Domanda energetica
/api/resources/*      -> Risorse energetiche
/api/technologies/*   -> Catalogo e configurazione tecnologie
/api/storage/*        -> Accumulo energetico
/api/scenarios/*      -> Gestione scenari
/api/optimization/*   -> Lancio e risultati ottimizzazione
/api/reports/*        -> Generazione e download report
/api/wizard/*         -> Dati e logica wizard
/api/market-data/*    -> Prezzi mercato, dati esterni
/api/files/*          -> Upload/download file
```

**Skills rilevanti**:
- `api-design-principles`
- `nodejs-backend-patterns`
- `error-handling-patterns`
- `openapi-spec-generation`
- `api-security-best-practices`
- `nestjs` (pattern applicabili)
- `drizzle-orm-patterns`
- `typescript-advanced-types`

---

### AGENT 06 - DATABASE & DATA MODELS
**Nome**: `database-engineer`
**Responsabilita'**:
- Schema PostgreSQL completo
- Drizzle ORM models e migrations
- Row-Level Security policies per multi-tenancy
- Indici e ottimizzazione query
- Seed data (tecnologie catalogo, codici NACE, profili default)
- Backup strategy

**Deliverable principali**:
- `/db/schema/` - Definizioni tabelle Drizzle
- `/db/migrations/` - Migrazioni database
- `/db/seed/` - Dati iniziali
- `/db/queries/` - Query complesse pre-definite
- Documentazione schema ER

**Tabelle principali** (dettaglio in sezione 7):
```
organizations
users
user_organizations (join multi-tenant)
sites
analyses
demands
lighting_zones
lighting_technologies
resources
technologies (catalogo)
technology_inputs
technology_outputs
technology_profiles
storage_systems
time_series
custom_code
scenarios
scenario_technology_configs
scenario_results
scenario_technology_results
reports
files
audit_log
```

**Skills rilevanti**:
- `postgresql-table-design`
- `drizzle-orm-patterns`
- `database-migration`
- `sql-optimization-patterns`
- `postgresql-optimization`
- `database-design`
- `postgres-best-practices`

---

### AGENT 07 - OPTIMIZATION ENGINE
**Nome**: `optimization-engine`
**Responsabilita'**:
- **CUORE DEL SISTEMA** - Motore di ottimizzazione MILP
- Modellazione matematica del problema energetico
- Funzioni obiettivo: minimizzazione costo / massimizzazione decarbonizzazione
- Vincoli: bilancio energetico orario, budget, emissioni, capacity
- Gestione storage/accumulo con stato di carica
- Profili temporali (8760 ore/anno)
- API FastAPI per esporre il solver
- Performance optimization del solver

**Deliverable principali**:
- `/optimizer/` - Package Python completo
- `/optimizer/models/` - Modelli matematici
- `/optimizer/solvers/` - Wrapper solver (PuLP + HiGHS)
- `/optimizer/api/` - FastAPI endpoints
- `/optimizer/tests/` - Test suite con casi noti
- Documentazione matematica del modello

**Modello di ottimizzazione**:
```
OBIETTIVO:
  min SUM(CAPEX[t] + OPEX[t]) per t in Tecnologie    [modalita' costo]
  oppure
  min SUM(CO2[r] * consumo[r]) per r in Risorse       [modalita' decarbon]

VINCOLI:
  Per ogni ora h in [0..8759]:
    Per ogni end_use e in [Cold, Elec, HeatH, HeatM, HeatL]:
      SUM(output[t,e,h]) >= demand[e,h]                [bilancio domanda]

    Per ogni tecnologia t:
      output[t,h] <= capacity[t] * capacity_factor[t,h] [capacity limit]
      capacity[t] >= min_size[t]                         [sizing minimo]
      capacity[t] <= max_size[t]                         [sizing massimo]

    Per ogni storage s:
      SOC[s,h] = SOC[s,h-1] + charge[s,h]*eff - discharge[s,h]/eff
      0 <= SOC[s,h] <= max_capacity[s]

  SUM(CAPEX[t]) <= max_capex                            [budget CAPEX]
  SUM(OPEX[t]) <= max_opex                              [budget OPEX]
  SUM(CO2[t]) <= max_co2                                [limite emissioni]

VARIABILI DECISIONALI:
  capacity[t]     : MW installati per tecnologia t      [continua >= 0]
  active[t]       : tecnologia t attiva si/no           [binaria]
  flow[t,r,h]     : flusso risorsa r in tecnologia t    [continua >= 0]
  charge[s,h]     : potenza carica storage h            [continua >= 0]
  discharge[s,h]  : potenza scarica storage h           [continua >= 0]
```

**Skills rilevanti**:
- `python-design-patterns`
- `fastapi-templates`
- `python-performance-optimization`
- `python-testing-patterns`
- `python-type-safety`
- `async-python-patterns`
- `python-error-handling`

---

### AGENT 08 - SCENARIO MANAGER
**Nome**: `scenario-manager`
**Responsabilita'**:
- CRUD scenari con duplicazione
- Configurazione tecnologie per scenario (min/max MW, enable/disable)
- Lancio calcolo ottimizzazione (job asincrono)
- Tracking progresso calcolo con SSE
- Confronto risultati tra scenari
- Flag "[outdated]" quando input cambiano dopo calcolo
- Log esecuzioni con timestamp e status

**Deliverable principali**:
- `/modules/scenarios/` - Logica business scenari
- Job queue integration per lancio calcoli
- Confronto scenari con metriche SAVING e SAVING %
- UI: tabella scenari, config panel, comparison view

**Flusso scenario**:
```
[Crea/Duplica Scenario]
        |
[Configura Tecnologie] -- min/max MW, enable, resource mapping
        |
[Imposta Vincoli] -- max CAPEX, max OPEX, max CO2, obiettivo
        |
[Lancia Calcolo] --> [BullMQ Job] --> [Python Optimizer]
        |                                    |
[SSE Progress] <-------- status updates -----+
        |
[Risultati] -- sizing, CAPEX, OPEX, CO2, savings
        |
[Confronto] -- AS_IS vs Light vs High decarbon
```

**Skills rilevanti**:
- `workflow-patterns`
- `bullmq-specialist`
- `cqrs-implementation`
- `saga-orchestration`
- `nodejs-backend-patterns`
- `error-handling-patterns`

---

### AGENT 09 - REPORT GENERATOR
**Nome**: `report-generator`
**Responsabilita'**:
- Generazione report Word (DOCX) professionali
- Generazione report PDF
- Template configurabili per tipologia di report
- Inserimento automatico di grafici, tabelle, immagini satellitari
- Esportazione Excel per dati tabulari
- Job asincrono per generazione (puo' richiedere tempo)

**Deliverable principali**:
- `/report-engine/` - Package Python per generazione
- `/report-engine/templates/` - Template Word/HTML base
- `/report-engine/generators/` - Generatori per formato
- `/report-engine/charts/` - Generazione grafici statici (matplotlib/plotly)

**Struttura report tipo**:
```
1. Copertina
   - Logo AzzeroCO2
   - Nome analisi, data, cliente

2. Dati anagrafici sito
   - Indirizzo, codice NACE, settore
   - Immagine satellitare
   - Superficie, addetti, orari operativi

3. Situazione energetica attuale (AS_IS)
   - Consumi per vettore (elettricita', gas, ecc.)
   - Costi energetici annui
   - Emissioni CO2 annue
   - Profilo di carico

4. Interventi proposti
   Per ogni tecnologia selezionata:
   - Descrizione tecnica
   - Sizing ottimale [kW/MW]
   - CAPEX stimato
   - Risparmio OPEX annuo
   - Riduzione CO2

5. Analisi finanziaria
   - CAPEX totale
   - ROI e tempo di ritorno
   - Cashflow cumulativo
   - Incentivi/sussidi applicabili

6. Confronto scenari
   - Tabella comparativa
   - Grafici a barre

7. Conclusioni e prossimi passi
```

**Skills rilevanti**:
- `docx`
- `pdf`
- `pptx`
- `xlsx`
- `python-design-patterns`
- `data-storytelling`
- `fastapi-templates`

---

### AGENT 10 - WIZARD (J4Wizard equivalent)
**Nome**: `energy-wizard`
**Responsabilita'**:
- Wizard guidato multi-step per creazione analisi
- Logica condizionale (domande cambiano in base a risposte)
- Profili energetici preimpostati per settore (codici NACE)
- Auto-completamento dati da bollette caricate
- Suggerimenti AI-powered basati su settore e dimensione
- Validazione progressiva dei dati inseriti

**Deliverable principali**:
- `/components/wizard/` - Componenti React del wizard
- `/modules/wizard/` - Logica backend wizard
- `/data/profiles/` - Profili settoriali preimpostati
- `/data/nace-codes/` - Database codici NACE/Ateco con mapping

**Step del wizard**:
```
STEP 1: DATI GENERALI
  - Nome analisi
  - Seleziona/crea sito (indirizzo, coordinate)
  - Codice NACE/Ateco (dropdown searchable)
  - Anno di riferimento
  - Ore operative, giorni lavorativi

STEP 2: CONSUMI ENERGETICI
  - Upload bollette (drag & drop) con OCR
  - OPPURE inserimento manuale:
    - Elettricita' [MWh/anno]
    - Gas naturale [MWh/anno]
    - Altro (biomassa, gasolio, GPL...)
  - Profilo di carico: standard settoriale o personalizzato

STEP 3: DOMANDA TERMICA/FRIGORIFERA
  - Domanda di calore [MWh/anno] per temperatura:
    - Alta T (>200°C)
    - Media T (80-200°C)
    - Bassa T (<80°C)
  - Domanda frigorifera [MWh/anno]
  - Illuminazione: zone, tecnologie attuali, ore

STEP 4: TECNOLOGIE DISPONIBILI
  - Selezione da catalogo preimpostato per settore
  - Per ogni tecnologia: min/max dimensionamento
  - Opzione "seleziona tutto" per analisi automatica
  - Vincoli budget opzionali

STEP 5: SOMMARIO E LANCIO
  - Riepilogo dati inseriti
  - Selezione obiettivo (Costo / Decarbonizzazione / Entrambi)
  - Lancio primo calcolo scenari base
  - Redirect a risultati
```

**Skills rilevanti**:
- `react-patterns`
- `interaction-design`
- `shadcn-ui`
- `form` (React Hook Form patterns)
- `ai-product`
- `prompt-engineering`

---

### AGENT 11 - AUTH & MULTI-TENANT SECURITY
**Nome**: `auth-security`
**Responsabilita'**:
- Sistema di autenticazione con Supabase Auth
- Multi-tenancy con isolamento dati via RLS
- Ruoli e permessi (Admin, Editor, Viewer)
- Row-Level Security PostgreSQL su Supabase
- Invito utenti per organizzazione via Supabase email
- 2FA opzionale (Supabase MFA)
- Audit log accessi e modifiche
- Security headers, CORS, rate limiting
- GDPR consent screen

**Deliverable principali**:
- `/lib/supabase/` - Client Supabase configurato (server + client)
- `/middleware.ts` - Auth middleware Next.js, tenant resolution
- `supabase/migrations/` - RLS policies
- `/modules/organizations/` - Gestione organizzazioni
- `/modules/invitations/` - Sistema inviti email (Supabase email templates)

**Modello permessi**:
```
Organization
  |-- Admin: gestione completa, inviti, billing
  |-- Editor: crea/modifica analisi, scenari, report
  |-- Viewer: solo lettura, download report

Super Admin (piattaforma)
  |-- Gestione organizzazioni
  |-- Catalogo tecnologie globale
  |-- Dati di mercato
  |-- Monitoraggio sistema
```

**Skills rilevanti**:
- `supabase-automation`
- `supabase-postgres-best-practices`
- `nextjs-supabase-auth`
- `auth-implementation-patterns`
- `nextjs-authentication`
- `two-factor-authentication-best-practices`
- `email-and-password-best-practices`
- `organization-best-practices`
- `security-audit`
- `gdpr-data-handling`
- `secrets-management`

---

### AGENT 12 - TESTING & QA
**Nome**: `testing-qa`
**Responsabilita'**:
- Setup framework di testing (Vitest + Playwright)
- Unit test per logica business
- Integration test per API
- E2E test per flussi critici
- Test del motore di ottimizzazione con casi noti
- Performance testing
- Accessibility testing
- CI/CD pipeline con test automatici

**Deliverable principali**:
- `/tests/unit/` - Unit test
- `/tests/integration/` - Integration test API
- `/tests/e2e/` - E2E test Playwright
- `/tests/optimizer/` - Test solver con soluzioni note
- `.github/workflows/test.yml` - CI pipeline
- Test coverage report

**Flussi E2E critici da testare**:
1. Registrazione -> Login -> Crea organizzazione
2. Wizard completo -> Lancio calcolo -> Visualizza risultati
3. Crea scenario manuale -> Configura -> Calcola -> Confronta
4. Genera report -> Download
5. Invita utente -> Accetta invito -> Verifica permessi
6. Upload bollette -> Verifica parsing

**Skills rilevanti**:
- `e2e-testing-patterns`
- `javascript-testing-patterns`
- `python-testing-patterns`
- `playwright-skill`
- `unit-testing-test-generate`
- `testing-patterns`
- `wcag-audit-patterns`
- `screen-reader-testing`
- `github-actions-templates`
- `deployment-pipeline-design`

---

### AGENT 13 - DEVOPS & FILE CLEANUP
**Nome**: `devops-cleanup`
**Responsabilita'**:
- Pulizia e organizzazione file/cartelle del progetto
- Rimozione file duplicati, temporanei, non necessari
- Verifica coerenza struttura directory con architettura definita
- Setup e manutenzione Docker / Docker Compose
- Gestione `.gitignore`, `.env.example`, configurazioni
- Vercel deploy configuration e environment variables
- Supabase project setup (database, storage buckets, auth config)
- Monitoraggio dimensione bundle e ottimizzazione asset
- Compressione e ottimizzazione video/immagini per web
- Automazione task ripetitivi con script

**Deliverable principali**:
- `docker-compose.yml` per sviluppo locale
- `Dockerfile` per ogni servizio
- `.env.example` con tutte le variabili (senza valori segreti)
- `vercel.json` configurazione deploy
- `supabase/` directory con migrations e seed
- Script di pulizia (`scripts/cleanup.sh`)
- Script di setup progetto (`scripts/setup.sh`)
- Ottimizzazione asset (video compressi per web, SVG ottimizzati)

**Task continui**:
- Verificare che nessun file sensibile sia tracciato da git
- Mantenere la struttura directory pulita e coerente
- Rimuovere codice morto, import non usati, file orfani
- Verificare che `.gitignore` copra tutti i file sensibili
- Ottimizzare dimensioni build/bundle

**Skills rilevanti**:
- `docker-expert`
- `vercel-deployment`
- `vercel-deploy-claimable`
- `supabase-automation`
- `supabase-postgres-best-practices`
- `codebase-cleanup-refactor-clean`
- `codebase-cleanup-deps-audit`
- `codebase-cleanup-tech-debt`
- `file-organizer`
- `deployment-procedures`
- `secrets-management`
- `github-actions-templates`

---

## 6. FASI DI SVILUPPO

### FASE 0 - SETUP (Settimana 1)
**Agenti attivi**: `architect-lead`, `devops-cleanup`

| # | Task | Agente | Output |
|---|------|--------|--------|
| 0.1 | Inizializzazione monorepo (Turborepo/pnpm workspaces) | architect-lead | Struttura directory, package.json, tsconfig |
| 0.2 | Setup Supabase project (DB, Auth, Storage, Realtime) | devops-cleanup | Supabase configurato con buckets e policies |
| 0.3 | Setup Next.js con App Router + Vercel config | architect-lead | App Next.js base funzionante su Vercel |
| 0.4 | Setup Python optimizer service con Docker | architect-lead + devops-cleanup | FastAPI base + Dockerfile |
| 0.5 | CI/CD pipeline base | devops-cleanup | GitHub Actions: lint, build, test |
| 0.6 | CLAUDE.md con convenzioni progetto | architect-lead | Convenzioni codice, naming, commit |
| 0.7 | Pulizia e organizzazione file progetto | devops-cleanup | Struttura pulita, asset ottimizzati |
| 0.8 | Compressione video per web + SVG ottimizzati | devops-cleanup | Video compressi, logo PNG da SVG |

### FASE 1 - FONDAMENTA (Settimane 2-3)
**Agenti attivi**: `frontend-core`, `ui-design-system`, `database-engineer`, `auth-security`, `devops-cleanup`

| # | Task | Agente | Dipende da |
|---|------|--------|-----------|
| 1.1 | Design system + tema AzzeroCO2 Energy (light+dark) | ui-design-system | 0.3 |
| 1.2 | Splash screen con shimmer logo (7-8s) | frontend-core + ui-design-system | 0.3, 0.8 |
| 1.3 | Landing page con video hero + sezioni | frontend-core + ui-design-system | 1.1 |
| 1.4 | Layout dashboard (sidebar + header + content) | frontend-core | 1.1 |
| 1.5 | Schema database completo + Supabase migrations | database-engineer | 0.2 |
| 1.6 | Seed data (tecnologie, codici NACE, profili) | database-engineer | 1.5 |
| 1.7 | Auth system con Supabase Auth (login, register, org) | auth-security | 0.2, 1.5 |
| 1.8 | Multi-tenant RLS policies su Supabase | auth-security | 1.5 |
| 1.9 | Componenti base UI (DataTable, Form, Modal) | ui-design-system | 1.1 |
| 1.10 | Routing completo con navigation tree | frontend-core | 1.4 |
| 1.11 | Verifica struttura file e pulizia post-scaffolding | devops-cleanup | 0.7 |

### FASE 2 - DATA INPUT (Settimane 4-5)
**Agenti attivi**: `frontend-core`, `backend-api`, `ui-design-system`, `dataviz-dashboard`

| # | Task | Agente | Dipende da |
|---|------|--------|-----------|
| 2.1 | API CRUD: sites, analyses | backend-api | 1.3, 1.5 |
| 2.2 | API CRUD: demand, resources, technologies | backend-api | 1.3 |
| 2.3 | Pagina General Settings | frontend-core | 1.7, 2.1 |
| 2.4 | Pagina Demand con profili | frontend-core | 1.7, 2.2 |
| 2.5 | Pagina Resources | frontend-core | 1.7, 2.2 |
| 2.6 | Pagina Technologies con modal dettaglio | frontend-core + ui-design-system | 1.7, 2.2 |
| 2.7 | Pagina Storage | frontend-core | 1.7, 2.2 |
| 2.8 | Pagina Lighting (demand + relamping) | frontend-core | 1.7, 2.2 |
| 2.9 | Grafici profili energetici | dataviz-dashboard | 1.7, 2.4 |
| 2.10 | Upload bollette con drag & drop | backend-api + ui-design-system | 2.1 |

### FASE 3 - OPTIMIZATION ENGINE (Settimane 4-7, in parallelo con Fase 2)
**Agenti attivi**: `optimization-engine`, `testing-qa`

| # | Task | Agente | Dipende da |
|---|------|--------|-----------|
| 3.1 | Modello MILP base (solo elettricita') | optimization-engine | - |
| 3.2 | Estensione multi-vettore (calore, freddo) | optimization-engine | 3.1 |
| 3.3 | Gestione storage nel modello | optimization-engine | 3.2 |
| 3.4 | Doppia funzione obiettivo (costo/decarbon) | optimization-engine | 3.2 |
| 3.5 | FastAPI endpoints per solver | optimization-engine | 3.4 |
| 3.6 | Test con casi noti e benchmark | testing-qa | 3.5 |
| 3.7 | Ottimizzazione performance solver | optimization-engine | 3.6 |

### FASE 4 - SCENARIO MANAGEMENT (Settimane 6-7)
**Agenti attivi**: `scenario-manager`, `frontend-core`, `dataviz-dashboard`

| # | Task | Agente | Dipende da |
|---|------|--------|-----------|
| 4.1 | CRUD scenari + duplicazione | scenario-manager | 1.3, 2.2 |
| 4.2 | Config tecnologie per scenario (slider min/max) | scenario-manager + frontend-core | 4.1 |
| 4.3 | Job queue per lancio calcolo | scenario-manager | 3.5 |
| 4.4 | SSE progress tracking | scenario-manager + backend-api | 4.3 |
| 4.5 | Pagina risultati scenario (summary) | frontend-core + dataviz-dashboard | 4.3 |
| 4.6 | Pagina confronto scenari | frontend-core + dataviz-dashboard | 4.5 |
| 4.7 | Flag "[outdated]" su modifica input | scenario-manager | 4.3 |
| 4.8 | Pagina sussidi/incentivi | frontend-core | 4.5 |

### FASE 5 - WIZARD & REPORT (Settimane 8-9)
**Agenti attivi**: `energy-wizard`, `report-generator`

| # | Task | Agente | Dipende da |
|---|------|--------|-----------|
| 5.1 | Wizard step 1-2 (dati generali + consumi) | energy-wizard | 2.3, 2.10 |
| 5.2 | Wizard step 3-4 (domanda termica + tecnologie) | energy-wizard | 2.4, 2.6 |
| 5.3 | Wizard step 5 (sommario + lancio) | energy-wizard | 4.3 |
| 5.4 | Template report Word | report-generator | - |
| 5.5 | Generatore dati report (query + calcoli) | report-generator | 4.5 |
| 5.6 | Grafici statici per report | report-generator | 5.5 |
| 5.7 | Endpoint generazione + download | report-generator | 5.6 |
| 5.8 | Generazione PDF alternativa | report-generator | 5.4 |

### FASE 6 - DASHBOARD & MAPPA (Settimane 9-10)
**Agenti attivi**: `dataviz-dashboard`, `frontend-core`

| # | Task | Agente | Dipende da |
|---|------|--------|-----------|
| 6.1 | Dashboard homepage con KPI widgets | dataviz-dashboard | 4.5 |
| 6.2 | Mappa impianti interattiva | dataviz-dashboard | 2.1 |
| 6.3 | Vista satellitare per FV | dataviz-dashboard | 6.2 |
| 6.4 | Market prices widget | dataviz-dashboard | 2.5 |
| 6.5 | Dashboard aggregata multi-sito | dataviz-dashboard | 6.1, 6.2 |

### FASE 7 - MIGLIORAMENTI AI & UX (Settimane 10-11)
**Agenti attivi**: `energy-wizard`, `frontend-core`, `optimization-engine`

| # | Task | Agente | Dipende da |
|---|------|--------|-----------|
| 7.1 | OCR bollette con AI | energy-wizard | 2.10 |
| 7.2 | Suggerimenti AI su interventi | energy-wizard | 4.5 |
| 7.3 | Preview real-time impatto modifiche | optimization-engine + frontend-core | 4.2 |
| 7.4 | Benchmark settoriale (confronto media NACE) | dataviz-dashboard | 6.1 |
| 7.5 | Notifiche email calcolo completato | scenario-manager | 4.4 |
| 7.6 | Export multi-formato (Excel, PowerPoint) | report-generator | 5.7 |

### FASE 8 - TESTING & POLISH (Settimane 11-12)
**Agenti attivi**: `testing-qa`, tutti gli altri per fix

| # | Task | Agente | Dipende da |
|---|------|--------|-----------|
| 8.1 | E2E test flussi completi | testing-qa | Tutte le fasi |
| 8.2 | Performance testing | testing-qa | 8.1 |
| 8.3 | Accessibility audit | testing-qa | 8.1 |
| 8.4 | Security audit | auth-security | 8.1 |
| 8.5 | Bug fix e polish | Tutti | 8.1-8.4 |
| 8.6 | Deploy staging | architect-lead | 8.5 |
| 8.7 | UAT (User Acceptance Testing) | testing-qa | 8.6 |
| 8.8 | Deploy produzione | architect-lead | 8.7 |

---

## 6. MODULI APPLICATIVI DETTAGLIATI

### 6.1 Modulo: Site Management
```
Gestione impianti/siti del cliente.
Ogni organizzazione puo' avere N siti.
Ogni sito ha coordinate GPS, indirizzo, immagine satellitare.
```

**Campi**:
- `name`: Nome impianto
- `address`: Indirizzo completo
- `city`, `province`, `country`
- `latitude`, `longitude`
- `nace_code`: Codice ATECO/NACE
- `sector`: Settore industriale (derivato da NACE)
- `employees`: Numero addetti
- `area_sqm`: Superficie [m2]
- `roof_area_sqm`: Superficie tetto disponibile FV [m2]
- `operating_hours`: Ore operative/anno
- `working_days`: Giorni lavorativi (LUN-DOM selezionabili)

### 6.2 Modulo: Energy Demand
```
Definizione della domanda energetica annuale per end-use.
Supporta profili orari (8760h) e profili tipici giornalieri.
```

**End-uses supportati**:
| End-use | Descrizione | Unita' |
|---------|-------------|--------|
| `ELECTRICITY` | Domanda elettrica | MWh/anno |
| `HEAT_HIGH_T` | Calore alta temperatura (>200°C) | MWh/anno |
| `HEAT_MED_T` | Calore media temperatura (80-200°C) | MWh/anno |
| `HEAT_LOW_T` | Calore bassa temperatura (<80°C) | MWh/anno |
| `COLD` | Domanda frigorifera | MWh/anno |

**Profili**:
- **Profilo giornaliero tipo**: 24 valori orari normalizzati (somma = 1)
- **Profilo settimanale**: 7 x 24 = 168 valori
- **Profilo annuale completo**: 8760 valori orari
- **Profili preimpostati** per codice NACE (es: industria alimentare, uffici, GDO)

### 6.3 Modulo: Lighting
```
Sotto-modulo specifico per illuminazione.
Analisi zone illuminotecniche e proposta relamping LED.
```

**Lighting Demand**:
- Zone illuminotecniche (es: "Produzione", "Uffici", "Magazzino")
- Per ogni zona: % della domanda elettrica, tecnologia attuale (fluorescente, alogena, HID, LED)
- Ore di funzionamento per zona

**Relamping Technologies**:
- LED equivalenti per ogni tecnologia esistente
- CAPEX sostituzione
- Risparmio energetico %
- Lifetime [ore]

### 6.4 Modulo: Resources
```
Risorse energetiche disponibili con prezzi e limiti.
```

| Risorsa | Parametri |
|---------|-----------|
| Elettricita' rete | Prezzo acquisto [EUR/MWh], Prezzo vendita [EUR/MWh], Fattore CO2 [tCO2/MWh] |
| Gas naturale | Prezzo [EUR/MWh], Fattore CO2, Disponibilita' max [MWh/anno] |
| Biomassa | Prezzo, Fattore CO2, Disponibilita' |
| Gasolio | Prezzo, Fattore CO2, Disponibilita' |
| GPL | Prezzo, Fattore CO2, Disponibilita' |
| Solare | Irradiazione [kWh/m2/anno] (auto da coordinate), Costo 0 |
| Idrogeno verde | Prezzo, Fattore CO2 = 0 |

### 6.5 Modulo: Technologies
```
Catalogo tecnologie con parametri tecnico-economici.
Ogni tecnologia ha input (risorse consumate) e output (end-use prodotti).
```

**Tecnologie principali nel catalogo**:
| Tecnologia | Input | Output |
|-----------|-------|--------|
| Fotovoltaico | Solare | Elettricita' |
| Eolico | Vento | Elettricita' |
| Caldaia a gas | Gas naturale | Calore (H/M/L T) |
| Caldaia a biomassa | Biomassa | Calore (M/L T) |
| Pompa di calore aria-acqua | Elettricita' | Calore (L T) |
| Pompa di calore geotermica | Elettricita' | Calore (L/M T) |
| Chiller | Elettricita' | Freddo |
| Cogeneratore (CHP) | Gas naturale | Elettricita' + Calore |
| Trigeneratore (CCHP) | Gas naturale | Elettricita' + Calore + Freddo |
| Cappotto termico | - | Riduzione domanda calore |
| LED relamping | Elettricita' (ridotta) | Illuminazione |

**Parametri per tecnologia**:
- `capex_per_kw` [EUR/kW]
- `maintenance_annual` [EUR/kW/anno]
- `lifetime` [anni]
- `capacity_factor` [0-1]
- `min_size` [kW]
- `max_size` [kW]
- `inputs[]`: nome, share%, risorsa associata
- `outputs[]`: nome, efficienza%, end_use associato
- `hourly_profile_generation`: profilo orario di producibilita' (es: curva solare)
- `hourly_profile_flexibility`: profilo flessibilita' (es: pompa calore modulante)
- `subsidy`: incentivi applicabili (Conto Termico, Certificati Bianchi, Comunita' Energetiche)

### 6.6 Modulo: Storage / Accumulo
```
Sistemi di accumulo energetico.
```

| Tipo | Descrizione |
|------|------------|
| Batteria Li-ion | Accumulo elettrico |
| Accumulo termico | Serbatoio acqua calda |
| Accumulo freddo | Ice storage / serbatoio acqua fredda |

**Parametri**:
- `capacity` [kWh]
- `max_charge_rate` [kW]
- `max_discharge_rate` [kW]
- `charge_efficiency` [0-1]
- `discharge_efficiency` [0-1]
- `self_discharge_rate` [%/ora]
- `capex_per_kwh` [EUR/kWh]
- `cycles_lifetime`
- `min_soc`, `max_soc` [0-1]

---

## 7. SCHEMA DATABASE

### 7.1 Diagramma ER (semplificato)

```
organizations ──1:N── users (via user_organizations)
     |
     └──1:N── sites
                |
                └──1:N── analyses
                           |
                           ├──1:N── demands
                           ├──1:N── lighting_zones
                           ├──1:N── analysis_resources
                           ├──1:N── analysis_technologies
                           │         ├──1:N── tech_inputs
                           │         └──1:N── tech_outputs
                           ├──1:N── storage_systems
                           ├──1:N── time_series
                           ├──1:1── custom_code
                           │
                           └──1:N── scenarios
                                     ├──1:N── scenario_tech_configs
                                     └──1:1── scenario_results
                                               └──1:N── tech_results
```

### 7.2 Tabelle principali

```sql
-- MULTI-TENANCY
organizations (id, name, slug, logo_url, plan, created_at)
users (id, email, name, avatar_url, created_at)
user_organizations (user_id, org_id, role [admin|editor|viewer], joined_at)

-- SITES
sites (id, org_id, name, address, city, province, country,
       lat, lng, nace_code, sector, employees, area_sqm,
       roof_area_sqm, operating_hours, working_days[],
       satellite_image_url, created_at, updated_at)

-- ANALYSES
analyses (id, site_id, org_id, name, description, year, wacc,
          status [draft|ready|calculated], wizard_completed,
          created_by, created_at, updated_at)

-- DEMAND
demands (id, analysis_id, end_use, annual_consumption_mwh,
         profile_type [nace_default|custom|upload],
         hourly_profile FLOAT[8760], created_at, updated_at)

-- LIGHTING
lighting_zones (id, analysis_id, name, demand_share_pct,
                current_technology, hours_per_year, area_sqm)
relamping_techs (id, zone_id, new_technology, capex,
                 energy_saving_pct, lifetime_hours)

-- RESOURCES
analysis_resources (id, analysis_id, resource_type,
                    buying_price, selling_price, co2_factor,
                    max_availability, notes)

-- TECHNOLOGIES
technology_catalog (id, name, category, description,
                    capex_per_kw, maintenance_annual, lifetime,
                    capacity_factor, min_size_kw, max_size_kw,
                    is_global, org_id, icon, created_at)
tech_inputs (id, tech_id, name, share_pct, resource_type)
tech_outputs (id, tech_id, name, efficiency_pct, end_use)
tech_hourly_profiles (id, tech_id, profile_type, values FLOAT[8760])
tech_subsidies (id, tech_id, subsidy_type, value, description)

analysis_technologies (id, analysis_id, catalog_tech_id,
                       custom_capex, custom_maintenance,
                       custom_efficiency, notes)

-- STORAGE
storage_systems (id, analysis_id, name, type, capacity_kwh,
                 max_charge_kw, max_discharge_kw,
                 charge_eff, discharge_eff, self_discharge_rate,
                 capex_per_kwh, cycles_lifetime, min_soc, max_soc)

-- TIME SERIES & CUSTOM
time_series (id, analysis_id, name, description, values FLOAT[8760])
custom_code (id, analysis_id, language, code, description)

-- SCENARIOS
scenarios (id, analysis_id, name, description, is_as_is,
           year, objective [cost|decarbonization],
           max_capex, max_opex, max_co2,
           status [draft|queued|running|completed|failed|outdated],
           calculated_at, calculation_time_sec,
           created_at, updated_at)

scenario_tech_configs (id, scenario_id, tech_id, enabled,
                       min_size_kw, max_size_kw,
                       resource_mapping JSONB)

-- RESULTS
scenario_results (id, scenario_id, total_capex, total_opex,
                  total_co2_tons, total_energy_cost,
                  roi_pct, payback_years, opex_saving_pct,
                  co2_reduction_pct, npv, irr,
                  calculated_at)

tech_results (id, result_id, tech_id, optimal_size_kw,
              capex, annual_opex, annual_co2, annual_energy,
              capacity_utilization_pct,
              hourly_output FLOAT[8760])

-- REPORTS
reports (id, analysis_id, scenario_ids[], template, format,
         file_url, status [generating|ready|failed],
         generated_at, created_by)

-- FILES
files (id, org_id, analysis_id, type [bill|satellite|document],
       filename, mime_type, size_bytes, storage_url,
       ocr_result JSONB, uploaded_by, uploaded_at)

-- AUDIT
audit_log (id, org_id, user_id, action, entity_type, entity_id,
           details JSONB, ip_address, created_at)
```

---

## 8. API ENDPOINTS

### 8.1 Autenticazione
```
POST   /api/auth/register          Registrazione
POST   /api/auth/login             Login
POST   /api/auth/logout            Logout
POST   /api/auth/refresh           Refresh token
POST   /api/auth/forgot-password   Reset password
POST   /api/auth/verify-email      Verifica email
GET    /api/auth/me                Utente corrente
```

### 8.2 Organizzazioni
```
GET    /api/organizations                     Lista org utente
POST   /api/organizations                     Crea org
GET    /api/organizations/:id                 Dettaglio org
PATCH  /api/organizations/:id                 Modifica org
DELETE /api/organizations/:id                 Elimina org
GET    /api/organizations/:id/members         Lista membri
POST   /api/organizations/:id/invitations     Invita membro
DELETE /api/organizations/:id/members/:uid    Rimuovi membro
```

### 8.3 Siti / Impianti
```
GET    /api/sites                    Lista siti (filtrati per org)
POST   /api/sites                    Crea sito
GET    /api/sites/:id                Dettaglio sito
PATCH  /api/sites/:id                Modifica sito
DELETE /api/sites/:id                Elimina sito
GET    /api/sites/:id/satellite      Immagine satellitare
POST   /api/sites/:id/satellite      Carica/genera satellitare
```

### 8.4 Analisi
```
GET    /api/analyses                         Lista analisi
POST   /api/analyses                         Crea analisi
GET    /api/analyses/:id                     Dettaglio analisi
PATCH  /api/analyses/:id                     Modifica analisi
DELETE /api/analyses/:id                     Elimina analisi
POST   /api/analyses/:id/duplicate           Duplica analisi
GET    /api/analyses/:id/export              Esporta dati analisi
```

### 8.5 Domanda Energetica
```
GET    /api/analyses/:id/demands             Lista demand
POST   /api/analyses/:id/demands             Crea demand
PATCH  /api/demands/:id                      Modifica demand
DELETE /api/demands/:id                      Elimina demand
GET    /api/demands/:id/profile              Profilo orario
PUT    /api/demands/:id/profile              Aggiorna profilo
GET    /api/profiles/nace/:code              Profilo default per NACE
```

### 8.6 Illuminazione
```
GET    /api/analyses/:id/lighting/zones      Lista zone
POST   /api/analyses/:id/lighting/zones      Crea zona
PATCH  /api/lighting/zones/:id               Modifica zona
DELETE /api/lighting/zones/:id               Elimina zona
GET    /api/lighting/relamping-options        Opzioni relamping
```

### 8.7 Risorse
```
GET    /api/analyses/:id/resources           Lista risorse
POST   /api/analyses/:id/resources           Aggiungi risorsa
PATCH  /api/resources/:id                    Modifica risorsa
DELETE /api/resources/:id                    Elimina risorsa
GET    /api/market-data/electricity           Prezzi elettricita'
GET    /api/market-data/gas                   Prezzi gas
```

### 8.8 Tecnologie
```
GET    /api/technologies/catalog             Catalogo globale
GET    /api/technologies/catalog/:id         Dettaglio tecnologia
POST   /api/technologies/catalog             Crea custom (org)
GET    /api/analyses/:id/technologies        Tech in analisi
POST   /api/analyses/:id/technologies        Aggiungi tech
PATCH  /api/analysis-technologies/:id        Modifica config
DELETE /api/analysis-technologies/:id        Rimuovi tech
```

### 8.9 Storage
```
GET    /api/analyses/:id/storage             Lista storage
POST   /api/analyses/:id/storage             Aggiungi storage
PATCH  /api/storage/:id                      Modifica storage
DELETE /api/storage/:id                      Elimina storage
```

### 8.10 Scenari
```
GET    /api/analyses/:id/scenarios           Lista scenari
POST   /api/analyses/:id/scenarios           Crea scenario
GET    /api/scenarios/:id                    Dettaglio scenario
PATCH  /api/scenarios/:id                    Modifica scenario
DELETE /api/scenarios/:id                    Elimina scenario
POST   /api/scenarios/:id/duplicate          Duplica scenario
POST   /api/scenarios/:id/calculate          Lancia calcolo
GET    /api/scenarios/:id/progress           SSE progress
GET    /api/scenarios/:id/results            Risultati
GET    /api/scenarios/:id/results/tech/:tid  Risultati per tech
GET    /api/analyses/:id/scenarios/compare   Confronto scenari
```

### 8.11 Report
```
POST   /api/reports/generate                 Genera report
GET    /api/reports/:id/status               Status generazione
GET    /api/reports/:id/download             Download report
GET    /api/analyses/:id/reports             Lista report
```

### 8.12 Wizard
```
GET    /api/wizard/nace-codes                Lista codici NACE
GET    /api/wizard/profiles/:nace            Profili per settore
GET    /api/wizard/technologies/:nace        Tech suggerite per settore
POST   /api/wizard/complete                  Completa wizard (crea analisi)
POST   /api/wizard/parse-bill               OCR bolletta
```

### 8.13 Files
```
POST   /api/files/upload                     Upload file
GET    /api/files/:id                        Dettaglio file
GET    /api/files/:id/download               Download file
DELETE /api/files/:id                        Elimina file
```

---

## 9. DIPENDENZE TRA MODULI

### 9.1 Grafo delle dipendenze

```
FASE 0: Setup
   |
   v
FASE 1: Fondamenta
   |
   +-- Auth (1.5) -----> Tutte le pagine
   |
   +-- DB Schema (1.3) -> Tutti i moduli backend
   |
   +-- Design System (1.1) -> Tutti i componenti UI
   |
   +-- Layout (1.2) ----> Tutte le pagine
   |
   v
FASE 2: Data Input          FASE 3: Optimizer (parallelo)
   |                              |
   +-- API CRUD ------+          +-- Modello MILP
   |                   |          |
   +-- Pagine input    |          +-- FastAPI endpoints
   |                   |          |
   v                   v          v
FASE 4: Scenario Manager  <------+
   |
   +-- CRUD scenari
   +-- Job queue
   +-- Risultati
   |
   v
FASE 5: Wizard + Report
   |
   +-- Wizard (usa Data Input + Scenario)
   +-- Report (usa Risultati)
   |
   v
FASE 6: Dashboard + Mappa
   |
   +-- KPI widgets (usa Risultati)
   +-- Mappa (usa Sites)
   |
   v
FASE 7: AI & UX Enhancement
   |
   v
FASE 8: Testing & Deploy
```

### 9.2 Blockers critici
| Modulo bloccante | Moduli bloccati | Nota |
|-----------------|----------------|------|
| DB Schema (1.3) | Tutti i backend | Priorita' massima |
| Auth (1.5) | Tutte le pagine protette | Puo' essere stubbed inizialmente |
| Optimizer API (3.5) | Scenario calculate (4.3) | Path critico |
| Design System (1.1) | Tutti i componenti UI | Bastano i base components |

---

## 10. SKILLS MAPPATE PER AGENTE

### Agent 01 - Architect Lead
```
architecture-patterns          -> Pattern architetturali generali
architecture-decision-records  -> ADR per decisioni chiave
clean-architecture             -> Layered architecture
monorepo-management            -> Turborepo / pnpm workspaces
turborepo-monorepo             -> Configurazione Turborepo
docker-expert                  -> Docker Compose, multi-service
api-design-principles          -> Contratti API
microservices-patterns         -> Comunicazione tra servizi
software-architecture          -> Design complessivo
context-driven-development     -> CLAUDE.md e contesto progetto
claude-md-management           -> Gestione CLAUDE.md
deployment-pipeline-design     -> CI/CD architecture
github-actions-templates       -> GitHub Actions setup
```

### Agent 02 - Frontend Core
```
nextjs-app-router              -> App Router setup
nextjs-app-router-patterns     -> Pattern avanzati routing
next-best-practices            -> Best practices Next.js
nextjs-performance             -> Performance optimization
nextjs-data-fetching           -> Data fetching patterns
react-patterns                 -> React 19 patterns
react-state-management         -> Zustand, state management
responsive-design              -> Mobile responsive
typescript-advanced-types      -> TypeScript avanzato
modern-javascript-patterns     -> ES6+ patterns
react-modernization            -> React 19 features
nextjs-deployment              -> Deploy configuration
```

### Agent 03 - UI Design System
```
shadcn-ui                      -> Componenti Shadcn/UI
tailwind-css-patterns          -> Pattern Tailwind
tailwind-design-system         -> Design system con Tailwind
design-system-patterns         -> Pattern design system
frontend-design                -> Visual design
visual-design-foundations      -> Typography, color, spacing
interaction-design             -> Micro-interactions
accessibility-compliance       -> WCAG compliance
web-component-design           -> Component architecture
responsive-design              -> Breakpoints, layout
web-design-guidelines          -> UI guidelines
```

### Agent 04 - Dashboard & DataViz
```
data-visualization             -> Grafici e chart
data-storytelling              -> Narrative con dati
kpi-dashboard-design           -> Dashboard KPI
react-patterns                 -> Componenti React
frontend-design                -> Visual design
interaction-design             -> Interattivita' grafici
```

### Agent 05 - Backend API
```
api-design-principles          -> REST API design
nodejs-backend-patterns        -> Node.js patterns
nestjs                         -> Pattern NestJS (applicabili)
error-handling-patterns        -> Error handling
openapi-spec-generation        -> OpenAPI spec
drizzle-orm-patterns           -> Drizzle ORM usage
typescript-advanced-types      -> TypeScript backend
api-security-best-practices    -> API security
nextjs-authentication          -> Auth integration
```

### Agent 06 - Database
```
postgresql-table-design        -> Schema design
drizzle-orm-patterns           -> Drizzle models/migrations
database-migration             -> Migration management
sql-optimization-patterns      -> Query optimization
postgresql-optimization        -> PostgreSQL tuning
database-design                -> ER design
postgres-best-practices        -> PostgreSQL best practices
supabase-postgres-best-practices -> Se si usa Supabase
```

### Agent 07 - Optimization Engine
```
python-design-patterns         -> Pattern Python
fastapi-templates              -> FastAPI setup
python-performance-optimization -> Performance solver
python-testing-patterns        -> Test del solver
python-type-safety             -> Type hints
async-python-patterns          -> Async per FastAPI
python-error-handling          -> Error handling
python-project-structure       -> Struttura progetto Python
python-code-style              -> Code style
uv-package-manager             -> Gestione dipendenze Python
```

### Agent 08 - Scenario Manager
```
workflow-patterns              -> Workflow management
bullmq-specialist              -> Job queue BullMQ
cqrs-implementation            -> CQRS patterns
nodejs-backend-patterns        -> Backend patterns
error-handling-patterns        -> Error handling
saga-orchestration             -> Saga per job complessi
```

### Agent 09 - Report Generator
```
docx                           -> Generazione Word
pdf                            -> Generazione PDF
pptx                           -> Generazione PowerPoint
xlsx                           -> Generazione Excel
python-design-patterns         -> Pattern Python
data-storytelling              -> Struttura report
fastapi-templates              -> API per report
```

### Agent 10 - Energy Wizard
```
react-patterns                 -> Componenti wizard
shadcn-ui                      -> UI components
interaction-design             -> UX wizard
prompt-engineering             -> AI suggestions
ai-product                     -> AI integration
frontend-design                -> Visual design
```

### Agent 11 - Auth & Security
```
better-auth                    -> Better Auth setup
better-auth-best-practices     -> Best practices auth
auth-implementation-patterns   -> Auth patterns
nextjs-authentication          -> Next.js auth
two-factor-authentication-best-practices -> 2FA
email-and-password-best-practices -> Email/password
organization-best-practices    -> Multi-org
security-audit                 -> Security review
gdpr-data-handling             -> GDPR compliance
secrets-management             -> Secrets management
```

### Agent 12 - Testing & QA
```
e2e-testing-patterns           -> E2E con Playwright
javascript-testing-patterns    -> Test JS/TS
python-testing-patterns        -> Test Python
playwright-skill               -> Playwright setup
unit-testing-test-generate     -> Unit test generation
testing-patterns               -> Pattern generali test
wcag-audit-patterns            -> Accessibility test
github-actions-templates       -> CI pipeline
deployment-pipeline-design     -> CD pipeline
```

### Agent 13 - DevOps & Cleanup
```
docker-expert                  -> Docker/Docker Compose
vercel-deployment              -> Vercel deploy config
vercel-deploy-claimable        -> Vercel domain setup
supabase-automation            -> Supabase project setup
supabase-postgres-best-practices -> Supabase PostgreSQL
codebase-cleanup-refactor-clean -> Pulizia codice
codebase-cleanup-deps-audit    -> Audit dipendenze
codebase-cleanup-tech-debt     -> Technical debt
file-organizer                 -> Organizzazione file
deployment-procedures          -> Procedure deploy
secrets-management             -> Gestione secrets/.env
github-actions-templates       -> CI/CD setup
```

---

## 12. MIGLIORAMENTI RISPETTO A J4ENERGY

### 12.1 UX/UI
- [x] Design moderno con Tailwind + Shadcn (vs enterprise datato)
- [x] Dark mode nativo (default come Nexus)
- [x] Splash screen con shimmer logo AzzeroCO2 (7-8 secondi)
- [x] Landing page pubblica con video hero e CTA
- [x] Mobile responsive + PWA
- [x] Micro-animazioni Framer Motion e transizioni fluide
- [x] Layout arioso con piu' spazio bianco
- [x] Loading states con skeleton screens + shimmer effect
- [x] Font Inter, design token coerenti con brand AzzeroCO2

### 12.2 Funzionalita'
- [x] AI-powered wizard con OCR bollette
- [x] Preview real-time impatto modifiche
- [x] Collaborazione multi-utente con ruoli
- [x] Benchmark settoriale (confronto media NACE)
- [x] Versioning scenari
- [x] Notifiche email/push al termine calcoli
- [x] Export multi-formato (Word, PDF, Excel, PowerPoint)
- [x] API pubblica per integrazioni
- [x] Calcolo incrementale (solo delta)

### 12.3 Tecnico
- [x] Supabase Premium (Auth, DB, Storage, Realtime, Edge Functions)
- [x] Vercel Pro (preview deploys, edge network, analytics)
- [x] Calcoli piu' veloci con HiGHS (vs solver generico)
- [x] Supabase Realtime per progress real-time (vs polling)
- [x] Caching intelligente risultati
- [x] Multi-tenant nativo con RLS su Supabase
- [x] Audit log completo
- [x] GDPR compliant by design

---

## 13. CRITERI DI QUALITA' E ACCEPTANCE

### 13.1 Performance
| Metrica | Target |
|---------|--------|
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Time to Interactive | < 3.5s |
| API response (CRUD) | < 200ms p95 |
| Calcolo scenario (base) | < 60s |
| Calcolo scenario (complesso) | < 5min |
| Generazione report | < 30s |

### 13.2 Qualita' codice
| Metrica | Target |
|---------|--------|
| Test coverage (backend) | > 80% |
| Test coverage (frontend) | > 70% |
| TypeScript strict mode | Abilitato |
| ESLint errors | 0 |
| Accessibility (Lighthouse) | > 90 |
| Security (OWASP top 10) | 0 vulnerabilita' critiche |

### 13.3 Acceptance criteria chiave
1. Un utente puo' completare il wizard e ottenere risultati in < 10 minuti
2. Il report generato e' professionale e pronto per il cliente finale
3. Il confronto scenari mostra chiaramente le differenze di costo e CO2
4. La mappa mostra tutti gli impianti con navigazione fluida
5. Il sistema regge 50 utenti concorrenti senza degradazione
6. I dati di un'organizzazione non sono MAI visibili ad un'altra
7. L'ottimizzatore produce risultati coerenti con i vincoli impostati
8. Lo splash screen mostra il logo AzzeroCO2 con shimmer per 7-8 secondi
9. La landing page ha video in background, animazioni fluide, CTA funzionante
10. Dark mode completo e coerente su tutte le pagine

---

## STRUTTURA DIRECTORY FINALE

```
azzeroco2-platform/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── app/                      # App Router pages
│   │   │   ├── (auth)/               # Auth pages (login, register)
│   │   │   ├── (dashboard)/          # Protected dashboard layout
│   │   │   │   ├── dashboard/        # Homepage dashboard
│   │   │   │   ├── sites/            # Sites management
│   │   │   │   ├── analysis/[id]/    # Analysis pages
│   │   │   │   │   ├── data-input/   # All data input sub-pages
│   │   │   │   │   ├── scenarios/    # Scenario management
│   │   │   │   │   ├── results/      # Results & comparison
│   │   │   │   │   └── report/       # Report generation
│   │   │   │   ├── wizard/           # J4Wizard equivalent
│   │   │   │   └── settings/         # User/org settings
│   │   │   └── api/                  # API routes
│   │   ├── components/
│   │   │   ├── ui/                   # Shadcn base components
│   │   │   ├── shared/               # Business components
│   │   │   ├── charts/               # Chart components
│   │   │   ├── maps/                 # Map components
│   │   │   ├── wizard/               # Wizard components
│   │   │   └── dashboard/            # Dashboard widgets
│   │   ├── lib/                      # Utilities, API client
│   │   ├── hooks/                    # Custom React hooks
│   │   ├── stores/                   # Zustand stores
│   │   └── styles/                   # Global styles, theme
│   │
│   └── optimizer/                    # Python optimization service
│       ├── api/                      # FastAPI routes
│       ├── models/                   # Mathematical models
│       ├── solvers/                  # Solver wrappers
│       ├── report/                   # Report generation
│       │   ├── templates/            # Word/HTML templates
│       │   ├── generators/           # Format generators
│       │   └── charts/               # Static chart generation
│       ├── data/                     # Default data, NACE profiles
│       └── tests/                    # Optimizer tests
│
├── packages/
│   ├── db/                           # Database package
│   │   ├── schema/                   # Drizzle schema definitions
│   │   ├── migrations/               # SQL migrations
│   │   ├── seed/                     # Seed data
│   │   └── queries/                  # Complex queries
│   │
│   ├── shared/                       # Shared types & utilities
│   │   ├── types/                    # TypeScript types
│   │   ├── validators/               # Zod schemas
│   │   └── constants/                # Shared constants
│   │
│   └── config/                       # Shared configuration
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── tests/
│   ├── unit/                         # Unit tests
│   ├── integration/                  # Integration tests
│   └── e2e/                          # Playwright E2E tests
│
├── docker/
│   ├── Dockerfile.web                # Frontend Dockerfile
│   ├── Dockerfile.optimizer          # Python service Dockerfile
│   └── docker-compose.yml            # Full dev stack
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI: lint, test, build
│       ├── deploy-staging.yml        # Deploy to staging
│       └── deploy-production.yml     # Deploy to production
│
├── CLAUDE.md                         # Convenzioni progetto
├── turbo.json                        # Turborepo config
├── package.json                      # Root package.json
├── pnpm-workspace.yaml               # pnpm workspaces
└── AZZEROCO2_PROJECT_MAP.md          # Questo file
```

---

> **NOTA**: Questo documento e' la bussola del progetto. Ogni agente deve consultarlo
> prima di iniziare il lavoro per comprendere il proprio ruolo, le dipendenze, e
> i deliverable attesi. Il documento verra' aggiornato man mano che il progetto evolve.
