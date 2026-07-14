export type DeedCategory = "registered" | "unregistered";

export interface DeedType {
  slug: string;
  name: string;
  category: DeedCategory;
  description: string;
  fields: DeedField[];
  template: string;
}

export interface DeedField {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "number";
  placeholder?: string;
}

const commonParties: DeedField[] = [
  { key: "firstPartyName", label: "First Party Full Name", type: "text", placeholder: "e.g. Rajesh Kumar Sharma" },
  { key: "firstPartyAddress", label: "First Party Address", type: "textarea", placeholder: "Full residential address" },
  { key: "firstPartyIdNumber", label: "First Party ID (Aadhaar/PAN)", type: "text" },
  { key: "secondPartyName", label: "Second Party Full Name", type: "text", placeholder: "e.g. Priya Verma" },
  { key: "secondPartyAddress", label: "Second Party Address", type: "textarea" },
  { key: "secondPartyIdNumber", label: "Second Party ID (Aadhaar/PAN)", type: "text" },
  { key: "executionDate", label: "Date of Execution", type: "date" },
  { key: "executionPlace", label: "Place of Execution", type: "text", placeholder: "e.g. New Delhi" },
];

export const deedTypes: DeedType[] = [
  {
    slug: "sale-deed",
    name: "Sale Deed",
    category: "registered",
    description: "Transfers ownership of immovable property from seller to buyer.",
    fields: [
      ...commonParties,
      { key: "propertyDescription", label: "Property Description", type: "textarea", placeholder: "Full property address, boundaries, area" },
      { key: "saleConsideration", label: "Sale Consideration (INR)", type: "number" },
      { key: "paymentMode", label: "Mode of Payment", type: "text", placeholder: "e.g. RTGS / Cheque No." },
    ],
    template: `THIS SALE DEED is executed on {executionDate} at {executionPlace}

BETWEEN
{firstPartyName}, residing at {firstPartyAddress}, holding ID {firstPartyIdNumber} (hereinafter called the "SELLER")

AND
{secondPartyName}, residing at {secondPartyAddress}, holding ID {secondPartyIdNumber} (hereinafter called the "PURCHASER")

WHEREAS the Seller is the absolute owner of the property described below:
{propertyDescription}

AND WHEREAS the Seller has agreed to sell the said property to the Purchaser for a total consideration of INR {saleConsideration}/- paid via {paymentMode}.

NOW THIS DEED WITNESSETH that in consideration of the sum received, the Seller hereby conveys, transfers and assigns absolutely unto the Purchaser all rights, title and interest in the said property.

IN WITNESS WHEREOF the parties have signed this Deed on the day and year first above written.

_______________________              _______________________
   SELLER                                    PURCHASER`,
  },
  {
    slug: "gift-deed",
    name: "Gift Deed",
    category: "registered",
    description: "Voluntary transfer of property without consideration, out of natural love and affection.",
    fields: [
      ...commonParties,
      { key: "relationship", label: "Relationship between parties", type: "text", placeholder: "e.g. Father and Son" },
      { key: "propertyDescription", label: "Property/Asset Description", type: "textarea" },
    ],
    template: `THIS GIFT DEED is made on {executionDate} at {executionPlace}

BETWEEN
{firstPartyName} (DONOR), residing at {firstPartyAddress}, ID {firstPartyIdNumber}

AND
{secondPartyName} (DONEE), residing at {secondPartyAddress}, ID {secondPartyIdNumber}

Relationship: {relationship}

WHEREAS the Donor, out of natural love and affection towards the Donee and without any monetary consideration, desires to gift the following property:
{propertyDescription}

NOW THIS DEED WITNESSETH that the Donor hereby transfers absolutely and forever by way of gift the said property to the Donee, who has accepted the same.

_______________________              _______________________
   DONOR                                     DONEE`,
  },
  {
    slug: "lease-deed",
    name: "Lease Deed",
    category: "registered",
    description: "Long-term lease agreement (typically above 11 months) requiring compulsory registration.",
    fields: [
      ...commonParties,
      { key: "propertyDescription", label: "Leased Premises", type: "textarea" },
      { key: "leaseTerm", label: "Lease Term (Years)", type: "number" },
      { key: "monthlyRent", label: "Monthly Rent (INR)", type: "number" },
      { key: "securityDeposit", label: "Security Deposit (INR)", type: "number" },
    ],
    template: `THIS LEASE DEED is executed on {executionDate} at {executionPlace}

BETWEEN
{firstPartyName} (LESSOR), residing at {firstPartyAddress}, ID {firstPartyIdNumber}

AND
{secondPartyName} (LESSEE), residing at {secondPartyAddress}, ID {secondPartyIdNumber}

PREMISES: {propertyDescription}

TERM: {leaseTerm} years from {executionDate}
RENT: INR {monthlyRent}/- per month
DEPOSIT: INR {securityDeposit}/- refundable

The Lessor grants and the Lessee accepts the lease of the premises on the terms above, subject to timely payment of rent and maintenance of the premises in good condition.

_______________________              _______________________
   LESSOR                                    LESSEE`,
  },
  {
    slug: "mortgage-deed",
    name: "Mortgage Deed",
    category: "registered",
    description: "Transfers interest in immovable property to secure a loan.",
    fields: [
      ...commonParties,
      { key: "propertyDescription", label: "Mortgaged Property", type: "textarea" },
      { key: "loanAmount", label: "Loan Amount (INR)", type: "number" },
      { key: "interestRate", label: "Interest Rate (% p.a.)", type: "number" },
      { key: "tenure", label: "Loan Tenure (Months)", type: "number" },
    ],
    template: `THIS MORTGAGE DEED is executed on {executionDate} at {executionPlace}

BETWEEN
{firstPartyName} (MORTGAGOR), residing at {firstPartyAddress}, ID {firstPartyIdNumber}

AND
{secondPartyName} (MORTGAGEE), residing at {secondPartyAddress}, ID {secondPartyIdNumber}

PROPERTY MORTGAGED: {propertyDescription}
LOAN AMOUNT: INR {loanAmount}/-
INTEREST: {interestRate}% per annum
TENURE: {tenure} months

The Mortgagor hereby transfers an interest in the above property to the Mortgagee as security for repayment of the loan with interest as per the terms stated herein.

_______________________              _______________________
   MORTGAGOR                                 MORTGAGEE`,
  },
  {
    slug: "partition-deed",
    name: "Partition Deed",
    category: "registered",
    description: "Divides jointly owned property among co-owners into separate shares.",
    fields: [
      ...commonParties,
      { key: "propertyDescription", label: "Joint Property Description", type: "textarea" },
      { key: "firstPartyShare", label: "First Party's Share", type: "text", placeholder: "e.g. Northern half measuring 1200 sq ft" },
      { key: "secondPartyShare", label: "Second Party's Share", type: "text" },
    ],
    template: `THIS PARTITION DEED is executed on {executionDate} at {executionPlace}

BETWEEN the co-owners:
1) {firstPartyName}, {firstPartyAddress}, ID {firstPartyIdNumber}
2) {secondPartyName}, {secondPartyAddress}, ID {secondPartyIdNumber}

JOINT PROPERTY: {propertyDescription}

The parties, being desirous of holding their shares separately, agree to partition the property as follows:

- {firstPartyName} shall exclusively own: {firstPartyShare}
- {secondPartyName} shall exclusively own: {secondPartyShare}

Each party relinquishes all claims to the portion allotted to the other and shall hold their respective share absolutely.

_______________________              _______________________
   PARTY 1                                   PARTY 2`,
  },
  {
    slug: "settlement-deed",
    name: "Settlement Deed",
    category: "registered",
    description: "Settles property or claims among family or parties, typically without monetary consideration.",
    fields: [
      ...commonParties,
      { key: "propertyDescription", label: "Property/Claim Being Settled", type: "textarea" },
      { key: "settlementTerms", label: "Settlement Terms", type: "textarea" },
    ],
    template: `THIS SETTLEMENT DEED is executed on {executionDate} at {executionPlace}

BETWEEN
{firstPartyName} (SETTLOR), {firstPartyAddress}, ID {firstPartyIdNumber}
AND
{secondPartyName} (BENEFICIARY), {secondPartyAddress}, ID {secondPartyIdNumber}

SUBJECT: {propertyDescription}

TERMS OF SETTLEMENT:
{settlementTerms}

The Settlor, of sound mind and free will, hereby settles the above in favour of the Beneficiary who accepts the same in full and final settlement of all claims.

_______________________              _______________________
   SETTLOR                                   BENEFICIARY`,
  },
  {
    slug: "power-of-attorney",
    name: "Power of Attorney",
    category: "registered",
    description: "Authorises another to act on your behalf for property matters (registered where required).",
    fields: [
      ...commonParties,
      { key: "powers", label: "Powers Granted", type: "textarea", placeholder: "List of acts the attorney can perform" },
      { key: "validity", label: "Validity Period", type: "text", placeholder: "e.g. 2 years or until revoked" },
    ],
    template: `THIS POWER OF ATTORNEY is executed on {executionDate} at {executionPlace}

I, {firstPartyName}, residing at {firstPartyAddress}, ID {firstPartyIdNumber} (hereinafter "PRINCIPAL")

DO HEREBY appoint {secondPartyName}, residing at {secondPartyAddress}, ID {secondPartyIdNumber} (hereinafter "ATTORNEY") to act on my behalf.

POWERS GRANTED:
{powers}

VALIDITY: {validity}

All acts done by the Attorney within the scope of the powers granted shall be binding on the Principal as if done by the Principal personally.

_______________________              _______________________
   PRINCIPAL                                 ATTORNEY`,
  },
  {
    slug: "rent-agreement",
    name: "Simple Rent Agreement",
    category: "unregistered",
    description: "Short-term rental agreement (typically 11 months) not requiring compulsory registration.",
    fields: [
      ...commonParties,
      { key: "propertyDescription", label: "Rented Premises", type: "textarea" },
      { key: "monthlyRent", label: "Monthly Rent (INR)", type: "number" },
      { key: "securityDeposit", label: "Security Deposit (INR)", type: "number" },
      { key: "tenureMonths", label: "Tenure (Months)", type: "number", placeholder: "e.g. 11" },
    ],
    template: `RENT AGREEMENT executed on {executionDate} at {executionPlace}

BETWEEN
Landlord: {firstPartyName}, {firstPartyAddress}, ID {firstPartyIdNumber}
Tenant:   {secondPartyName}, {secondPartyAddress}, ID {secondPartyIdNumber}

PREMISES: {propertyDescription}
RENT: INR {monthlyRent}/- per month
DEPOSIT: INR {securityDeposit}/- (refundable)
TENURE: {tenureMonths} months from {executionDate}

The Tenant agrees to pay rent by the 5th of each month and use the premises solely for residential purposes. The Landlord agrees to peaceful possession during the tenure.

_______________________              _______________________
   LANDLORD                                  TENANT`,
  },
  {
    slug: "affidavit",
    name: "Affidavit",
    category: "unregistered",
    description: "Sworn written statement confirmed by oath, used as evidence.",
    fields: [
      { key: "firstPartyName", label: "Deponent Full Name", type: "text" },
      { key: "firstPartyAddress", label: "Deponent Address", type: "textarea" },
      { key: "firstPartyIdNumber", label: "Deponent ID (Aadhaar/PAN)", type: "text" },
      { key: "fatherName", label: "Father's / Husband's Name", type: "text" },
      { key: "age", label: "Age", type: "number" },
      { key: "purpose", label: "Purpose of Affidavit", type: "text" },
      { key: "statement", label: "Statement / Facts", type: "textarea" },
      { key: "executionDate", label: "Date", type: "date" },
      { key: "executionPlace", label: "Place", type: "text" },
    ],
    template: `AFFIDAVIT

I, {firstPartyName}, S/o or W/o {fatherName}, aged {age} years, residing at {firstPartyAddress}, ID {firstPartyIdNumber}, do hereby solemnly affirm and declare as under:

Purpose: {purpose}

1. {statement}

2. That the contents of this affidavit are true and correct to the best of my knowledge and belief, and nothing material has been concealed therefrom.

Verified at {executionPlace} on this {executionDate}.

                                            _______________________
                                                    DEPONENT`,
  },
  {
    slug: "mou",
    name: "Memorandum of Understanding",
    category: "unregistered",
    description: "Records mutual understanding between parties on intended cooperation.",
    fields: [
      ...commonParties,
      { key: "purpose", label: "Purpose of MoU", type: "textarea" },
      { key: "obligations", label: "Key Obligations of Each Party", type: "textarea" },
      { key: "duration", label: "Duration", type: "text" },
    ],
    template: `MEMORANDUM OF UNDERSTANDING

Executed on {executionDate} at {executionPlace}

BETWEEN
Party A: {firstPartyName}, {firstPartyAddress}, ID {firstPartyIdNumber}
Party B: {secondPartyName}, {secondPartyAddress}, ID {secondPartyIdNumber}

PURPOSE:
{purpose}

OBLIGATIONS:
{obligations}

DURATION: {duration}

This MoU records the mutual understanding of the parties and, unless otherwise stated, does not create legally binding obligations except where explicitly required by law.

_______________________              _______________________
   PARTY A                                   PARTY B`,
  },
  {
    slug: "loan-agreement",
    name: "Loan Agreement",
    category: "unregistered",
    description: "Records terms of a loan between individuals.",
    fields: [
      ...commonParties,
      { key: "loanAmount", label: "Loan Amount (INR)", type: "number" },
      { key: "interestRate", label: "Interest Rate (% p.a.)", type: "number" },
      { key: "tenure", label: "Repayment Tenure (Months)", type: "number" },
      { key: "purpose", label: "Purpose of Loan", type: "text" },
    ],
    template: `LOAN AGREEMENT executed on {executionDate} at {executionPlace}

BETWEEN
Lender:   {firstPartyName}, {firstPartyAddress}, ID {firstPartyIdNumber}
Borrower: {secondPartyName}, {secondPartyAddress}, ID {secondPartyIdNumber}

AMOUNT: INR {loanAmount}/-
INTEREST: {interestRate}% per annum
TENURE: {tenure} months
PURPOSE: {purpose}

The Borrower agrees to repay the loan with interest in equal monthly instalments. On default, the Lender may demand full repayment and pursue legal remedies.

_______________________              _______________________
   LENDER                                    BORROWER`,
  },
  {
    slug: "receipt",
    name: "Receipt",
    category: "unregistered",
    description: "Acknowledges payment or delivery of goods/services.",
    fields: [
      { key: "firstPartyName", label: "Received From (Payer)", type: "text" },
      { key: "firstPartyAddress", label: "Payer Address", type: "textarea" },
      { key: "secondPartyName", label: "Received By (Payee)", type: "text" },
      { key: "secondPartyAddress", label: "Payee Address", type: "textarea" },
      { key: "amount", label: "Amount (INR)", type: "number" },
      { key: "purpose", label: "Purpose / Description", type: "text" },
      { key: "paymentMode", label: "Mode of Payment", type: "text" },
      { key: "executionDate", label: "Date", type: "date" },
      { key: "executionPlace", label: "Place", type: "text" },
    ],
    template: `RECEIPT

Date: {executionDate}
Place: {executionPlace}

Received with thanks from {firstPartyName} ({firstPartyAddress}) a sum of INR {amount}/- ({paymentMode}) towards {purpose}.

Received by:
{secondPartyName}
{secondPartyAddress}

                                            _______________________
                                                    SIGNATURE`,
  },
  {
    slug: "private-agreement",
    name: "Private Agreement",
    category: "unregistered",
    description: "General private agreement between parties not requiring compulsory registration.",
    fields: [
      ...commonParties,
      { key: "subject", label: "Subject of Agreement", type: "text" },
      { key: "terms", label: "Terms & Conditions", type: "textarea" },
    ],
    template: `PRIVATE AGREEMENT

Executed on {executionDate} at {executionPlace}

BETWEEN
Party A: {firstPartyName}, {firstPartyAddress}, ID {firstPartyIdNumber}
Party B: {secondPartyName}, {secondPartyAddress}, ID {secondPartyIdNumber}

SUBJECT: {subject}

TERMS:
{terms}

Both parties confirm they have read and understood this agreement and enter into it voluntarily.

_______________________              _______________________
   PARTY A                                   PARTY B`,
  },
];

export const registeredDeeds = deedTypes.filter((d) => d.category === "registered");
export const unregisteredDeeds = deedTypes.filter((d) => d.category === "unregistered");

export function getDeedBySlug(slug: string) {
  return deedTypes.find((d) => d.slug === slug);
}

export function renderDeed(template: string, data: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => data[key]?.toString().trim() || `[${key}]`);
}
