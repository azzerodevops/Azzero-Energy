# AzzeroCO2 Energy — Documentazione Completa

> "Il clima nelle nostre mani"

## Cos'e AzzeroCO2 Energy

AzzeroCO2 Energy e una piattaforma SaaS per **audit energetici, ottimizzazione e decarbonizzazione** di edifici industriali e commerciali. Consente a consulenti energetici, facility manager e aziende di:

- Modellare la situazione energetica attuale (AS-IS) di uno o piu impianti
- Simulare scenari di intervento (fotovoltaico, pompe di calore, batterie, involucro edilizio, ecc.)
- Ottimizzare la selezione tecnologica per minimizzare costi o massimizzare la decarbonizzazione
- Generare report professionali con analisi finanziaria
- Tracciare risparmi energetici e riduzione CO2 su piu siti

---

## Architettura Tecnica

### Stack Tecnologico

| Componente | Tecnologia |
|------------|-----------|
| **Frontend** | Next.js 15 + React 19 + Tailwind CSS 4 + Shadcn/UI |
| **Backend** | Python 3.12 + FastAPI + PuLP (solver MILP) |
| **Database** | PostgreSQL via Supabase Premium (RLS multi-tenant) |
| **ORM** | Drizzle ORM (TypeScript) |
| **Auth** | Supabase Auth (JWT) |
| **Storage** | Supabase Storage (documenti e report) |
| **AI** | Claude API (OCR bollette + suggerimenti tecnologici) |
| **Deploy** | Vercel Pro (frontend) + Railway (optimizer Python) |
| **CI/CD** | GitHub Actions (lint, type-check, build) |
| **Monorepo** | Turborepo + pnpm workspaces |

### Struttura del Progetto

```
apps/
  web/              -> Next.js 15 frontend (App Router)
    src/
      app/          -> Route handlers + pagine
      components/   -> Componenti React (organizzati per dominio)
      actions/      -> 13 moduli di Server Actions
      lib/          -> Utilities, client Supabase, auth
      stores/       -> Zustand state stores
    public/         -> Loghi, video, assets

  optimizer/        -> Python FastAPI engine
    config.py       -> Settings (Pydantic)
    main.py         -> FastAPI app setup
    models/         -> Modelli input/output (Pydantic)
    db/             -> Client Supabase
    solver/         -> Solver MILP (PuLP + HiGHS)
    routes/         -> Endpoint API
    ocr/            -> Scansione bollette (Claude Vision)
    ai/             -> Suggerimenti AI (Claude)
    report/         -> Generazione report (DOCX/XLSX/PPTX)
    profiles/       -> Generazione profili energetici
    notifications/  -> Sistema email

packages/
  config/           -> Configurazioni condivise ESLint + TypeScript
  shared/           -> Tipi, validatori Zod, costanti
  db/               -> Schema Drizzle ORM (15 file, 22 tabelle)
```

---

## Funzionalita Implementate

### 1. Gestione Siti (Impianti)
- Creazione e gestione di impianti energetici con dati geografici, settoriali e operativi
- Codice NACE con auto-compilazione dei dati energetici settoriali
- Ricerca indirizzo con geocoding (Nominatim API)
- Coordinate GPS per visualizzazione su mappa

### 2. Wizard Analisi (5 Step)
Procedura guidata per la creazione di analisi complete:
1. **Generale**: Selezione impianto, nome analisi, anno, WACC
2. **Consumi**: Definizione domande energetiche (elettricita, calore a 3 livelli, freddo) + OCR bollette + stima AI
3. **Termico/Illuminazione**: Zone di riscaldamento/raffrescamento e illuminazione
4. **Tecnologie**: Selezione dal catalogo tecnologico con vincoli min/max
5. **Riepilogo**: Revisione e creazione atomica

### 3. Creazione Manuale Analisi
Percorso alternativo al wizard per utenti esperti:
- Creazione rapida con dati essenziali (nome, impianto, anno)
- Compilazione di ogni sezione tramite le 9 tab dedicate

### 4. Dettaglio Analisi (9 Tab)
| Tab | Contenuto |
|-----|-----------|
| **Generale** | Metadati analisi, WACC, descrizione |
| **Domanda** | Profili di domanda energetica (8760h) + grafici |
| **Risorse** | Risorse energetiche con prezzi e fattori CO2 |
| **Tecnologie** | Catalogo tecnologico applicato all'analisi |
| **Accumulo** | Sistemi batteria e accumulo termico |
| **Illuminazione** | Zone illuminazione per retrofit LED |
| **File** | Upload/download documenti |
| **Scenari** | Gestione scenari di ottimizzazione |
| **Report** | Generazione e download report |

### 5. Motore di Ottimizzazione (MILP)
- **Formulazione**: Programmazione Lineare Intera Mista (MILP)
- **Variabili**: Capacita installata, selezione tecnologia (binaria), flussi energetici orari (8760h), stato di carica storage
- **Vincoli**: Bilancio domanda multi-vettore, limiti capacita, dinamiche storage (SOC ciclico), disponibilita risorse
- **Obiettivi**: Minimizzazione costo (CRF annualizzato) OPPURE minimizzazione CO2 (con vincolo budget)
- **Solver**: PuLP con HiGHS (fallback CBC), timeout 5 minuti

### 6. Gestione Scenari
- Creazione scenari con obiettivo (costo o decarbonizzazione)
- Configurazione vincoli per tecnologia (min/max capacita, force-include)
- Budget limit opzionale
- Lancio ottimizzazione con polling stato ogni 3s
- Validazione pre-lancio con errori, warning e auto-fix
- Confronto multi-scenario

### 7. Risultati Ottimizzazione
- **KPI Finanziari**: CAPEX, OPEX, risparmio annuo, payback, IRR, NPV
- **KPI Ambientali**: Riduzione CO2 (%), mix energetico
- **Dettaglio per tecnologia**: Capacita ottimale, produzione annua, risparmio
- **Grafici**: CAPEX vs risparmio (bar), produzione per tecnologia (pie)

### 8. Generazione Report Multi-formato
| Formato | Contenuto |
|---------|-----------|
| **DOCX** | Documento completo 6 sezioni (copertina, sito, situazione attuale, interventi, analisi finanziaria, conclusioni) |
| **XLSX** | 4 fogli Excel (riepilogo, consumi, tecnologie, analisi finanziaria) |
| **PPTX** | 9+ slide con grafici branded |

Grafici generati con Matplotlib (tema dark branded):
- Mix energetico (pie), breakdown CAPEX (hbar), CAPEX vs risparmio (grouped bar), cashflow (line)

### 9. OCR Bollette
- Upload drag & drop di immagini bollette energetiche
- Estrazione dati automatica via Claude Vision (claude-haiku-4-5-20251001)
- Dati estratti: fornitore, periodo, consumo kWh, importo EUR, prezzo unitario, potenza, POD
- Correzione manuale post-OCR

### 10. Suggerimenti AI
- Analisi della situazione energetica corrente
- Raccomandazioni tecnologiche personalizzate
- Stima consumi energetici basata su codice NACE + area + dipendenti
- Chat interattiva per affinamento stime

### 11. Dashboard Analitica
- 6 KPI cards (siti, analisi, scenari, CAPEX totale, risparmio, CO2)
- 3 grafici Recharts (analisi/mese, scenari/stato, top siti risparmio)
- Feed attivita recenti (ultime 10 azioni)
- Tabella multi-sito aggregata con sorting/filtering
- Widget prezzi PUN/PSV con mini sparkline

### 12. Mappa Interattiva
- Leaflet con OpenStreetMap tiles
- Marker per ogni sito con popup dettagliato
- Sidebar filtro per settore NACE
- Toggle vista satellite (Esri World Imagery)
- Calcolo potenziale fotovoltaico semplificato

### 13. Sistema Notifiche Email
- Notifiche scenario completato/fallito
- Template HTML branded
- Fallback console log (sviluppo)

---

## Flussi Utente Principali

### Flusso A: Setup Organizzazione
1. Splash screen (shimmer 7-8s) -> Landing page con video hero
2. Registrazione (email + nome organizzazione)
3. Supabase Auth crea utente, organizzazione e membership

### Flusso B: Creazione Impianto
1. Dashboard -> Impianti -> "Nuovo impianto"
2. Compilazione: nome, indirizzo (geocoding), NACE, area, dipendenti, ore operative
3. Salvataggio con isolamento multi-tenant (RLS)

### Flusso C: Analisi con Wizard
1. Analisi -> "Nuova analisi" -> "Procedura guidata"
2. 5 step: Generale -> Consumi (+ OCR bollette) -> Termico -> Tecnologie -> Riepilogo
3. Creazione atomica: analisi + domande + zone illuminazione + tecnologie + risorse default + scenario base

### Flusso D: Analisi Manuale
1. Analisi -> "Nuova analisi" -> "Creazione manuale"
2. Compilazione dati base (nome, impianto, anno, WACC)
3. Redirect alla pagina dettaglio per compilare ogni tab manualmente

### Flusso E: Ottimizzazione
1. Analisi -> Scenari -> Configura obiettivo e vincoli
2. Lancio ottimizzazione -> Backend MILP (5 min timeout)
3. Polling status -> Risultati con KPI e grafici

### Flusso F: Report
1. Analisi -> Report -> Seleziona scenario e formato
2. Generazione background -> Download

---

## Database (22 Tabelle, 12 Enum)

### Schema Principale

| Tabella | Descrizione |
|---------|-------------|
| `organizations` | Aziende/tenant con piano (free/pro/enterprise) |
| `users` | Account utente (link Supabase Auth) |
| `user_organizations` | Relazione N:M utenti-organizzazioni con ruoli |
| `sites` | Impianti con localizzazione, NACE, area, tetto |
| `analyses` | Audit energetici con anno, WACC, status |
| `demands` | Domande energetiche (5 vettori + profili 8760h) |
| `lighting_zones` | Zone illuminazione per retrofit |
| `analysis_resources` | Risorse energetiche con prezzi e CO2 |
| `technology_catalog` | Catalogo tecnologie (globale + custom) |
| `tech_inputs` / `tech_outputs` | Fattori conversione tecnologie |
| `analysis_technologies` | Tecnologie applicate a ogni analisi |
| `storage_systems` | Batterie e accumulo termico |
| `scenarios` | Scenari what-if con obiettivo e vincoli |
| `scenario_tech_configs` | Vincoli per-tecnologia per scenario |
| `scenario_results` | Risultati aggregati (CAPEX, OPEX, IRR, NPV, CO2) |
| `tech_results` | Risultati per-tecnologia (capacita, produzione, risparmio) |
| `reports` | Documenti generati (DOCX/XLSX/PPTX) |
| `files` | Upload documenti |
| `time_series` | Dati orari (prezzi, meteo, produzione) |
| `nace_codes` | ~58 codici classificazione settoriale |
| `audit_logs` | Log attivita per compliance |
| `subscriptions` | Abbonamenti e fatturazione |

### Enum
`organization_plan`, `user_role`, `analysis_status`, `scenario_status`, `objective`, `end_use`, `profile_type`, `resource_type`, `storage_type`, `report_format`, `subscription_status`, `time_series_type`

---

## API Backend (Python FastAPI)

### Ottimizzazione
| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/solve/{id}` | POST | Avvia ottimizzazione scenario (background) |
| `/solve/{id}/status` | GET | Polling stato (queued/running/completed/failed) |
| `/solve/{id}/results` | GET | Risultati completi |
| `/solve/{id}/validate` | GET | Pre-validazione senza esecuzione |

### Report
| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/report/{id}` | POST | Avvia generazione report (DOCX/XLSX/PPTX) |
| `/report/{job_id}/status` | GET | Stato generazione |
| `/report/{job_id}/download` | GET | Download file |

### AI & OCR
| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/ocr/bill` | POST | Upload immagine bolletta -> dati estratti |
| `/ai/suggestions/{id}` | POST | Suggerimenti tecnologici AI |
| `/ai/estimate` | POST | Stima consumi da caratteristiche sito |

### Profili
| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/profiles/generate` | POST | Preview profilo 8760h (288 punti) |
| `/profiles/apply/{id}` | POST | Genera e salva profili per tutte le domande |

### Health
| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/health` | GET | Status + versione (v0.3.0) |

---

## Server Actions (Next.js)

13 moduli di server actions per operazioni CRUD sicure:

| Modulo | Funzioni | Descrizione |
|--------|----------|-------------|
| `analyses.ts` | 4 | Create, update, delete, duplicate analisi |
| `scenarios.ts` | 11 | CRUD scenari + lancio ottimizzazione + polling |
| `wizard.ts` | 1 | Completamento atomico wizard (7 step) |
| `demands.ts` | 3 | CRUD domande energetiche |
| `technologies.ts` | 4 | Catalogo + CRUD tech analisi |
| `resources.ts` | 3 | CRUD risorse energetiche |
| `storage.ts` | 3 | CRUD sistemi accumulo |
| `lighting.ts` | 3 | CRUD zone illuminazione |
| `files.ts` | 2 | Upload/delete documenti |
| `reports.ts` | 2 | Lista/delete report |
| `sites.ts` | 5 | CRUD siti + NACE codes |
| `dashboard.ts` | 5 | KPI, grafici, attivita, mappa, multi-sito |
| `benchmark.ts` | 1 | Benchmarking efficienza energetica |

---

## Design System

### Brand
- **Primary Blue**: `#0097D7` | **Secondary Green**: `#00B894`
- **Dark Background**: `#121827` | **Card Dark**: `#1E293B`
- **Font**: Inter (300-800) | **Icons**: Lucide React
- **Dark mode**: Default

### Componenti UI
- 22 componenti Shadcn/UI + 3 custom (DataTable, LoadingSkeletons, KPICard)
- Animazioni: splash shimmer, Framer Motion, tab transitions
- Responsive: mobile-first con Tailwind breakpoints
- Toast: Sonner per notifiche

---

## Sicurezza

- **Autenticazione**: Supabase Auth con JWT e refresh sessione via middleware
- **Multi-tenant**: RLS (Row-Level Security) PostgreSQL con funzioni helper
- **Ruoli**: Admin, Editor, Viewer per organizzazione
- **Validazione**: Zod a tutti i confini di sistema
- **Headers**: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy

---

## Come Avviare

### Prerequisiti
- Node.js 24+, pnpm 10+, Python 3.12+

### Frontend
```bash
pnpm install
pnpm --filter @azzeroco2/web dev
# -> http://localhost:3000
```

### Backend (Optimizer)
```bash
cd apps/optimizer
pip3 install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
# -> http://localhost:8000
```

### Variabili d'Ambiente
Copiare `.env.example` -> `.env` e configurare:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_JWT_SECRET`
- `OPTIMIZER_SUPABASE_URL` / `OPTIMIZER_SUPABASE_SERVICE_KEY`
- `ANTHROPIC_API_KEY` (per OCR e AI)

---

## Aree di Miglioramento Identificate

### Priorita Alta
1. **Autorizzazione**: Aggiungere verifica ownership organizzazione in tutte le operazioni CRUD
2. **Filtro multi-tenant**: Dashboard e query devono filtrare per `organization_id`
3. **Accessibilita**: ARIA labels, navigazione keyboard, contrasto colori WCAG AA
4. **Mobile**: Navigation drawer, tabelle responsive, touch targets 44x44px

### Priorita Media
5. **Transazioni**: Wrap `completeWizard` in transazione atomica (stored procedure)
6. **Indici DB**: Aggiungere indici su FK principali (organization_id, analysis_id, etc.)
7. **Tipo sicurezza**: Sostituire `as any` con tipi Zod inferiti nei form
8. **WebSocket**: Sostituire polling 3s con Supabase Realtime o SSE
9. **Rate limiting**: Proteggere API OCR e AI suggestions

### Priorita Bassa
10. **Soft delete**: Aggiungere `deleted_at` per recupero dati
11. **Job persistence**: Redis/PostgreSQL per report generation jobs
12. **Export CSV**: Aggiungere export per tabelle dashboard
13. **Command palette**: Ctrl+K per ricerca rapida nell'app
14. **Onboarding**: Tutorial in-app per nuovi utenti
