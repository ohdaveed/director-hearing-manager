import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle2, MapPin, FileText, User, Plus } from 'lucide-react';

interface Props {
  summary: { address: string; complaintId: string; assignedTo: string };
  onReset: () => void;
}

export default function SuccessScreen({ summary, onReset }: Props) {
  return (
    <div className="container mx-auto px-6 py-16 max-w-xl text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="bg-card border border-border rounded-2xl p-10 shadow-sm"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 350, damping: 18, delay: 0.15 }}
          className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5"
        >
          <CheckCircle2 className="w-9 h-9 text-primary" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <h2 className="text-2xl font-bold text-foreground mb-2">Complaint Created!</h2>
          <p className="text-muted-foreground mb-5">The complaint has been saved and is ready for inspection.</p>
          <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left space-y-2 border border-border">
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Address</p>
                <p className="text-sm font-semibold text-foreground">{summary.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Complaint ID</p>
                <p className="text-sm font-mono font-semibold text-primary">#{summary.complaintId}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Assigned Inspector</p>
                <p className="text-sm font-semibold text-foreground">{summary.assignedTo}</p>
              </div>
            </div>
          </div>
          <Button onClick={onReset} className="gap-2">
            <Plus className="w-4 h-4" /> Enter Another Complaint
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
