import fs from "fs";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

async function extractDetailed() {
  const fileName = "HHP_26_08_Packet.pdf";
  const data = new Uint8Array(fs.readFileSync(fileName));
  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdf = await loadingTask.promise;
  console.log(`PDF Pages: ${pdf.numPages}`);

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    console.log(`Page ${i} items:`, content.items.length);
    content.items.forEach((item) => {
      console.log(`- Text: "${item.str}" | Transform:`, item.transform);
    });
  }
}

extractDetailed().catch(console.error);
