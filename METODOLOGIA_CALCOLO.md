# AzzeroCO2 Energy - Metodologia di Calcolo

**Versione**: 1.0
**Data**: Marzo 2026
**Destinatari**: Esperti energetici, auditor, revisori tecnici
**Classificazione**: Documento tecnico di validazione

---

## Indice

1. [Introduzione](#1-introduzione)
2. [Modello di Domanda Energetica](#2-modello-di-domanda-energetica)
3. [Profili Settoriali NACE](#3-profili-settoriali-nace)
4. [Catalogo Tecnologico](#4-catalogo-tecnologico)
5. [Formulazione Matematica dell'Ottimizzazione](#5-formulazione-matematica-dellottimizzazione)
6. [Indicatori Finanziari](#6-indicatori-finanziari)
7. [Calcolo Riduzione CO2](#7-calcolo-riduzione-co2)
8. [Generazione Profili di Domanda 8760h](#8-generazione-profili-di-domanda-8760h)
9. [Stima Consumi AI](#9-stima-consumi-ai)
10. [Ipotesi e Limitazioni](#10-ipotesi-e-limitazioni)
11. [Fonti e Riferimenti](#11-fonti-e-riferimenti)

---

## 1. Introduzione

### 1.1 Scopo del Documento

Questo documento descrive in modo esaustivo la metodologia di calcolo adottata dalla piattaforma **AzzeroCO2 Energy** per l'analisi energetica, l'ottimizzazione e la decarbonizzazione di siti industriali e commerciali.

Il documento e destinato a esperti energetici, auditor certificati e revisori tecnici che necessitano di comprendere e validare:

- Le ipotesi di modellazione adottate
- Le formule matematiche utilizzate nel motore di ottimizzazione
- I valori di default e i parametri assunti
- Le limitazioni e semplificazioni del modello

### 1.2 Approccio Generale

La piattaforma utilizza un modello di **Programmazione Lineare Mista Intera (MILP - Mixed Integer Linear Programming)** con risoluzione oraria su un orizzonte temporale di **8.760 ore** (1 anno non bisestile). Il modello determina il dimensionamento ottimale delle tecnologie energetiche e il dispacciamento orario delle risorse, minimizzando il costo totale annualizzato oppure le emissioni di CO2.

Il solver utilizzato e **HiGHS** (con fallback su **CBC**), con un timeout configurabile di **300 secondi** (default).

### 1.3 Vettori Energetici Modellati

La piattaforma modella **5 vettori energetici** (end-use):

| Codice | Descrizione | Unita |
|--------|-------------|-------|
| `ELECTRICITY` | Elettricita | kWh |
| `HEAT_HIGH_T` | Calore ad alta temperatura (>150 C) | kWh_th |
| `HEAT_MED_T` | Calore a media temperatura (60-150 C) | kWh_th |
| `HEAT_LOW_T` | Calore a bassa temperatura (<60 C) | kWh_th |
| `COLD` | Freddo (raffrescamento) | kWh_fr |

### 1.4 Risorse Energetiche

Le risorse energetiche acquistabili/vendibili nel modello sono:

| Codice | Descrizione | Acquistabile | Vendibile |
|--------|-------------|:---:|:---:|
| `electricity` | Rete elettrica | Si | Si |
| `natural_gas` | Gas naturale | Si | No |
| `biomass` | Biomassa | Si | No |
| `diesel` | Gasolio | Si | No |
| `lpg` | GPL | Si | No |
| `solar` | Risorsa solare | Si | No |
| `wind` | Risorsa eolica | Si | No |
| `hydrogen` | Idrogeno | Si | No |

**Nota**: Solo l'elettricita puo essere rivenduta alla rete (immissione in rete). Le altre risorse sono solo acquistabili.

---

## 2. Modello di Domanda Energetica

### 2.1 Struttura della Domanda

Ogni analisi energetica e composta da una o piu **domande**, ciascuna definita da:

- **Vettore energetico** (end-use): uno dei 5 vettori sopra elencati
- **Consumo annuo** in MWh
- **Tipo di profilo**: determina la forma del carico orario
- **Profilo orario**: 8.760 valori in kWh (uno per ogni ora dell'anno)

### 2.2 Tipi di Profilo Disponibili

| Tipo | Descrizione | Ore operative tipiche |
|------|-------------|----------------------|
| `flat` | Carico costante durante le ore operative | Configurabile |
| `office` | Ufficio italiano tipico (8:00-18:00 lun-ven) | ~2.200 |
| `industrial_1shift` | Industria turno singolo (06:00-14:00 lun-ven) | ~2.000 |
| `industrial_2shift` | Industria doppio turno (06:00-22:00 lun-ven) | ~4.000 |
| `industrial_3shift` | Industria ciclo continuo (24/7) | 8.760 |
| `commercial` | Commerciale/retail (09:00-21:00, weekend incluso) | ~3.000 |
| `residential` | Residenziale (doppio picco mattino/sera) | 8.760 |
| `nace_default` | Default basato sul codice NACE del sito | Da profilo NACE |

### 2.3 Mapping Profilo Default per Vettore

Quando non viene specificato un tipo di profilo, il sistema assegna automaticamente:

| Vettore energetico | Profilo default |
|---------------------|-----------------|
| ELECTRICITY | `office` |
| HEAT_HIGH_T | `industrial_1shift` |
| HEAT_MED_T | `industrial_1shift` |
| HEAT_LOW_T | `office` |
| COLD | `office` |

### 2.4 Fallback: Profilo Piatto

Se non e disponibile un profilo orario esplicito e il consumo annuo e noto, il sistema genera un **profilo piatto** dividendo il consumo annuo uniformemente sulle 8.760 ore:

```
kWh_orario = (consumo_annuo_MWh * 1000) / 8760
```

---

## 3. Profili Settoriali NACE

La piattaforma contiene un database di profili energetici tipici per **58 codici NACE**, basati su benchmark ENEA, GSE e best practice EU per audit energetici. Questi valori sono utilizzati come valori di default nel wizard di analisi.

### 3.1 Tabella Completa dei Profili NACE

| Codice | Settore | kWh/m2 | kWh/dip. | % Elett. | % Gas | Ore op. | Giorni lav. |
|--------|---------|-------:|--------:|---------:|------:|--------:|-------------|
| **Sezione A - Agricoltura** |||||||
| A01 | Agricoltura | 50 | 8.000 | 35% | 65% | 2.500 | Lun-Sab |
| A02 | Silvicoltura | 30 | 5.000 | 30% | 70% | 2.000 | Lun-Ven |
| A03 | Pesca e acquacoltura | 80 | 12.000 | 50% | 50% | 3.000 | Lun-Sab |
| **Sezione B - Estrazione minerali** |||||||
| B05 | Estrazione carbone | 150 | 25.000 | 55% | 45% | 5.000 | Lun-Sab |
| B06 | Estrazione petrolio e gas | 200 | 30.000 | 40% | 60% | 7.000 | Lun-Dom |
| B08 | Estrazione minerali da cave | 120 | 18.000 | 50% | 50% | 4.000 | Lun-Ven |
| **Sezione C - Manifatturiero** |||||||
| C10 | Alimentare | 280 | 15.000 | 40% | 60% | 4.000 | Lun-Ven |
| C11 | Bevande | 250 | 18.000 | 45% | 55% | 3.500 | Lun-Ven |
| C13 | Tessile | 200 | 12.000 | 50% | 50% | 4.000 | Lun-Ven |
| C14 | Abbigliamento | 120 | 6.000 | 65% | 35% | 2.500 | Lun-Ven |
| C15 | Articoli in pelle | 140 | 7.000 | 60% | 40% | 2.500 | Lun-Ven |
| C16 | Industria del legno | 180 | 10.000 | 55% | 45% | 3.500 | Lun-Ven |
| C17 | Carta | 350 | 25.000 | 45% | 55% | 5.000 | Lun-Sab |
| C18 | Stampa | 160 | 8.000 | 70% | 30% | 3.000 | Lun-Ven |
| C19 | Raffinazione petrolio | 500 | 50.000 | 30% | 70% | 8.000 | Lun-Dom |
| C20 | Prodotti chimici | 400 | 35.000 | 40% | 60% | 6.000 | Lun-Sab |
| C21 | Farmaceutico | 300 | 20.000 | 50% | 50% | 5.000 | Lun-Ven |
| C22 | Gomma e plastica | 320 | 22.000 | 60% | 40% | 4.500 | Lun-Sab |
| C23 | Minerali non metalliferi | 450 | 40.000 | 35% | 65% | 5.500 | Lun-Sab |
| C24 | Metallurgia | 600 | 55.000 | 50% | 50% | 6.500 | Lun-Sab |
| C25 | Prodotti in metallo | 250 | 14.000 | 55% | 45% | 4.000 | Lun-Ven |
| C26 | Elettronica | 220 | 12.000 | 80% | 20% | 3.500 | Lun-Ven |
| C27 | Apparecchiature elettriche | 200 | 11.000 | 70% | 30% | 3.500 | Lun-Ven |
| C28 | Macchinari | 230 | 13.000 | 60% | 40% | 4.000 | Lun-Ven |
| C29 | Autoveicoli | 350 | 20.000 | 50% | 50% | 5.000 | Lun-Sab |
| C30 | Mezzi di trasporto | 300 | 18.000 | 50% | 50% | 4.500 | Lun-Ven |
| C31 | Mobili | 160 | 8.000 | 60% | 40% | 3.000 | Lun-Ven |
| C32 | Altre manifatture | 180 | 10.000 | 60% | 40% | 3.000 | Lun-Ven |
| C33 | Riparazione macchinari | 150 | 9.000 | 65% | 35% | 2.500 | Lun-Ven |
| **Sezione D - Fornitura energia** |||||||
| D35 | Fornitura energia | 400 | 45.000 | 60% | 40% | 8.000 | Lun-Dom |
| **Sezione E - Acqua e rifiuti** |||||||
| E36 | Trattamento acqua | 180 | 20.000 | 85% | 15% | 7.000 | Lun-Dom |
| E37 | Gestione fognature | 160 | 18.000 | 80% | 20% | 7.000 | Lun-Dom |
| E38 | Gestione rifiuti | 200 | 22.000 | 60% | 40% | 5.000 | Lun-Sab |
| **Sezione F - Costruzioni** |||||||
| F41 | Costruzione edifici | 80 | 5.000 | 45% | 55% | 2.200 | Lun-Ven |
| F42 | Ingegneria civile | 90 | 6.000 | 40% | 60% | 2.200 | Lun-Ven |
| F43 | Lavori specializzati | 100 | 5.500 | 50% | 50% | 2.200 | Lun-Ven |
| **Sezione G - Commercio** |||||||
| G45 | Commercio autoveicoli | 120 | 7.000 | 70% | 30% | 2.500 | Lun-Sab |
| G46 | Commercio all'ingrosso | 100 | 6.000 | 65% | 35% | 2.500 | Lun-Ven |
| G47 | Commercio al dettaglio | 150 | 5.000 | 75% | 25% | 3.000 | Lun-Sab |
| **Sezione H - Trasporti** |||||||
| H49 | Trasporto terrestre | 60 | 10.000 | 30% | 70% | 4.000 | Lun-Sab |
| H50 | Trasporto marittimo | 70 | 15.000 | 25% | 75% | 5.000 | Lun-Dom |
| H51 | Trasporto aereo | 100 | 25.000 | 20% | 80% | 6.000 | Lun-Dom |
| H52 | Magazzinaggio | 80 | 8.000 | 60% | 40% | 4.000 | Lun-Sab |
| **Sezione I - Alloggio e ristorazione** |||||||
| I55 | Alloggio | 200 | 10.000 | 50% | 50% | 6.000 | Lun-Dom |
| I56 | Ristorazione | 300 | 12.000 | 45% | 55% | 3.500 | Lun-Dom |
| **Sezione J - ICT** |||||||
| J61 | Telecomunicazioni | 250 | 10.000 | 90% | 10% | 8.760 | Lun-Dom |
| J62 | Software e consulenza IT | 100 | 4.000 | 90% | 10% | 2.200 | Lun-Ven |
| J63 | Servizi informativi | 130 | 5.000 | 85% | 15% | 2.500 | Lun-Ven |
| **Sezione K - Finanza** |||||||
| K64 | Servizi finanziari | 110 | 4.500 | 85% | 15% | 2.200 | Lun-Ven |
| **Sezione L - Immobiliare** |||||||
| L68 | Attivita immobiliari | 90 | 4.000 | 70% | 30% | 2.200 | Lun-Ven |
| **Sezione M - Professionali** |||||||
| M69 | Attivita legali e contabili | 90 | 3.500 | 85% | 15% | 2.000 | Lun-Ven |
| M70 | Consulenza gestionale | 95 | 3.800 | 85% | 15% | 2.200 | Lun-Ven |
| M71 | Architettura e ingegneria | 85 | 3.500 | 85% | 15% | 2.200 | Lun-Ven |
| **Sezione N - Servizi amministrativi** |||||||
| N77 | Noleggio e leasing | 70 | 3.000 | 75% | 25% | 2.200 | Lun-Ven |
| **Sezione O - Pubblica amministrazione** |||||||
| O84 | Pubblica amministrazione | 120 | 5.000 | 70% | 30% | 2.200 | Lun-Ven |
| **Sezione P - Istruzione** |||||||
| P85 | Istruzione | 110 | 5.000 | 45% | 55% | 2.000 | Lun-Ven |
| **Sezione Q - Sanita** |||||||
| Q86 | Assistenza sanitaria | 280 | 15.000 | 50% | 50% | 6.000 | Lun-Dom |
| Q87 | Assistenza residenziale | 220 | 10.000 | 45% | 55% | 8.760 | Lun-Dom |
| **Sezione R - Arte e sport** |||||||
| R90 | Attivita creative | 100 | 4.000 | 80% | 20% | 2.000 | Lun-Sab |
| R93 | Sport e intrattenimento | 180 | 8.000 | 70% | 30% | 3.500 | Lun-Dom |

### 3.2 Come Vengono Utilizzati i Profili NACE

La stima del consumo annuo avviene tramite due indicatori:

1. **Stima da superficie**: `consumo_annuo = kWh/m2 * superficie_m2`
2. **Stima da dipendenti**: `consumo_annuo = kWh/dipendente * n_dipendenti`

La ripartizione tra vettori energetici avviene con le percentuali `electricity_pct` e `gas_pct`:

- **Consumo elettrico** = consumo_totale * electricity_pct
- **Consumo termico** = consumo_totale * gas_pct

### 3.3 Fonti dei Valori

I valori sono derivati da:
- Benchmark ENEA per diagnosi energetiche delle PMI italiane
- Dati GSE sui consumi energetici per settore
- Linee guida EU per audit energetici (Direttiva 2012/27/UE)
- Statistiche Eurostat sui consumi specifici per settore NACE

---

## 4. Catalogo Tecnologico

### 4.1 Tecnologie Disponibili

Il catalogo globale include **15 tecnologie** di default con i seguenti parametri:

| Tecnologia | Categoria | CAPEX (EUR/kW) | Manutenzione (EUR/kW/anno) | Vita utile (anni) | Fattore capacita | Taglia min (kW) | Taglia max (kW) |
|------------|-----------|---------------:|---------------------------:|-------------------:|-----------------:|----------------:|----------------:|
| Fotovoltaico | Rinnovabile | 800 | 10 | 25 | 0,15 | 1 | 10.000 |
| Eolico | Rinnovabile | 1.200 | 25 | 20 | 0,25 | 10 | 5.000 |
| Caldaia a gas | Termico | 100 | 5 | 20 | 0,90 | 10 | 5.000 |
| Caldaia a biomassa | Termico | 300 | 15 | 20 | 0,85 | 50 | 3.000 |
| Pompa di calore aria-acqua | Termico | 500 | 12 | 15 | 0,35 | 5 | 1.000 |
| Pompa di calore geotermica | Termico | 800 | 10 | 25 | 0,40 | 10 | 500 |
| Cogeneratore (CHP) | Cogenerazione | 1.500 | 30 | 15 | 0,85 | 50 | 5.000 |
| Trigeneratore (CCHP) | Cogenerazione | 2.000 | 40 | 15 | 0,80 | 100 | 3.000 |
| Chiller ad assorbimento | Raffrescamento | 400 | 10 | 20 | 0,70 | 50 | 2.000 |
| Chiller elettrico | Raffrescamento | 250 | 8 | 15 | 0,80 | 10 | 3.000 |
| Cappotto termico | Involucro | 50 | 0 | 30 | 1,00 | 100 | 50.000 |
| Relamping LED | Illuminazione | 3 | 0 | 15 | 1,00 | 1 | 100.000 |
| Inverter su motori | Efficienza | 20 | 1 | 15 | 1,00 | 5 | 1.000 |
| Compressore aria efficiente | Efficienza | 150 | 5 | 15 | 0,90 | 10 | 500 |
| Recuperatore di calore | Efficienza | 200 | 5 | 20 | 0,80 | 10 | 2.000 |

### 4.2 Significato del Fattore di Capacita

Il **fattore di capacita** (capacity factor) ha significati diversi a seconda della tecnologia:

- **Fotovoltaico (0,15)**: produzione media annua pari al 15% della potenza di picco installata (tipico dell'Italia centro-settentrionale, ~1.300 kWh/kWp)
- **Eolico (0,25)**: produzione media annua pari al 25% della potenza nominale
- **Caldaia a gas (0,90)**: rendimento termico del 90%
- **Pompa di calore aria-acqua (0,35)**: rappresenta l'inverso del COP medio (COP ~2,8, capacity_factor = 1/COP * efficienza)
- **Cogeneratore (0,85)**: rendimento elettrico + quota di calore recuperabile

**Ipotesi**: Per le rinnovabili (fotovoltaico, eolico), il fattore di capacita vincola la produzione massima oraria alla potenza installata moltiplicata per tale fattore. Questo e una semplificazione rispetto all'utilizzo di profili meteorologici orari reali.

### 4.3 Modello Input-Output delle Tecnologie

Ogni tecnologia e modellata come un convertitore con:

- **Input**: risorse consumate (es. gas naturale, elettricita, sole)
- **Output**: vettori energetici prodotti (es. elettricita, calore, freddo)
- **Fattori di conversione**: efficienza della conversione input-output

Per esempio, un cogeneratore (CHP) ha:
- Input: gas naturale (conversion_factor: 1,0)
- Output: elettricita (conversion_factor: 0,35) + calore (conversion_factor: 0,50)

Questo significa che per ogni kWh di gas consumato, si ottengono 0,35 kWh_e + 0,50 kWh_th.

### 4.4 Parametri di Default per Storage

I sistemi di accumulo hanno parametri di default definiti nel modello:

| Parametro | Batteria Li-ion | Accumulo termico caldo | Accumulo termico freddo |
|-----------|----------------:|----------------------:|------------------------:|
| Efficienza carica | 0,95 (95%) | 0,95 (95%) | 0,95 (95%) |
| Efficienza scarica | 0,95 (95%) | 0,95 (95%) | 0,95 (95%) |
| Tasso auto-scarica (/h) | 0,0 | 0,0 | 0,0 |
| SOC minimo | 0,10 (10%) | 0,10 (10%) | 0,10 (10%) |
| SOC massimo | 0,90 (90%) | 0,90 (90%) | 0,90 (90%) |
| Vita utile assunta (anni) | 15 | 15 | 15 |

**Nota**: La vita utile dello storage e fissata a **15 anni** nel calcolo dell'annualizzazione del CAPEX, indipendentemente dal tipo di storage.

---

## 5. Formulazione Matematica dell'Ottimizzazione

### 5.1 Insiemi e Indici

| Simbolo | Descrizione |
|---------|-------------|
| T | Insieme delle tecnologie candidate e esistenti |
| S | Insieme dei sistemi di accumulo |
| R | Insieme delle risorse energetiche |
| E | Insieme dei vettori energetici (end-use) |
| H = {0, 1, ..., 8759} | Ore dell'anno (8.760 ore) |

### 5.2 Variabili Decisionali

| Variabile | Tipo | Dominio | Descrizione |
|-----------|------|---------|-------------|
| cap_t | Continua | [0, max_cap_t] | Capacita installata della tecnologia t (kW) |
| use_t | Binaria | {0, 1} | 1 se la tecnologia t e selezionata, 0 altrimenti |
| ein_{t,r,h} | Continua | >= 0 | Energia in ingresso nella tech t dalla risorsa r all'ora h (kWh) |
| eout_{t,e,h} | Continua | >= 0 | Energia in uscita dalla tech t per il vettore e all'ora h (kWh) |
| soc_{s,h} | Continua | >= 0 | Stato di carica dello storage s all'ora h (kWh) |
| charge_{s,h} | Continua | [0, P_max_charge_s] | Potenza di carica dello storage s all'ora h (kW) |
| discharge_{s,h} | Continua | [0, P_max_discharge_s] | Potenza di scarica dello storage s all'ora h (kW) |
| buy_{r,h} | Continua | >= 0 | Energia acquistata dalla risorsa r all'ora h (kWh) |
| sell_{r,h} | Continua | >= 0 | Energia venduta della risorsa r all'ora h (kWh) |

**Note**:
- Le variabili `sell` sono create **solo per l'elettricita** (unica risorsa vendibile alla rete)
- Per le tecnologie **esistenti**, la variabile `cap_t` e fissata alla capacita installata (lowBound = upBound = installed_capacity_kw)
- I limiti superiori di `charge` e `discharge` sono imposti direttamente come bound della variabile LP

### 5.3 Funzione Obiettivo: Minimizzazione del Costo

```
min Z_costo = SUM_t [CAPEX_annualizzato_t + Manutenzione_t]
            + SUM_{r,h} [buy_{r,h} * prezzo_acquisto_r / 1000]
            - SUM_{r,h} [sell_{r,h} * prezzo_vendita_r / 1000]
            + SUM_s [CAPEX_storage_annualizzato_s]
```

Dove:

**CAPEX annualizzato** (solo per tecnologie nuove, non esistenti):

```
CAPEX_annualizzato_t = CAPEX_per_kW_t * cap_t * CRF(WACC, lifetime_t)
```

**Manutenzione annua**:

```
Manutenzione_t = manutenzione_annua_per_kW_t * cap_t
```

**Costo risorse**: i prezzi sono espressi in EUR/MWh, le variabili buy/sell sono in kWh, quindi si divide per 1.000.

**CAPEX storage annualizzato**:

```
CAPEX_storage_s = CAPEX_per_kWh_s * capacita_kWh_s * CRF(WACC, 15)
```

**Nota**: Il CAPEX dello storage e un costo fisso (non una variabile decisionale nel modello attuale), con vita utile fissata a 15 anni.

### 5.4 Capital Recovery Factor (CRF)

Il CRF converte un investimento di capitale in un costo annuo equivalente:

```
CRF(WACC, n) = WACC * (1 + WACC)^n / ((1 + WACC)^n - 1)
```

Dove:
- **WACC**: Weighted Average Cost of Capital (default: **5%** = 0,05)
- **n**: vita utile della tecnologia in anni

Caso speciale: se WACC = 0 oppure n = 0, allora CRF = 1/max(n, 1).

**Esempio**: Per un impianto fotovoltaico con WACC = 5% e vita utile 25 anni:

```
CRF(0,05; 25) = 0,05 * 1,05^25 / (1,05^25 - 1) = 0,05 * 3,386 / 2,386 = 0,0710
```

Quindi il CAPEX annualizzato e il 7,10% del CAPEX totale.

### 5.5 Funzione Obiettivo: Minimizzazione della CO2

```
min Z_co2 = SUM_{r,h} [buy_{r,h} * fattore_co2_r / 1000]
```

Dove `fattore_co2_r` e espresso in tCO2/MWh e le variabili buy sono in kWh (da cui la divisione per 1.000).

**Vincolo di budget opzionale**: quando l'obiettivo e la decarbonizzazione, e possibile imporre un limite massimo al costo totale:

```
SUM_t [CAPEX_annualizzato_t + Manutenzione_t]
+ SUM_{r,h} [buy_{r,h} * prezzo_r / 1000]
- SUM_{r,h} [sell_{r,h} * prezzo_r / 1000]
<= Budget_limite
```

### 5.6 Vincoli di Bilancio Energetico Elettrico

Per ogni ora h = 0, ..., 8759:

```
SUM_t [eout_{t,ELECTRICITY,h}]
+ SUM_s_batteria [discharge_{s,h}]
- SUM_s_batteria [charge_{s,h}]
+ buy_{electricity,h}
- sell_{electricity,h}
= Domanda_ELECTRICITY_h
```

**Interpretazione**: la produzione delle tecnologie + lo scarico delle batterie - la carica delle batterie + l'acquisto dalla rete - la vendita alla rete deve essere uguale alla domanda elettrica oraria.

### 5.7 Vincoli di Bilancio Termico e Freddo

Per ciascuno dei 4 vettori termici (HEAT_HIGH_T, HEAT_MED_T, HEAT_LOW_T, COLD) e per ogni ora h:

```
SUM_t [eout_{t,e,h}]
+ SUM_s_termico [discharge_{s,h}]
- SUM_s_termico [charge_{s,h}]
= Domanda_{e,h}
```

La corrispondenza tra vettore termico e tipo di storage e:

| Vettore energetico | Tipo storage associato |
|--------------------|----------------------|
| HEAT_HIGH_T | thermal_hot |
| HEAT_MED_T | thermal_hot |
| HEAT_LOW_T | thermal_hot |
| COLD | thermal_cold |

**Nota**: A differenza del bilancio elettrico, non esiste acquisto/vendita di calore dalla rete. Il calore deve essere prodotto internamente dalle tecnologie o prelevato dall'accumulo.

### 5.8 Vincoli di Capacita delle Tecnologie

Per ogni tecnologia t che produce il vettore e, per ogni ora h:

```
eout_{t,e,h} <= cap_t * CF_t
```

Dove CF_t e il fattore di capacita della tecnologia t.

### 5.9 Vincoli di Efficienza (Conversione Input-Output)

Per ogni tecnologia t con input e output, per ogni ora h:

```
SUM_e [eout_{t,e,h} / cf_output_{t,e}] <= SUM_r [ein_{t,r,h} * cf_input_{t,r}]
```

Dove:
- `cf_output_{t,e}` e il fattore di conversione in output per il vettore e
- `cf_input_{t,r}` e il fattore di conversione in input per la risorsa r

**Interpretazione**: l'energia in uscita (normalizzata per l'efficienza di output) non puo superare l'energia in ingresso (moltiplicata per l'efficienza di input).

### 5.10 Vincoli per Fonti Rinnovabili

Per le tecnologie con input da risorse rinnovabili (solare, eolico), per ogni ora h:

```
ein_{t,r,h} <= cap_t * CF_t
```

Questo vincola l'input di energia rinnovabile alla capacita installata e al fattore di capacita. Questo e una semplificazione rispetto all'uso di profili meteorologici reali (irraggiamento solare orario, velocita del vento oraria).

### 5.11 Vincoli Big-M per la Selezione delle Tecnologie

Per ogni tecnologia **nuova** (non esistente):

```
cap_t <= max_cap_t * use_t          (vincolo superiore)
cap_t >= min_cap_t * use_t          (vincolo inferiore)
```

Dove:
- `max_cap_t`: capacita massima (da scenario config o da catalogo)
- `min_cap_t`: capacita minima (da scenario config o da catalogo)
- `use_t`: variabile binaria di selezione

Questo garantisce che:
- Se use_t = 0 (tecnologia non selezionata), allora cap_t = 0
- Se use_t = 1 (tecnologia selezionata), allora min_cap_t <= cap_t <= max_cap_t

**Vincolo force-include**: quando una tecnologia e marcata come "forza inclusione" nello scenario:

```
use_t >= 1
```

### 5.12 Vincoli di Disponibilita delle Risorse

Per le risorse con limite annuo di disponibilita (in MWh):

```
SUM_h [buy_{r,h}] <= max_availability_r * 1000
```

La conversione MWh -> kWh avviene moltiplicando per 1.000.

### 5.13 Vincoli di Storage (Dinamica SOC)

Per ogni sistema di accumulo s e per ogni ora h:

```
soc_{s,h} = soc_{s,h-1} * (1 - sigma_s) + charge_{s,h} * eta_c_s - discharge_{s,h} / eta_d_s
```

Dove:
- `sigma_s`: tasso di auto-scarica orario
- `eta_c_s`: efficienza di carica (default 0,95)
- `eta_d_s`: efficienza di scarica (default 0,95)

**Condizione di ciclicita**: all'ora h=0, il riferimento e h_prev = 8759 (ultima ora dell'anno), creando un vincolo ciclico:

```
soc_{s,0} = soc_{s,8759} * (1 - sigma_s) + charge_{s,0} * eta_c_s - discharge_{s,0} / eta_d_s
```

**Vincoli di stato di carica**:

```
SOC_min_s * C_s <= soc_{s,h} <= SOC_max_s * C_s
```

Dove:
- `SOC_min_s`: stato di carica minimo (default 0,10 = 10%)
- `SOC_max_s`: stato di carica massimo (default 0,90 = 90%)
- `C_s`: capacita totale dello storage in kWh

**Vincoli di potenza**: i limiti di carica/scarica sono imposti come bound delle variabili:

```
0 <= charge_{s,h} <= P_max_charge_s
0 <= discharge_{s,h} <= P_max_discharge_s
```

---

## 6. Indicatori Finanziari

### 6.1 CAPEX Totale

```
CAPEX_totale = SUM_t [CAPEX_per_kW_t * cap_t_ottimale]     (solo tech nuove)
             + SUM_s [CAPEX_per_kWh_s * capacita_s]         (storage)
```

Per le tecnologie esistenti (is_existing = true), il CAPEX non viene conteggiato (investimento gia effettuato).

### 6.2 OPEX Annuo

```
OPEX_annuo = SUM_t [manutenzione_annua_per_kW_t * cap_t_ottimale]
```

### 6.3 Costo Baseline (Senza Ottimizzazione)

Il costo baseline rappresenta lo scenario "business-as-usual" in cui tutta l'energia viene acquistata dalla rete:

```
Costo_baseline = SUM_domande [consumo_annuo_MWh * prezzo_acquisto_EUR/MWh]
```

Con la seguente mappatura domanda-risorsa:

| Vettore energetico | Risorsa di riferimento |
|--------------------|----------------------|
| ELECTRICITY | electricity |
| HEAT_HIGH_T | natural_gas |
| HEAT_MED_T | natural_gas |
| HEAT_LOW_T | natural_gas |
| COLD | electricity |

**Ipotesi importante**: il costo baseline per il riscaldamento assume l'acquisto diretto di gas naturale, senza considerare efficienze di conversione. Analogamente, il freddo e assimilato all'acquisto di elettricita (senza COP).

### 6.4 Costo Ottimizzato

```
Costo_ottimizzato = SUM_{r,h} [buy_{r,h}* * prezzo_r / 1000]
                  - SUM_{r,h} [sell_{r,h}* * prezzo_r / 1000]
```

Dove `*` indica i valori ottimali delle variabili.

### 6.5 Risparmio Annuo

```
Risparmio_annuo = Costo_baseline - (Costo_ottimizzato + OPEX_annuo)
```

### 6.6 Payback Semplice

```
Payback = CAPEX_totale / Risparmio_annuo     [anni]
```

Il payback e calcolato solo se Risparmio_annuo > 0. Altrimenti e `null`.

### 6.7 Valore Attuale Netto (NPV)

```
NPV = -CAPEX_totale + Risparmio_annuo * PV_factor
```

Dove il fattore di valore attuale e calcolato su un orizzonte di **20 anni**:

```
PV_factor = (1 - (1 + WACC)^(-20)) / WACC
```

**Ipotesi**: L'NPV e calcolato con un orizzonte fisso di 20 anni, indipendentemente dalla vita utile delle tecnologie. Risparmio annuo costante per tutti i 20 anni. WACC default = 5%.

**Esempio**: Con WACC = 5%, PV_factor = (1 - 1,05^(-20)) / 0,05 = 12,46

### 6.8 IRR (Tasso Interno di Rendimento)

**Non calcolato** nella versione attuale. Il campo IRR e presente nel modello dati ma viene restituito come `null`. Il calcolo dell'IRR richiede un algoritmo iterativo (Newton-Raphson) che non e stato ancora implementato.

### 6.9 Cicli Annuali dello Storage

```
Cicli_annuali = SUM_h [charge_{s,h}*] / capacita_kWh_s
```

Rappresenta il numero di cicli completi equivalenti effettuati dallo storage in un anno.

---

## 7. Calcolo Riduzione CO2

### 7.1 CO2 Baseline

Le emissioni baseline sono calcolate moltiplicando i consumi annui per i fattori di emissione di ciascuna risorsa:

```
CO2_baseline = SUM_domande [consumo_annuo_MWh * fattore_co2_tCO2/MWh]
```

Con la stessa mappatura domanda-risorsa del costo baseline:

| Vettore energetico | Risorsa CO2 di riferimento |
|--------------------|--------------------------|
| ELECTRICITY | electricity (fattore_co2 rete elettrica) |
| HEAT_HIGH_T | natural_gas (fattore_co2 gas naturale) |
| HEAT_MED_T | natural_gas |
| HEAT_LOW_T | natural_gas |
| COLD | electricity |

### 7.2 CO2 Ottimizzata

```
CO2_ottimizzata = SUM_{r,h} [buy_{r,h}* * fattore_co2_r / 1000]     [tCO2/anno]
```

**Nota**: le emissioni delle risorse rinnovabili (solare, eolico) hanno fattore_co2 = 0.

### 7.3 Riduzione Percentuale

```
Riduzione_CO2_% = (CO2_baseline - CO2_ottimizzata) / CO2_baseline
```

La riduzione e espressa come frazione (es. 0,35 = 35%).

### 7.4 Fattori di Emissione Tipici (Riferimento)

I fattori di emissione sono parametri configurabili dall'utente. I valori tipici per il mercato italiano sono:

| Risorsa | Fattore CO2 tipico (tCO2/MWh) | Fonte |
|---------|------------------------------:|-------|
| Elettricita (rete) | 0,257 | ISPRA 2024, mix elettrico italiano |
| Gas naturale | 0,202 | IPCC, PCI gas naturale |
| Gasolio | 0,267 | IPCC |
| GPL | 0,227 | IPCC |
| Biomassa | 0,0 (*) | Neutrale per convenzione |
| Solare/Eolico | 0,0 | Nessuna emissione diretta |

(*) La biomassa e considerata carbon neutral per convenzione (le emissioni di combustione sono bilanciate dall'assorbimento durante la crescita della biomassa). Questo e coerente con le convenzioni IPCC ma e una semplificazione (non considera emissioni da trasporto, lavorazione, etc.).

---

## 8. Generazione Profili di Domanda 8760h

### 8.1 Architettura del Generatore

Il generatore di profili produce un vettore di **8.760 valori** (uno per ogni ora dell'anno di riferimento 2025, non bisestile) seguendo tre fasi:

1. **Forma base** (raw shape): profilo giornaliero tipo per il settore
2. **Modulazione stagionale**: variazione annuale per tipo di vettore energetico
3. **Normalizzazione**: scalatura per garantire che la somma sia uguale al consumo annuo

```
profilo_finale[h] = forma_base[h] * stagionalita[h] * fattore_scala
```

Dove:

```
fattore_scala = (consumo_annuo_MWh * 1000) / SUM_h [forma_base[h] * stagionalita[h]]
```

### 8.2 Profili Giornalieri (Forma Base)

#### Profilo Ufficio

Ramp up 7-9, picco 9-12, calo pranzo 13-14, picco 14-17, ramp down 17-19. Weekend al 5% (carico base).

| Ora | Fattore | Ora | Fattore | Ora | Fattore | Ora | Fattore |
|-----|--------:|-----|--------:|-----|--------:|-----|--------:|
| 0 | 0,05 | 6 | 0,10 | 12 | 0,85 | 18 | 0,50 |
| 1 | 0,05 | 7 | 0,30 | 13 | 0,75 | 19 | 0,20 |
| 2 | 0,05 | 8 | 0,70 | 14 | 0,95 | 20 | 0,10 |
| 3 | 0,05 | 9 | 0,95 | 15 | 1,00 | 21 | 0,08 |
| 4 | 0,05 | 10 | 1,00 | 16 | 1,00 | 22 | 0,05 |
| 5 | 0,05 | 11 | 1,00 | 17 | 0,90 | 23 | 0,05 |

Weekend: tutti i valori = 0,05

#### Profilo Industriale 1 Turno (06:00-14:00)

| Ora | Fattore | Ora | Fattore | Ora | Fattore | Ora | Fattore |
|-----|--------:|-----|--------:|-----|--------:|-----|--------:|
| 0 | 0,05 | 6 | 0,80 | 12 | 1,00 | 18 | 0,05 |
| 1 | 0,05 | 7 | 0,95 | 13 | 0,95 | 19 | 0,05 |
| 2 | 0,05 | 8 | 1,00 | 14 | 0,60 | 20 | 0,05 |
| 3 | 0,05 | 9 | 1,00 | 15 | 0,15 | 21 | 0,05 |
| 4 | 0,05 | 10 | 1,00 | 16 | 0,08 | 22 | 0,05 |
| 5 | 0,20 | 11 | 1,00 | 17 | 0,05 | 23 | 0,05 |

Weekend: tutti i valori = 0,03

#### Profilo Industriale 2 Turni (06:00-22:00)

| Ora | Fattore | Ora | Fattore | Ora | Fattore | Ora | Fattore |
|-----|--------:|-----|--------:|-----|--------:|-----|--------:|
| 0 | 0,05 | 6 | 0,85 | 12 | 1,00 | 18 | 1,00 |
| 1 | 0,05 | 7 | 0,95 | 13 | 0,85 | 19 | 1,00 |
| 2 | 0,05 | 8 | 1,00 | 14 | 0,90 | 20 | 0,95 |
| 3 | 0,05 | 9 | 1,00 | 15 | 1,00 | 21 | 0,80 |
| 4 | 0,05 | 10 | 1,00 | 16 | 1,00 | 22 | 0,30 |
| 5 | 0,25 | 11 | 1,00 | 17 | 1,00 | 23 | 0,10 |

Weekend: tutti i valori = 0,03

#### Profilo Industriale 3 Turni (Ciclo Continuo 24/7)

| Ora | Fattore | Ora | Fattore | Ora | Fattore | Ora | Fattore |
|-----|--------:|-----|--------:|-----|--------:|-----|--------:|
| 0 | 0,95 | 6 | 0,85 | 12 | 1,00 | 18 | 1,00 |
| 1 | 0,95 | 7 | 0,95 | 13 | 1,00 | 19 | 1,00 |
| 2 | 0,95 | 8 | 1,00 | 14 | 0,90 | 20 | 1,00 |
| 3 | 0,95 | 9 | 1,00 | 15 | 0,95 | 21 | 0,95 |
| 4 | 0,95 | 10 | 1,00 | 16 | 1,00 | 22 | 0,90 |
| 5 | 0,90 | 11 | 1,00 | 17 | 1,00 | 23 | 0,95 |

Nessuna differenza tra giorni feriali e festivi. Lievi cali ai cambi turno (ore 6, 14, 22).

#### Profilo Commerciale/Retail (09:00-21:00)

Feriali:

| Ora | Fattore | Ora | Fattore | Ora | Fattore | Ora | Fattore |
|-----|--------:|-----|--------:|-----|--------:|-----|--------:|
| 0 | 0,05 | 6 | 0,05 | 12 | 1,00 | 18 | 1,00 |
| 1 | 0,05 | 7 | 0,10 | 13 | 0,90 | 19 | 0,95 |
| 2 | 0,05 | 8 | 0,30 | 14 | 0,85 | 20 | 0,80 |
| 3 | 0,05 | 9 | 0,70 | 15 | 0,90 | 21 | 0,40 |
| 4 | 0,05 | 10 | 0,85 | 16 | 0,95 | 22 | 0,10 |
| 5 | 0,05 | 11 | 0,95 | 17 | 1,00 | 23 | 0,05 |

Weekend: valori leggermente piu alti nelle ore pomeridiane/serali (fino a 1,10), riflettendo il maggior afflusso di clienti tipico dei centri commerciali italiani il sabato e la domenica.

#### Profilo Residenziale (Doppio Picco)

Feriali:

| Ora | Fattore | Ora | Fattore | Ora | Fattore | Ora | Fattore |
|-----|--------:|-----|--------:|-----|--------:|-----|--------:|
| 0 | 0,15 | 6 | 0,20 | 12 | 0,35 | 18 | 0,70 |
| 1 | 0,10 | 7 | 0,55 | 13 | 0,40 | 19 | 0,90 |
| 2 | 0,08 | 8 | 0,70 | 14 | 0,30 | 20 | 1,00 |
| 3 | 0,08 | 9 | 0,50 | 15 | 0,25 | 21 | 0,95 |
| 4 | 0,08 | 10 | 0,30 | 16 | 0,30 | 22 | 0,70 |
| 5 | 0,10 | 11 | 0,25 | 17 | 0,45 | 23 | 0,40 |

Caratteristica "doppio picco" tipica italiana: mattina (7-9) per preparazione e colazione, sera (18-22) per cottura e intrattenimento. Weekend piu distribuito con risveglio piu tardivo.

### 8.3 Modulazione Stagionale

La modulazione stagionale si basa su un **modello a coseno** ancorato al clima italiano.

#### Elettricita

Variazione stagionale moderata (+/- 15%), con doppio picco inverno-estate:

```
fattore_h = 1,0 + 0,08 * cos(2*pi*(giorno - 15) / 365) + 0,10 * cos(2*pi*(giorno - 200) / 365)
```

Dove:
- `giorno` = h / 24 (giorno dell'anno, 0-based)
- Giorno 15: meta gennaio (picco invernale, illuminazione + riscaldamento)
- Giorno 200: meta luglio (picco estivo, condizionamento)
- Ampiezza invernale: 8%
- Ampiezza estiva: 10%

#### Riscaldamento (HEAT_HIGH_T, HEAT_MED_T, HEAT_LOW_T)

Forte stagionalita con picco invernale e domanda quasi nulla in estate:

```
cos_val = cos(2*pi*(giorno - 15) / 365)
raw = cos_val - 0,05
fattore_h = max(0, raw)^1,3 + 0,05
```

- Il coseno e centrato sul giorno 15 (meta gennaio = picco)
- L'offset -0,05 riduce la stagione di riscaldamento (attiva circa 55% dell'anno)
- L'esponente 1,3 accentua la differenza tra mesi centrali e di transizione
- Il termine +0,05 rappresenta il **carico base** (acqua calda sanitaria, calore di processo)

**Stagione di riscaldamento risultante**: approssimativamente da ottobre a aprile, coerente con la zona climatica D/E italiana (DPR 412/93).

#### Raffrescamento (COLD)

Forte stagionalita con picco estivo:

```
cos_val = cos(2*pi*(giorno - 200) / 365)
raw = cos_val - 0,15
fattore_h = max(0, raw)^1,3 + 0,02
```

- Il coseno e centrato sul giorno 200 (meta luglio = picco)
- L'offset -0,15 crea una stagione di raffrescamento piu breve del riscaldamento
- Il termine +0,02 rappresenta il **carico base** (sale server, refrigerazione)

**Stagione di raffrescamento risultante**: approssimativamente da maggio a settembre.

### 8.4 Anno di Riferimento

L'anno di riferimento e il **2025** (non bisestile, 365 giorni = 8.760 ore). L'ora 0 corrisponde al 1 gennaio 2025 ore 00:00. Il 1 gennaio 2025 e un mercoledi.

---

## 9. Stima Consumi AI

### 9.1 Architettura

La piattaforma offre due servizi di intelligenza artificiale per la stima energetica:

1. **Stima consumi** (AI Estimator): stima i consumi annui basandosi sulle caratteristiche del sito
2. **Suggerimenti tecnologici** (AI Suggestions): suggerisce le tecnologie piu appropriate

Entrambi utilizzano il modello **Claude Haiku 4.5** (claude-haiku-4-5-20251001) di Anthropic con prompt specializzati in italiano.

### 9.2 Stima dei Consumi (AI Estimator)

**Input**: caratteristiche del sito
- Codice NACE
- Settore
- Superficie in m2
- Numero dipendenti
- Ore operative annue

**Output**:
- Consumo elettrico stimato (MWh/anno)
- Consumo gas stimato (MWh/anno)
- Consumo termico stimato (MWh/anno)
- Suggerimento profilo di carico
- Livello di confidenza (alta/media/bassa)
- Raccomandazioni specifiche

**Livelli di confidenza**:
- **Alta**: disponibili NACE + superficie + dipendenti + ore operative
- **Media**: disponibili almeno 2 dei parametri sopra
- **Bassa**: disponibile solo 1 o nessun parametro

Il modello AI utilizza come riferimento i benchmark di settore per il mercato italiano (ENEA, GSE, ISO 50001).

### 9.3 Suggerimenti Tecnologici (AI Suggestions)

**Input**: profilo energetico completo dell'analisi
- Codice NACE e settore
- Consumi per vettore energetico
- Prezzi delle risorse energetiche
- Tecnologie gia installate
- Catalogo tecnologie disponibili (con costi)
- Budget disponibile (se specificato)
- Area tetto disponibile (se specificata)
- Latitudine del sito

**Output**: 3-6 suggerimenti ordinati per priorita, ciascuno con:
- Nome e categoria della tecnologia
- Motivazione in italiano
- Capacita stimata (kW)
- Risparmio stimato (%)
- Priorita (alta/media/bassa)
- Impatto CO2

**Importante**: I suggerimenti AI sono indicativi e non sostituiscono l'ottimizzazione MILP. Servono come guida per la configurazione degli scenari.

---

## 10. Ipotesi e Limitazioni

### 10.1 Ipotesi Generali

1. **Anno tipico**: l'analisi si basa su un singolo anno (8.760 ore), non su proiezioni multi-anno. Non si considerano variazioni dei prezzi energetici nel tempo.

2. **Prezzi costanti**: i prezzi di acquisto/vendita dell'energia sono costanti per tutto l'anno. Non sono modellate fasce orarie F1/F2/F3, PUN orario, o variazioni stagionali dei prezzi.

3. **Fattori di capacita costanti**: i fattori di capacita delle rinnovabili (fotovoltaico, eolico) sono costanti per ogni ora. Non si utilizzano profili meteorologici orari reali (irraggiamento TMY, velocita del vento). Questa e una semplificazione significativa.

4. **Nessun degrado**: non si modella il degrado prestazionale delle tecnologie nel tempo (es. degrado moduli FV dello 0,5%/anno).

5. **Linearita**: il modello e lineare (MILP). Le prestazioni delle tecnologie (COP delle pompe di calore, efficienza dei cogeneratori) sono costanti e non dipendono dalle condizioni operative (temperatura esterna, carico parziale).

6. **Decisioni binarie**: la selezione delle tecnologie e binaria (si/no). Non e modellato il dimensionamento a gradini (es. moduli FV da 400 Wp).

7. **Costi lineari**: i costi di investimento scalano linearmente con la capacita. Non si considerano economie di scala o costi fissi indipendenti dalla taglia.

### 10.2 Ipotesi sullo Storage

1. **Vita utile fissa a 15 anni** per tutti i tipi di storage (batterie Li-ion, accumulo termico)
2. **Auto-scarica a zero** per default (la degradazione oraria non e considerata)
3. **Capacita dello storage non ottimizzata**: la capacita in kWh e un parametro fisso, non una variabile decisionale. Il modello ottimizza solo il dispacciamento (carica/scarica)
4. **Ciclicita**: il SOC al 31 dicembre ore 23 deve essere uguale al SOC del 1 gennaio ore 00 (conservazione dell'energia annuale)
5. **Efficienza round-trip**: con i default, eta_totale = 0,95 * 0,95 = 0,9025 (90,25%)

### 10.3 Ipotesi sul Calcolo Finanziario

1. **WACC unico al 5%**: lo stesso tasso di sconto viene applicato a tutte le tecnologie, senza differenziare il rischio
2. **NPV su 20 anni fisso**: l'orizzonte di valutazione e fisso a 20 anni indipendentemente dalla vita utile delle tecnologie
3. **Risparmio costante**: l'NPV assume un risparmio annuo costante per tutti i 20 anni (nessuna inflazione, nessun degrado, nessuna variazione prezzi)
4. **Payback semplice**: non e calcolato il payback attualizzato (discounted payback)
5. **IRR non calcolato**: nella versione attuale l'IRR non e implementato
6. **Nessun incentivo**: non sono modellati incentivi fiscali (Conto Termico, detrazioni, certificati bianchi, scambio sul posto)

### 10.4 Ipotesi sulla Baseline

1. **Baseline "tutto dalla rete"**: si assume che senza interventi, tutta l'energia venga acquistata dalla rete (elettricita) o dal fornitore gas (calore). Non si considerano le tecnologie gia installate nella baseline.
2. **Nessuna efficienza nella baseline**: il costo baseline del calore non considera l'efficienza della caldaia esistente (es. 1 MWh di domanda termica = 1 MWh di gas acquistato, non 1/0,9 MWh)
3. **Freddo equiparato all'elettricita**: la baseline CO2 e di costo per il freddo usa i fattori dell'elettricita (assume chiller elettrico esistente con COP = 1)

### 10.5 Limitazioni Note

1. **Nessuna modellazione della rete**: non si considerano vincoli di connessione alla rete, costi di allacciamento, limiti di potenza contrattuale
2. **Nessuna modellazione del terreno**: non si valutano vincoli spaziali (ombreggiamento FV, disponibilita terreno per eolico, orientamento falde)
3. **Nessuna analisi multi-sito**: ogni sito e ottimizzato indipendentemente, senza considerare sinergie tra siti (es. comunita energetiche rinnovabili)
4. **Nessun trasporto energetico**: non si modellano reti di teleriscaldamento o pipeline
5. **Nessuna incertezza**: il modello e deterministico, non si eseguono analisi di sensibilita automatiche
6. **Nessun mercato spot**: non si considerano contratti PPA, mercato dei servizi di dispacciamento, demand response

---

## 11. Fonti e Riferimenti

### 11.1 Normativa

- **ISO 50001:2018** - Sistemi di gestione dell'energia - Requisiti e guida per l'uso
- **D.Lgs. 102/2014** - Attuazione della direttiva 2012/27/UE sull'efficienza energetica (obbligo audit energetico per grandi imprese)
- **DPR 412/93** - Regolamento per la progettazione, installazione, esercizio e manutenzione degli impianti termici (zone climatiche, stagione di riscaldamento)
- **Direttiva 2012/27/UE** - Direttiva sull'efficienza energetica (Energy Efficiency Directive)
- **Direttiva 2018/2001/UE** (RED II) - Promozione dell'uso di energia da fonti rinnovabili
- **EPBD recast (2024/1275/UE)** - Energy Performance of Buildings Directive

### 11.2 Benchmark Energetici

- **ENEA** - Rapporti annuali sull'efficienza energetica, benchmark di consumo per settore industriale italiano
- **GSE** - Gestore dei Servizi Energetici, statistiche sui consumi energetici per settore NACE
- **Eurostat** - Energy Balance Sheets, dati di consumo specifico per settore
- **IPCC** - Guidelines for National Greenhouse Gas Inventories (fattori di emissione)
- **ISPRA** - Istituto Superiore per la Protezione e la Ricerca Ambientale (fattore emissivo rete elettrica italiana)

### 11.3 Strumenti di Calcolo

- **PuLP** - Python Linear Programming library per la formulazione del modello MILP
- **HiGHS** - High-performance open-source solver per problemi LP/MILP (solver primario)
- **CBC** - COIN-OR Branch and Cut solver (solver di fallback)
- **Pydantic** - Validazione dei dati di input/output
- **Claude Haiku 4.5** - Modello AI per stima consumi e suggerimenti tecnologici

### 11.4 Convenzioni Adottate

- **Unita energetiche**: kWh per il modello orario, MWh per i dati annuali, EUR/MWh per i prezzi
- **Unita di capacita**: kW per potenza, kWh per accumulo
- **Unita CO2**: tCO2/MWh per i fattori di emissione, tCO2/anno per le emissioni totali
- **Unita finanziarie**: EUR per tutti i costi e risparmi
- **Orizzonte temporale**: 8.760 ore/anno (anno non bisestile)
- **Convenzione segni**: acquisto positivo, vendita negativa (nel bilancio dei costi)

---

*Documento generato il 2 marzo 2026. Ultima revisione: v1.0*
*Per validazione e revisione tecnica, contattare il team AzzeroCO2 Energy.*
