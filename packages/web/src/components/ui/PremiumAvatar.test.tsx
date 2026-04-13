import { render, screen } from "@testing-library/react";
import { PremiumAvatar } from "./PremiumAvatar";
import { AvatarFallback } from "./avatar";

describe("PremiumAvatar", () => {
  it("renders plain Avatar with no crown when isPremium is false", () => {
    const { container } = render(
      <PremiumAvatar isPremium={false} className="h-10 w-10">
        <AvatarFallback>AB</AvatarFallback>
      </PremiumAvatar>,
    );
    expect(container.querySelector('[aria-label="Rommz+ Premium"]')).toBeNull();
    expect(container.firstChild).toHaveAttribute("data-slot", "avatar");
  });

  it("renders crown badge when isPremium is true", () => {
    render(
      <PremiumAvatar isPremium={true} className="h-10 w-10">
        <AvatarFallback>AB</AvatarFallback>
      </PremiumAvatar>,
    );
    expect(screen.getByLabelText("Rommz+ Premium")).toBeInTheDocument();
  });

  it("renders no crown when isPremium is undefined (defaults to no ring)", () => {
    const { container } = render(
      <PremiumAvatar className="h-10 w-10">
        <AvatarFallback>AB</AvatarFallback>
      </PremiumAvatar>,
    );
    expect(container.querySelector('[aria-label="Rommz+ Premium"]')).toBeNull();
  });

  it("passes className to wrapper div when premium", () => {
    const { container } = render(
      <PremiumAvatar isPremium={true} className="h-20 w-20">
        <AvatarFallback>AB</AvatarFallback>
      </PremiumAvatar>,
    );
    expect(container.firstChild).toHaveClass("h-20", "w-20");
  });

  it("passes className through to the inner Avatar when premium", () => {
    const { container } = render(
      <PremiumAvatar isPremium={true} className="h-20 w-20 rounded-[28px] shadow-lg">
        <AvatarFallback>AB</AvatarFallback>
      </PremiumAvatar>,
    );

    const premiumAvatar = container.querySelector('[data-slot="avatar"]');
    expect(premiumAvatar).toHaveClass("absolute", "border-2", "border-white", "shadow-lg", "rounded-[inherit]");
  });
});
