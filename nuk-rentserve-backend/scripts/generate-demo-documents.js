const fs = require("fs");
const path = require("path");

const PRIVATE_DIR = path.join(__dirname, "../uploads/private_documents");
if (!fs.existsSync(PRIVATE_DIR)) {
  fs.mkdirSync(PRIVATE_DIR, { recursive: true });
}

// Generate a valid 2-page minimal PDF
function createSamplePdf(title, subtitle, pageCount = 2) {
  let contentStream1 = `BT /F1 20 Tf 50 720 Td (${title}) Tj ET\nBT /F1 12 Tf 50 690 Td (${subtitle} - Page 1) Tj ET\nBT /F1 10 Tf 50 650 Td (Verified by Government of Karnataka / NUK RentServe Verification Desk) Tj ET\nBT /F1 10 Tf 50 630 Td (Document Reference: NUK-VERIFY-2026-DOC-001) Tj ET\nBT /F1 10 Tf 50 610 Td (Holder Status: Active Verification Applicant) Tj ET\nBT /F1 10 Tf 50 590 Td (Jurisdiction: Bagalkot District, Karnataka) Tj ET\n`;
  let contentStream2 = `BT /F1 20 Tf 50 720 Td (${title} - Endorsement Record) Tj ET\nBT /F1 12 Tf 50 690 Td (${subtitle} - Page 2) Tj ET\nBT /F1 10 Tf 50 650 Td (Official Transport Authority Seal & Validity Details) Tj ET\nBT /F1 10 Tf 50 630 Td (Vehicle Classes Authorized: 3W-CAB, LMV-TR, TRANS) Tj ET\nBT /F1 10 Tf 50 610 Td (Valid Across Karnataka through 2035) Tj ET\n`;

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 7 0 R >> >> >>
endobj
4 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 6 0 R /Resources << /Font << /F1 7 0 R >> >> >>
endobj
5 0 obj
<< /Length ${contentStream1.length} >>
stream
${contentStream1}endstream
endobj
6 0 obj
<< /Length ${contentStream2.length} >>
stream
${contentStream2}endstream
endobj
7 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 8
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000333 00000 n 
0000000450 00000 n 
0000000567 00000 n 
trailer
<< /Size 8 /Root 1 0 R >>
startxref
644
%%EOF`;
  return Buffer.from(pdf, "utf-8");
}

// Minimal valid 1x1 PNG expanded to a valid 200x200 PNG with headers
// Or a valid base64 PNG data
const SAMPLE_PNG_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

// Valid small JPEG file bytes
const SAMPLE_JPEG_HEX = 
  "ffd8ffe000104a46494600010101004800480000ffdb00430008060607060508070707090908" +
  "0a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c303134" +
  "34341f27393d38323c2e333430ffc0000b080001000101011100ffc4001f0000010501010101" +
  "010100000000000000000102030405060708090a0bffda0008010100003f007f00ffd9";

function createDemoFiles() {
  const samplePdf = createSamplePdf("NUK RentServe Document Verification", "Official Driving Licence Scan & Endorsement");
  const sampleAadhaarPdf = createSamplePdf("Government of India - Unique Identification Authority", "Aadhaar Identity Verification Card (Masked)");
  const sampleJpg = Buffer.from(SAMPLE_JPEG_HEX, "hex");
  const samplePng = Buffer.from(SAMPLE_PNG_BASE64, "base64");

  // Write demo files
  fs.writeFileSync(path.join(PRIVATE_DIR, "demo-dl-doc.pdf"), samplePdf);
  fs.writeFileSync(path.join(PRIVATE_DIR, "demo-dl-doc"), samplePdf);
  fs.writeFileSync(path.join(PRIVATE_DIR, "demo-aadhaar-doc.pdf"), sampleAadhaarPdf);
  fs.writeFileSync(path.join(PRIVATE_DIR, "demo-aadhaar-doc.jpg"), sampleJpg);
  fs.writeFileSync(path.join(PRIVATE_DIR, "demo-aadhaar-doc"), sampleJpg);
  fs.writeFileSync(path.join(PRIVATE_DIR, "demo-rc-doc.jpg"), sampleJpg);
  fs.writeFileSync(path.join(PRIVATE_DIR, "demo-rc-doc"), sampleJpg);
  fs.writeFileSync(path.join(PRIVATE_DIR, "demo-student-id-doc.jpg"), sampleJpg);
  fs.writeFileSync(path.join(PRIVATE_DIR, "demo-student-id-doc"), sampleJpg);
  fs.writeFileSync(path.join(PRIVATE_DIR, "sample-preview.pdf"), samplePdf);
  fs.writeFileSync(path.join(PRIVATE_DIR, "sample-preview.jpg"), sampleJpg);

  console.log("Demo verification documents generated in uploads/private_documents.");
}

createDemoFiles();
