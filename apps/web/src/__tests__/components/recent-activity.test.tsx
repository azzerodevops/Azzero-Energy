import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentActivity } from "@/components/dashboard/recent-activity";

const now = new Date("2026-02-27T12:00:00Z");

const sampleActivity = [
  {
    id: "1",
    type: "analysis_created" as const,
    title: "Analisi stabilimento Nord",
    description: "Creata nuova analisi energetica per lo stabilimento Nord",
    timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
  },
  {
    id: "2",
    type: "scenario_completed" as const,
    title: "Scenario fotovoltaico completato",
    description: "Ottimizzazione completata con risparmio del 25%",
    timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
  },
  {
    id: "3",
    type: "scenario_failed" as const,
    title: "Scenario fallito",
    description: "Errore durante il calcolo dello scenario",
    timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  },
];

describe("RecentActivity", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders activity items with their titles and descriptions", () => {
    render(<RecentActivity activity={sampleActivity} />);

    expect(screen.getByText("Analisi stabilimento Nord")).toBeInTheDocument();
    expect(
      screen.getByText("Creata nuova analisi energetica per lo stabilimento Nord"),
    ).toBeInTheDocument();

    expect(screen.getByText("Scenario fotovoltaico completato")).toBeInTheDocument();
    expect(
      screen.getByText("Ottimizzazione completata con risparmio del 25%"),
    ).toBeInTheDocument();

    expect(screen.getByText("Scenario fallito")).toBeInTheDocument();
    expect(
      screen.getByText("Errore durante il calcolo dello scenario"),
    ).toBeInTheDocument();
  });

  it("renders the section title 'Attivita' recenti'", () => {
    render(<RecentActivity activity={sampleActivity} />);

    expect(screen.getByText("Attività recenti")).toBeInTheDocument();
  });

  it("renders empty state when no activities", () => {
    render(<RecentActivity activity={[]} />);

    expect(screen.getByText("Nessuna attività recente")).toBeInTheDocument();
  });

  it("displays relative time in Italian (minutes)", () => {
    render(<RecentActivity activity={sampleActivity} />);

    // 5 minutes ago => "5 minuti fa"
    expect(screen.getByText("5 minuti fa")).toBeInTheDocument();
  });

  it("displays relative time in Italian (hours)", () => {
    render(<RecentActivity activity={sampleActivity} />);

    // 3 hours ago => "3 ore fa"
    expect(screen.getByText("3 ore fa")).toBeInTheDocument();
  });

  it("displays relative time in Italian (days)", () => {
    render(<RecentActivity activity={sampleActivity} />);

    // 2 days ago => "2 giorni fa"
    expect(screen.getByText("2 giorni fa")).toBeInTheDocument();
  });

  it("displays 'Adesso' for timestamps less than 1 minute ago", () => {
    const recentItem = [
      {
        id: "now",
        type: "analysis_created" as const,
        title: "Appena creata",
        description: "Attività appena avvenuta",
        timestamp: new Date(now.getTime() - 10 * 1000).toISOString(), // 10 seconds ago
      },
    ];

    render(<RecentActivity activity={recentItem} />);

    expect(screen.getByText("Adesso")).toBeInTheDocument();
  });

  it("uses singular forms correctly (1 minuto, 1 ora, 1 giorno)", () => {
    const singularItems = [
      {
        id: "s1",
        type: "analysis_created" as const,
        title: "Un minuto fa",
        description: "Desc",
        timestamp: new Date(now.getTime() - 1 * 60 * 1000).toISOString(),
      },
      {
        id: "s2",
        type: "scenario_completed" as const,
        title: "Un'ora fa",
        description: "Desc",
        timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "s3",
        type: "scenario_failed" as const,
        title: "Un giorno fa",
        description: "Desc",
        timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    render(<RecentActivity activity={singularItems} />);

    expect(screen.getByText("1 minuto fa")).toBeInTheDocument();
    expect(screen.getByText("1 ora fa")).toBeInTheDocument();
    expect(screen.getByText("1 giorno fa")).toBeInTheDocument();
  });

  it("displays formatted date for timestamps older than 7 days", () => {
    const oldItem = [
      {
        id: "old",
        type: "analysis_created" as const,
        title: "Vecchia attività",
        description: "Molto tempo fa",
        timestamp: new Date("2026-01-15T10:00:00Z").toISOString(), // Jan 15
      },
    ];

    render(<RecentActivity activity={oldItem} />);

    // Format: dd/mm/yyyy => "15/01/2026"
    expect(screen.getByText("15/01/2026")).toBeInTheDocument();
  });
});
