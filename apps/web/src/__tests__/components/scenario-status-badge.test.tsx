import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ScenarioStatusBadge } from "@/components/scenarios/scenario-status-badge";

describe("ScenarioStatusBadge", () => {
  it("renders the correct label for 'draft' status", () => {
    render(<ScenarioStatusBadge status="draft" />);
    expect(screen.getByText("Bozza")).toBeInTheDocument();
  });

  it("renders the correct label for 'queued' status", () => {
    render(<ScenarioStatusBadge status="queued" />);
    expect(screen.getByText("In coda")).toBeInTheDocument();
  });

  it("renders the correct label for 'running' status", () => {
    render(<ScenarioStatusBadge status="running" />);
    expect(screen.getByText("In calcolo")).toBeInTheDocument();
  });

  it("renders the correct label for 'completed' status", () => {
    render(<ScenarioStatusBadge status="completed" />);
    expect(screen.getByText("Completato")).toBeInTheDocument();
  });

  it("renders the correct label for 'failed' status", () => {
    render(<ScenarioStatusBadge status="failed" />);
    expect(screen.getByText("Errore")).toBeInTheDocument();
  });

  it("renders the correct label for 'outdated' status", () => {
    render(<ScenarioStatusBadge status="outdated" />);
    expect(screen.getByText("Obsoleto")).toBeInTheDocument();
  });

  it("shows spinner (Loader2) for 'running' status", () => {
    const { container } = render(<ScenarioStatusBadge status="running" />);
    const spinner = container.querySelector("svg.animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("shows spinner (Loader2) for 'queued' status", () => {
    const { container } = render(<ScenarioStatusBadge status="queued" />);
    const spinner = container.querySelector("svg.animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("does not show spinner for 'draft' status", () => {
    const { container } = render(<ScenarioStatusBadge status="draft" />);
    const spinner = container.querySelector("svg.animate-spin");
    expect(spinner).not.toBeInTheDocument();
  });

  it("does not show spinner for 'completed' status", () => {
    const { container } = render(<ScenarioStatusBadge status="completed" />);
    const spinner = container.querySelector("svg.animate-spin");
    expect(spinner).not.toBeInTheDocument();
  });

  it("does not show spinner for 'failed' status", () => {
    const { container } = render(<ScenarioStatusBadge status="failed" />);
    const spinner = container.querySelector("svg.animate-spin");
    expect(spinner).not.toBeInTheDocument();
  });

  it("falls back to raw status string for unknown status", () => {
    render(<ScenarioStatusBadge status="unknown_status" />);
    expect(screen.getByText("unknown_status")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ScenarioStatusBadge status="draft" className="custom-class" />,
    );
    const badge = container.querySelector(".custom-class");
    expect(badge).toBeInTheDocument();
  });
});
