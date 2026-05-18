import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  DatabaseZap,
  FileDown,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GeneratedPacketFile,
  PacketValidationResult,
} from "@/services/packetService";
import { VALIDATION_BADGE } from "@/constants/packet";
import { formatPacketDateTime } from "@/utils/packetFormat";

function validationSummary(results: PacketValidationResult[]) {
  return results.reduce(
    (acc, result) => {
      if (result.status === "pass") acc.pass += 1;
      else if (result.status === "warning") acc.warning += 1;
      else acc.fail += 1;
      return acc;
    },
    { pass: 0, warning: 0, fail: 0 },
  );
}

function ValidationResultsPanel({
  results,
  onRefresh,
  refreshing,
}: {
  results: PacketValidationResult[];
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const summary = validationSummary(results);
  const hasResults = results.length > 0;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <DatabaseZap className="w-4 h-4 text-primary" />
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Packet Readiness
            </h3>
            <p className="text-xs text-muted-foreground">
              Uses SOP validation results from the database.
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={refreshing}
          className="gap-1.5 h-8 text-xs"
        >
          {refreshing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Refresh Snapshot
        </Button>
      </div>

      {hasResults ? (
        <>
          <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-border bg-card">
            <div className="rounded-lg bg-success/10 px-3 py-2 text-center">
              <p className="text-sm font-bold text-success">{summary.pass}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Pass
              </p>
            </div>
            <div className="rounded-lg bg-warning/10 px-3 py-2 text-center">
              <p className="text-sm font-bold text-warning">
                {summary.warning}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Warnings
              </p>
            </div>
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-center">
              <p className="text-sm font-bold text-destructive">
                {summary.fail}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Fail
              </p>
            </div>
          </div>
          <div className="divide-y divide-border max-h-80 overflow-y-auto">
            {results.map((result) => {
              const badge =
                VALIDATION_BADGE[result.status] ?? VALIDATION_BADGE.warning;
              return (
                <div
                  key={result.rule_slug}
                  className="px-4 py-3 flex items-start gap-3"
                >
                  <div className="pt-0.5">
                    {result.status === "pass" ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : result.status === "fail" ? (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-semibold text-foreground">
                        {result.rule_slug.replaceAll("_", " ")}
                      </p>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${badge}`}
                      >
                        {result.status}
                      </span>
                      {result.severity && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {result.severity}
                        </span>
                      )}
                    </div>
                    {result.message && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {result.message}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
          No validation results yet. Refresh the packet snapshot to run readiness
          checks.
        </div>
      )}
    </div>
  );
}

function GeneratedFilesPanel({ files }: { files: GeneratedPacketFile[] }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
        <FileDown className="w-4 h-4 text-primary" />
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Generated Files
          </h3>
          <p className="text-xs text-muted-foreground">
            Drafts, final packets, JSON snapshots, and indexes.
          </p>
        </div>
      </div>
      {files.length === 0 ? (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
          No generated files have been registered for this packet.
        </div>
      ) : (
        <div className="divide-y divide-border">
          {files.map((file) => (
            <div
              key={file.id}
              className="px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {file.file_name || file.file_path}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {file.file_type} · v{file.version_number} ·{" "}
                  {formatPacketDateTime(file.generated_at)}
                  {file.is_final ? " · final" : ""}
                </p>
              </div>
              <a
                href={file.file_path}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline shrink-0"
              >
                Open
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PacketReadinessPanel({
  results,
  files,
  onRefresh,
  refreshing,
}: {
  results: PacketValidationResult[];
  files: GeneratedPacketFile[];
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="space-y-4">
      <ValidationResultsPanel
        results={results}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
      <GeneratedFilesPanel files={files} />
    </div>
  );
}
