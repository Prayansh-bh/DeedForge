import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — DeedForge" },
      { name: "description", content: "Get in touch with the DeedForge team for support, feedback or partnership enquiries." },
      { property: "og:title", content: "Contact DeedForge" },
      { property: "og:description", content: "Reach the DeedForge team by email, phone or the contact form." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [sent, setSent] = useState(false);

  return (
    <div className="container-x py-16 md:py-24">
      <header className="max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</span>
        <h1 className="mt-2 font-serif text-5xl font-bold tracking-tight">Get in touch</h1>
        <p className="mt-4 text-muted-foreground">
          Questions about a deed template, a partnership idea, or feedback on the product?
          Reach out — we read every message.
        </p>
      </header>

      <div className="mt-12 grid gap-10 md:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <ContactRow icon={<Mail className="h-4 w-4" />} label="Email" value="hello@deedforge.example" />
          <ContactRow icon={<Phone className="h-4 w-4" />} label="Phone" value="+91 98765 43210" />
          <ContactRow icon={<MapPin className="h-4 w-4" />} label="Address" value="Connaught Place, New Delhi 110001, India" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="rounded-xl border border-border bg-card p-6"
        >
          <div className="grid gap-4">
            <Field label="Full name" name="name" required />
            <Field label="Email" name="email" type="email" required />
            <Field label="Subject" name="subject" />
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</span>
              <textarea
                rows={5}
                required
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
            </label>
            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {sent ? "Message sent ✓" : "Send message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border p-5">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border">{icon}</span>
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 font-serif text-lg">{value}</div>
      </div>
    </div>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
      />
    </label>
  );
}
