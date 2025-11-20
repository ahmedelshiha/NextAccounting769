/**
 * Tests for KYC Dashboard Components
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { KYCProgressCard } from "../../KYCDashboard/KYCProgressCard";
import { KYCStepsList } from "../../KYCDashboard/KYCStepsList";
import { KYCTimeline } from "../../KYCDashboard/KYCTimeline";
import { mockKYCSteps, mockCompletedSteps } from "../testUtils";

describe("KYCProgressCard", () => {
  it("should display correct progress percentage", () => {
    render(
      <KYCProgressCard completedSteps={4} totalSteps={6} percentage={67} />
    );
    expect(screen.getByText("67%")).toBeInTheDocument();
  });

  it("should display steps completed count", () => {
    render(
      <KYCProgressCard completedSteps={4} totalSteps={6} percentage={67} />
    );
    expect(screen.getByText("4 of 6 steps completed")).toBeInTheDocument();
  });

  it("should show 'Complete' badge at 100%", () => {
    render(
      <KYCProgressCard completedSteps={6} totalSteps={6} percentage={100} />
    );
    expect(screen.getByText("Complete")).toBeInTheDocument();
  });

  it("should show 'In Progress' badge between 50-99%", () => {
    render(
      <KYCProgressCard completedSteps={4} totalSteps={6} percentage={67} />
    );
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("should show 'Not Started' badge below 50%", () => {
    render(
      <KYCProgressCard completedSteps={1} totalSteps={6} percentage={17} />
    );
    expect(screen.getByText("Not Started")).toBeInTheDocument();
  });

  it("should render progress bar", () => {
    const { container } = render(
      <KYCProgressCard completedSteps={4} totalSteps={6} percentage={67} />
    );
    expect(container.querySelector('[role="progressbar"]')).toBeInTheDocument();
  });
});

describe("KYCStepsList", () => {
  const mockOnStepClick = jest.fn();

  beforeEach(() => {
    mockOnStepClick.mockClear();
  });

  it("should render all steps", () => {
    render(<KYCStepsList steps={mockKYCSteps} onStepClick={mockOnStepClick} />);
    mockKYCSteps.forEach((step) => {
      expect(screen.getByText(step.title)).toBeInTheDocument();
    });
  });

  it("should call onStepClick when a step is clicked", () => {
    render(<KYCStepsList steps={mockKYCSteps} onStepClick={mockOnStepClick} />);
    const firstStep = screen.getByText(mockKYCSteps[0].title);
    const card = firstStep.closest("div")?.parentElement;
    if (card) {
      fireEvent.click(card);
      expect(mockOnStepClick).toHaveBeenCalledWith(mockKYCSteps[0].id);
    }
  });

  it("should show empty state when no steps", () => {
    render(<KYCStepsList steps={[]} onStepClick={mockOnStepClick} />);
    expect(screen.getByText("No KYC steps available")).toBeInTheDocument();
  });

  it("should render correct number of step cards", () => {
    const { container } = render(
      <KYCStepsList steps={mockKYCSteps} onStepClick={mockOnStepClick} />
    );
    const cards = container.querySelectorAll('[class*="Card"]');
    expect(cards.length).toBeGreaterThan(0);
  });
});

describe("KYCTimeline", () => {
  it("should render completed steps", () => {
    render(<KYCTimeline completedSteps={mockCompletedSteps} />);
    mockCompletedSteps.forEach((step) => {
      expect(screen.getByText(step.title)).toBeInTheDocument();
    });
  });

  it("should show empty state when no completed steps", () => {
    render(<KYCTimeline completedSteps={[]} />);
    expect(screen.getByText("No steps completed yet")).toBeInTheDocument();
    expect(
      screen.getByText("Start your KYC verification to see your progress here")
    ).toBeInTheDocument();
  });

  it("should display completion dates", () => {
    render(<KYCTimeline completedSteps={mockCompletedSteps} />);
    const dateElements = screen.getAllByText(/Completed on/i);
    expect(dateElements.length).toBe(mockCompletedSteps.length);
  });

  it("should render completed icons for all steps", () => {
    const { container } = render(
      <KYCTimeline completedSteps={mockCompletedSteps} />
    );
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThanOrEqual(mockCompletedSteps.length);
  });

  it("should render empty state icon when no steps", () => {
    const { container } = render(<KYCTimeline completedSteps={[]} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
