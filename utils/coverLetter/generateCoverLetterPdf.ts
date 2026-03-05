import fs from "fs";
import path from "path";

import PDFDocument from "pdfkit";

export async function generateCoverLetterPdf(text: string): Promise<Buffer> {
  const fontPath = path.join(process.cwd(), "public", "fonts", "times.ttf");

  if (!fs.existsSync(fontPath)) {
    throw new Error(`Font file not found: ${fontPath}`);
  }

  const doc = new PDFDocument({
    margin: 50,
    font: fontPath,
  });

  const chunks: Uint8Array[] = [];

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(11);

    doc.text(text, {
      align: "left",
      lineGap: 2,
    });

    doc.end();
  });
}
