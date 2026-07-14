import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Copy, Download, FileText } from "lucide-react";
import { getDeedBySlug, renderDeed, type DeedField } from "@/lib/deed-data";

export const Route = createFileRoute("/deed/$slug")({
  loader: ({ params }) => {
    const deed = getDeedBySlug(params.slug);
    if (!deed) throw notFound();
    return { deed };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Deed not found — DeedForge" }, { name: "robots", content: "noindex" }] };
    }
    const { deed } = loaderData;
    const title = `${deed.name} — Draft Online | DeedForge`;
    const description = `${deed.description} Fill personal and party details to generate a ${deed.name.toLowerCase()} draft in minutes.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: `/deed/${deed.slug}` },
      ],
      links: [{ rel: "canonical", href: `/deed/${deed.slug}` }],
    };
  },
  component: DeedPage,
  notFoundComponent: () => (
    <div className="container-x py-24 text-center">
      <h1 className="font-serif text-3xl font-bold">Deed not found</h1>
      <p className="mt-3 text-muted-foreground">The document you requested doesn't exist.</p>
      <Link to="/" className="mt-6 inline-block underline">Back to home</Link>
    </div>
  ),
});

function DeedPage() {
  const { deed } = Route.useLoaderData();
  const [data, setData] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const rendered = useMemo(() => renderDeed(deed.template, data), [deed, data]);

  const setField = (key: string, value: string) => setData((d) => ({ ...d, [key]: value }));

  const download = () => {
    const blob = new Blob([rendered], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deed.slug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(rendered);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="container-x py-10 md:py-14">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </Link>

      <header className="mt-4 border-b border-border pb-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {deed.category === "registered" ? "Registered Deed" : "Unregistered Document"}
        </span>
        <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight md:text-5xl">{deed.name}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{deed.description}</p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-serif text-xl font-semibold">Enter details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The deed preview updates as you type.
            </p>
            <div className="mt-6 grid gap-4">
              {deed.fields.map((f: DeedField) => (
                <FieldInput key={f.key} field={f} value={data[f.key] ?? ""} onChange={(v) => setField(f.key, v)} />
              ))}
            </div>
          </div>
        </form>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 font-serif text-sm font-semibold">
              <FileText className="h-4 w-4" /> Live preview
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent"
              >
                <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={download}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <pre className="whitespace-pre-wrap break-words font-serif text-[13.5px] leading-relaxed text-foreground/90">
              {rendered}
            </pre>
          </div>

          <p className="text-xs text-muted-foreground">
            This is a draft template. Get it stamped, signed and — where required — registered at the
            Sub-Registrar's office. Consult a qualified lawyer before execution.
          </p>
        </div>
      </div>
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: DeedField;
  value: string;
  onChange: (v: string) => void;
}) {
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-ring";
  return (
    <label className="grid gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</span>
      {field.type === "textarea" ? (
        <textarea
          rows={3}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      ) : (
        <input
          type={field.type}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      )}
    </label>
  );
}
