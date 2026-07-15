import { createFileRoute, Link, notFound, useNavigate } from '@tanstack/react-router';
import { useMemo, useState, useRef, useEffect } from "react";
import { ArrowLeft, Copy, Download, FileText, Home, Building2, Sprout, Lock, Unlock, UploadCloud, Loader2, CheckCircle2, ChevronDown, FileType2 } from "lucide-react";
import { getDeedBySlug, renderDeed, type DeedField } from "@/lib/deed-data";
import { useAuth } from "@/hooks/use-auth";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

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

const PROPERTY_SUBTYPES: Record<string, string[]> = {
  Residential: [
    "Apartment",
    "Flat",
    "Villa",
    "House",
    "Residential Plot",
    "Duplex",
    "Builder Floor",
    "Farmhouse",
  ],
  Commercial: [
    "Shop",
    "Office",
    "Showroom",
    "Warehouse",
    "Factory",
    "Hotel",
    "Restaurant",
    "Mall Unit",
    "Industrial Shed",
    "Commercial Plot",
  ],
  Agricultural: [
    "Irrigated Land",
    "Dry Land",
    "Cultivable Land",
    "Orchard",
    "Plantation",
    "Vineyard",
    "Grazing Land",
    "Farm Land",
    "Horticulture Land",
  ],
};

function DeedPage() {
  const { deed } = Route.useLoaderData();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [propertyType, setPropertyType] = useState<string | null>(null);
  const [propertySubType, setPropertySubType] = useState<string | null>(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({
        to: "/auth",
        search: { redirect: `/deed/${deed.slug}`, tab: "login" },
      });
    }
  }, [user, authLoading, navigate, deed.slug]);

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  const [uploadState, setUploadState] = useState<Record<string, {
    fileName: string | null;
    status: "idle" | "uploading" | "ocr" | "parsing" | "completed";
    progress: number;
  }>>({
    firstParty: { fileName: null, status: "idle", progress: 0 },
    secondParty: { fileName: null, status: "idle", progress: 0 },
    payment: { fileName: null, status: "idle", progress: 0 },
  });

  const isLocked = deed.category === "registered" && (!propertyType || !propertySubType);

  const showPaymentUpload = deed.category === "registered" && deed.fields.some(
    (f) => f.key === "paymentMode" || f.key === "saleConsideration" || f.key === "monthlyRent" || f.key === "loanAmount"
  );

  const rendered = useMemo(() => renderDeed(deed.template, data), [deed, data]);

  const setField = (key: string, value: string) => setData((d) => ({ ...d, [key]: value }));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const downloadPDF = () => {
    setShowDownloadMenu(false);
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxW = pageW - margin * 2;
    const lineHeight = 6;
    let y = margin;

    doc.setFont("times", "normal");
    doc.setFontSize(11);

    const lines = rendered.split("\n");
    lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(line === "" ? " " : line, maxW);
      wrapped.forEach((wLine: string) => {
        if (y > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(wLine, margin, y);
        y += lineHeight;
      });
    });

    doc.save(`${deed.slug}.pdf`);
  };

  const downloadDocx = async () => {
    setShowDownloadMenu(false);
    const paragraphs = rendered.split("\n").map((line) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            font: "Times New Roman",
            size: 22,
          }),
        ],
        spacing: { after: line.trim() === "" ? 0 : 80 },
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${deed.slug}.docx`);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(rendered);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleSimulatedUpload = (section: "firstParty" | "secondParty" | "payment", file: File) => {
    // Start simulation
    setUploadState(prev => ({
      ...prev,
      [section]: { fileName: file.name, status: "uploading", progress: 20 }
    }));

    // Step 1: Uploading (20% -> 60%)
    setTimeout(() => {
      setUploadState(prev => ({
        ...prev,
        [section]: { ...prev[section], status: "ocr", progress: 60 }
      }));

      // Step 2: OCR Analysis (60% -> 90%)
      setTimeout(() => {
        setUploadState(prev => ({
          ...prev,
          [section]: { ...prev[section], status: "parsing", progress: 90 }
        }));

        // Step 3: Parse and Fill (90% -> 100%)
        setTimeout(() => {
          setUploadState(prev => ({
            ...prev,
            [section]: { ...prev[section], status: "completed", progress: 100 }
          }));

          const newFills: Record<string, string> = {};
          const keysToHighlight: string[] = [];

          if (section === "firstParty") {
            const mapping = {
              firstPartyName: "Rajesh Kumar Sharma",
              firstPartyAddress: "Flat No. 402, Sunshine Apartments, Sector 15, Dwarka, New Delhi - 110075",
              firstPartyIdNumber: "AADHAAR: 9876 5432 1098",
              firstPartyShare: "Residential plot measuring 1500 sq ft"
            };
            Object.entries(mapping).forEach(([key, val]) => {
              if (deed.fields.some(f => f.key === key)) {
                newFills[key] = val;
                keysToHighlight.push(key);
              }
            });
          } else if (section === "secondParty") {
            const mapping = {
              secondPartyName: "Priya Verma",
              secondPartyAddress: "H.No. 89, Phase 2, DLF Cyber City, Sector 24, Gurugram, Haryana - 122002",
              secondPartyIdNumber: "AADHAAR: 1234 5678 9012",
              secondPartyShare: "Commercial space measuring 1000 sq ft"
            };
            Object.entries(mapping).forEach(([key, val]) => {
              if (deed.fields.some(f => f.key === key)) {
                newFills[key] = val;
                keysToHighlight.push(key);
              }
            });
          } else if (section === "payment") {
            const mapping = {
              paymentMode: "Net Banking Ref: UTIB00012458921",
              saleConsideration: "5500000",
              monthlyRent: "25000",
              securityDeposit: "50000",
              loanAmount: "3500000",
              interestRate: "8.5",
              tenure: "180",
              tenureMonths: "11"
            };
            Object.entries(mapping).forEach(([key, val]) => {
              if (deed.fields.some(f => f.key === key)) {
                newFills[key] = val;
                keysToHighlight.push(key);
              }
            });
          }

          // Update main form data
          setData(prevData => ({
            ...prevData,
            ...newFills
          }));

          // Highlight fields
          setHighlightedFields(prev => {
            const next = new Set(prev);
            keysToHighlight.forEach(k => next.add(k));
            return next;
          });

          // Remove highlight after 2.5 seconds
          setTimeout(() => {
            setHighlightedFields(prev => {
              const next = new Set(prev);
              keysToHighlight.forEach(k => next.delete(k));
              return next;
            });
          }, 2500);

        }, 800);
      }, 800);
    }, 800);
  };

  const handleClear = (section: "firstParty" | "secondParty" | "payment") => {
    setUploadState(prev => ({
      ...prev,
      [section]: { fileName: null, status: "idle", progress: 0 }
    }));
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
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <h2 className="font-serif text-xl font-semibold flex items-center gap-2">
                  Enter details
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  The deed preview updates as you type.
                </p>
              </div>
              {deed.category === "registered" && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all duration-300 ${
                  isLocked 
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" 
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                }`}>
                  {isLocked ? (
                    <>
                      <Lock className="h-3.5 w-3.5" /> Locked
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3.5 w-3.5" /> {propertySubType} ({propertyType})
                    </>
                  )}
                </span>
              )}
            </div>

            {deed.category === "registered" && (
              <div className="mb-6 bg-accent/20 p-4 rounded-lg border border-border space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Select Property Type <span className="text-destructive">*</span>
                </span>

                {/* Step 1 — Category */}
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: "Residential", label: "Residential", icon: Home },
                    { id: "Commercial", label: "Commercial", icon: Building2 },
                    { id: "Agricultural", label: "Agricultural", icon: Sprout },
                  ] as const).map((type) => {
                    const Icon = type.icon;
                    const isSelected = propertyType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          const same = propertyType === type.id;
                          const next = same ? null : type.id;
                          setPropertyType(next);
                          setPropertySubType(null);
                          setData((d) => ({ ...d, propertyType: next ?? "", propertySubType: "" }));
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30"
                            : "border-border bg-background hover:bg-accent/80 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-5 w-5 mb-1.5" />
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Step 2 — Sub-type (animated reveal) */}
                {propertyType && PROPERTY_SUBTYPES[propertyType] && (
                  <div className="overflow-hidden">
                    <div className="pt-1 pb-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <span className="text-primary">▸</span>
                        {propertyType} sub-type <span className="text-destructive">*</span>
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {PROPERTY_SUBTYPES[propertyType].map((sub) => {
                        const isSubSelected = propertySubType === sub;
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => {
                              setPropertySubType(sub);
                              setData((d) => ({ ...d, propertySubType: sub }));
                            }}
                            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 cursor-pointer ${
                              isSubSelected
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground hover:bg-accent/60"
                            }`}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {deed.category === "registered" && (
              <div className="mb-6 bg-accent/10 p-4 rounded-lg border border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-3">
                  Auto-Fill details via Document Upload
                </span>
                <div className={`grid gap-3 ${showPaymentUpload ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
                  <UploadZone
                    label="First Party ID"
                    id="firstParty"
                    state={uploadState.firstParty}
                    onUpload={handleSimulatedUpload}
                    onClear={handleClear}
                    disabled={isLocked}
                  />
                  <UploadZone
                    label="Second Party ID"
                    id="secondParty"
                    state={uploadState.secondParty}
                    onUpload={handleSimulatedUpload}
                    onClear={handleClear}
                    disabled={isLocked}
                  />
                  {showPaymentUpload && (
                    <UploadZone
                      label="Payment Proof"
                      id="payment"
                      state={uploadState.payment}
                      onUpload={handleSimulatedUpload}
                      onClear={handleClear}
                      disabled={isLocked}
                    />
                  )}
                </div>
              </div>
            )}

            <div className="relative mt-6">
              {isLocked && (
                <div className="absolute inset-0 bg-card/75 backdrop-blur-[1.5px] flex flex-col items-center justify-center rounded-xl z-10 p-4 text-center transition-all duration-300">
                  <div className="bg-background border border-border p-5 rounded-xl shadow-lg max-w-sm">
                    <Lock className="h-8 w-8 text-amber-500 mx-auto mb-3 animate-pulse" />
                    <h3 className="font-serif font-semibold text-foreground text-base">Details Locked</h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      {!propertyType
                        ? "Select a property category (Residential, Commercial, or Agricultural) above to continue."
                        : "Now select a sub-type under " + propertyType + " to unlock the deed fields."}
                    </p>
                  </div>
                </div>
              )}
              
              <div className={`grid gap-4 transition-all duration-300 ${isLocked ? "opacity-30 pointer-events-none select-none" : "opacity-100"}`}>
                {deed.fields.map((f: DeedField) => (
                  <FieldInput 
                    key={f.key} 
                    field={f} 
                    value={data[f.key] ?? ""} 
                    onChange={(v) => setField(f.key, v)} 
                    disabled={isLocked}
                    isHighlighted={highlightedFields.has(f.key)}
                  />
                ))}
              </div>
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

              {/* Download split-button */}
              <div className="relative" ref={downloadMenuRef}>
                <div className="inline-flex rounded-md overflow-hidden border border-primary">
                  <button
                    type="button"
                    onClick={downloadPDF}
                    className="inline-flex items-center gap-1.5 bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDownloadMenu((v) => !v)}
                    aria-label="Choose download format"
                    className="bg-primary/90 hover:bg-primary/70 border-l border-primary-foreground/20 px-2 py-1.5 text-primary-foreground transition-colors"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {showDownloadMenu && (
                  <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[160px] rounded-lg border border-border bg-popover shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <button
                      type="button"
                      onClick={downloadPDF}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-medium hover:bg-accent transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5 text-red-500" />
                      Download as PDF
                    </button>
                    <button
                      type="button"
                      onClick={downloadDocx}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-medium hover:bg-accent transition-colors"
                    >
                      <FileType2 className="h-3.5 w-3.5 text-blue-500" />
                      Download as Word (.docx)
                    </button>
                  </div>
                )}
              </div>
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

function UploadZone({
  label,
  id,
  state,
  onUpload,
  onClear,
  disabled,
}: {
  label: string;
  id: "firstParty" | "secondParty" | "payment";
  state: { fileName: string | null; status: string; progress: number };
  onUpload: (section: "firstParty" | "secondParty" | "payment", file: File) => void;
  onClear: (section: "firstParty" | "secondParty" | "payment") => void;
  disabled: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStatusText = () => {
    switch (state.status) {
      case "uploading": return "Uploading...";
      case "ocr": return "Analyzing text...";
      case "parsing": return "Extracting details...";
      case "completed": return "Auto-filled!";
      default: return `Upload ${label}`;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(id, e.target.files[0]);
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-border transition-all duration-300 ${
      disabled 
        ? "opacity-45 cursor-not-allowed select-none bg-accent/5" 
        : state.status === "idle"
          ? "bg-background hover:bg-accent/40 hover:border-primary/50 cursor-pointer"
          : "bg-accent/15 border-primary/30"
    }`}
      onClick={() => !disabled && state.status === "idle" && fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        className="hidden"
        disabled={disabled}
      />
      
      {state.status === "idle" && (
        <div className="flex flex-col items-center text-center">
          <UploadCloud className="h-6 w-6 text-muted-foreground mb-1.5" />
          <span className="text-[11px] font-semibold text-foreground/80">{label}</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">Click to scan ID/Receipt</span>
        </div>
      )}

      {state.status !== "idle" && state.status !== "completed" && (
        <div className="w-full flex flex-col items-center text-center">
          <Loader2 className="h-6 w-6 text-primary animate-spin mb-1.5" />
          <span className="text-[11px] font-semibold text-primary">{getStatusText()}</span>
          <div className="w-full bg-border h-1 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300 rounded-full animate-pulse" 
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {state.status === "completed" && (
        <div className="flex flex-col items-center text-center w-full">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1.5" />
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{getStatusText()}</span>
          <span className="text-[9px] truncate max-w-full text-muted-foreground mt-0.5 px-2 font-mono" title={state.fileName || ""}>
            {state.fileName}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear(id);
            }}
            className="mt-2.5 text-[9px] font-bold text-destructive hover:underline cursor-pointer border border-destructive/20 hover:border-destructive/40 bg-destructive/5 hover:bg-destructive/10 px-2 py-0.5 rounded transition-colors"
          >
            Clear File
          </button>
        </div>
      )}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  disabled,
  isHighlighted,
}: {
  field: DeedField;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  isHighlighted?: boolean;
}) {
  const base =
    "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-all duration-300 focus:border-ring disabled:opacity-60 disabled:cursor-not-allowed";
  
  const highlightClass = isHighlighted
    ? "bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 scale-[1.005]"
    : "";

  return (
    <label className={`grid gap-1.5 transition-all duration-500 ${isHighlighted ? "text-emerald-600 dark:text-emerald-400 font-medium" : ""}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</span>
      {field.type === "textarea" ? (
        <textarea
          rows={3}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${base} ${highlightClass}`}
          disabled={disabled}
        />
      ) : (
        <input
          type={field.type}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${base} ${highlightClass}`}
          disabled={disabled}
        />
      )}
    </label>
  );
}
