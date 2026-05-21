require('dotenv').config();
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Place your audit instructions here
const UX_INSTRUCTION_SET = `
You are an expert Enterprise UX Architect. Audit the provided React/Tailwind component against:
1. Hick's Law: Minimize cognitive load (dense lists, cluttered areas).
2. Fitts's Law: Ensure hit targets (min 44px) and interaction ergonomics.
3. Jakob's Law: Validate against enterprise standard conventions (semantic status badges, clear hierarchies).
4. Aesthetic-Usability Effect: Review scannability, containerization, and alignment.

Output requirements:
- Bulleted list of violations.
- Tactical refactors table (Issue | Tailwind Refactor).
- Maintain professional, emoji-free tone.
`;

async function runAudit(filePath) {
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    const prompt = `### INSTRUCTIONS: ${UX_INSTRUCTION_SET} \n\n ### CODE: ${code}`;

    const result = await model.generateContent(prompt);
    console.log(`\n--- AUDIT: ${filePath} ---\n`);
    console.log(result.response.text());
  } catch (err) {
    console.error('Audit failed:', err);
  }
}

const targetFile = process.argv[2];
if (targetFile) runAudit(targetFile);
