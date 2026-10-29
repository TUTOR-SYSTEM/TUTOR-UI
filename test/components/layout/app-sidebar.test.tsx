import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { appShellDictionary } from "@/lib/i18n/app-shell.dictionary";
import { DEFAULT_LANGUAGE } from "@/types";
import { useAuthStore } from "@/zustand/auth.store";

const copy = appShellDictionary[DEFAULT_LANGUAGE];

const nav = vi.hoisted(() => ({ pathname: "/" }));
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => router,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...rest} />
  ),
}));

import AppSidebar from "@/components/layout/app-sidebar";

// Sign-out goes through a TanStack mutation; stub it so the sidebar renders without a QueryClient.
const logoutMock = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("@/lib/services/auth.service", () => ({
  useAuthActions: () => ({ logout: {
    mutate: (_payload: unknown, opts?: { onSettled?: () => void }) => {
      logoutMock.mutate();
      opts?.onSettled?.();
    },
  } }),
}));

const initialAuth = useAuthStore.getState();

const jwt = (payload: Record<string, unknown>) =>
  `h.${btoa(JSON.stringify(payload))}.s`;

function signIn(
  role: string,
  user: Record<string, unknown> = {},
  accessToken: string | null = jwt({ role }),
) {
  useAuthStore.setState(
    {
      accessToken,
      user: { role, ...user } as never,
    },
    false,
  );
}

/** Returns the sidebar's main nav links (excluding the profile popover). */
function navLinks() {
  const navEl = screen.getByRole("navigation");
  return within(navEl).getAllByRole("link");
}

/** Visible label of each link, without the badge count rendered inside it. */
function navLabels() {
  return navLinks().map((link) =>
    Array.from(link.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent ?? "")
      .join("")
      .trim(),
  );
}

describe("AppSidebar", () => {
  beforeEach(() => {
    nav.pathname = "/";
    router.push.mockReset();
    router.replace.mockReset();
    signIn("TUTOR", { firstName: "An", lastName: "Le" });
  });

  afterEach(() => {
    useAuthStore.setState(initialAuth, true);
  });

  describe("brand header", () => {
    it("renders the brand name and tagline", () => {
      render(<AppSidebar />);
      expect(screen.getByText(copy.brand.name)).toBeInTheDocument();
      expect(screen.getByText(copy.brand.tagline)).toBeInTheDocument();
    });
  });

  describe("navigation by role", () => {
    it("shows the full tutor menu including fees, but not students (ADMIN-only list endpoint)", () => {
      signIn("TUTOR");
      render(<AppSidebar />);
      const labels = navLabels();
      expect(labels).toEqual(
        expect.arrayContaining([
          copy.nav.overview,
          copy.nav.schedule,
          copy.nav.notifications,
          copy.nav.classes,
          copy.nav.curriculum,
          copy.nav.grades,
          copy.nav.fees,
          copy.nav.discussions,
          copy.nav.aiChat,
        ]),
      );
      expect(labels).not.toContain(copy.nav.students);
      expect(labels).not.toContain(copy.nav.tutors);
      expect(labels).not.toContain(copy.nav.logger);
    });

    it("shows the trimmed admin menu with tutors, logger and test monitor", () => {
      signIn("ADMIN");
      render(<AppSidebar />);
      expect(navLabels()).toEqual([
        copy.nav.overview,
        copy.nav.tutors,
        copy.nav.students,
        copy.nav.flowRequests,
        copy.nav.logger,
        copy.nav.testMonitor,
        copy.nav.settings,
      ]);
    });

    it("hides students and fees from the student menu", () => {
      signIn("STUDENT");
      render(<AppSidebar />);
      const labels = navLabels();
      expect(labels).toContain(copy.nav.grades);
      expect(labels).not.toContain(copy.nav.students);
      expect(labels).not.toContain(copy.nav.fees);
      expect(labels).not.toContain(copy.nav.tutors);
    });

    it("shows child-scoped curriculum and grades for parents", () => {
      signIn("PARENT");
      render(<AppSidebar />);
      const labels = navLabels();
      expect(labels).toContain(copy.nav.fees);
      expect(labels).not.toContain(copy.nav.students);
      expect(labels).not.toContain(copy.nav.users);
    });

    it("always appends the settings link for every role", () => {
      for (const role of ["ADMIN", "TUTOR", "STUDENT", "PARENT"]) {
        signIn(role);
        const { unmount } = render(<AppSidebar />);
        const settings = navLinks().at(-1)!;
        expect(settings).toHaveAttribute("href", "/settings");
        expect(settings.textContent).toBe(copy.nav.settings);
        unmount();
      }
    });

    it("links every nav item to its route", () => {
      signIn("STUDENT");
      render(<AppSidebar />);
      const hrefs = navLinks().map((l) => l.getAttribute("href"));
      expect(hrefs).toEqual(
        expect.arrayContaining(["/", "/schedule", "/notifications", "/classes", "/grades", "/discussions", "/ai-chat"]),
      );
    });

    it("defaults to the tutor menu when no role is available", () => {
      useAuthStore.setState({ accessToken: null, user: null }, false);
      render(<AppSidebar />);
      expect(navLabels()).toContain(copy.nav.fees);
      expect(navLabels()).not.toContain(copy.nav.students);
    });
  });

  describe("active item", () => {
    it("marks only the home link active on the root path", () => {
      nav.pathname = "/";
      render(<AppSidebar />);
      const active = navLinks().filter((l) => l.className.includes("bg-sidebar-primary"));
      expect(active.map((l) => l.getAttribute("href"))).toEqual(["/"]);
    });

    it("marks a nested route active under its section", () => {
      nav.pathname = "/classes/abc-123/curriculum";
      render(<AppSidebar />);
      const active = navLinks().filter((l) => l.className.includes("bg-sidebar-primary"));
      expect(active.map((l) => l.getAttribute("href"))).toEqual(["/classes"]);
    });

    it("does not treat a sibling prefix as active", () => {
      nav.pathname = "/classes-archive";
      render(<AppSidebar />);
      const active = navLinks().filter((l) => l.className.includes("bg-sidebar-primary"));
      expect(active).toHaveLength(0);
    });

    it("does not mark the home link active on a deeper unrelated route", () => {
      nav.pathname = "/schedule";
      render(<AppSidebar />);
      const home = navLinks().find((l) => l.getAttribute("href") === "/")!;
      expect(home.className).not.toContain("bg-sidebar-primary");
    });
  });

  describe("notification badge", () => {
    it("shows the badge count on the notifications item", () => {
      render(<AppSidebar />);
      const link = navLinks().find((l) => l.getAttribute("href") === "/notifications")!;
      expect(within(link).getByText("5")).toBeInTheDocument();
    });

    it("does not show a badge on items without one", () => {
      render(<AppSidebar />);
      const link = navLinks().find((l) => l.getAttribute("href") === "/schedule")!;
      expect(within(link).queryByText(/^\d+$/)).toBeNull();
    });
  });

  describe("profile block", () => {
    it("shows initials when the user has no avatar", () => {
      render(<AppSidebar />);
      expect(screen.getByText("AL")).toBeInTheDocument();
    });

    it("falls back to 'U' when the user has no name", () => {
      signIn("TUTOR", {});
      render(<AppSidebar />);
      expect(screen.getByText("U")).toBeInTheDocument();
    });

    it("shows the full display name", () => {
      render(<AppSidebar />);
      expect(screen.getByText("An Le")).toBeInTheDocument();
    });

    it("falls back to the default user label when there is no name", () => {
      signIn("PARENT", {});
      render(<AppSidebar />);
      expect(screen.getByText(copy.userMenu.defaultName)).toBeInTheDocument();
    });

    it("renders the avatar image when the user has one", () => {
      signIn("TUTOR", { firstName: "An", lastName: "Le", avatar: "https://cdn.example.com/a.png" });
      render(<AppSidebar />);
      const img = screen.getByRole("img", { name: "An Le" });
      expect(img).toHaveAttribute("src", "https://cdn.example.com/a.png");
    });

    it("shows the tutor's subjects as the subtitle when present", () => {
      signIn("TUTOR", { firstName: "An", lastName: "Le", subjects: "Toán, Lý" });
      render(<AppSidebar />);
      expect(screen.getByText("Toán, Lý")).toBeInTheDocument();
    });

    it("shows the role label as the subtitle for non-tutors", () => {
      signIn("STUDENT", { firstName: "An", lastName: "Le", subjects: "Toán" });
      render(<AppSidebar />);
      expect(screen.getByText(copy.roleLabels.STUDENT)).toBeInTheDocument();
      expect(screen.queryByText("Toán")).not.toBeInTheDocument();
    });
  });

  describe("user menu", () => {
    function openMenu() {
      fireEvent.click(screen.getByText("An Le"));
    }

    it("opens the menu with settings and sign-out actions", () => {
      render(<AppSidebar />);
      openMenu();
      const settingsLinks = screen.getAllByRole("link", { name: copy.userMenu.settings });
      expect(settingsLinks.at(-1)).toHaveAttribute("href", "/settings");
      expect(screen.getByRole("button", { name: copy.userMenu.signOut })).toBeInTheDocument();
    });

    it("signs out: calls the server logout, clears the access token and routes to /login", () => {
      render(<AppSidebar />);
      openMenu();
      fireEvent.click(screen.getByRole("button", { name: copy.userMenu.signOut }));
      expect(logoutMock.mutate).toHaveBeenCalledTimes(1);
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(router.push).toHaveBeenCalledWith("/login");
    });
  });
});
