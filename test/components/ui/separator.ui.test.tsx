import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Separator } from "@/components/ui/separator.ui";

describe("Separator", () => {
  it("renders a decorative horizontal separator by default", () => {
    const { container } = render(<Separator />);
    const el = container.querySelector('[data-slot="separator"]');
    expect(el).toHaveAttribute("data-orientation", "horizontal");
    expect(el).toHaveAttribute("role", "none");
  });

  it("uses role=separator when not decorative and supports vertical orientation", () => {
    const { container } = render(<Separator decorative={false} orientation="vertical" />);
    const el = container.querySelector('[data-slot="separator"]');
    expect(el).toHaveAttribute("role", "separator");
    expect(el).toHaveAttribute("aria-orientation", "vertical");
  });
});
