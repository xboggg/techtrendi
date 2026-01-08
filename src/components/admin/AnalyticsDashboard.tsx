import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Clock,
  FileText,
  MessageSquare,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatCard {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
}

interface ChartData {
  label: string;
  value: number;
}

interface TopContent {
  id: string;
  title: string;
  views: number;
  engagement: number;
  type: string;
}

// Sample data
const statsData: StatCard[] = [
  { label: 'Total Views', value: '124.5K', change: 12.5, trend: 'up', icon: Eye },
  { label: 'Unique Visitors', value: '45.2K', change: 8.3, trend: 'up', icon: Users },
  { label: 'Avg. Read Time', value: '4m 32s', change: -2.1, trend: 'down', icon: Clock },
  { label: 'Articles Published', value: 156, change: 15, trend: 'up', icon: FileText },
  { label: 'Comments', value: '2.3K', change: 22.4, trend: 'up', icon: MessageSquare },
  { label: 'Revenue', value: '$8,450', change: 18.7, trend: 'up', icon: DollarSign },
];

const viewsData: ChartData[] = [
  { label: 'Mon', value: 4200 },
  { label: 'Tue', value: 5100 },
  { label: 'Wed', value: 4800 },
  { label: 'Thu', value: 6200 },
  { label: 'Fri', value: 5800 },
  { label: 'Sat', value: 4100 },
  { label: 'Sun', value: 3800 },
];

const topContent: TopContent[] = [
  { id: '1', title: 'iPhone 15 Pro Max Review', views: 15420, engagement: 8.5, type: 'Review' },
  { id: '2', title: 'Best Password Managers 2024', views: 12350, engagement: 7.2, type: 'Guide' },
  { id: '3', title: 'Samsung S24 vs iPhone 15', views: 10890, engagement: 6.8, type: 'Comparison' },
  { id: '4', title: 'AI in Cybersecurity', views: 8920, engagement: 9.1, type: 'Blog' },
  { id: '5', title: 'MacBook Pro M3 Long-term', views: 7650, engagement: 7.5, type: 'Review' },
];

const trafficSources: { source: string; visitors: number; percentage: number }[] = [
  { source: 'Google Search', visitors: 18500, percentage: 41 },
  { source: 'Direct', visitors: 12300, percentage: 27 },
  { source: 'Social Media', visitors: 8100, percentage: 18 },
  { source: 'Referral', visitors: 4500, percentage: 10 },
  { source: 'Email', visitors: 1800, percentage: 4 },
];

// Stat Card Component
function StatCardComponent({ stat }: { stat: StatCard }) {
  const Icon = stat.icon;
  const isPositive = stat.trend === 'up';

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium',
          isPositive ? 'text-green-500' : 'text-red-500'
        )}>
          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(stat.change)}%
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
      <div className="text-sm text-muted-foreground">{stat.label}</div>
    </div>
  );
}

// Simple Bar Chart
function BarChart({ data, className }: { data: ChartData[]; className?: string }) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-end justify-between h-40 gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
              title={`${item.label}: ${item.value.toLocaleString()}`}
            />
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Traffic Sources Bar
function TrafficSourceBar({ data }: { data: typeof trafficSources }) {
  return (
    <div className="space-y-3">
      {data.map((source, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground">{source.source}</span>
            <span className="text-muted-foreground">{source.visitors.toLocaleString()} ({source.percentage}%)</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
              style={{ width: `${source.percentage}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Main Dashboard
export function AnalyticsDashboard({ className }: { className?: string }) {
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | '90d'>('7d');

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track your content performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            {(['today', '7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md transition-colors',
                  timeRange === range
                    ? 'bg-background shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {range === 'today' ? 'Today' : range}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsData.map((stat, index) => (
          <StatCardComponent key={index} stat={stat} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Views Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground">Page Views</h3>
            <Badge variant="secondary">Last 7 days</Badge>
          </div>
          <BarChart data={viewsData} />
        </div>

        {/* Traffic Sources */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Traffic Sources</h3>
          <TrafficSourceBar data={trafficSources} />
        </div>
      </div>

      {/* Top Content */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Top Performing Content</h3>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Views</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {topContent.map((content, index) => (
                <tr key={content.id} className="border-b border-border last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">{content.title}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="secondary">{content.type}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right text-sm text-foreground">
                    {content.views.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={cn(
                      'text-sm font-medium',
                      content.engagement >= 8 ? 'text-green-500' :
                      content.engagement >= 6 ? 'text-yellow-500' : 'text-red-500'
                    )}>
                      {content.engagement}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="font-semibold text-foreground">Real-time Visitors</h3>
          </div>
          <div className="text-4xl font-bold text-foreground mb-2">127</div>
          <p className="text-sm text-muted-foreground">Active users on site right now</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Device Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Mobile</span>
              <span className="text-sm text-muted-foreground">62%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '62%' }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Desktop</span>
              <span className="text-sm text-muted-foreground">31%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full" style={{ width: '31%' }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Tablet</span>
              <span className="text-sm text-muted-foreground">7%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: '7%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
