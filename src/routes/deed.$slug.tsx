import { createFileRoute, Link, notFound, useNavigate } from '@tanstack/react-router';
import { useMemo, useState, useRef, useEffect } from "react";
import { ArrowLeft, Copy, Download, FileText, Home, Building2, Sprout, Lock, Unlock, UploadCloud, Loader2, CheckCircle2, ChevronDown, FileType2, Info } from "lucide-react";
import { getDeedBySlug, renderDeed, type DeedField, type DocumentUpload, type DeedType, DUPLEX_DEED } from "@/lib/deed-data";
import { useAuth } from "@/hooks/use-auth";
import jsPDF from "jspdf";
import * as htmlToImage from "html-to-image";
import { toast } from "sonner";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

// Pre-fetch the apartment/flat deed so we can switch to it in-place on the Sale Deed route
const APARTMENT_FLAT_DEED = getDeedBySlug("sale-deed-apartment-flat");

export const Route = createFileRoute("/deed/$slug")({
  loader: ({ params }) => {
    // Normalize slug (replace url-encoded spaces or spaces with hyphens, lowercase)
    const normalizedSlug = decodeURIComponent(params.slug).trim().replace(/\s+/g, '-').toLowerCase();
    const deed = getDeedBySlug(normalizedSlug) || getDeedBySlug(params.slug);
    return { deed: deed || null };
  },
  head: ({ loaderData }) => {
    if (!loaderData || !loaderData.deed) {
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
    "Apartment/Flat",
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

// Simulated OCR data per document upload id
const SIMULATED_OCR_DATA: Record<string, Record<string, string>> = {
  vendorAadhaar: {
    vendorName: "Rajesh Kumar Sharma",
    vendorFatherName: "Ramesh Lal Sharma",
    vendorAge: "47",
    vendorAddress: "Flat No. 501, Green Valley Apartments, Sector 12, Bhopal – 462001, Madhya Pradesh",
    vendorAadhaar: "9876 5432 1098",
  },
  vendorPAN: {
    vendorPAN: "ABCRS1234F",
  },
  vendeeAadhaar: {
    vendeeName: "Priya Verma",
    vendeeFatherName: "Anil Kumar Verma",
    vendeeAge: "35",
    vendeeAddress: "H.No. 89, Phase 2, Arera Colony, Bhopal – 462016, Madhya Pradesh",
    vendeeAadhaar: "1234 5678 9012",
  },
  vendeePAN: {
    vendeePAN: "FGHPV5678K",
  },
  motherDeed: {
    societyName: "Sunshine Residency",
    sroOfficeName: "Sub-Registrar Office, Bhopal City",
    prevRegDate: "2019-03-15",
    prevDocNumber: "1245/2019",
    prevJildNumber: "5",
  },
  khasra: {
    khasraNumber: "123/1",
    halkaNumber: "45",
    gramName: "Bhopal City",
    districtName: "Bhopal, Madhya Pradesh",
  },
  allotmentLetter: {
    flatNumber: "402",
    floorNumber: "4th",
    blockName: "Tower A",
    superBuiltUpArea: "1250 sq ft",
    carpetArea: "980 sq ft",
    parkingNumber: "B-14",
  },
  layoutPlan: {
    boundaryNorth: "Flat No. 401",
    boundarySouth: "Open Terrace",
    boundaryEast: "Corridor / Lift Lobby",
    boundaryWest: "External Wall of Building",
  },
  bankPayment: {
    saleAmountFigures: "5500000",
    saleAmountWords: "Fifty-Five Lakhs Rupees Only",
    paymentDetails: "NEFT UTR No. UTIB00012458921 dated 15-07-2026, Bank: SBI Bhopal Main Branch",
  },
  // legacy sections for non-apartment deeds
  firstParty: {
    firstPartyName: "Rajesh Kumar Sharma",
    firstPartyAddress: "Flat No. 402, Sunshine Apartments, Sector 15, Dwarka, New Delhi - 110075",
    firstPartyIdNumber: "AADHAAR: 9876 5432 1098",
    firstPartyShare: "Residential plot measuring 1500 sq ft",
  },
  secondParty: {
    secondPartyName: "Priya Verma",
    secondPartyAddress: "H.No. 89, Phase 2, DLF Cyber City, Sector 24, Gurugram, Haryana - 122002",
    secondPartyIdNumber: "AADHAAR: 1234 5678 9012",
    secondPartyShare: "Commercial space measuring 1000 sq ft",
  },
  payment: {
    paymentMode: "Net Banking Ref: UTIB00012458921",
    saleConsideration: "5500000",
    monthlyRent: "25000",
    securityDeposit: "50000",
    loanAmount: "3500000",
    interestRate: "8.5",
    tenure: "180",
    tenureMonths: "11",
  },
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
  const previewRef = useRef<HTMLDivElement>(null);
  const [highlightedFields, setHighlightedFields] = useState<Set<string>>(new Set());

  // Determine which deed data to actually use for fields/uploads/template/preview
  // On the Sale Deed route, swap to the Apartment/Flat deed when that sub-type is active
  const effectiveDeed: DeedType = useMemo(() => {
    if (!deed) return {} as any;
    if (
      deed.slug === "sale-deed" &&
      propertyType === "Residential" &&
      propertySubType === "Apartment/Flat" &&
      APARTMENT_FLAT_DEED
    ) {
      return APARTMENT_FLAT_DEED;
    }
    if (
      deed.slug === "sale-deed" &&
      propertyType === "Residential" &&
      propertySubType === "Duplex" &&
      DUPLEX_DEED
    ) {
      return DUPLEX_DEED;
    }
    return deed;
  }, [deed, propertyType, propertySubType]);

  // Build upload state from the effective deed's documentUploads (resets when effectiveDeed changes)
  const buildUploadState = (d: DeedType | null) => {
    if (!d || !d.documentUploads) {
      return {
        firstParty: { fileName: null, status: "idle" as const, progress: 0 },
        secondParty: { fileName: null, status: "idle" as const, progress: 0 },
        payment: { fileName: null, status: "idle" as const, progress: 0 },
      };
    }
    return d.documentUploads.reduce<Record<string, { fileName: string | null; status: "idle" | "uploading" | "ocr" | "parsing" | "completed"; progress: number }>>((acc, doc) => {
      acc[doc.id] = { fileName: null, status: "idle", progress: 0 };
      return acc;
    }, {});
  };

  const [uploadState, setUploadState] = useState<Record<string, {
    fileName: string | null;
    status: "idle" | "uploading" | "ocr" | "parsing" | "completed";
    progress: number;
  }>>(buildUploadState(deed));

  // Reset form data and upload state whenever the effective deed switches
  const prevEffectiveSlug = useRef(effectiveDeed?.slug);
  useEffect(() => {
    if (effectiveDeed && effectiveDeed.slug !== prevEffectiveSlug.current) {
      prevEffectiveSlug.current = effectiveDeed.slug;
      setData({});
      setUploadState(buildUploadState(effectiveDeed));
      setHighlightedFields(new Set());
    }
  }, [effectiveDeed]);

  const isLocked = effectiveDeed?.category === "registered" && (!propertyType || !propertySubType);

  const showPaymentUpload = effectiveDeed?.category === "registered" && !effectiveDeed.documentUploads && effectiveDeed.fields?.some(
    (f) => f.key === "paymentMode" || f.key === "saleConsideration" || f.key === "monthlyRent" || f.key === "loanAmount"
  );

  const rendered = useMemo(() => {
    if (!effectiveDeed || !effectiveDeed.template) return "";
    return renderDeed(effectiveDeed.template, data);
  }, [effectiveDeed, data]);

  const setField = (key: string, value: string) => setData((d) => ({ ...d, [key]: value }));

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!deed) return;
    if (!authLoading && !user) {
      navigate({
        to: "/auth",
        search: { redirect: `/deed/${deed.slug}`, tab: "login" },
      });
    }
  }, [user, authLoading, navigate, deed]);

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

  if (authLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!deed) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="font-serif text-3xl font-bold">Deed not found</h1>
        <p className="mt-3 text-muted-foreground">The document you requested doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block underline">Back to home</Link>
      </div>
    );
  }

  if (!user) return null;

  const downloadPDF = async () => {
    try {
      setShowDownloadMenu(false);
      
      if (isApartmentFlatDeed && previewRef.current) {
        toast.info("Generating PDF...", {
          description: "This may take a few seconds.",
          duration: 3000,
        });

        const imgData = await htmlToImage.toJpeg(previewRef.current, {
          quality: 0.9,
          backgroundColor: '#ffffff',
          pixelRatio: 2 // High-res scaling
        });

        // We can get width and height from the image data
        const img = new Image();
        img.src = imgData;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const usableW = pageW - margin * 2;
        const imgW = img.width;
        const imgH = img.height;
        const ratio = usableW / imgW;
        const scaledH = imgH * ratio;

        const pageImgH = pageH - margin * 2;
        let renderedH = 0;
        while (renderedH < scaledH) {
          if (renderedH > 0) pdf.addPage();
          pdf.addImage(imgData, "JPEG", margin, margin - renderedH, usableW, scaledH, undefined, "FAST");
          renderedH += pageImgH;
        }

        pdf.save(`${effectiveDeed.slug}.pdf`);
        return;
      }

      // Fallback text-based PDF for generic deeds
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
      doc.save(`${effectiveDeed.slug}.pdf`);

    } catch (err: any) {
      console.error("PDF generation failed:", err);
      toast.error("PDF generation failed", {
        description: err.message || String(err),
      });
    }
  };

  const downloadDocx = async () => {
    setShowDownloadMenu(false);

    if (isApartmentFlatDeed && previewRef.current) {
      // Export as HTML .doc (Word opens this natively, perfectly preserving tables, colors, and Hindi fonts!)
      const htmlContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>${effectiveDeed.name}</title></head>
        <body style="font-family: Arial, sans-serif;">
          ${previewRef.current.innerHTML}
        </body>
        </html>
      `;
      const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
      saveAs(blob, `${effectiveDeed.slug}.doc`);
      return;
    }

    // Generic text-based docx export for other deeds
    const paragraphs = rendered.split("\n").map((line) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            font: "Arial",
            size: 22,
          }),
        ],
        spacing: { after: line.trim() === "" ? 0 : 80 },
      })
    );

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${effectiveDeed.slug}.docx`);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(rendered);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleDocumentUpload = async (sectionId: string, file: File) => {
    setUploadState(prev => ({
      ...prev,
      [sectionId]: { fileName: file.name, status: "uploading", progress: 10 }
    }));

    try {
      // Use Gemini 2.0 Flash for OCR
      setUploadState(prev => ({
        ...prev,
        [sectionId]: { ...prev[sectionId], status: "ocr", progress: 30 }
      }));

      // Get API Key from localStorage or fallback to user's provided key
      let apiKey = localStorage.getItem("GEMINI_API_KEY") || "AQ.Ab8RN6KbRuP4O-vw6Q1MBjAdNxornEjrrZfcv5a6JRejiu94dg";
      
      if (!apiKey) {
        throw new Error("Gemini API Key is required for OCR.");
      }

      setUploadState(prev => ({
        ...prev,
        [sectionId]: { ...prev[sectionId], status: "ocr", progress: 50 }
      }));

      // Convert file to Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Extract raw base64 string
        };
        reader.onerror = reject;
      });

      setUploadState(prev => ({
        ...prev,
        [sectionId]: { ...prev[sectionId], status: "ocr", progress: 70 }
      }));

      let systemPrompt = "Extract all text from this document verbatim.";
      const docUpload = effectiveDeed.documentUploads?.find(d => d.id === sectionId);
      
      if (sectionId === 'masterRegistry') {
        systemPrompt = `You are an advanced Legal Document Automation Engineer specializing in Indian Property Law and precise data mapping. Your task is to extract data from unstructured multi-page Indian Sale Deeds (विक्रय-पत्र) PDFs and structure them into a rigid JSON format that feeds directly into a Next.js/MERN template system.

### GOAL:
Analyze the provided document comprehensively, resolve entity relationships (such as Partners or Power of Attorney holders), and output a single, flat JSON object mapping perfectly to the target schema.

### INGESTION RULES:
1. Context Scoping: Legal deeds contain recursive dates and names. Look at the primary headings ("विक्रेता" and "क्रेता") to lock onto the current transaction parties. Historical transactions mentioned in the "अन्य विवरण" (history) section must only be mapped to original developer/previous registry fields.
2. Token Invariance: Do not abbreviate names, cut off addresses, or normalize figures. Extract the exact matching strings from the text.
3. Language Conversion: The \`saleAmountWords\` field requires translating the numeric total value into clean Hindi words (e.g., 4000000 -> चालीस लाख).
4. Granular Installment Parsing: Under the "Sale Consideration" section, you must extract every single payment installment line item sequentially. Do not group them into a single string. Break each item down into the exact object structure defined below.

### OUTPUT SCHEMA (STRICT JSON ONLY):
Return ONLY a valid JSON object matching the following structure. Do not append prose, explanations, or Markdown code blocks outside of raw JSON.

{
  "saleAmountFigures": "String (e.g., '4000000')",
  "saleAmountWords": "String (Hindi text representation, e.g., 'चालीस लाख')",
  "vendorName": "String (Company/Individual Name)",
  "vendorRelation": "String (e.g., 'through partner', 'आत्मज')",
  "vendorFatherName": "String",
  "vendorAddress": "String",
  "mukhtyarName": "String (PoA holder name if present, else empty string)",
  "mukhtyarFatherName": "String",
  "mukhtyarAddress": "String",
  "vendeeName": "String (Combined buyers string if multi-owner)",
  "vendeeRelation": "String",
  "vendeeFatherName": "String",
  "vendeeAddress": "String",
  "houseBungalowNumber": "String",
  "propertyTypeCode": "String (e.g., 'C')",
  "khasraNumber": "String (e.g., '71/2 व 71/3')",
  "colonyName": "String",
  "gramName": "String",
  "wardNumber": "String",
  "plotArea": "String",
  "groundFloorArea": "String",
  "firstFloorArea": "String",
  "boundaryEast": "String",
  "boundaryWest": "String",
  "boundaryNorth": "String",
  "boundarySouth": "String",
  "paymentInstallments": [
    {
      "serialNumber": "String (e.g., '1', '2')",
      "amountFigures": "String (e.g., '50,000')",
      "instrumentType": "String (Must be exactly 'Cheque' or 'Demand Draft' or 'RTGS/NEFT')",
      "instrumentNumber": "String (The Cheque/DD/Transaction number, e.g., '501051')",
      "paymentDate": "String (Date in DD/MM/YYYY format, e.g., '31/12/2020')",
      "bankName": "String (Name of the issuing bank, e.g., 'SBI', 'PNB', 'UCO Bank')"
    }
  ],
  "ePanjeeyanNumber": "String",
  "sroOfficeName": "String",
  "executionDate": "String (DD/MM/YYYY format)"
}

### PRIVACY GUARDRAIL:
- If government identification numbers like Aadhaar numbers are discovered anywhere within the document text, do NOT output their numeric digits. Completely redact the digits and replace them with the text value "[Aadhaar Redacted]". 
- Other document identifiers such as PAN or PF numbers should be preserved and passed through normally if required.`;
      } else if (docUpload) {
        // Dynamically build schema instructions based on the fields mapped to this document upload
        const schemaFields: Record<string, string> = {};
        docUpload.fills.forEach(key => {
          const field = effectiveDeed.fields.find(f => f.key === key);
          schemaFields[key] = field ? `String value for: ${field.label}` : "String value";
        });

        systemPrompt = `You are an advanced Legal Document Automation Engineer specializing in Indian Property Law and precise data mapping.
Your task is to extract data from this document and return ONLY a valid JSON object matching the following schema. Do not append any explanations, comments, or Markdown code blocks.

JSON Schema:
${JSON.stringify(schemaFields, null, 2)}

### PRIVACY GUARDRAIL:
- If government identification numbers like Aadhaar numbers are discovered anywhere within the document text, do NOT output their numeric digits. Completely redact the digits and replace them with the text value "[Aadhaar Redacted]".
- Other identifiers such as PAN numbers should be preserved and passed through normally if required.`;
      }

      // Call Gemini 2.5 Flash API (2.0 hits quota limit with the provided key)
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: systemPrompt },
              { inline_data: { mime_type: file.type, data: base64Data } }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to fetch from Gemini API");
      }

      const responseData = await response.json();
      const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text || "";

      setUploadState(prev => ({
        ...prev,
        [sectionId]: { ...prev[sectionId], status: "parsing", progress: 90 }
      }));

      console.log(`[Gemini Raw OCR Result for ${sectionId}]:`, text);

      let newFills: Record<string, string> = {};
      const keysToHighlight: string[] = [];

      try {
        // Parse the LLM's JSON response defensively
        const cleanJsonStr = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedJson = JSON.parse(cleanJsonStr);

        if (sectionId === 'masterRegistry') {
           // For the main sale deed, map the rigid schema directly
           Object.entries(parsedJson).forEach(([key, val]) => {
             if (val && typeof val === 'string' && val.trim() !== '') {
               newFills[key] = val.trim();
             } else if (Array.isArray(val) && val.length > 0 && key === 'paymentInstallments') {
               // Map payment installment objects dynamically to the Hindi localized string
               val.forEach((installment, idx) => {
                 let text = "";
                 if (typeof installment === 'object' && installment !== null) {
                   const amt = installment.amountFigures || '';
                   const instType = installment.instrumentType || '';
                   const instNum = installment.instrumentNumber || '';
                   const date = installment.paymentDate || '';
                   const bank = installment.bankName || '';
                   // Format into: "रू. 50,000/- चेक क्र. 501051 दि. 31/12/2020 बैंक SBI"
                   text = `रू. ${amt}/- ${instType} क्र. ${instNum} दि. ${date} बैंक ${bank}`.trim();
                 } else if (typeof installment === 'string') {
                   text = installment;
                 }
                 
                 if (idx === 0) newFills.paymentInstallment1 = text;
                 if (idx === 1) newFills.paymentInstallment2 = text;
                 if (idx === 2) newFills.paymentInstallment3 = text;
                 if (idx === 3) newFills.paymentInstallment4 = text;
                 if (idx === 4) newFills.paymentInstallment5 = text;
               });
             }
           });
        } else {
           // For individual uploaded documents (vendorAadhaar, vendorPAN, motherDeed, khasra, layoutPlan, etc)
           Object.entries(parsedJson).forEach(([key, val]) => {
             if (val && typeof val === 'string' && val.trim() !== '') {
               newFills[key] = val.trim();
             }
           });
        }
      } catch (e) {
        console.error("Failed to parse Gemini JSON:", e, "Raw text:", text);
      }

      const finalFills = { ...newFills };

      Object.keys(finalFills).forEach(key => {
        keysToHighlight.push(key);
      });

      setData(prevData => ({ ...prevData, ...finalFills }));

      setUploadState(prev => ({
        ...prev,
        [sectionId]: { ...prev[sectionId], status: "completed", progress: 100 }
      }));

      setHighlightedFields(prev => {
        const next = new Set(prev);
        keysToHighlight.forEach(k => next.add(k));
        return next;
      });

      setTimeout(() => {
        setHighlightedFields(prev => {
          const next = new Set(prev);
          keysToHighlight.forEach(k => next.delete(k));
          return next;
        });
      }, 2500);

    } catch (error: any) {
      console.error("OCR Error:", error);
      const errorMessage = error?.message || String(error);
      
      // Clear invalid key if authentication failed
      if (errorMessage.toLowerCase().includes("api key not valid")) {
        localStorage.removeItem("GEMINI_API_KEY");
      }

      toast.error(`OCR Failed for ${sectionId}`, {
        description: `Gemini API Error: ${errorMessage}`,
      });
      setUploadState(prev => ({
        ...prev,
        [sectionId]: { fileName: null, status: "idle", progress: 0 }
      }));
    }
  };

  const handleClear = (sectionId: string) => {
    setUploadState(prev => ({
      ...prev,
      [sectionId]: { fileName: null, status: "idle", progress: 0 }
    }));
  };

  const hasAdvancedUploads = !!(effectiveDeed.documentUploads && effectiveDeed.documentUploads.length > 5);
  const isApartmentFlatDeed = effectiveDeed.slug === "sale-deed-apartment-flat";

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-deed, #printable-deed * {
            visibility: visible;
          }
          #printable-deed {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          @page {
            margin: 15mm;
          }
        }
      `}</style>
      
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

            {/* Document Upload Section */}
            {deed.category === "registered" && (
              <div className="mb-6 bg-accent/10 p-4 rounded-lg border border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                  Auto-Fill via Document Upload
                </span>
                {hasAdvancedUploads ? (
                  <p className="text-[11px] text-muted-foreground mb-4 flex items-start gap-1.5">
                    <Info className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                    {isApartmentFlatDeed
                      ? "Upload your Master Registry to auto-fill the entire deed, or upload individual ID/Property documents."
                      : "Upload your Master Registry or individual documents to auto-fill party and property details."
                    }
                  </p>
                ) : null}

                {/* Apartment/Flat: 9-document grid + Master Registry */}
                {hasAdvancedUploads && effectiveDeed.documentUploads ? (
                  <div className="space-y-4">
                    {/* Master Registry */}
                    {effectiveDeed.documentUploads!.filter(d => d.id === "masterRegistry").map((doc) => (
                      <div key={doc.id} className="mb-2">
                        <DocUploadZone
                          doc={doc}
                          state={uploadState[doc.id]}
                          onUpload={handleDocumentUpload}
                          onClear={handleClear}
                          disabled={isLocked}
                        />
                      </div>
                    ))}

                    {/* Vendor documents */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">Vendor (विक्रेता)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {effectiveDeed.documentUploads!.filter(d => d.id.startsWith("vendor")).map((doc) => (
                          <DocUploadZone
                            key={doc.id}
                            doc={doc}
                            state={uploadState[doc.id]}
                            onUpload={handleDocumentUpload}
                            onClear={handleClear}
                            disabled={isLocked}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Vendee documents */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">Vendee (क्रेता)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {effectiveDeed.documentUploads!.filter(d => d.id.startsWith("vendee")).map((doc) => (
                          <DocUploadZone
                            key={doc.id}
                            doc={doc}
                            state={uploadState[doc.id]}
                            onUpload={handleDocumentUpload}
                            onClear={handleClear}
                            disabled={isLocked}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Property documents */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">Property & Payment Documents</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {effectiveDeed.documentUploads!.filter(d => !d.id.startsWith("vendor") && !d.id.startsWith("vendee") && d.id !== "masterRegistry").map((doc) => (
                          <DocUploadZone
                            key={doc.id}
                            doc={doc}
                            state={uploadState[doc.id]}
                            onUpload={handleDocumentUpload}
                            onClear={handleClear}
                            disabled={isLocked}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Legacy 2-3 zone layout for other deeds */
                  <div className={`grid gap-3 ${showPaymentUpload ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
                    <UploadZone
                      label="First Party ID"
                      id="firstParty"
                      state={uploadState.firstParty}
                      onUpload={handleDocumentUpload}
                      onClear={handleClear}
                      disabled={isLocked}
                    />
                    <UploadZone
                      label="Second Party ID"
                      id="secondParty"
                      state={uploadState.secondParty}
                      onUpload={handleDocumentUpload}
                      onClear={handleClear}
                      disabled={isLocked}
                    />
                    {showPaymentUpload && (
                      <UploadZone
                        label="Payment Proof"
                        id="payment"
                        state={uploadState.payment}
                        onUpload={handleDocumentUpload}
                        onClear={handleClear}
                        disabled={isLocked}
                      />
                    )}
                  </div>
                )}
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
              
              <div
                key={effectiveDeed.slug}
                className={`grid gap-4 transition-all duration-500 ${isLocked ? "opacity-30 pointer-events-none select-none" : "opacity-100"}`}
              >
                {effectiveDeed.fields.map((f: DeedField) => (
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

          {/* Live Preview Area */}
          <div ref={previewRef} id="printable-deed" className="print:bg-white">
            {isApartmentFlatDeed ? (
              <ApartmentDeedPreview data={data} />
            ) : (
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <pre className="whitespace-pre-wrap break-words font-serif text-[13.5px] leading-relaxed text-foreground/90">
                  {rendered}
                </pre>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            This is a draft template. Get it stamped, signed and — where required — registered at the
            Sub-Registrar's office. Consult a qualified lawyer before execution.
          </p>
        </div>
      </div>
    </div>
    </div>
  );
}

// ─── Apartment/Flat styled live preview ──────────────────────────────────────
function ph(val: string | undefined, fallback: string) {
  return val?.trim() ? val.trim() : fallback;
}

function ApartmentDeedPreview({ data }: { data: Record<string, string> }) {
  const d = data;
  const missing = (key: string) => !d[key]?.trim();

  function Field({ k, label }: { k: string; label: string }) {
    return missing(k) ? (
      <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold border" style={{ backgroundColor: '#fee2e2', color: '#dc2626', borderColor: '#fecaca' }}>
        [{label}]
      </span>
    ) : (
      <span className="font-semibold" style={{ color: '#1a1a1a' }}>{d[k]}</span>
    );
  }

  return (
    <div className="rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: '#e5e5e5', backgroundColor: '#ffffff' }}>
      {/* Header */}
      <div className="px-6 py-5 text-center" style={{ backgroundColor: '#800000' }}>
        <h2 className="font-serif font-bold text-lg tracking-wide uppercase" style={{ color: '#ffffff' }}>
          अचल संपत्ति विक्रय विलेख
        </h2>
        <p className="text-xs mt-1 font-medium" style={{ color: '#fecaca' }}>(SALE DEED — Apartment/Flat, Madhya Pradesh)</p>
      </div>

      <div className="p-6 space-y-6 font-serif text-[13px] leading-relaxed" style={{ color: '#1a1a1a' }}>

        {/* Parties */}
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-widest border-b pb-1.5 mb-3" style={{ color: '#800000', borderColor: 'rgba(128, 0, 0, 0.2)' }}>
            पक्षकारों का विवरण (Parties)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vendor */}
            <div className="rounded-lg border p-3 space-y-1" style={{ borderColor: '#e5e5e5', backgroundColor: '#ffffff' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#737373' }}>विक्रेता / Vendor (First Party)</p>
              <p><span className="text-[11px]" style={{ color: '#737373' }}>नाम:</span> <Field k="vendorName" label="Vendor Name" /></p>
              <p><span className="text-[11px]" style={{ color: '#737373' }}>पिता/पति:</span> <Field k="vendorFatherName" label="Father/Husband" /></p>
              <p><span className="text-[11px]" style={{ color: '#737373' }}>आयु:</span> <Field k="vendorAge" label="Age" /> वर्ष</p>
              <p><span className="text-[11px]" style={{ color: '#737373' }}>पता:</span> <Field k="vendorAddress" label="Address" /></p>
              <p><span className="text-[11px]" style={{ color: '#737373' }}>PAN:</span> <Field k="vendorPAN" label="PAN" /></p>
              <p><span className="text-[11px]" style={{ color: '#737373' }}>Aadhaar:</span> <Field k="vendorAadhaar" label="Aadhaar" /></p>
            </div>
            {/* Vendee */}
            <div className="rounded-lg border p-3 space-y-1" style={{ borderColor: '#e5e5e5', backgroundColor: '#ffffff' }}>
              <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#737373' }}>क्रेता / Vendee (Second Party)</p>
              <p><span className="text-[11px]" style={{ color: '#737373' }}>नाम:</span> <Field k="vendeeName" label="Vendee Name" /></p>
              <p><span className="text-[11px]" style={{ color: '#737373' }}>पिता/पति:</span> <Field k="vendeeFatherName" label="Father/Husband" /></p>
              <p><span className="text-[11px]" style={{ color: '#737373' }}>आयु:</span> <Field k="vendeeAge" label="Age" /> वर्ष</p>
              <p><span className="text-[11px]" style={{ color: '#737373' }}>पता:</span> <Field k="vendeeAddress" label="Address" /></p>
              <p><span className="text-[11px]" style={{ color: '#737373' }}>PAN:</span> <Field k="vendeePAN" label="PAN" /></p>
              <p><span className="text-[11px]" style={{ color: '#737373' }}>Aadhaar:</span> <Field k="vendeeAadhaar" label="Aadhaar" /></p>
            </div>
          </div>
        </section>

        {/* Recitals */}
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-widest border-b pb-1.5 mb-3" style={{ color: '#800000', borderColor: 'rgba(128, 0, 0, 0.2)' }}>
            प्रस्तावना (Recitals)
          </h3>
          <p className="text-justify">
            <strong>चूंकि (WHEREAS)</strong> विक्रेता <Field k="vendorName" label="Vendor Name" /> उस बहुमंजिला आवासीय परिसर <Field k="societyName" label="Society Name" /> के पूर्ण स्वामी हैं, खसरा नंबर <Field k="khasraNumber" label="Khasra No." />, हल्का नंबर <Field k="halkaNumber" label="Halka No." />, ग्राम/शहर <Field k="gramName" label="Village/Town" />, जिला <Field k="districtName" label="District" />, मध्य प्रदेश। उप-पंजीयक कार्यालय <Field k="sroOfficeName" label="SRO Office" /> में दस्तावेज़ क्रमांक <Field k="prevDocNumber" label="Doc No." />, जिल्द <Field k="prevJildNumber" label="Jild No." />, दिनांक <Field k="prevRegDate" label="Prev. Date" /> द्वारा क्रय किया गया था।
          </p>
          <p className="mt-2 text-justify">
            <strong>तथा चूंकि</strong> फ्लैट नंबर <Field k="flatNumber" label="Flat No." />, फ्लोर <Field k="floorNumber" label="Floor" /> को रुपये <Field k="saleAmountFigures" label="Amount ₹" />/- (<Field k="saleAmountWords" label="Amount in Words" />) में क्रेता <Field k="vendeeName" label="Vendee Name" /> को हस्तांतरित किया जा रहा है।
          </p>
        </section>

        {/* Consideration */}
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-widest border-b pb-1.5 mb-3" style={{ color: '#800000', borderColor: 'rgba(128, 0, 0, 0.2)' }}>
            प्रतिफल (Consideration)
          </h3>
          <div className="border rounded-lg p-3" style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}>
            <p>
              <span className="text-[11px]" style={{ color: '#737373' }}>कुल राशि:</span>{" "}
              <span className="font-bold" style={{ color: '#800000' }}>₹ <Field k="saleAmountFigures" label="Amount" />/-</span>
            </p>
            <p className="mt-0.5">
              <span className="text-[11px]" style={{ color: '#737373' }}>शब्दों में:</span>{" "}
              <Field k="saleAmountWords" label="Amount in Words" />
            </p>
            <p className="mt-0.5">
              <span className="text-[11px]" style={{ color: '#737373' }}>भुगतान विवरण:</span>{" "}
              <Field k="paymentDetails" label="Payment Details" />
            </p>
          </div>
        </section>

        {/* Property Schedule */}
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-widest border-b pb-1.5 mb-3" style={{ color: '#800000', borderColor: 'rgba(128, 0, 0, 0.2)' }}>
            अनुसूची: संपत्ति का विवरण (Schedule of Property)
          </h3>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#e5e5e5', backgroundColor: '#ffffff' }}>
            <table className="w-full text-[12px]">
              <tbody>
                {[
                  ["फ्लैट/अपार्टमेंट नंबर", "flatNumber", "Flat No."],
                  ["फ्लोर", "floorNumber", "Floor"],
                  ["ब्लॉक/टावर", "blockName", "Block/Tower"],
                  ["सुपर बिल्ट-अप एरिया", "superBuiltUpArea", "Super Built-up Area"],
                  ["कारपेट एरिया", "carpetArea", "Carpet Area"],
                  ["पार्किंग नंबर", "parkingNumber", "Parking No."],
                ].map(([label, key, fb]) => (
                  <tr key={key} className="border-b last:border-0" style={{ borderColor: '#e5e5e5' }}>
                    <td className="px-3 py-2 font-medium w-1/2" style={{ color: '#737373' }}>{label}</td>
                    <td className="px-3 py-2"><Field k={key} label={fb} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Boundaries */}
          <div className="mt-3 rounded-lg border p-3" style={{ borderColor: '#e5e5e5', backgroundColor: '#ffffff' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#737373' }}>चतुःसीमा (Boundaries)</p>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              {[
                ["उत्तर (North)", "boundaryNorth"],
                ["दक्षिण (South)", "boundarySouth"],
                ["पूर्व (East)", "boundaryEast"],
                ["पश्चिम (West)", "boundaryWest"],
              ].map(([dir, key]) => (
                <p key={key}>
                  <span style={{ color: '#737373' }}>{dir}:</span>{" "}
                  <Field k={key} label={dir} />
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Covenants */}
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-widest border-b pb-1.5 mb-3" style={{ color: '#800000', borderColor: 'rgba(128, 0, 0, 0.2)' }}>
            प्रमुख शर्तें (Key Covenants)
          </h3>
          <ol className="space-y-1.5 text-[12px] list-decimal list-inside" style={{ color: '#1a1a1a' }}>
            <li><strong>स्वामित्व हस्तांतरण:</strong> इस विलेख के निष्पादन से विक्रेता क्रेता को सभी अधिकार हस्तांतरित करता है।</li>
            <li><strong>आधिपत्य:</strong> वास्तविक, भौतिक एवं रिक्त आधिपत्य आज से क्रेता को सौंपा जा रहा है।</li>
            <li><strong>भारमुक्ति:</strong> संपत्ति सभी ऋणों, बंधकों, वादों से पूर्णतः मुक्त है।</li>
            <li><strong>कर देयता:</strong> आज की तिथि तक के सभी कर विक्रेता ने चुकाए हैं; आगे से क्रेता जिम्मेदार।</li>
            <li><strong>नामांतरण:</strong> क्रेता संपत्ति का नामांतरण अपने नाम पर कराने हेतु स्वतंत्र है।</li>
          </ol>
        </section>

        {/* Signatures */}
        <section className="border-t pt-5" style={{ borderColor: '#e5e5e5' }}>
          <h3 className="text-[11px] font-bold uppercase tracking-widest pb-1.5 mb-4" style={{ color: '#800000' }}>
            हस्ताक्षर (Signatures)
          </h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="h-10 border-b border-dashed mb-2" style={{ borderColor: '#a3a3a3' }} />
              <p className="text-[11px] font-semibold">विक्रेता / Vendor</p>
              <p className="text-[10px]" style={{ color: '#737373' }}>({ph(d.vendorName, "Vendor Name")})</p>
            </div>
            <div>
              <div className="h-10 border-b border-dashed mb-2" style={{ borderColor: '#a3a3a3' }} />
              <p className="text-[11px] font-semibold">क्रेता / Vendee</p>
              <p className="text-[10px]" style={{ color: '#737373' }}>({ph(d.vendeeName, "Vendee Name")})</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-6 text-[11px]">
            <div>
              <p className="font-semibold mb-1" style={{ color: '#737373' }}>गवाह १ / Witness 1</p>
              <div className="h-6 border-b border-dashed" style={{ borderColor: '#e5e5e5' }} />
              <p className="text-[10px] mt-1" style={{ color: '#737373' }}>नाम / Name: ________________</p>
            </div>
            <div>
              <p className="font-semibold mb-1" style={{ color: '#737373' }}>गवाह २ / Witness 2</p>
              <div className="h-6 border-b border-dashed" style={{ borderColor: '#e5e5e5' }} />
              <p className="text-[10px] mt-1" style={{ color: '#737373' }}>नाम / Name: ________________</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── DocUploadZone — for deed.documentUploads ─────────────────────────────────
function DocUploadZone({
  doc,
  state,
  onUpload,
  onClear,
  disabled,
}: {
  doc: DocumentUpload;
  state: { fileName: string | null; status: string; progress: number } | undefined;
  onUpload: (id: string, file: File) => void;
  onClear: (id: string) => void;
  disabled: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const safeState = state ?? { fileName: null, status: "idle", progress: 0 };

  const getStatusText = () => {
    switch (safeState.status) {
      case "uploading": return "Uploading...";
      case "ocr": return "Scanning text...";
      case "parsing": return "Extracting...";
      case "completed": return "Auto-filled!";
      default: return "Upload";
    }
  };

  return (
    <div
      className={`relative flex flex-col p-3 rounded-xl border-2 border-dashed transition-all duration-300 ${
        disabled
          ? "opacity-45 cursor-not-allowed select-none bg-accent/5 border-border"
          : safeState.status === "idle"
            ? "bg-background hover:bg-accent/40 hover:border-primary/50 cursor-pointer border-border"
            : safeState.status === "completed"
              ? "bg-emerald-500/5 border-emerald-500/40"
              : "bg-accent/15 border-primary/30"
      }`}
      onClick={() => !disabled && safeState.status === "idle" && fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && onUpload(doc.id, e.target.files[0])}
        accept="image/*,application/pdf"
        className="hidden"
        disabled={disabled}
      />

      {safeState.status === "idle" && (
        <>
          <div className="flex items-start gap-2">
            <UploadCloud className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-foreground/80 leading-snug">{doc.label}</p>
              {doc.labelHindi && <p className="text-[10px] text-muted-foreground">{doc.labelHindi}</p>}
            </div>
          </div>
          <p className="text-[9px] text-muted-foreground mt-1.5 leading-snug ml-6">{doc.description}</p>
        </>
      )}

      {safeState.status !== "idle" && safeState.status !== "completed" && (
        <div className="flex flex-col items-center text-center py-1">
          <Loader2 className="h-5 w-5 text-primary animate-spin mb-1" />
          <span className="text-[11px] font-semibold text-primary">{getStatusText()}</span>
          <div className="w-full bg-border h-1 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 rounded-full"
              style={{ width: `${safeState.progress}%` }}
            />
          </div>
        </div>
      )}

      {safeState.status === "completed" && (
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{doc.label}</p>
              <p className="text-[9px] text-muted-foreground truncate max-w-[120px] font-mono">{safeState.fileName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(doc.id); }}
            className="text-[9px] font-bold text-destructive hover:underline shrink-0"
          >
            Clear
          </button>
        </div>
      )}
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
  id: string;
  state: { fileName: string | null; status: string; progress: number } | undefined;
  onUpload: (sectionId: string, file: File) => void;
  onClear: (sectionId: string) => void;
  disabled: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const safeState = state ?? { fileName: null, status: "idle", progress: 0 };

  const getStatusText = () => {
    switch (safeState.status) {
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
        : safeState.status === "idle"
          ? "bg-background hover:bg-accent/40 hover:border-primary/50 cursor-pointer"
          : "bg-accent/15 border-primary/30"
    }`}
      onClick={() => !disabled && safeState.status === "idle" && fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,application/pdf"
        className="hidden"
        disabled={disabled}
      />
      
      {safeState.status === "idle" && (
        <div className="flex flex-col items-center text-center">
          <UploadCloud className="h-6 w-6 text-muted-foreground mb-1.5" />
          <span className="text-[11px] font-semibold text-foreground/80">{label}</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">Click to scan ID/Receipt</span>
        </div>
      )}

      {safeState.status !== "idle" && safeState.status !== "completed" && (
        <div className="w-full flex flex-col items-center text-center">
          <Loader2 className="h-6 w-6 text-primary animate-spin mb-1.5" />
          <span className="text-[11px] font-semibold text-primary">{getStatusText()}</span>
          <div className="w-full bg-border h-1 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300 rounded-full animate-pulse" 
              style={{ width: `${safeState.progress}%` }}
            />
          </div>
        </div>
      )}

      {safeState.status === "completed" && (
        <div className="flex flex-col items-center text-center w-full">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 mb-1.5" />
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{getStatusText()}</span>
          <span className="text-[9px] truncate max-w-full text-muted-foreground mt-0.5 px-2 font-mono" title={safeState.fileName || ""}>
            {safeState.fileName}
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
