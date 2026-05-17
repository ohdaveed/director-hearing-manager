import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatePresence, motion } from 'framer-motion';
import { ALL_COMPLAINT_STATUSES } from '@/utils/complaintStatuses';

const CLOSED_STATUSES = ['Closed — Compliant', 'Closed — No Violation', 'Closed — Unfounded'];

interface Props {
  status: string; setStatus: (v: string) => void;
  dateClosed: string; setDateClosed: (v: string) => void;
}

export default function StatusSection({ status, setStatus, dateClosed, setDateClosed }: Props) {
  const isClosed = CLOSED_STATUSES.includes(status);
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
      <h2 className="font-semibold text-foreground text-base mb-4 uppercase tracking-wide text-xs text-muted-foreground">Complaint Status</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{ALL_COMPLAINT_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <AnimatePresence>
          {isClosed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="space-y-1"
            >
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date Closed</label>
              <Input type="date" value={dateClosed} onChange={e => setDateClosed(e.target.value)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
