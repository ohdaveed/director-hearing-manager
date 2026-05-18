import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { documentService, DocumentCategory } from "@/services/documentService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleTable } from "@/components/ui/SimpleTable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Upload,
  Search,
  Download,
  Loader2,
  Trash2,
  Tag,
  BookOpen,
  Image as ImageIcon,
  CheckCircle2,
  Scale,
  ShieldCheck,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const CATEGORIES: DocumentCategory[] = [
  "Regulatory SOP",
  "Legal Logic & Citations",
  "Article 11 Health Code",
  "Draft Hearing Packet",
  "Official Hearing Record",
  "Evidence: Inspection Report",
  "Evidence: Photographic",
  "Service & Notice Proof",
  "General Reference",
];

const CATEGORY_ICONS: Record<string, any> = {
  "Regulatory SOP": BookOpen,
  "Legal Logic & Citations": Scale,
  "Article 11 Health Code": ShieldCheck,
  "Draft Hearing Packet": FileText,
  "Official Hearing Record": CheckCircle2,
  "Evidence: Inspection Report": FileText,
  "Evidence: Photographic": ImageIcon,
  "Service & Notice Proof": Tag,
  "General Reference": FileText,
};

export default function DocumentLibraryPage() {
  const [view, setView] = useState<"documents" | "regulatory">("documents");
  const [activeCategory, setActiveCategory] = useState<
    DocumentCategory | "All"
  >("Regulatory SOP");
  const [searchQuery, setSearchQuery] = useState("");
  const [regSearchQuery, setRegSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", activeCategory],
    enabled: view === "documents",
    queryFn: async () => {
      if (activeCategory === "All") {
        const results = await Promise.all(
          CATEGORIES.map((cat) => documentService.getDocumentsByCategory(cat)),
        );
        return results.flat();
      }
      return documentService.getDocumentsByCategory(activeCategory);
    },
  });

  const { data: regulatoryRefs = [], isLoading: isLoadingReg } = useQuery({
    queryKey: ["regulatory-refs", regSearchQuery],
    enabled: view === "regulatory",
    queryFn: () =>
      regSearchQuery
        ? documentService.searchRegulatoryReferences(regSearchQuery)
        : documentService.getRegulatoryReferences(""),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      category,
    }: {
      file: File;
      category: DocumentCategory;
    }) => {
      return documentService.uploadDocument(file, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (activeCategory === "All") {
      toast.error(
        "Please select a specific category first to ensure correct labeling.",
      );
      return;
    }

    uploadMutation.mutate({
      file,
      category: activeCategory as DocumentCategory,
    });
    e.target.value = "";
  };

  const docColumns = [
    {
      key: "title" as const,
      header: "Document Title",
      render: (value: string, row: any) => {
        const Icon = CATEGORY_ICONS[row.category as string] || FileText;
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/5 rounded-lg text-primary">
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{value}</span>
              <span className="text-[10px] text-muted-foreground font-mono uppercase">
                {row.file_type?.split("/").pop() || "FILE"}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: "category" as const,
      header: "Category",
      render: (value: string) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border">
          {value}
        </span>
      ),
    },
    {
      key: "created_at" as const,
      header: "Uploaded",
      render: (value: string) => (
        <span className="text-muted-foreground">
          {format(new Date(value), "MMM d, yyyy")}
        </span>
      ),
    },
    {
      key: "version" as const,
      header: "Version",
      render: (value: string) => (
        <span className="text-sm font-mono text-muted-foreground">
          v{value || "1.0"}
        </span>
      ),
    },
    {
      key: "id" as const,
      header: "",
      render: (_: string, row: any) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            asChild
            title="Download"
            className="h-8 w-8"
          >
            <a
              href={documentService.getDocumentUrl(row.file_path)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Delete"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const regColumns = [
    {
      key: "violation_code" as const,
      header: "Health Code",
      render: (value: string) => (
        <span className="font-mono font-bold">{value}</span>
      ),
    },
    {
      key: "short_title" as const,
      header: "Rule Title",
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: "verbatim_text" as const,
      header: "Official Language",
      render: (value: string) => (
        <p className="text-xs text-muted-foreground line-clamp-2 max-w-md italic">
          "{value}"
        </p>
      ),
    },
    {
      key: "standard_corrective_action" as const,
      header: "Standard Corrective Action",
      render: (value: string) => (
        <p className="text-xs text-emerald-700 line-clamp-2 max-w-md font-medium">
          {value || "—"}
        </p>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Knowledge & Documents
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Central repository for regulatory logic, SOPs, and health codes.
          </p>
        </div>
        <div className="bg-muted/50 p-1 rounded-lg flex items-center gap-1">
          <Button
            variant={view === "documents" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("documents")}
            className="h-8"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            File Registry
          </Button>
          <Button
            variant={view === "regulatory" ? "default" : "ghost"}
            size="sm"
            onClick={() => setView("regulatory")}
            className="h-8"
          >
            <Scale className="h-3.5 w-3.5 mr-1.5" />
            Regulatory Brain
          </Button>
        </div>
      </div>

      {view === "documents" ? (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <Tabs
              value={activeCategory}
              onValueChange={(v) =>
                setActiveCategory(v as DocumentCategory | "All")
              }
              className="w-full lg:w-auto"
            >
              <TabsList className="bg-muted/50 p-1 h-auto flex flex-wrap justify-start gap-1">
                <TabsTrigger value="All" className="px-4 py-2">
                  All Documents
                </TabsTrigger>
                {CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat] || FileText;
                  return (
                    <TabsTrigger
                      key={cat}
                      value={cat}
                      className="px-4 py-2 gap-2"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="whitespace-nowrap">{cat}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  className="pl-9 w-full lg:w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                onClick={() =>
                  document.getElementById("library-upload")?.click()
                }
                disabled={uploadMutation.isPending || activeCategory === "All"}
                className="gap-2"
                size="sm"
              >
                {uploadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  Upload to{" "}
                  {activeCategory === "All" ? "Category" : activeCategory}
                </span>
                <span className="sm:hidden">Upload</span>
              </Button>
              <input
                id="library-upload"
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-sm">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Loading document library...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold">No documents found</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-1">
                  {searchQuery
                    ? `No results matching "${searchQuery}"`
                    : `There are no documents currently labeled as "${activeCategory}".`}
                </p>
              </div>
            ) : (
              <SimpleTable
                data={documents.filter((doc) =>
                  doc.title.toLowerCase().includes(searchQuery.toLowerCase()),
                )}
                columns={docColumns}
                searchable={false}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search health codes or rule text..."
                className="pl-9"
                value={regSearchQuery}
                onChange={(e) => setRegSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">
                {regulatoryRefs.length} Reference Rules Found
              </span>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                Add Rule
              </Button>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-4 shadow-sm">
            {isLoadingReg ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p>Retrieving regulatory logic...</p>
              </div>
            ) : regulatoryRefs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center px-4">
                <Scale className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold">No rules found</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mt-1">
                  The regulatory brain is empty or no rules match your search.
                </p>
              </div>
            ) : (
              <SimpleTable
                data={regulatoryRefs}
                columns={regColumns}
                searchable={false}
              />
            )}
          </div>
        </div>
      )}

      <div className="mt-8 p-6 bg-primary/5 rounded-2xl border border-primary/10 flex flex-col md:flex-row items-center gap-6">
        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="font-bold text-foreground text-lg">
            AI Verification Core
          </h4>
          <p className="text-muted-foreground text-sm">
            The "Regulatory Brain" stores the verbatim language the AI uses to
            verify hearing packets. Update these rules to change how the AI
            evaluates compliance and suggests corrective actions.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            className="border-primary/20 hover:bg-primary/10 text-primary"
          >
            Import Official PDF
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Sync Brain
          </Button>
        </div>
      </div>
    </div>
  );
}
