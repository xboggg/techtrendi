import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  status?: 'completed' | 'current' | 'upcoming';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
  orientation?: 'vertical' | 'horizontal';
}

export function Timeline({ items, className, orientation = 'vertical' }: TimelineProps) {
  if (orientation === 'horizontal') {
    return (
      <div className={cn('w-full overflow-x-auto', className)}>
        <div className="flex items-start min-w-max py-4">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-start">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 z-10',
                    item.status === 'completed' && 'bg-primary border-primary text-primary-foreground',
                    item.status === 'current' && 'bg-background border-primary text-primary',
                    item.status === 'upcoming' && 'bg-muted border-border text-muted-foreground'
                  )}
                >
                  {item.icon || (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="mt-3 text-center max-w-[150px]">
                  <p className="text-xs text-muted-foreground mb-1">{item.date}</p>
                  <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                  )}
                </div>
              </div>
              {index < items.length - 1 && (
                <div
                  className={cn(
                    'w-20 h-0.5 mt-5 mx-2',
                    item.status === 'completed' ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-8">
        {items.map((item, index) => (
          <div key={item.id} className="relative flex gap-6">
            {/* Dot */}
            <div
              className={cn(
                'relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0',
                item.status === 'completed' && 'bg-primary border-primary text-primary-foreground',
                item.status === 'current' && 'bg-background border-primary text-primary ring-4 ring-primary/20',
                item.status === 'upcoming' && 'bg-muted border-border text-muted-foreground'
              )}
            >
              {item.icon || (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <p className="text-sm text-muted-foreground mb-1">{item.date}</p>
              <h4 className="text-lg font-semibold text-foreground">{item.title}</h4>
              {item.description && (
                <p className="text-muted-foreground mt-2">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Changelog Timeline variant
interface ChangelogItem {
  version: string;
  date: string;
  title: string;
  changes: {
    type: 'added' | 'changed' | 'fixed' | 'removed';
    description: string;
  }[];
}

interface ChangelogTimelineProps {
  items: ChangelogItem[];
  className?: string;
}

export function ChangelogTimeline({ items, className }: ChangelogTimelineProps) {
  const typeColors = {
    added: 'bg-green-500/10 text-green-600 dark:text-green-400',
    changed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    fixed: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    removed: 'bg-red-500/10 text-red-600 dark:text-red-400',
  };

  const typeLabels = {
    added: 'Added',
    changed: 'Changed',
    fixed: 'Fixed',
    removed: 'Removed',
  };

  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-10">
        {items.map((item) => (
          <div key={item.version} className="relative flex gap-6">
            <div className="relative z-10 w-10 h-10 rounded-full bg-primary border-2 border-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold">v{item.version.split('.')[0]}</span>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xl font-bold text-foreground">v{item.version}</h3>
                <span className="text-sm text-muted-foreground">{item.date}</span>
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-4">{item.title}</h4>

              <div className="space-y-2">
                {item.changes.map((change, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        typeColors[change.type]
                      )}
                    >
                      {typeLabels[change.type]}
                    </span>
                    <p className="text-muted-foreground">{change.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Timeline;
