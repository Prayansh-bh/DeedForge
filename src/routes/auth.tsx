import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Loader2, Shield, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Login or Sign Up — DeedForge" },
      { name: "description", content: "Sign in or create your DeedForge account to start drafting legally-formatted deeds in minutes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: (search.redirect as string) || "/",
    tab: ((search.tab as string) === "signup" ? "signup" : "login") as "login" | "signup",
  }),
});

function AuthPage() {
  const { user, loading, login, signup, isDemoMode } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const redirectTo = search.redirect || "/";
  const [tab, setTab] = useState<"login" | "signup">(search.tab || "login");

  // If already logged in, redirect away
  useEffect(() => {
    if (!loading && user) {
      navigate({ to: redirectTo as any });
    }
  }, [user, loading, navigate, redirectTo]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo and branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-foreground text-background">
            <FileText className="h-7 w-7" />
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight">DeedForge</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tab === "login" ? "Sign in to your account" : "Create your free account"}
          </p>
          {isDemoMode && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Shield className="h-3 w-3" /> Demo Mode — any email & password accepted
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="mb-6 flex rounded-lg border border-border bg-accent/30 p-1">
          <button
            type="button"
            id="auth-tab-login"
            onClick={() => setTab("login")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all duration-200 ${
              tab === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            id="auth-tab-signup"
            onClick={() => setTab("signup")}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all duration-200 ${
              tab === "signup"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Auth form */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {tab === "login" ? (
            <LoginForm onSuccess={() => navigate({ to: redirectTo as any })} onSwitchTab={() => setTab("signup")} />
          ) : (
            <SignupForm onSuccess={() => navigate({ to: redirectTo as any })} onSwitchTab={() => setTab("login")} />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to DeedForge's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

function LoginForm({ onSuccess, onSwitchTab }: { onSuccess: () => void; onSwitchTab: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: loginError } = await login(email, password);

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => onSuccess(), 600);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Signed in! Redirecting…
        </div>
      )}

      <div className="grid gap-1.5">
        <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Email Address
        </label>
        <input
          id="login-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. rajesh@example.com"
          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-ring"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        id="login-submit"
        type="submit"
        disabled={loading || success}
        className="mt-2 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
          </span>
        ) : success ? (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Signed in!
          </span>
        ) : (
          "Sign In"
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Don't have an account?{" "}
        <button type="button" onClick={onSwitchTab} className="font-semibold text-foreground underline underline-offset-2">
          Sign up for free
        </button>
      </p>
    </form>
  );
}

function SignupForm({ onSuccess, onSwitchTab }: { onSuccess: () => void; onSwitchTab: () => void }) {
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const { error: signupError } = await signup(email, password, name);

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => onSuccess(), 600);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Account created! Redirecting…
        </div>
      )}

      <div className="grid gap-1.5">
        <label htmlFor="signup-name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Full Name
        </label>
        <input
          id="signup-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rajesh Kumar Sharma"
          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Email Address
        </label>
        <input
          id="signup-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. rajesh@example.com"
          className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-ring"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="signup-password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Password <span className="normal-case font-normal">(min. 6 characters)</span>
        </label>
        <div className="relative">
          <input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-ring"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        id="signup-submit"
        type="submit"
        disabled={loading || success}
        className="mt-2 w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
          </span>
        ) : success ? (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-4 w-4" /> Created!
          </span>
        ) : (
          "Create Account"
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <button type="button" onClick={onSwitchTab} className="font-semibold text-foreground underline underline-offset-2">
          Sign in
        </button>
      </p>
    </form>
  );
}
