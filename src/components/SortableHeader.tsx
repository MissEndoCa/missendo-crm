import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

interface SortableHeaderProps {
  title: string;
  sortKey: string;
  currentSortKey: string | null;
  currentDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableHeader({
  title,
  sortKey,
  currentSortKey,
  currentDirection,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSortKey === sortKey && currentDirection !== null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(sortKey)}
      className={cn('h-8 gap-1 -ml-3 font-medium', isActive && 'text-primary', className)}
    >
      {title}
      {!isActive && <ArrowUpDown className="h-3 w-3 opacity-50" />}
      {isActive && currentDirection === 'asc' && <ArrowUp className="h-3 w-3" />}
      {isActive && currentDirection === 'desc' && <ArrowDown className="h-3 w-3" />}
    </Button>
  );
}
