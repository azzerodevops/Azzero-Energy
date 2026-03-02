# AZZEROCO2 ENERGY - DESIGN REFERENCE

> Questo file contiene tutti i riferimenti visivi, colori, animazioni e specifiche
> di design per l'applicazione AzzeroCO2 Energy.

---

## 1. BRAND IDENTITY

### 1.1 Nome applicazione
**AzzeroCO2 Energy**
- Tagline: "il clima nelle nostre mani"

### 1.2 Loghi disponibili
| File | Uso | Colori |
|------|-----|--------|
| `AZZEROCO2_LOGO_PAYOFF_ITA_POS.svg` | Su sfondo scuro | Tutto bianco (#fff) |
| `AzzeroCO2_LOGO_PAYOFF_ITA.svg` | Su sfondo chiaro | Blu #0097D7 + Nero #1D1D1B |
| `/LOGO_AZZERO_Bianco.png` | Splash screen, sidebar dark | Bianco (da creare dal SVG POS) |

### 1.3 Colori brand
```
Primary Blue:     #0097D7  (hsl 198 100% 42%)
Primary Dark:     #0284C7  (hsl 201 96% 32%)  - variante piu' profonda
Secondary Green:  #00B894  (hsl 169 100% 36%)
Accent Cyan:      #22D3EE  (hsl 186 94% 57%)
Dark Text:        #1D1D1B
```

### 1.4 Video di sfondo disponibili
| File | Risoluzione | FPS | Uso suggerito |
|------|-------------|-----|---------------|
| `12808704_1920_1080_25fps.mp4` | 1920x1080 | 25 | Hero landing page |
| `13578301-uhd_3840_2160_30fps.mp4` | 3840x2160 | 30 | Background sezione |
| `14044733_1080_1920_48fps.mp4` | 1080x1920 | 48 | Mobile/vertical |
| `4249216-uhd_3840_2160_24fps.mp4` | 3840x2160 | 24 | Background hero UHD |

---

## 2. SPLASH SCREEN / LOADING (da Nexus)

### 2.1 Specifica completa
Durata totale: **7-8 secondi** (3.5s animazione x2 cicli circa)

**Struttura a 2 layer sovrapposti:**

```
[BACKGROUND: #0f172a / #121827 solid dark navy]

  [LAYER 1 - Ghost/dim logo]
    <img src="logo_bianco.png" class="h-20 opacity-[0.15]" />
    <p class="text-[13px] text-white/20 tracking-wide font-light">
      Caricamento in corso...
    </p>

  [LAYER 2 - Shimmer overlay, position: absolute inset-0]
    <div style="
      mask-image: linear-gradient(110deg, transparent 30%, white 50%, transparent 70%);
      mask-size: 300% 100%;
      mask-repeat: no-repeat;
      animation: logo-wave 3.5s ease-in-out infinite;
    ">
      <img src="logo_bianco.png" class="h-20" />
      <p class="text-[13px] text-white/60 tracking-wide font-light">
        Caricamento in corso...
      </p>
    </div>
```

### 2.2 Animazione shimmer (CSS)
```css
@keyframes logo-wave {
  0%   { mask-position: 200% center; -webkit-mask-position: 200% center; }
  100% { mask-position: -100% center; -webkit-mask-position: -100% center; }
}
```

**Come funziona:**
- Il logo fantasma sta a opacity 0.15 come base
- Un secondo logo identico e' sovrapposto, mascherato da un gradient diagonale (110deg)
- La maschera e' 300% piu' larga dell'elemento
- L'animazione sposta la maschera da destra a sinistra in 3.5s
- La banda luminosa diagonale scorre sul logo creando l'effetto "shimmer/shine"

### 2.3 Flusso completo splash
```
intro-loading (3s) -> onboarding (opzionale) -> loading (3s) -> GDPR -> App
```

Per AzzeroCO2 Energy: semplificare a **splash (7-8s) -> App**

---

## 3. LANDING PAGE (da Dashboard DemoAzzero)

### 3.1 Stack tecnico di riferimento
- React + Vite SPA
- Tailwind CSS + Shadcn/UI
- Recharts per grafici
- Framer Motion per animazioni
- Font: Inter (300-800) via Google Fonts

### 3.2 Design Tokens (da implementare)

**Light Mode:**
```css
:root {
  --primary: 198 100% 42%;           /* #0097D7 */
  --primary-foreground: 210 40% 98%;
  --secondary: 169 100% 36%;         /* #00B894 */
  --background: 210 40% 98%;         /* #f4f7fa */
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;                 /* #ffffff */
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --border: 214 32% 91%;
  --destructive: 0 84% 60%;
  --radius: 0.5rem;
}
```

**Dark Mode:**
```css
.dark {
  --background: 222 47% 11%;         /* #121827 */
  --foreground: 210 40% 98%;
  --card: 217 33% 17%;               /* #1e293b */
  --muted: 217 33% 17%;
  --border: 215 25% 27%;
  --radius: 0.75rem;                  /* Piu' morbido in dark */
}
```

### 3.3 Palette grafici
```
Chart 1: #0097D7  (primary blue)
Chart 2: #00B894  (green)
Chart 3: #5FC5B8  (teal)
Chart 4: #4A9FD8  (steel blue)
Chart 5: #FFB020  (amber)
Extra:   #E17055  (coral - warning)
Extra:   #7C3AED  (purple - governance)
Extra:   #0D9488  (dark teal - carbon)
Extra:   #E879A8  (pink - accent)
```

### 3.4 Layout Landing Page
La landing page di AzzeroCO2 Energy sara' composta da:

```
+------------------------------------------------------------------+
| HEADER: Logo AzzeroCO2 Energy | Nav links | Login CTA            |
+------------------------------------------------------------------+
|                                                                    |
| HERO SECTION (con video background)                                |
| - Video loop in background (uno dei 4 video)                      |
| - Overlay gradient scuro                                          |
| - Titolo: "Decarbonizza il tuo impianto"                         |
| - Sottotitolo: "Piattaforma intelligente per audit energetici,   |
|   ottimizzazione e pianificazione della decarbonizzazione"        |
| - CTA: "Inizia ora" + "Scopri di piu'"                           |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
| FEATURES SECTION (3-4 card con icone)                              |
| [Audit Energetico] [Ottimizzazione] [Scenari] [Report]           |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
| COME FUNZIONA (3 step illustrati)                                  |
| 1. Carica i dati  2. Simula scenari  3. Genera report             |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
| DASHBOARD PREVIEW (screenshot/mockup della dashboard)              |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
| FOOTER: Logo | Link | Privacy | Contatti                          |
|                                                                    |
+------------------------------------------------------------------+
```

### 3.5 Animazioni (Framer Motion)
```javascript
// Fade-in dal basso per sezioni
const sectionVariant = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.2, duration: 0.5 }
};

// Tab underline animation
const tabUnderline = {
  transition: "left 300ms cubic-bezier(.4,0,.2,1), width 300ms cubic-bezier(.4,0,.2,1)"
};

// Skeleton loading
@keyframes skeleton-loading {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// Float animation (per elementi decorativi)
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}

// Pulse ring (per badge/notifiche)
@keyframes pulse-ring {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.5; transform: scale(1.05); }
}
```

---

## 4. DASHBOARD INTERNA (dopo login)

### 4.1 Layout principale
```
+--+----------------------------------------------------+
|  |  HEADER: [Logo] [Nome analisi] [Toolbar] [Avatar]  |
|  +----------------------------------------------------+
| S|                                                      |
| I|  CONTENT AREA                                        |
| D|                                                      |
| E|  - Pagine cambiano dinamicamente                     |
| B|  - Background: #f4f7fa (light) / #121827 (dark)     |
| A|  - Card bianche / #1e293b (dark)                     |
| R|                                                      |
|  |                                                      |
+--+----------------------------------------------------+
```

### 4.2 Sidebar
- Collassabile (larghezza collapsed: ~60px, expanded: ~240px)
- Sfondo: bianco (light) / #121827 (dark)
- Logo in alto
- Menu ad albero con icone Lucide
- Active state: barra laterale sinistra 2px #0097D7
- Hover: bg-muted con transizione

### 4.3 Tipografia
- **Font**: Inter (Google Fonts)
- **Pesi**: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
- **Heading 1**: text-3xl font-bold (30px)
- **Heading 2**: text-2xl font-bold (24px)
- **Heading 3**: text-xl font-semibold (20px)
- **Body**: text-base (16px)
- **Small/Caption**: text-[13px] font-light tracking-wide
- **KPI values**: text-5xl/6xl font-bold text-[#0097D7]

---

## 5. COMPONENTI UI CHIAVE

### 5.1 KPI Card
```
+-------------------------------------------+
| [Icon]  Titolo metrica                    |
|                                           |
|         1,234.56                          |
|         (text-3xl font-bold #0097D7)      |
|                                           |
|         +2.3% vs anno precedente          |
|         (badge verde o rosso con freccia) |
+-------------------------------------------+
```

### 5.2 Shimmer Card (loading state)
```css
.shimmer {
  position: relative;
  overflow: hidden;
}
.shimmer::after {
  content: "";
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%);
  animation: shimmer 2s infinite;
}
@keyframes shimmer {
  0%  { left: -100%; }
  100% { left: 100%; }
}
```

### 5.3 Navigazione tab con underline animata
```css
.tab-indicator {
  position: absolute;
  bottom: 0;
  height: 2px;
  background: hsl(var(--primary));
  transition: left 300ms cubic-bezier(.4,0,.2,1),
              width 300ms cubic-bezier(.4,0,.2,1);
}
```
