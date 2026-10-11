import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.ui";

describe("Card primitives", () => {
  it("renders the composed card with slots and default size", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Desc</CardDescription>
        </CardHeader>
        <CardContent>Body</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>,
    );
    expect(container.querySelector('[data-slot="card"]')).toHaveAttribute("data-size", "default");
    expect(screen.getByText("Title")).toHaveAttribute("data-slot", "card-title");
    expect(screen.getByText("Desc")).toHaveAttribute("data-slot", "card-description");
    expect(screen.getByText("Body")).toHaveAttribute("data-slot", "card-content");
    expect(screen.getByText("Footer")).toHaveAttribute("data-slot", "card-footer");
  });

  it("sets data-size to sm when requested and merges custom classes", () => {
    const { container } = render(<Card size="sm" className="custom-x">x</Card>);
    const card = container.querySelector('[data-slot="card"]');
    expect(card).toHaveAttribute("data-size", "sm");
    expect(card).toHaveClass("custom-x");
  });
});
