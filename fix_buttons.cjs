const fs = require('fs');
let code = fs.readFileSync('src/pages/DraftPacketAnalysisPage.tsx', 'utf-8');

code = code.replace(
  /<button onClick=\{\(\) => setViewState\("review"\)\} className="px-4 py-2 border rounded">Back to Review<\/button>/,
  '<Button variant="outline" onClick={() => setViewState("review")}>Back to Review</Button>'
);

code = code.replace(
  /\} className="px-4 py-2 bg-primary text-white rounded">Download New Packet<\/button>/,
  '} className="gap-2"><Download className="w-4 h-4" /> Download New Packet</Button>'
);

code = code.replace(
  /<button onClick=\{/,
  '<Button onClick={'
);

// We need to make sure we imported Download and Button.
// Does it import Button? Yes, in ParallelReviewView probably? Wait, let's check imports in DraftPacketAnalysisPage.tsx
if (!code.includes('import { Button }')) {
  code = code.replace(/import { useState } from "react";/, 'import { useState } from "react";\nimport { Button } from "@/components/ui/button";\nimport { Download } from "lucide-react";');
} else if (!code.includes('import { Download }')) {
  code = code.replace(/import { Button } from "@\/components\/ui\/button";/, 'import { Button } from "@/components/ui/button";\nimport { Download } from "lucide-react";');
}

fs.writeFileSync('src/pages/DraftPacketAnalysisPage.tsx', code);
