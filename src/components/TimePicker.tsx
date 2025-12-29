import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('09');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setSelectedHour(h || '09');
      setSelectedMinute(m || '00');
    }
  }, [value]);

  // Scroll to selected items when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const hourElement = hourRef.current?.querySelector(`[data-hour="${selectedHour}"]`);
        const minuteElement = minuteRef.current?.querySelector(`[data-minute="${selectedMinute}"]`);
        hourElement?.scrollIntoView({ block: 'center', behavior: 'auto' });
        minuteElement?.scrollIntoView({ block: 'center', behavior: 'auto' });
      }, 50);
    }
  }, [open, selectedHour, selectedMinute]);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = ['00', '15', '30', '45'];

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour);
    onChange(`${hour}:${selectedMinute}`);
  };

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute);
    onChange(`${selectedHour}:${minute}`);
    setOpen(false);
  };

  const displayValue = value || '09:00';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Hours */}
          <div className="border-r">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
              Hour
            </div>
            <ScrollArea className="h-[200px]" ref={hourRef}>
              <div className="p-1">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    data-hour={hour}
                    onClick={() => handleHourSelect(hour)}
                    className={cn(
                      "px-3 py-1.5 cursor-pointer rounded text-sm hover:bg-accent transition-colors",
                      selectedHour === hour && "bg-primary text-primary-foreground hover:bg-primary"
                    )}
                  >
                    {hour}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          {/* Minutes */}
          <div>
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b">
              Min
            </div>
            <ScrollArea className="h-[200px]" ref={minuteRef}>
              <div className="p-1">
                {minutes.map((minute) => (
                  <div
                    key={minute}
                    data-minute={minute}
                    onClick={() => handleMinuteSelect(minute)}
                    className={cn(
                      "px-3 py-1.5 cursor-pointer rounded text-sm hover:bg-accent transition-colors",
                      selectedMinute === minute && "bg-primary text-primary-foreground hover:bg-primary"
                    )}
                  >
                    {minute}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
