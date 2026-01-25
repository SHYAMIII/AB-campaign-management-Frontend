import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatsCardProps) {
  const iconBgVariants = {
    default: 'bg-muted',
    primary: 'gradient-primary shadow-md',
    success: 'bg-success shadow-md',
    warning: 'bg-warning shadow-md',
    destructive: 'bg-destructive shadow-md',
  };

  const iconTextVariants = {
    default: 'text-foreground',
    primary: 'text-primary-foreground',
    success: 'text-success-foreground',
    warning: 'text-warning-foreground',
    destructive: 'text-destructive-foreground',
  };

  const glowVariants = {
    default: '',
    primary: 'group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.2)]',
    success: 'group-hover:shadow-[0_0_20px_hsl(var(--success)/0.2)]',
    warning: 'group-hover:shadow-[0_0_20px_hsl(var(--warning)/0.2)]',
    destructive: 'group-hover:shadow-[0_0_20px_hsl(var(--destructive)/0.2)]',
  };

  return (
    <Card className={cn(
      'group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
      glowVariants[variant],
      className
    )}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && (
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
            iconBgVariants[variant]
          )}>
            <Icon className={cn('h-5 w-5', iconTextVariants[variant])} />
          </div>
        )}
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          {trend && (
            <span
              className={cn(
                'flex items-center gap-0.5 text-sm font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              <span className={cn(
                'inline-block transition-transform',
                trend.isPositive ? 'rotate-0' : 'rotate-180'
              )}>
                ↑
              </span>
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {subtitle && (
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
