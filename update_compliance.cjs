const fs = require("fs");
let code = fs.readFileSync("src/components/packet/ComplianceReviewView.tsx", "utf-8");

code = code.replace(
  /onDownload\?: \(\) => void;/,
  "onDownload?: () => void;\n  onGenerateCorrected?: () => void;",
);

code = code.replace(
  /onDownload,\s*isLoading = false/,
  "onDownload,\n  onGenerateCorrected,\n  isLoading = false",
);

code = code.replace(
  /<Button variant="outline" onClick=\{onDownload\}>/,
  '{onGenerateCorrected && (<Button variant="default" onClick={onGenerateCorrected} className="mr-2">\n              Generate Corrected Packet\n            </Button>)}\n            <Button variant="outline" onClick={onDownload}>',
);

fs.writeFileSync("src/components/packet/ComplianceReviewView.tsx", code);
