import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Search } from 'lucide-react';
import { VIOLATION_TYPES, VIOLATION_CATEGORIES } from '../violationTypes';

interface Props {
  value: string;
  onChange: (key: string) => void;
  readOnly?: boolean;
}

export default function ViolationTypeSelector({ value, onChange, readOnly }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = VIOLATION_TYPES.find(v => `${v.category}||${v.label}` === value);

  const filtered = VIOLATION_TYPES.filter(v =>
    !search.trim() ||
    v.label.toLowerCase().includes(search.toLowerCase()) ||
    v.category.split(' (')[0].toLowerCase().includes(search.toLowerCase())
  );
  const grouped = VIOLATION_CATEGORIES
    .map(cat => ({ cat, items: filtered.filter(v => v.category === cat) }))
    .filter(g => g.items.length > 0);

  return (
    <Popover open={open} onOpenChange={o => {
      setOpen(o);
      if (o) setTimeout(() => inputRef.current?.focus(), 50);
      else setSearch('');
    }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={readOnly}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all text-left ${
            open ? 'border-primary ring-2 ring-primary/20 bg-card' : 'border-border hover:border-primary/40 bg-card'
          } ${readOnly ? 'opacity-70 cursor-default' : 'cursor-pointer'}`}
        >
          <span className={selected ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
            {selected?.label ?? 'Select violation type…'}
          </span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0 shadow-xl" align="start">
        <div className="p-2 border-b border-border bg-card">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search violations…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm border-0 bg-muted/50 focus-visible:ring-0"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {grouped.length === 0
            ? <p className="text-xs text-muted-foreground text-center py-6">No match for "{search}"</p>
            : grouped.map(({ cat, items }) => (
              <div key={cat}>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-1.5 bg-muted/40 sticky top-0">
                  {cat.split(' (')[0]}
                </p>
                {items.map(v => {
                  const key = `${v.category}||${v.label}`;
                  const isSel = value === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { onChange(key); setOpen(false); setSearch(''); }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between gap-3 text-sm transition-colors ${
                        isSel ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-muted/60 text-foreground'
                      }`}
                    >
                      <span className="flex-1">{v.label}</span>
                      <span className={`text-xs font-mono shrink-0 ${isSel ? 'text-primary/70' : 'text-muted-foreground'}`}>
                        {v.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          }
        </div>
      </PopoverContent>
    </Popover>
  );
}
