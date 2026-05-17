import { useState } from "react";
import { format } from "date-fns";
import { DayPicker, DateRange } from "react-day-picker";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import "react-day-picker/dist/style.css";

interface DateRangePickerProps {
  onChange?: (range: DateRange | undefined) => void;
  className?: string;
}

export function DateRangePicker({ onChange, className }: DateRangePickerProps) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (selectedRange: DateRange | undefined) => {
    setRange(selectedRange);
    onChange?.(selectedRange);
  };

  const formatDateRange = () => {
    if (!range?.from) return "Select date range";
    if (!range?.to) return format(range.from, "MMM d, yyyy");
    return `${format(range.from, "MMM d, yyyy")} - ${format(range.to, "MMM d, yyyy")}`;
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start text-left font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {formatDateRange()}
      </Button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-1 p-4 bg-white border rounded-lg shadow-lg">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="p-3"
          />
          <div className="flex justify-end gap-2 mt-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRange(undefined);
                onChange?.(undefined);
              }}
            >
              Clear
            </Button>
            <Button size="sm" onClick={() => setIsOpen(false)}>
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("relative inline-block", className)}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start text-left font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {value ? format(value, "MMM d, yyyy") : placeholder || "Select date"}
      </Button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-1 p-4 bg-white border rounded-lg shadow-lg">
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange?.(date);
              setIsOpen(false);
            }}
            className="p-3"
          />
        </div>
      )}
    </div>
  );
}
