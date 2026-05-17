/**
 * EnforcementPage.tsx
 *
 * 5th-pillar nav destination (PM + Super Admin only).
 * Houses Escalation Queue and Hearing Packets as sub-tabs — both existing
 * pages are embedded as-is; no data or logic changes.
 *
 * Routes:
 *   /enforcement             → Escalation Queue
 *   /enforcement/hearings    → Hearing Packets list
 *   /enforcement/hearings/:id → Hearing Packets (auto-selects packet by ID)
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Package } from 'lucide-react';
import EscalationQueuePage from '@/pages/EscalationQueuePage';
import HearingPacketsPage from '@/pages/HearingPacketsPage';

export default function EnforcementPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHearings = location.pathname.startsWith('/enforcement/hearings');

  return (
    <div className="min-h-screen bg-background">
      {/* Sub-tab bar */}
      <div className="border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 max-w-[1300px]">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => navigate('/enforcement')}
              className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${
                !isHearings
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Escalation Queue
            </button>
            <button
              type="button"
              onClick={() => navigate('/enforcement/hearings')}
              className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${
                isHearings
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Hearing Packets
            </button>
          </div>
        </div>
      </div>

      {/* Page content */}
      {isHearings ? <HearingPacketsPage /> : <EscalationQueuePage />}
    </div>
  );
}
