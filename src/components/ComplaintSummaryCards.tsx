/**
 * ComplaintSummaryCards.tsx
 *
 * Four summary metric cards shown at the top of AllComplaintsPage.
 * Displays counts for Active, Overdue, New This Month, and Hearing Ready complaints.
 */

import { GetAllComplaintsOutputType } from 'zite-endpoints-sdk';
import { AlertTriangle, Clock, FilePlus, Scale } from 'lucide-react';
import { ACTIVE_STATUSES, isOverdue } from '@/utils/complaintStatuses';

type Complaint = GetAllComplaintsOutputType['complaints'][0];

type Props = {
  complaints: Complaint[];
};

export default function ComplaintSummaryCards({ complaints }: Props) {
  const today = new Date();

  const active = complaints.filter(c => (ACTIVE_STATUSES as readonly string[]).includes(c.status ?? '')).length;
  const overdue = complaints.filter(isOverdue).length;
  const newThisMonth = complaints.filter(c => {
    if (!c.dateEntered) return false;
    const d = new Date(c.dateEntered + 'T00:00:00');
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length;
  const hearingReady = complaints.filter(
    c => c.hearingStatus === 'Referred' || c.hearingStatus === 'Hearing Scheduled'
  ).length;

  const cards = [
    {
      label: 'Active',
      value: active,
      icon: <Clock className="w-3.5 h-3.5" />,
      card: 'bg-primary/10 border-primary/30',
      bar: 'bg-primary',
      text: 'text-primary',
    },
    {
      label: 'Overdue',
      value: overdue,
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      card: overdue > 0 ? 'bg-destructive/10 border-destructive/30' : 'bg-card border-border',
      bar: overdue > 0 ? 'bg-destructive' : 'bg-muted-foreground',
      text: overdue > 0 ? 'text-destructive' : 'text-muted-foreground',
    },
    {
      label: 'New This Month',
      value: newThisMonth,
      icon: <FilePlus className="w-3.5 h-3.5" />,
      card: 'bg-card border-border',
      bar: 'bg-muted-foreground',
      text: 'text-foreground',
    },
    {
      label: 'Hearing Ready',
      value: hearingReady,
      icon: <Scale className="w-3.5 h-3.5" />,
      card: hearingReady > 0 ? 'bg-accent/50 border-accent/30' : 'bg-card border-border',
      bar: hearingReady > 0 ? 'bg-accent-foreground' : 'bg-muted-foreground',
      text: hearingReady > 0 ? 'text-accent-foreground' : 'text-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {cards.map(card => (
        <div key={card.label} className={`relative rounded-xl border overflow-hidden shadow-sm ${card.card}`}>
          <div className={`h-[3px] w-full ${card.bar} opacity-70`} />
          <div className="px-4 py-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`${card.text} opacity-60`}>{card.icon}</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
                {card.label}
              </p>
            </div>
            <p className={`text-2xl font-black tabular-nums leading-none ${card.text}`}>{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
