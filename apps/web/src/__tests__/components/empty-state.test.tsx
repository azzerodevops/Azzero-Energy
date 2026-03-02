import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "@/components/shared/empty-state";
import { FileSearch, Plus } from "lucide-react";

// Mock next/link as a simple anchor tag
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        icon={FileSearch}
        title="Nessun sito trovato"
        description="Aggiungi il tuo primo sito per iniziare."
      />,
    );

    expect(screen.getByText("Nessun sito trovato")).toBeInTheDocument();
    expect(
      screen.getByText("Aggiungi il tuo primo sito per iniziare."),
    ).toBeInTheDocument();
  });

  it("renders the icon", () => {
    const { container } = render(
      <EmptyState
        icon={FileSearch}
        title="Nessun risultato"
        description="Prova con altri criteri di ricerca."
      />,
    );

    // Lucide renders an SVG element
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });

  it("renders action button with link when actionHref is provided", () => {
    render(
      <EmptyState
        icon={Plus}
        title="Nessuna analisi"
        description="Crea la tua prima analisi."
        actionLabel="Nuova analisi"
        actionHref="/dashboard/analyses/new"
      />,
    );

    const link = screen.getByRole("link", { name: "Nuova analisi" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/dashboard/analyses/new");
  });

  it("renders action button with onClick when onAction is provided", async () => {
    const handleAction = vi.fn();
    const user = userEvent.setup();

    render(
      <EmptyState
        icon={Plus}
        title="Nessun scenario"
        description="Crea il tuo primo scenario."
        actionLabel="Nuovo scenario"
        onAction={handleAction}
      />,
    );

    const button = screen.getByRole("button", { name: "Nuovo scenario" });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it("does not render any button when no action props are provided", () => {
    render(
      <EmptyState
        icon={FileSearch}
        title="Vuoto"
        description="Nessun elemento presente."
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("does not render link button when actionLabel is missing even if actionHref is set", () => {
    render(
      <EmptyState
        icon={FileSearch}
        title="Test"
        description="Descrizione"
        actionHref="/dashboard/somewhere"
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
