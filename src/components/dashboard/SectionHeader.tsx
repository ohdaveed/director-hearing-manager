type Props = {
  icon: React.ReactNode;
  title: string;
};

export default function SectionHeader({ icon, title }: Props) {
  return (
    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
      <span className="text-primary/60 flex-shrink-0">{icon}</span>
      <h2 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
        {title}
      </h2>
    </div>
  );
}
