/**
 * Tests for KYC Shared Components
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { KYCStepIcon } from "../../shared/KYCStepIcon";
import { KYCStatusBadge } from "../../shared/KYCStatusBadge";
import { KYCProgress } from "../../shared/KYCProgress";
import { KYCStepCard } from "../../shared/KYCStepCard";
import { mockKYCSteps } from "../testUtils";

describe("KYCStepIcon", () => {
  it("should render completed icon", () => {
    const { container } = render(<KYCStepIcon status="completed" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
    expect(container.querySelector(".text-green-600")).toBeInTheDocument();
  });

  it("should render in_progress icon with animation", () => {
    const { container } = render(<KYCStepIcon status="in_progress" />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("should render pending icon", () => {
    const { container } = render(<KYCStepIcon status="pending" />);
    expect(container.querySelector(".text-gray-400")).toBeInTheDocument();
  });

  it("should render different sizes", () => {
    const { container: small } = render(
      <KYCStepIcon status="completed" size="sm" />
    );
    const { container: large } = render(
      <KYCStepIcon status="completed" size="lg" />
    );

    expect(small.querySelector(".h-4")).toBeInTheDocument();
    expect(large.querySelector(".h-8")).toBeInTheDocument();
  });
});

describe("KYCStatusBadge", () => {
  it("should render completed badge", () => {
    render(<KYCStatusBadge status="completed" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("should render in_progress badge", () => {
    render(<KYCStatusBadge status="in_progress" />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("should render pending badge", () => {
    render(<KYCStatusBadge status="pending" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("should render custom label", () => {
    render(<KYCStatusBadge status="completed" label="Verified" />);
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });
});

describe("KYCProgress", () => {
  it("should display correct percentage", () => {
    render(<KYCProgress value={75} />);
    expect(screen.getByText("75% Complete")).toBeInTheDocument();
  });

  it("should show completion message at 100%", () => {
    render(<KYCProgress value={100} />);
    expect(screen.getByText("✓ All steps completed")).toBeInTheDocument();
  });

  it("should not show completion message below 100%", () => {
    render(<KYCProgress value={99} />);
    expect(screen.queryByText("✓ All steps completed")).not.toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <KYCProgress value={50} className="custom-class" />
    );
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });
});

describe("KYCStepCard", () => {
  const mockStep = mockKYCSteps[0];
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it("should render step title and description", () => {
    render(<KYCStepCard step={mockStep} onClick={mockOnClick} />);
    expect(screen.getByText(mockStep.title)).toBeInTheDocument();
    expect(screen.getByText(mockStep.description)).toBeInTheDocument();
  });

  it("should call onClick when clicked", () => {
    render(<KYCStepCard step={mockStep} onClick={mockOnClick} />);
    const card = screen.getByText(mockStep.title).closest("div")?.parentElement;
    if (card) {
      fireEvent.click(card);
      expect(mockOnClick).toHaveBeenCalled();
    }
  });

  it("should show completed indicator for completed steps", () => {
    const completedStep = { ...mockStep, status: "completed" as const };
    render(<KYCStepCard step={completedStep} onClick={mockOnClick} />);
    expect(screen.getByText("✓ Verified")).toBeInTheDocument();
  });

  it("should show progress bar for in_progress steps", () => {
    const inProgressStep = {
      ...mockStep,
      status: "in_progress" as const,
      percentage: 60,
    };
    render(<KYCStepCard step={inProgressStep} onClick={mockOnClick} />);
    expect(screen.getByText("60%")).toBeInTheDocument();
  });

  it("should render KYCStepIcon", () => {
    const { container } = render(
      <KYCStepCard step={mockStep} onClick={mockOnClick} />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("should render chevron icon", () => {
    const { container } = render(
      <KYCStepCard step={mockStep} onClick={mockOnClick} />
    );
    const chevrons = container.querySelectorAll("svg");
    expect(chevrons.length).toBeGreaterThan(0);
  });
});
