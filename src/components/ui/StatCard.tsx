'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Card } from './Card';
import { CircularProgress } from './Progress';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showProgress?: boolean;
  maxValue?: number;
  suffix?: string;
  prefix?: string;
  loading?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  previousValue,
  icon: Icon,
  variant = 'default',
  showProgress = false,
  maxValue = 100,
  suffix = '',
  prefix = '',
  loading = false,
  trend,
  trendValue,
  className,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setAnimatedValue(value);
    }, 200);

    return () => clearTimeout(timer);
  }, [value]);

  const variantStyles = {
    default: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      progressVariant: 'default' as const,
    },
    success: {
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      progressVariant: 'success' as const,
    },
    warning: {
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      progressVariant: 'warning' as const,
    },
    danger: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      progressVariant: 'danger' as const,
    },
  };

  const styles = variantStyles[variant];

  const getTrendIcon = () => {
    if (trend === 'up') return '↗️';
    if (trend === 'down') return '↘️';
    return '→';
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      <Card className="h-full">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center mb-4">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-sm',
                styles.iconBg
              )}>
                <Icon className={cn('w-6 h-6', styles.iconColor)} />
              </div>
              
              {showProgress && (
                <div className="ml-auto">
                  <CircularProgress
                    value={value}
                    max={maxValue}
                    size={60}
                    variant={styles.progressVariant}
                    showValue={false}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-12 h-6 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <motion.p 
                    className="text-3xl font-bold text-gray-900"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {prefix}
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1, delay: 0.5 }}
                    >
                      {Math.round(animatedValue)}
                    </motion.span>
                    {suffix}
                  </motion.p>
                )}
              </motion.div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">{title}</p>
                
                {trend && trendValue !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className={cn(
                      'flex items-center text-xs font-medium',
                      getTrendColor()
                    )}
                  >
                    <span className="mr-1">{getTrendIcon()}</span>
                    {Math.abs(trendValue)}%
                  </motion.div>
                )}
              </div>

              {previousValue !== undefined && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-xs text-gray-500"
                >
                  Previous: {prefix}{previousValue}{suffix}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default StatCard;