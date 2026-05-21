const fs = require('fs');
const crypto = require('crypto');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const getApiKey = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('Missing GEMINI_API_KEY. Run with `pass-cli run --env-file .env.pass.template -- node scripts/run-audit.js <file-path>` or generate .env with `npm run prepare-env`.');
        process.exit(1);
    }
    return apiKey;
};

// Initialize Gemini
const genAI = new GoogleGenerativeAI(getApiKey());
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const SYSTEM_INSTRUCTIONS = `
**Role:** You are an expert Enterprise UX Architect specialized in high-performance web applications. Your goal is to audit React/Tailwind component code for usability, accessibility, and cognitive efficiency.

**Evaluation Framework:**

1. **Hick's Law:** Minimize cognitive load. Identify dense lists, cluttered action areas, and lack of visual hierarchy.
2. **Fitts's Law:** Ensure target accessibility. Assess button hit areas, spacing, and interaction ergonomics.
3. **Jakob's Law:** Adhere to industry mental models. Validate status tokens, navigation patterns, and component naming against established enterprise design systems.
4. **Aesthetic-Usability Effect:** Maximize scannability. Review containerization, shadow elevation, alignment, and whitespace consistency.

**Output Requirements:**

* **Analysis:** Provide a bulleted list of UX violations based on the four principles above.
* **Remediation:** Provide tactical, code-level refactors using Tailwind CSS utility classes.
* **Format:** * Use a table for high-impact refactors (Issue | Tailwind Refactor).
* Maintain a concise, direct, and professional tone.
* **CRITICAL:** Remove all emojis.

**Constraints:**

* Always favor accessibility (WCAG compliant) and mobile-first responsive design.
* Do not provide general theory; provide actionable code changes.
* Ensure all refactors are backward-compatible with standard React component structures.
`;

const CACHE_FILE = '.audit_cache.json';
const cache = fs.existsSync(CACHE_FILE) ? JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) : {};

function getFileHash(content) {
  return crypto.createHash('md5').update(content).digest('hex');
}

async function auditFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Only audit components (JSX/Tailwind)
    if (!fileContent.includes('className=')) {
        console.log(`Skipping: ${filePath} (not a component)`);
        return;
    }

    const fileHash = getFileHash(fileContent);
    if (cache[filePath] === fileHash) {
        console.log(`Skipping: ${filePath} (already audited)`);
        return;
    }

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: `### SYSTEM INSTRUCTIONS: ${SYSTEM_INSTRUCTIONS} \n\n ### CODE TO AUDIT: \n ${fileContent}` }]
      }]
    });

    console.log(`--- AUDIT RESULTS: ${filePath} ---`);
    console.log(result.response.text());

    cache[filePath] = fileHash;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));

  } catch (error) {
    console.error('Audit failed:', error);
  }
}

const file = process.argv[2];
if (file) auditFile(file);
else console.log('Usage: node scripts/run-audit.js <file-path>');
