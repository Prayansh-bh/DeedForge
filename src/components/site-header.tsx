import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { Moon, Sun, Menu, X, ChevronDown, LogIn, LogOut, UserCircle2 } from "lucide-react";
import { registeredDeeds, unregisteredDeeds } from "@/lib/deed-data";
import { useAuth } from "@/hooks/use-auth";

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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    navigate({ to: "/" });
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-2 font-serif text-xl font-bold tracking-tight">
          <span className="inline-block h-6 w-6 rounded-sm bg-foreground" aria-hidden />
          DeedForge
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          <NavLink to="/">Home</NavLink>

          <DeedMenu label="Registered" deeds={registeredDeeds} requiresAuth />
          <DeedMenu label="Unregistered" deeds={unregisteredDeeds} requiresAuth />

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

          {/* Auth button area */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                id="header-user-menu"
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="hidden md:inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {initials}
                </span>
                <span className="max-w-[120px] truncate">{displayName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-border bg-popover p-2 shadow-lg">
                  <div className="border-b border-border px-3 py-2 mb-1">
                    <p className="text-xs font-semibold text-foreground truncate">{user.user_metadata?.full_name || "My Account"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                  </div>
                  <button
                    id="header-logout-btn"
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              id="header-login-btn"
              to="/auth"
              className="hidden md:inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 hover:-translate-y-0.5"
            >
              <LogIn className="h-3.5 w-3.5" /> Log In
            </Link>
          )}

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
              <MobileAuthLink key={d.slug} slug={d.slug} onClick={() => setMobileOpen(false)}>
                {d.name}
              </MobileAuthLink>
            ))}
            <div className="py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unregistered Deeds</div>
            {unregisteredDeeds.map((d) => (
              <MobileAuthLink key={d.slug} slug={d.slug} onClick={() => setMobileOpen(false)}>
                {d.name}
              </MobileAuthLink>
            ))}
            <MobileLink to="/testimonials" onClick={() => setMobileOpen(false)}>Testimonials</MobileLink>
            <MobileLink to="/about" onClick={() => setMobileOpen(false)}>About Us</MobileLink>
            <MobileLink to="/contact" onClick={() => setMobileOpen(false)}>Contact Us</MobileLink>

            <div className="mt-3 border-t border-border pt-3">
              {user ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                >
                  <LogIn className="h-4 w-4" /> Log In / Sign Up
                </Link>
              )}
            </div>
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

function MobileAuthLink({ slug, onClick, children }: { slug: string; onClick: () => void; children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleClick = () => {
    onClick();
    if (!user) {
      navigate({ to: "/auth", search: { redirect: `/deed/${slug}`, tab: "login" } });
    } else {
      navigate({ to: "/deed/$slug", params: { slug } });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-left rounded-md px-3 py-2 text-sm text-foreground/90 hover:bg-accent"
    >
      {children}
    </button>
  );
}

function DeedMenu({ label, deeds, requiresAuth }: { label: string; deeds: typeof registeredDeeds; requiresAuth?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDeedClick = (slug: string) => {
    if (requiresAuth && !user) {
      navigate({ to: "/auth", search: { redirect: `/deed/${slug}`, tab: "login" } });
    } else {
      navigate({ to: "/deed/$slug", params: { slug } });
    }
  };

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
          <button
            key={d.slug}
            type="button"
            onClick={() => handleDeedClick(d.slug)}
            className="block w-full text-left rounded-sm px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-accent"
          >
            {d.name}
          </button>
        ))}
      </div>
    </div>
  );
}
