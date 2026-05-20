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
  /\{onDownload && \(/,
  '{onGenerateCorrected && (<Button variant="default" onClick={onGenerateCorrected} className="mr-2 border-primary bg-primary text-primary-foreground hover:bg-primary/90">✨ Generate Corrected Packet</Button>)}\n          {onDownload && (',
);

fs.writeFileSync("src/components/packet/ComplianceReviewView.tsx", code);
