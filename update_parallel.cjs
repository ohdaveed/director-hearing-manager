const fs = require('fs');
let code = fs.readFileSync('src/components/packet/ParallelReviewView.tsx', 'utf-8');

code = code.replace(
  /onDownload\?: \(\) => void;/,
  'onDownload?: () => void;\n  onGenerateCorrected?: () => void;'
);

code = code.replace(
  /onDownload,/,
  'onDownload,\n  onGenerateCorrected,'
);

// We need to add the button in the right place. Where does ParallelReviewView render its action buttons?
// Actually, ParallelReviewView uses ComplianceReviewView on the right panel! 
// Let's pass it down to ComplianceReviewView as well.
code = code.replace(
  /<ComplianceReviewView\s+complianceResult=\{complianceResult\}\s+extractedText=\{extractedText\}\s+fileName=\{fileName\}\s+onApprove=\{onApprove\}\s+onEdit=\{onEdit\}\s+onBack=\{onBack\}\s+onDownload=\{onDownload\}\s*\/>/m,
  '<ComplianceReviewView\n            complianceResult={complianceResult}\n            extractedText={extractedText}\n            fileName={fileName}\n            onApprove={onApprove}\n            onEdit={onEdit}\n            onBack={onBack}\n            onDownload={onDownload}\n            onGenerateCorrected={onGenerateCorrected}\n          />'
);

fs.writeFileSync('src/components/packet/ParallelReviewView.tsx', code);
