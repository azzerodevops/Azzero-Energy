// ============================================================
// AzzeroCO2 Energy - NACE Codes Seed Data
// ~55 energy-relevant EU activity classification codes
// ============================================================

export const naceCodes = [
  // Section A - Agriculture
  { code: "A01", description: "Coltivazioni agricole e produzione di prodotti animali", section: "A", isEnergyRelevant: true },
  { code: "A02", description: "Silvicoltura e utilizzo di aree forestali", section: "A", isEnergyRelevant: true },
  { code: "A03", description: "Pesca e acquacoltura", section: "A", isEnergyRelevant: true },

  // Section B - Mining
  { code: "B05", description: "Estrazione di carbone", section: "B", isEnergyRelevant: true },
  { code: "B06", description: "Estrazione di petrolio greggio e di gas naturale", section: "B", isEnergyRelevant: true },
  { code: "B08", description: "Altre attivit\u00e0 di estrazione di minerali da cave e miniere", section: "B", isEnergyRelevant: true },

  // Section C - Manufacturing (most important for energy audits)
  { code: "C10", description: "Industrie alimentari", section: "C", isEnergyRelevant: true },
  { code: "C11", description: "Industria delle bevande", section: "C", isEnergyRelevant: true },
  { code: "C13", description: "Industrie tessili", section: "C", isEnergyRelevant: true },
  { code: "C14", description: "Confezione di articoli di abbigliamento", section: "C", isEnergyRelevant: true },
  { code: "C15", description: "Fabbricazione di articoli in pelle", section: "C", isEnergyRelevant: true },
  { code: "C16", description: "Industria del legno", section: "C", isEnergyRelevant: true },
  { code: "C17", description: "Fabbricazione di carta e di prodotti di carta", section: "C", isEnergyRelevant: true },
  { code: "C18", description: "Stampa e riproduzione di supporti registrati", section: "C", isEnergyRelevant: true },
  { code: "C19", description: "Fabbricazione di coke e prodotti della raffinazione del petrolio", section: "C", isEnergyRelevant: true },
  { code: "C20", description: "Fabbricazione di prodotti chimici", section: "C", isEnergyRelevant: true },
  { code: "C21", description: "Fabbricazione di prodotti farmaceutici", section: "C", isEnergyRelevant: true },
  { code: "C22", description: "Fabbricazione di articoli in gomma e materie plastiche", section: "C", isEnergyRelevant: true },
  { code: "C23", description: "Fabbricazione di altri prodotti della lavorazione di minerali non metalliferi", section: "C", isEnergyRelevant: true },
  { code: "C24", description: "Metallurgia", section: "C", isEnergyRelevant: true },
  { code: "C25", description: "Fabbricazione di prodotti in metallo", section: "C", isEnergyRelevant: true },
  { code: "C26", description: "Fabbricazione di computer e prodotti di elettronica", section: "C", isEnergyRelevant: true },
  { code: "C27", description: "Fabbricazione di apparecchiature elettriche", section: "C", isEnergyRelevant: true },
  { code: "C28", description: "Fabbricazione di macchinari ed apparecchiature", section: "C", isEnergyRelevant: true },
  { code: "C29", description: "Fabbricazione di autoveicoli, rimorchi e semirimorchi", section: "C", isEnergyRelevant: true },
  { code: "C30", description: "Fabbricazione di altri mezzi di trasporto", section: "C", isEnergyRelevant: true },
  { code: "C31", description: "Fabbricazione di mobili", section: "C", isEnergyRelevant: true },
  { code: "C32", description: "Altre industrie manifatturiere", section: "C", isEnergyRelevant: true },
  { code: "C33", description: "Riparazione e installazione di macchine", section: "C", isEnergyRelevant: true },

  // Section D - Energy supply
  { code: "D35", description: "Fornitura di energia elettrica, gas, vapore e aria condizionata", section: "D", isEnergyRelevant: true },

  // Section E - Water/Waste
  { code: "E36", description: "Raccolta, trattamento e fornitura di acqua", section: "E", isEnergyRelevant: true },
  { code: "E37", description: "Gestione delle reti fognarie", section: "E", isEnergyRelevant: true },
  { code: "E38", description: "Raccolta, trattamento e smaltimento dei rifiuti", section: "E", isEnergyRelevant: true },

  // Section F - Construction
  { code: "F41", description: "Costruzione di edifici", section: "F", isEnergyRelevant: true },
  { code: "F42", description: "Ingegneria civile", section: "F", isEnergyRelevant: true },
  { code: "F43", description: "Lavori di costruzione specializzati", section: "F", isEnergyRelevant: true },

  // Section G - Wholesale/Retail
  { code: "G45", description: "Commercio all'ingrosso e al dettaglio di autoveicoli", section: "G", isEnergyRelevant: true },
  { code: "G46", description: "Commercio all'ingrosso", section: "G", isEnergyRelevant: true },
  { code: "G47", description: "Commercio al dettaglio", section: "G", isEnergyRelevant: true },

  // Section H - Transport
  { code: "H49", description: "Trasporto terrestre e mediante condotte", section: "H", isEnergyRelevant: true },
  { code: "H50", description: "Trasporto marittimo e per vie d'acqua", section: "H", isEnergyRelevant: true },
  { code: "H51", description: "Trasporto aereo", section: "H", isEnergyRelevant: true },
  { code: "H52", description: "Magazzinaggio e attivit\u00e0 di supporto ai trasporti", section: "H", isEnergyRelevant: true },

  // Section I - Accommodation/Food
  { code: "I55", description: "Alloggio", section: "I", isEnergyRelevant: true },
  { code: "I56", description: "Attivit\u00e0 dei servizi di ristorazione", section: "I", isEnergyRelevant: true },

  // Section J - ICT
  { code: "J61", description: "Telecomunicazioni", section: "J", isEnergyRelevant: true },
  { code: "J62", description: "Produzione di software e consulenza informatica", section: "J", isEnergyRelevant: true },
  { code: "J63", description: "Attivit\u00e0 dei servizi d'informazione", section: "J", isEnergyRelevant: true },

  // Section K - Finance
  { code: "K64", description: "Attivit\u00e0 di servizi finanziari", section: "K", isEnergyRelevant: false },

  // Section L - Real Estate
  { code: "L68", description: "Attivit\u00e0 immobiliari", section: "L", isEnergyRelevant: true },

  // Section M - Professional
  { code: "M69", description: "Attivit\u00e0 legali e contabilit\u00e0", section: "M", isEnergyRelevant: false },
  { code: "M70", description: "Attivit\u00e0 di direzione aziendale e di consulenza gestionale", section: "M", isEnergyRelevant: false },
  { code: "M71", description: "Attivit\u00e0 degli studi di architettura e d'ingegneria", section: "M", isEnergyRelevant: false },

  // Section N - Administrative
  { code: "N77", description: "Attivit\u00e0 di noleggio e leasing operativo", section: "N", isEnergyRelevant: false },

  // Section O - Public administration
  { code: "O84", description: "Amministrazione pubblica e difesa", section: "O", isEnergyRelevant: true },

  // Section P - Education
  { code: "P85", description: "Istruzione", section: "P", isEnergyRelevant: true },

  // Section Q - Health
  { code: "Q86", description: "Assistenza sanitaria", section: "Q", isEnergyRelevant: true },
  { code: "Q87", description: "Servizi di assistenza sociale residenziale", section: "Q", isEnergyRelevant: true },

  // Section R - Arts
  { code: "R90", description: "Attivit\u00e0 creative, artistiche e di intrattenimento", section: "R", isEnergyRelevant: false },
  { code: "R93", description: "Attivit\u00e0 sportive, di intrattenimento e di divertimento", section: "R", isEnergyRelevant: true },
] as const;
