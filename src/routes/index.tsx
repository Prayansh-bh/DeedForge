import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight, FileCheck2, FileText, Scale, ShieldCheck, Sparkles, Users } from "lucide-react";
import { registeredDeeds, unregisteredDeeds } from "@/lib/deed-data";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DeedForge — Generate Registered & Unregistered Deeds Online" },
      {
        name: "description",
        content:
          "Create sale deeds, gift deeds, rent agreements, affidavits, MoUs and more in minutes. Fill a simple form and get a legally-formatted deed instantly.",
      },
      { property: "og:title", content: "DeedForge — Online Deed Generator" },
      {
        property: "og:description",
        content: "Fill a form. Get a deed. Registered and unregistered legal document drafts in minutes.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: HomePage,
});

const faqs = [
  {
    q: "What is the difference between a registered and unregistered deed?",
    a: "Registered deeds are recorded with the Sub-Registrar and are mandatory for transactions like sale, gift, mortgage or lease over 12 months. Unregistered documents such as short-term rent agreements, affidavits or MoUs are legally valid without registration in most cases.",
  },
  {
    q: "Is a deed generated on DeedForge legally valid?",
    a: "DeedForge produces standard drafts based on common Indian legal templates. For execution you must sign it, pay applicable stamp duty, and — where required — register it at the Sub-Registrar's office. Always have a qualified lawyer review the final draft.",
  },
  {
    q: "How long does it take to draft a deed?",
    a: "Most deeds are ready in under 5 minutes. Fill in the party details and property information, review the preview, and download your draft.",
  },
  {
    q: "Do I need a lawyer after generating a deed?",
    a: "For high-value or registered transactions we strongly recommend a lawyer review the draft before execution and registration.",
  },
  {
    q: "Can I edit the generated deed?",
    a: "Yes. You can copy the generated text and modify any clause before printing or executing the document.",
  },
];

function HomePage() {
  return (
    <>
      <Hero />
      <DocumentPicker />
      <HowItWorks />
      <Testimonials />
      <FAQ />
    </>
  );
}

function Hero() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartDrafting = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      navigate({ to: "/auth", search: { redirect: "/#pick-document", tab: "login" } });
    }
  };

  return (
    <section className="border-b border-border">
      <div className="container-x grid gap-10 py-20 md:grid-cols-2 md:py-28">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3 w-3" /> Draft deeds in minutes
          </span>
          <h1 className="mt-5 font-serif text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            From pre-deed to <span className="underline decoration-4 underline-offset-4">final deed</span>, in one form.
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground md:text-lg">
            DeedForge turns your personal and party details into a clean, legally-formatted deed
            — ready to review, download and register.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#pick-document"
              onClick={handleStartDrafting}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Start drafting <ChevronRight className="h-4 w-4" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold hover:bg-accent"
            >
              How it works
            </a>
          </div>

          <dl className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6">
            <Stat value="13+" label="Deed templates" />
            <Stat value="< 5 min" label="Avg. draft time" />
            <Stat value="2 clicks" label="From data to deed" />
          </dl>
        </div>

        <div className="relative">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-serif text-sm font-semibold">
                <FileText className="h-4 w-4" /> Preview — Sale Deed
              </div>
              <span className="text-xs text-muted-foreground">Draft</span>
            </div>
            <pre className="whitespace-pre-wrap font-serif text-[13px] leading-relaxed text-foreground/90">
{`THIS SALE DEED is executed on 14 July 2026 at New Delhi

BETWEEN
Rajesh Kumar Sharma, residing at 12 Rose Villa,
New Delhi — the "SELLER"

AND
Priya Verma, residing at 47 Green Park,
New Delhi — the "PURCHASER"

WHEREAS the Seller is the absolute owner of
Flat 402, Aditya Heights, Sector 21 …`}
            </pre>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <FileCheck2 className="h-3.5 w-3.5" /> Auto-formatted • Ready to review
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="font-serif text-2xl font-bold">{value}</dt>
      <dd className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dd>
    </div>
  );
}

function DocumentPicker() {
  const [hovered, setHovered] = useState<"registered" | "unregistered" | null>(null);

  return (
    <section id="pick-document" className="border-b border-border py-20">
      <div className="container-x">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-serif text-4xl font-bold tracking-tight">Choose your document type</h2>
          <p className="mt-3 text-muted-foreground">
            Hover on a category to see the documents inside, then pick one to start drafting.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <PickerCard
            title="Registered"
            subtitle="Recorded with the Sub-Registrar. Mandatory for property transfers and long leases."
            deeds={registeredDeeds}
            active={hovered === "registered"}
            onEnter={() => setHovered("registered")}
            onLeave={() => setHovered(null)}
            icon={<Scale className="h-5 w-5" />}
          />
          <PickerCard
            title="Unregistered"
            subtitle="Legally valid without Sub-Registrar filing. Great for short leases, MoUs and affidavits."
            deeds={unregisteredDeeds}
            active={hovered === "unregistered"}
            onEnter={() => setHovered("unregistered")}
            onLeave={() => setHovered(null)}
            icon={<FileText className="h-5 w-5" />}
          />
        </div>
      </div>
    </section>
  );
}

function PickerCard({
  title,
  subtitle,
  deeds,
  active,
  onEnter,
  onLeave,
  icon,
}: {
  title: string;
  subtitle: string;
  deeds: typeof registeredDeeds;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
  icon: React.ReactNode;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDeedClick = (e: React.MouseEvent, slug: string) => {
    if (!user) {
      e.preventDefault();
      navigate({ to: "/auth", search: { redirect: `/deed/${slug}`, tab: "login" } });
    }
  };

  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-8 transition-colors hover:bg-accent/40"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background">
          {icon}
        </span>
        <h3 className="font-serif text-2xl font-bold">{title}</h3>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>

      <div
        className={`mt-6 grid gap-2 transition-all duration-300 ${active ? "opacity-100" : "opacity-70"}`}
      >
        {deeds.map((d) => (
          <Link
            key={d.slug}
            to="/deed/$slug"
            params={{ slug: d.slug }}
            onClick={(e) => handleDeedClick(e, d.slug)}
            className="flex items-center justify-between rounded-md border border-border bg-background px-4 py-3 text-sm font-medium transition-transform hover:-translate-y-0.5 hover:bg-foreground hover:text-background"
          >
            <span>{d.name}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", title: "Pick a document", body: "Select from registered or unregistered deed templates." },
    { n: "02", title: "Fill personal details", body: "Enter party names, addresses, IDs and transaction details." },
    { n: "03", title: "Generate & download", body: "Preview the draft, copy it or download for signature." },
  ];
  return (
    <section id="how-it-works" className="border-b border-border py-20">
      <div className="container-x">
        <div className="mb-10 max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Process</span>
          <h2 className="mt-2 font-serif text-4xl font-bold tracking-tight">How it works</h2>
        </div>
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="rounded-xl border border-border p-6">
              <div className="font-serif text-4xl font-bold text-muted-foreground">{s.n}</div>
              <h3 className="mt-3 font-serif text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    {
      quote: "Drafted a rent agreement for my tenant in 3 minutes. The format was exactly what my lawyer expected.",
      name: "Ananya Iyer",
      role: "Landlord, Bengaluru",
    },
    {
      quote: "Used DeedForge to prepare a partition draft between siblings. Saved us multiple consultations.",
      name: "Vikram Malhotra",
      role: "Small business owner, Pune",
    },
    {
      quote: "Clean, professional output. The affidavit template was court-ready with minor edits.",
      name: "Sneha Kapoor",
      role: "Advocate, Delhi",
    },
  ];
  return (
    <section className="border-b border-border py-20">
      <div className="container-x">
        <div className="mb-10 flex items-end justify-between">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Testimonials</span>
            <h2 className="mt-2 font-serif text-4xl font-bold tracking-tight">Trusted by owners, tenants and lawyers</h2>
          </div>
          <Link to="/testimonials" className="hidden text-sm font-medium underline underline-offset-4 md:inline">
            Read more
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <figure key={t.name} className="flex flex-col justify-between rounded-xl border border-border p-6">
              <blockquote className="font-serif text-lg leading-snug">"{t.quote}"</blockquote>
              <figcaption className="mt-6 border-t border-border pt-4 text-sm">
                <div className="font-semibold">{t.name}</div>
                <div className="text-muted-foreground">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section className="py-20">
      <div className="container-x max-w-3xl">
        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">FAQ</span>
          <h2 className="mt-2 font-serif text-4xl font-bold tracking-tight">Frequently asked questions</h2>
        </div>
        <div className="divide-y divide-border rounded-xl border border-border">
          {faqs.map((f, i) => (
            <details key={i} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-serif text-lg font-semibold">
                {f.q}
                <span className="text-2xl leading-none transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5" />
            <p className="text-sm">Draft your first deed now — free preview, no signup.</p>
          </div>
          <a href="#pick-document" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Start drafting
          </a>
        </div>
      </div>
    </section>
  );
}
