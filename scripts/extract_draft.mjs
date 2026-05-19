import fs from 'fs';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

async function extractDraft() {
  const fileName = 'HHP_26_08_Packet.pdf';
  if (!fs.existsSync(fileName)) {
    console.error(`File ${fileName} not found.`);
    process.exit(1);
  }
  const data = new Uint8Array(fs.readFileSync(fileName));
  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
  });
  
  const pdf = await loadingTask.promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    fullText += `--- Page ${i} ---\n` + strings.join(" ") + "\n";
  }

  fs.writeFileSync('draft_hhp_26_08_extracted.txt', fullText);
  console.log("Draft HHP_26_08 Text Extracted.");
}

extractDraft().catch(console.error);
