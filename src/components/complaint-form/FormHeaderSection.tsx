import { Input } from '@/components/ui/input';
import { FileText } from 'lucide-react';

interface Props {
  caseNumber311: string;
  setCaseNumber311: (v: string) => void;
  dateReceived: string;
  setDateReceived: (v: string) => void;
  hasDetails: boolean;
}

export default function FormHeaderSection({ caseNumber311, setCaseNumber311, dateReceived, setDateReceived, hasDetails }: Props) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${hasDetails ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
          <FileText className="w-4 h-4" />
        </div>
        <h2 className="font-semibold text-foreground text-lg">Complaint Information</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">311 Case Number</label>
          <Input
            placeholder="Optional"
            value={caseNumber311}
            onChange={e => setCaseNumber311(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date Received</label>
          <Input
            type="date"
            value={dateReceived}
            onChange={e => setDateReceived(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
