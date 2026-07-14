import { createFileRoute } from "@tanstack/react-router";
import { Quote } from "lucide-react";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Testimonials — DeedForge" },
      { name: "description", content: "Hear from landlords, tenants, business owners and lawyers who draft deeds and agreements with DeedForge." },
      { property: "og:title", content: "Testimonials — DeedForge" },
      { property: "og:description", content: "What our users say about drafting deeds with DeedForge." },
      { property: "og:url", content: "/testimonials" },
    ],
    links: [{ rel: "canonical", href: "/testimonials" }],
  }),
  component: TestimonialsPage,
});

const testimonials = [
  { quote: "Drafted a rent agreement for my tenant in 3 minutes. The format was exactly what my lawyer expected.", name: "Ananya Iyer", role: "Landlord, Bengaluru" },
  { quote: "Used DeedForge to prepare a partition draft between siblings. Saved us multiple consultations.", name: "Vikram Malhotra", role: "Small business owner, Pune" },
  { quote: "Clean, professional output. The affidavit template was court-ready with minor edits.", name: "Sneha Kapoor", role: "Advocate, Delhi" },
  { quote: "The MoU template helped us formalise a partnership without days of back-and-forth.", name: "Rohan Desai", role: "Founder, Ahmedabad" },
  { quote: "As a first-time home buyer, seeing the sale deed structure in plain terms was reassuring.", name: "Meera Nair", role: "Home buyer, Kochi" },
  { quote: "Power of Attorney draft was neatly worded. Registered without a hitch.", name: "Arjun Sethi", role: "NRI, Gurugram" },
];

function TestimonialsPage() {
  return (
    <div className="container-x py-16 md:py-24">
      <header className="max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Testimonials</span>
        <h1 className="mt-2 font-serif text-5xl font-bold tracking-tight">Words from our users</h1>
        <p className="mt-4 text-muted-foreground">
          Landlords, tenants, lawyers and business owners share how DeedForge helped them
          draft legal documents faster.
        </p>
      </header>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((t) => (
          <figure key={t.name} className="flex flex-col justify-between rounded-xl border border-border p-6">
            <Quote className="h-5 w-5 text-muted-foreground" />
            <blockquote className="mt-4 font-serif text-lg leading-snug">"{t.quote}"</blockquote>
            <figcaption className="mt-6 border-t border-border pt-4 text-sm">
              <div className="font-semibold">{t.name}</div>
              <div className="text-muted-foreground">{t.role}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
