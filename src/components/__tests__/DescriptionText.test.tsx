import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vite-plus/test";
import { DescriptionText } from "../ComplaintDetailView";

describe("DescriptionText", () => {
  it("renders short text without show more button", () => {
    const shortText = "This is a short description.";
    render(<DescriptionText text={shortText} />);
    
    expect(screen.getByText(shortText)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /show more/i })).not.toBeInTheDocument();
  });

  it("truncates long text and shows 'show more' button", () => {
    const longText = "A".repeat(300);
    render(<DescriptionText text={longText} />);
    
    const truncatedText = "A".repeat(200) + "…";
    expect(screen.getByText(truncatedText)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show more/i })).toBeInTheDocument();
  });

  it("expands when 'show more' is clicked and shows 'show less'", async () => {
    const longText = "A".repeat(300);
    render(<DescriptionText text={longText} />);
    const user = userEvent.setup();
    
    const showMoreBtn = screen.getByRole("button", { name: /show more/i });
    await user.click(showMoreBtn);
    
    expect(screen.getByText(longText)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show less/i })).toBeInTheDocument();
  });

  it("collapses when 'show less' is clicked", async () => {
    const longText = "A".repeat(300);
    render(<DescriptionText text={longText} />);
    const user = userEvent.setup();
    
    await user.click(screen.getByRole("button", { name: /show more/i }));
    await user.click(screen.getByRole("button", { name: /show less/i }));
    
    const truncatedText = "A".repeat(200) + "…";
    expect(screen.getByText(truncatedText)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /show more/i })).toBeInTheDocument();
  });
});
