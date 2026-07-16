export type DeedCategory = "registered" | "unregistered";

export interface DeedType {
  slug: string;
  name: string;
  category: DeedCategory;
  description: string;
  fields: DeedField[];
  documentUploads?: DocumentUpload[];
  template: string;
  /** If true, this deed is excluded from the home-page listing (accessible via direct URL only). */
  hidden?: boolean;
}

export interface DeedField {
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "number" | "file";
  placeholder?: string;
}

export interface DocumentUpload {
  id: string;
  label: string;
  labelHindi?: string;
  description: string;
  fills: string[];    // which field keys this document fills
  required: boolean;
}

const commonParties: DeedField[] = [
  { key: "firstPartyName", label: "First Party Full Name", type: "text", placeholder: "e.g. Rajesh Kumar Sharma" },
  { key: "firstPartyAddress", label: "First Party Address", type: "textarea", placeholder: "Full residential address" },
  { key: "firstPartyIdNumber", label: "First Party ID (Aadhaar/PAN)", type: "text" },
  { key: "secondPartyName", label: "Second Party Full Name", type: "text", placeholder: "e.g. Priya Verma" },
  { key: "secondPartyAddress", label: "Second Party Address", type: "textarea" },
  { key: "secondPartyIdNumber", label: "Second Party ID (Aadhaar/PAN)", type: "text" },
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
    template: `THIS SALE DEED

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
    slug: "sale-deed-apartment-flat",
    name: "Sale Deed – Apartment/Flat",
    category: "registered",
    hidden: true,   // reached via Sale Deed → Residential → Apartment/Flat sub-type, not listed separately
    description: "Full sale deed for Apartment/Flat under Madhya Pradesh law. Upload your documents to auto-fill all fields including vendor/vendee details, property schedule, and payment proof.",
    documentUploads: [
      {
        id: "vendorAadhaar",
        label: "Vendor's Aadhaar Card",
        labelHindi: "विक्रेता का आधार कार्ड",
        description: "Extracts: Vendor name, father/husband name, address, age, Aadhaar number",
        fills: ["vendorName", "vendorFatherName", "vendorAge", "vendorAddress", "vendorAadhaar"],
        required: true,
      },
      {
        id: "vendorPAN",
        label: "Vendor's PAN Card",
        labelHindi: "विक्रेता का पैन कार्ड",
        description: "Extracts: Vendor PAN number",
        fills: ["vendorPAN"],
        required: true,
      },
      {
        id: "vendeeAadhaar",
        label: "Vendee's Aadhaar Card",
        labelHindi: "क्रेता का आधार कार्ड",
        description: "Extracts: Vendee name, father/husband name, address, age, Aadhaar number",
        fills: ["vendeeName", "vendeeFatherName", "vendeeAge", "vendeeAddress", "vendeeAadhaar"],
        required: true,
      },
      {
        id: "vendeePAN",
        label: "Vendee's PAN Card",
        labelHindi: "क्रेता का पैन कार्ड",
        description: "Extracts: Vendee PAN number",
        fills: ["vendeePAN"],
        required: true,
      },
      {
        id: "motherDeed",
        label: "Mother Deed / Previous Sale Deed",
        labelHindi: "पूर्व पंजीकृत विक्रय विलेख",
        description: "Extracts: Previous registration date, document no., book/volume no., Sub-Registrar office name",
        fills: ["sroOfficeName", "prevRegDate", "prevDocNumber", "prevJildNumber", "societyName"],
        required: true,
      },
      {
        id: "khasra",
        label: "Khasra / Municipal Property Tax Receipt",
        labelHindi: "भू-राजस्व रिकॉर्ड / संपत्तिकर रसीद",
        description: "Extracts: Khasra no., Halka no., Village/Town, District, Property ID",
        fills: ["khasraNumber", "halkaNumber", "gramName", "districtName"],
        required: true,
      },
      {
        id: "allotmentLetter",
        label: "Allotment Letter / Builder-Buyer Agreement",
        labelHindi: "आवंटन पत्र / बिल्डर-क्रेता अनुबंध",
        description: "Extracts: Flat no., Floor, Block/Tower, Super built-up area, Carpet area, Parking no.",
        fills: ["flatNumber", "floorNumber", "blockName", "superBuiltUpArea", "carpetArea", "parkingNumber"],
        required: true,
      },
      {
        id: "layoutPlan",
        label: "Approved Building/Layout Plan",
        labelHindi: "स्वीकृत भवन/लेआउट प्लान",
        description: "Extracts: Exact boundaries (North, South, East, West) of the flat",
        fills: ["boundaryNorth", "boundarySouth", "boundaryEast", "boundaryWest"],
        required: true,
      },
      {
        id: "bankPayment",
        label: "Bank Payment Receipt(s) – RTGS/NEFT/Cheque/DD",
        labelHindi: "भुगतान प्रमाण / बैंक रसीद",
        description: "Extracts: Total sale amount (figures & words), UTR no., Cheque/DD no., date, bank name",
        fills: ["saleAmountFigures", "saleAmountWords", "paymentDetails"],
        required: true,
      },
    ],
    fields: [
      // Vendor (First Party)
      { key: "vendorName",       label: "Vendor Full Name (विक्रेता का नाम)",          type: "text",     placeholder: "e.g. Rajesh Kumar Sharma" },
      { key: "vendorFatherName", label: "Vendor Father/Husband Name (पिता/पति का नाम)", type: "text",     placeholder: "e.g. Ramesh Sharma" },
      { key: "vendorAge",        label: "Vendor Age (आयु)",                             type: "number",   placeholder: "e.g. 45" },
      { key: "vendorAddress",    label: "Vendor Address (पूर्ण पता)",                   type: "textarea", placeholder: "Full residential address" },
      { key: "vendorAadhaar",    label: "Vendor Aadhaar Number (आधार संख्या)",          type: "text",     placeholder: "e.g. 9876 5432 1098" },
      { key: "vendorPAN",        label: "Vendor PAN Number (पैन संख्या)",               type: "text",     placeholder: "e.g. ABCDE1234F" },
      // Vendee (Second Party)
      { key: "vendeeName",       label: "Vendee Full Name (क्रेता का नाम)",             type: "text",     placeholder: "e.g. Priya Verma" },
      { key: "vendeeFatherName", label: "Vendee Father/Husband Name (पिता/पति का नाम)", type: "text",     placeholder: "e.g. Anil Verma" },
      { key: "vendeeAge",        label: "Vendee Age (आयु)",                             type: "number",   placeholder: "e.g. 38" },
      { key: "vendeeAddress",    label: "Vendee Address (पूर्ण पता)",                   type: "textarea", placeholder: "Full residential address" },
      { key: "vendeeAadhaar",    label: "Vendee Aadhaar Number (आधार संख्या)",          type: "text",     placeholder: "e.g. 1234 5678 9012" },
      { key: "vendeePAN",        label: "Vendee PAN Number (पैन संख्या)",               type: "text",     placeholder: "e.g. FGHIJ5678K" },
      // Property Recitals
      { key: "societyName",      label: "Society/Building Name (भवन/सोसायटी का नाम)",  type: "text",     placeholder: "e.g. Sunshine Residency" },
      { key: "khasraNumber",     label: "Khasra Number (खसरा नंबर)",                   type: "text",     placeholder: "e.g. 123/1" },
      { key: "halkaNumber",      label: "Halka Number (हल्का नंबर)",                   type: "text",     placeholder: "e.g. 45" },
      { key: "gramName",         label: "Village/Town (मौजा/शहर)",                     type: "text",     placeholder: "e.g. Bhopal" },
      { key: "districtName",     label: "District (जिला)",                             type: "text",     placeholder: "e.g. Bhopal, Madhya Pradesh" },
      { key: "sroOfficeName",    label: "Sub-Registrar Office (उप-पंजीयक कार्यालय)",  type: "text",     placeholder: "e.g. SRO, Bhopal City" },
      { key: "prevRegDate",      label: "Previous Registration Date (पूर्व पंजीयन तिथि)", type: "date" },
      { key: "prevDocNumber",    label: "Previous Document Number (दस्तावेज़ क्रमांक)", type: "text",     placeholder: "e.g. 1245/2019" },
      { key: "prevJildNumber",   label: "Previous Volume/Jild Number (जिल्द नंबर)",   type: "text",     placeholder: "e.g. 5" },
      // Flat Schedule
      { key: "flatNumber",       label: "Flat/Apartment Number (फ्लैट नंबर)",         type: "text",     placeholder: "e.g. 402" },
      { key: "floorNumber",      label: "Floor Number (फ्लोर नंबर)",                  type: "text",     placeholder: "e.g. 4th" },
      { key: "blockName",        label: "Block/Tower (ब्लॉक/टावर)",                   type: "text",     placeholder: "e.g. Tower A" },
      { key: "superBuiltUpArea", label: "Super Built-up Area (सुपर बिल्ट-अप एरिया)", type: "text",     placeholder: "e.g. 1250 sq ft" },
      { key: "carpetArea",       label: "Carpet Area (कारपेट एरिया)",                 type: "text",     placeholder: "e.g. 980 sq ft" },
      { key: "parkingNumber",    label: "Parking Space Number (पार्किंग नंबर)",       type: "text",     placeholder: "e.g. B-14 (Optional)" },
      // Boundaries
      { key: "boundaryNorth",    label: "North Boundary (उत्तर में)",                 type: "text",     placeholder: "e.g. Flat No. 401" },
      { key: "boundarySouth",    label: "South Boundary (दक्षिण में)",                type: "text",     placeholder: "e.g. Open Terrace" },
      { key: "boundaryEast",     label: "East Boundary (पूर्व में)",                  type: "text",     placeholder: "e.g. Corridor / Lift" },
      { key: "boundaryWest",     label: "West Boundary (पश्चिम में)",                 type: "text",     placeholder: "e.g. External Wall" },
      // Consideration
      { key: "saleAmountFigures", label: "Sale Amount in Figures — INR (राशि अंकों में)", type: "number", placeholder: "e.g. 5500000" },
      { key: "saleAmountWords",   label: "Sale Amount in Words (राशि शब्दों में)",       type: "text",   placeholder: "e.g. Fifty-Five Lakhs Rupees Only" },
      { key: "paymentDetails",    label: "Payment Details – UTR/Cheque/DD (भुगतान विवरण)", type: "textarea", placeholder: "e.g. NEFT UTR No. UTIB00012458921 dated 15-07-2026, Bank: SBI" },
    ],
    template: `अचल संपत्ति विक्रय विलेख (SALE DEED)
मध्य प्रदेश में अपार्टमेंट/फ्लैट बिक्री हेतु
════════════════════════════════════════════════

पक्षकारों का विवरण (PARTIES)

विक्रेता: {vendorName}
पिता/पति का नाम: {vendorFatherName}
आयु: लगभग {vendorAge} वर्ष
निवासी: {vendorAddress}
पैन नंबर: {vendorPAN}
आधार नंबर: {vendorAadhaar}
(जिन्हें आगे "विक्रेता" या "प्रथम पक्ष" कहा गया है)

                    -- बनाम --

क्रेता: {vendeeName}
पिता/पति का नाम: {vendeeFatherName}
आयु: लगभग {vendeeAge} वर्ष
निवासी: {vendeeAddress}
पैन नंबर: {vendeePAN}
आधार नंबर: {vendeeAadhaar}
(जिन्हें आगे "क्रेता" या "द्वितीय पक्ष" कहा गया है)

────────────────────────────────────────────────
प्रस्तावना एवं पूर्व इतिहास (RECITALS)
────────────────────────────────────────────────

चूंकि (WHEREAS) विक्रेता उस बहुमंजिला आवासीय परिसर/भवन का पूर्ण और
एकमात्र स्वामी है, जो कि {societyName} के नाम से स्थित है, जिसका खसरा
नंबर {khasraNumber}, पटवारी हल्का नंबर {halkaNumber}, मौजा/ग्राम {gramName},
तहसील व जिला {districtName}, मध्य प्रदेश में स्थित है।

विक्रेता ने उक्त संपत्ति को उप-पंजीयक कार्यालय {sroOfficeName} के समक्ष
पंजीकृत विक्रय विलेख दिनांक {prevRegDate} को दस्तावेज़ क्रमांक {prevDocNumber},
जिल्द नंबर {prevJildNumber} के माध्यम से क्रय किया था।

तथा चूंकि विक्रेता ने उक्त संपत्ति के अंतर्गत आने वाले अपार्टमेंट/फ्लैट
नंबर {flatNumber}, फ्लोर नंबर {floorNumber} को सभी स्वत्वों सहित पूर्ण
रूप से बेचने का प्रस्ताव क्रेता के समक्ष रखा, जिसे क्रेता ने कुल प्रतिफल
राशि रुपये {saleAmountFigures}/- (शब्दों में: {saleAmountWords} रुपये मात्र)
में पूर्णतः भारमुक्त क्रय करने हेतु स्वीकार कर लिया है।

────────────────────────────────────────────────
शर्तें एवं प्रावधान (TERMS & CONDITIONS)
────────────────────────────────────────────────

१. प्रतिफल एवं पावती (Consideration & Receipt):
   क्रेता ने विक्रेता को तयशुदा पूर्ण प्रतिफल राशि रुपये {saleAmountFigures}/-
   का भुगतान बैंक माध्यम {paymentDetails} द्वारा कर दिया है, जिसकी प्राप्ति
   विक्रेता इसके द्वारा स्वीकार करता है।

२. स्वामित्व का हस्तांतरण (Transfer of Title):
   इस विलेख के निष्पादन के साथ ही विक्रेता उक्त अपार्टमेंट/फ्लैट से संबंधित
   अपने सभी अधिकार, स्वत्व, हित, मार्ग-अधिकार और सुख-भोग के अधिकार पूर्ण
   और पूर्ण स्वामित्व के साथ क्रेता को हस्तांतरित करता है।

३. वास्तविक आधिपत्य (Delivery of Possession):
   विक्रेता ने उक्त फ्लैट का वास्तविक, भौतिक और रिक्त आधिपत्य तथा उससे
   संबंधित सभी मूल लिंक दस्तावेज़ आज दिनांक को क्रेता को सौंप दिए हैं।

४. भारमुक्ति का आश्वासन (Clear Title Guarantee):
   विक्रेता गारंटी देता है कि उक्त फ्लैट सभी प्रकार के ऋणों, बंधकों,
   न्यायालयी वादों, कुर्की या किसी अन्य कानूनी विवादों से पूर्णतः मुक्त है।

५. कर एवं अन्य देयताएं (Taxes and Outgoings):
   आज की तिथि तक के सभी संपत्तिकर, बिजली बिल, जल कर, और रखरखाव शुल्क का
   भुगतान विक्रेता द्वारा कर दिया गया है। आज के बाद के सभी कर क्रेता की
   जिम्मेदारी होंगे।

६. नामांतरण का अधिकार (Mutation & Utilities):
   क्रेता को इस विलेख के आधार पर संपत्ति का नामांतरण अपने नाम पर कराने का
   पूर्ण अधिकार होगा।

────────────────────────────────────────────────
अनुसूची: संपत्ति का विवरण (SCHEDULE OF PROPERTY)
────────────────────────────────────────────────

  फ्लैट/अपार्टमेंट नंबर  : {flatNumber}
  फ्लोर                   : {floorNumber}
  ब्लॉक/टावर              : {blockName}
  सुपर बिल्ट-अप एरिया     : {superBuiltUpArea}
  कारपेट एरिया            : {carpetArea}
  पार्किंग नंबर           : {parkingNumber}

  चतुःसीमा (Boundaries):
    उत्तर में (North) : {boundaryNorth}
    दक्षिण में (South): {boundarySouth}
    पूर्व में (East)  : {boundaryEast}
    पश्चिम में (West) : {boundaryWest}

════════════════════════════════════════════════
हस्ताक्षर (SIGNATURES)
════════════════════════════════════════════════

___________________________        ___________________________
विक्रेता / प्रथम पक्ष              क्रेता / द्वितीय पक्ष
({vendorName})                     ({vendeeName})


गवाहों के हस्ताक्षर (WITNESSES):

१. हस्ताक्षर: ____________________   नाम: _____________ पता: ______________

२. हस्ताक्षर: ____________________   नाम: _____________ पता: ______________`,
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
    template: `THIS GIFT DEED

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
    template: `THIS LEASE DEED

BETWEEN
{firstPartyName} (LESSOR), residing at {firstPartyAddress}, ID {firstPartyIdNumber}

AND
{secondPartyName} (LESSEE), residing at {secondPartyAddress}, ID {secondPartyIdNumber}

PREMISES: {propertyDescription}

TERM: {leaseTerm} years
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
    template: `THIS MORTGAGE DEED

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
    template: `THIS PARTITION DEED

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
    template: `THIS SETTLEMENT DEED

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
    template: `THIS POWER OF ATTORNEY

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

export const registeredDeeds = deedTypes.filter((d) => d.category === "registered" && !d.hidden);
export const unregisteredDeeds = deedTypes.filter((d) => d.category === "unregistered" && !d.hidden);

export function getDeedBySlug(slug: string) {
  return deedTypes.find((d) => d.slug === slug);
}

export function renderDeed(template: string, data: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => data[key]?.toString().trim() || `[${key}]`);
}
