import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <PanelErrorSummary
          title={this.props.title ?? "Section Error"}
          error={this.state.error?.message}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

export function PanelErrorSummary({
  title,
  error,
  onRetry,
}: {
  title: string;
  error?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-card border border-destructive/30 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-destructive" />
        <h3 className="text-sm font-semibold text-destructive">{title}</h3>
      </div>
      <div className="p-5 text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Something went wrong rendering this section.
        </p>
        {error && (
          <p className="text-xs text-muted-foreground/70 font-mono">{error}</p>
        )}
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-1.5 mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </Button>
        )}
      </div>
    </div>
  );
}
