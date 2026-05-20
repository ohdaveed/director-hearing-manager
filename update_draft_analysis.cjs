const fs = require("fs");
let code = fs.readFileSync("src/pages/DraftPacketAnalysisPage.tsx", "utf-8");

// Add state for corrected text
code = code.replace(
  /const \[result, setResult\] = useState<ComplianceResult \| undefined>\(\);/,
  'const [result, setResult] = useState<ComplianceResult | undefined>();\n  const [correctedText, setCorrectedText] = useState("");',
);

// We need an option to Generate Corrected Packet
const handleBackRegex = /  const handleBack = \(\) => \{/;
const generateHandler = `  const handleGenerateCorrected = async () => {
    if (!result) return;
    setViewState("generating");
    try {
      const newText = await aiService.generateCorrectedPacket(extractedText, result);
      setCorrectedText(newText);
      setViewState("corrected");
    } catch (err) {
      console.error(err);
      alert("Failed to generate corrected packet.");
      setViewState("review");
    }
  };

  const handleBack = () => {`;
code = code.replace(handleBackRegex, generateHandler);

// Add the view rendering for "generating" and "corrected" states
const renderEnd = `  return (
    <div className="max-w-2xl mx-auto p-6">`;

const renderStart = `  if (viewState === "generating") {
    return (
      <div className="max-w-2xl mx-auto p-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Generating Corrected Packet...</h2>
        <p className="text-muted-foreground">The AI is applying the recommended changes to your draft packet.</p>
        <div className="mt-8 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (viewState === "corrected") {
    return (
      <div className="max-w-4xl mx-auto p-6 flex flex-col h-screen">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Suggested Packet Corrected by AI</h2>
          <div className="flex gap-4">
            <button onClick={() => setViewState("review")} className="px-4 py-2 border rounded">Back to Review</button>
            <button onClick={() => {
              const blob = new Blob([correctedText], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = \`corrected-\${fileName.replace(/\\.[^/.]+$/, "")}.txt\`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }} className="px-4 py-2 bg-primary text-white rounded">Download New Packet</button>
          </div>
        </div>
        <div className="flex-1 bg-white border rounded p-6 overflow-auto">
          <pre className="whitespace-pre-wrap font-sans">{correctedText}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">`;

code = code.replace(renderEnd, renderStart);

// Let's also add the "Generate Corrected Packet" button to ParallelReviewView or DraftPacketAnalysisPage...
// In DraftPacketAnalysisPage, the ParallelReviewView is rendered. We can pass a new prop `onGenerateCorrected` to it.
code = code.replace(
  /onDownload=\{handleDownload\}/,
  "onDownload={handleDownload}\n        onGenerateCorrected={handleGenerateCorrected}",
);

fs.writeFileSync("src/pages/DraftPacketAnalysisPage.tsx", code);
