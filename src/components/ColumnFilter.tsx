import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Filter, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColumnFilterProps {
  title: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onFilterChange: (values: string[]) => void;
}

export function ColumnFilter({ title, options, selectedValues, onFilterChange }: ColumnFilterProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      onFilterChange([]);
    } else {
      onFilterChange(options.map(o => o.value));
    }
  };

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onFilterChange(selectedValues.filter(v => v !== value));
    } else {
      onFilterChange([...selectedValues, value]);
    }
  };

  const handleClear = () => {
    onFilterChange([]);
    setSearchQuery('');
  };

  const isFiltered = selectedValues.length > 0 && selectedValues.length < options.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 gap-1 -ml-3 font-medium",
            isFiltered && "text-primary"
          )}
        >
          {title}
          <Filter className={cn("h-3 w-3", isFiltered && "fill-primary")} />
          {isFiltered && (
            <span className="ml-1 rounded-full bg-primary text-primary-foreground px-1.5 py-0.5 text-xs">
              {selectedValues.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8"
            />
          </div>
        </div>
        <div className="p-2 border-b flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            className="h-7 text-xs"
          >
            {selectedValues.length === options.length ? 'Tümünü Kaldır' : 'Tümünü Seç'}
          </Button>
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 text-xs text-destructive hover:text-destructive"
            >
              <X className="h-3 w-3 mr-1" />
              Temizle
            </Button>
          )}
        </div>
        <ScrollArea className="h-[200px]">
          <div className="p-2 space-y-1">
            {filteredOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Sonuç bulunamadı
              </p>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                  onClick={() => handleToggle(option.value)}
                >
                  <Checkbox
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={() => handleToggle(option.value)}
                  />
                  <span className="text-sm flex-1 truncate">{option.label}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
