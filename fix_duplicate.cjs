const fs = require('fs');
let code = fs.readFileSync('src/pages/ComplaintEntryPage.tsx', 'utf-8');

const dupRegex = /\{\/\* ── Duplicate Detection ───────────────────────────────────────────── \*\/\}([\s\S]*?)<\/AnimatePresence>/g;
code = code.replace(dupRegex, '');

fs.writeFileSync('src/pages/ComplaintEntryPage.tsx', code);
