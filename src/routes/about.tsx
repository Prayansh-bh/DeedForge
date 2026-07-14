import { createFileRoute } from "@tanstack/react-router";
import { Scale, ShieldCheck, Sparkles, Users } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — DeedForge" },
      { name: "description", content: "DeedForge helps individuals and small businesses draft registered and unregistered legal documents through clear, guided forms." },
      { property: "og:title", content: "About DeedForge" },
      { property: "og:description", content: "Our mission: make legal drafting accessible, fast and jargon-free." },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="container-x py-16 md:py-24">
      <header className="max-w-3xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">About</span>
        <h1 className="mt-2 font-serif text-5xl font-bold tracking-tight">Legal drafting, without the friction.</h1>
        <p className="mt-5 text-lg text-muted-foreground">
          DeedForge is a lightweight document platform that turns your personal and party
          details into legally-formatted deeds and agreements. We focus on the Indian legal
          context and cover the most common registered and unregistered instruments.
        </p>
      </header>

      <section className="mt-14 grid gap-6 md:grid-cols-3">
        <ValueCard icon={<Scale className="h-5 w-5" />} title="Accurate templates" body="Our deed structures follow standard Indian legal conventions and are reviewed against common Sub-Registrar requirements." />
        <ValueCard icon={<Sparkles className="h-5 w-5" />} title="Fast by design" body="Skip lengthy consultations for routine drafts. Fill a form, preview the deed, and take it to your lawyer polished." />
        <ValueCard icon={<ShieldCheck className="h-5 w-5" />} title="Private" body="Everything you type stays in your browser during drafting. Nothing is saved to our servers unless you choose to." />
      </section>

      <section className="mt-20 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight">Our mission</h2>
          <p className="mt-4 text-muted-foreground">
            Legal drafting is often treated as a black box — long PDFs, opaque clauses and
            wait times measured in days. We believe the first draft should take minutes, not
            days. DeedForge collects the essentials, produces a clean structured document,
            and hands it back to you (and your lawyer) to review and refine.
          </p>
        </div>
        <div>
          <h2 className="font-serif text-3xl font-bold tracking-tight">Who it's for</h2>
          <ul className="mt-4 space-y-3 text-muted-foreground">
            <li className="flex gap-3"><Users className="mt-1 h-4 w-4 flex-none" /> Landlords and tenants drafting rent and lease agreements.</li>
            <li className="flex gap-3"><Users className="mt-1 h-4 w-4 flex-none" /> Families arranging partition, gift or settlement deeds.</li>
            <li className="flex gap-3"><Users className="mt-1 h-4 w-4 flex-none" /> Small businesses formalising MoUs and private agreements.</li>
            <li className="flex gap-3"><Users className="mt-1 h-4 w-4 flex-none" /> Lawyers looking for a fast first-draft starting point.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function ValueCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border p-6">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border">
        {icon}
      </span>
      <h3 className="mt-4 font-serif text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
