import { cn } from '@/lib/utils';

// Base Skeleton
interface SkeletonProps {
  className?: string;
  animate?: boolean;
}

export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-muted rounded',
        animate && 'animate-pulse',
        className
      )}
    />
  );
}

// Text Skeleton
export function TextSkeleton({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && 'w-4/5')}
        />
      ))}
    </div>
  );
}

// Avatar Skeleton
export function AvatarSkeleton({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return <Skeleton className={cn('rounded-full', sizes[size], className)} />;
}

// Button Skeleton
export function ButtonSkeleton({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
  };

  return <Skeleton className={cn('rounded-lg', sizes[size], className)} />;
}

// Image Skeleton
export function ImageSkeleton({
  aspectRatio = '16/9',
  className,
}: {
  aspectRatio?: string;
  className?: string;
}) {
  return (
    <Skeleton
      className={cn('w-full', className)}
      style={{ aspectRatio }}
    />
  );
}

// Card Skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card border border-border rounded-xl overflow-hidden', className)}>
      <Skeleton className="h-48 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex items-center gap-2 pt-2">
          <AvatarSkeleton size="sm" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

// Article Card Skeleton
export function ArticleCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-4', className)}>
      <Skeleton className="w-32 h-24 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

// Review Card Skeleton
export function ReviewCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card border border-border rounded-xl p-6', className)}>
      <div className="flex items-start gap-4">
        <AvatarSkeleton size="lg" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-24" />
          <TextSkeleton lines={3} />
          <div className="flex items-center gap-4 pt-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Card Skeleton
export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card border border-border rounded-xl overflow-hidden', className)}>
      <Skeleton className="h-56 rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-12 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-full" />
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-4 w-4 rounded-full" />
          ))}
          <Skeleton className="h-4 w-8 ml-2" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" />
          <ButtonSkeleton size="sm" />
        </div>
      </div>
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('border border-border rounded-lg overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-muted/50 p-4 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4 flex gap-4 border-t border-border">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// List Skeleton
export function ListSkeleton({
  items = 5,
  showAvatar = true,
  className,
}: {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {showAvatar && <AvatarSkeleton />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Sidebar Skeleton
export function SidebarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Widget 1 */}
      <div className="bg-card border border-border rounded-xl p-4">
        <Skeleton className="h-5 w-32 mb-4" />
        <ListSkeleton items={3} showAvatar={false} />
      </div>
      {/* Widget 2 */}
      <div className="bg-card border border-border rounded-xl p-4">
        <Skeleton className="h-5 w-24 mb-4" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-16 rounded-full" />
          ))}
        </div>
      </div>
      {/* Widget 3 */}
      <div className="bg-card border border-border rounded-xl p-4">
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

// Dashboard Skeleton
export function DashboardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-64" />
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-64" />
        </div>
      </div>
      {/* Table */}
      <TableSkeleton />
    </div>
  );
}

// Page Header Skeleton
export function PageHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-10 w-96" />
      <Skeleton className="h-5 w-2/3" />
    </div>
  );
}

// Form Skeleton
export function FormSkeleton({
  fields = 4,
  className,
}: {
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <ButtonSkeleton size="lg" className="w-full" />
    </div>
  );
}

// Comment Skeleton
export function CommentSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex gap-4', className)}>
      <AvatarSkeleton />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <TextSkeleton lines={2} />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

// Shimmer effect variant
export function ShimmerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden bg-muted rounded',
        className
      )}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

export default Skeleton;
