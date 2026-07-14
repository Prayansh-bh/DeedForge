import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun, Menu, X, ChevronDown } from "lucide-react";
import { registeredDeeds, unregisteredDeeds } from "@/lib/deed-data";

function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const initial = stored === "dark" ? "dark" : "light";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return { theme, toggle };
}

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl font-bold tracking-tight">
          <span className="inline-block h-6 w-6 rounded-sm bg-foreground" aria-hidden />
          DeedForge
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <NavLink to="/">Home</NavLink>

          <DeedMenu label="Registered" deeds={registeredDeeds} />
          <DeedMenu label="Unregistered" deeds={unregisteredDeeds} />

          <NavLink to="/testimonials">Testimonials</NavLink>
          <NavLink to="/about">About Us</NavLink>
          <NavLink to="/contact">Contact Us</NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${theme === "light" ? "night" : "day"} mode`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background transition-colors hover:bg-accent"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border md:hidden">
          <nav className="container-x flex flex-col py-4 text-sm" aria-label="Mobile">
            <MobileLink to="/" onClick={() => setMobileOpen(false)}>Home</MobileLink>
            <div className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registered Deeds</div>
            {registeredDeeds.map((d) => (
              <MobileLink key={d.slug} to="/deed/$slug" params={{ slug: d.slug }} onClick={() => setMobileOpen(false)}>
                {d.name}
              </MobileLink>
            ))}
            <div className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unregistered Deeds</div>
            {unregisteredDeeds.map((d) => (
              <MobileLink key={d.slug} to="/deed/$slug" params={{ slug: d.slug }} onClick={() => setMobileOpen(false)}>
                {d.name}
              </MobileLink>
            ))}
            <MobileLink to="/testimonials" onClick={() => setMobileOpen(false)}>Testimonials</MobileLink>
            <MobileLink to="/about" onClick={() => setMobileOpen(false)}>About Us</MobileLink>
            <MobileLink to="/contact" onClick={() => setMobileOpen(false)}>Contact Us</MobileLink>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
      activeProps={{ className: "rounded-md px-3 py-2 text-sm font-medium bg-accent text-foreground" }}
    >
      {children}
    </Link>
  );
}

function MobileLink({ to, params, onClick, children }: { to: string; params?: Record<string, string>; onClick: () => void; children: React.ReactNode }) {
  const props = { to, params, onClick, className: "rounded-md px-3 py-2 text-sm text-foreground/90 hover:bg-accent" } as unknown as React.ComponentProps<typeof Link>;
  return <Link {...props}>{children}</Link>;
}

function DeedMenu({ label, deeds }: { label: string; deeds: typeof registeredDeeds }) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
      >
        {label}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <div className="invisible absolute left-0 top-full z-50 mt-1 w-64 rounded-md border border-border bg-popover p-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label} Documents
        </div>
        {deeds.map((d) => (
          <Link
            key={d.slug}
            to="/deed/$slug"
            params={{ slug: d.slug }}
            className="block rounded-sm px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-accent"
          >
            {d.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
