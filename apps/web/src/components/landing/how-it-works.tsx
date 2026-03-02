"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: 1,
    title: "Carica i dati",
    description:
      "Inserisci i dati del tuo impianto: consumi, bollette, planimetrie. Il wizard ti guida passo passo.",
  },
  {
    number: 2,
    title: "Simula scenari",
    description:
      "Configura tecnologie e parametri. L'ottimizzatore calcola la soluzione più efficiente.",
  },
  {
    number: 3,
    title: "Genera report",
    description:
      "Ottieni report professionali con analisi economica, ambientale e piano d'azione.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-muted/30 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Come funziona
          </h2>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-8"
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={stepVariants}
              className="flex flex-col items-center text-center"
            >
              {/* Numbered circle */}
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {step.number}
              </div>

              <h3 className="mb-3 text-xl font-semibold text-foreground">
                {step.title}
              </h3>

              <p className="max-w-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Connecting lines (desktop only) */}
        <div className="relative -mt-[calc(24px+8rem+3rem)] hidden md:block">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-16">
            <div className="h-px flex-1 bg-border" />
            <div className="mx-4 h-2 w-2 rounded-full bg-primary" />
            <div className="h-px flex-1 bg-border" />
          </div>
        </div>
      </div>
    </section>
  );
}
