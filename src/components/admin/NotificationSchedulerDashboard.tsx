'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Play, 
  Square, 
  RefreshCw, 
  Settings, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

interface SchedulerStatus {
  isRunning: boolean;
  activeTasks: string[];
  retryQueueSizes: Record<string, number>;
  config: {
    persistentHealthCheckInterval: number;
    medicationReminderInterval: number;
    streakMilestoneInterval: number;
    maxRetries: number;
    retryDelay: number;
  };
}

interface SchedulerConfig {
  persistentHealthCheckInterval?: number;
  medicationReminderInterval?: number;
  streakMilestoneInterval?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export default function NotificationSchedulerDashboard() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [configMode, setConfigMode] = useState(false);
  const [config, setConfig] = useState<SchedulerConfig>({});
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch scheduler status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/health-calendar/notifications/scheduler');
      if (!response.ok) throw new Error('Failed to fetch status');
      
      const data = await response.json();
      setStatus(data.status);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching scheduler status:', error);
      toast.error('Failed to fetch scheduler status');
    }
  };

  // Control scheduler
  const controlScheduler = async (action: string, triggerType?: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/health-calendar/notifications/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, triggerType })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to control scheduler');
      }
      
      const data = await response.json();
      setStatus(data.status);
      toast.success(data.message);
    } catch (error) {
      console.error('Error controlling scheduler:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to control scheduler');
    } finally {
      setLoading(false);
    }
  };

  // Update configuration
  const updateConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health-calendar/notifications/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'config', config })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update configuration');
      }
      
      const data = await response.json();
      setStatus(data.status);
      setConfigMode(false);
      setConfig({});
      toast.success('Configuration updated successfully');
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update configuration');
    } finally {
      setLoading(false);
    }
  };

  // Format interval for display
  const formatInterval = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  useEffect(() => {
    fetchStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading scheduler status...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notification Scheduler</h2>
          <p className="text-muted-foreground">
            Manage automated health notifications and email alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={status.isRunning ? 'default' : 'secondary'}>
            {status.isRunning ? (
              <><CheckCircle className="h-3 w-3 mr-1" /> Running</>
            ) : (
              <><XCircle className="h-3 w-3 mr-1" /> Stopped</>
            )}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </span>
        </div>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Control Panel
          </CardTitle>
          <CardDescription>
            Start, stop, or manually trigger notification checks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => controlScheduler(status.isRunning ? 'stop' : 'start')}
              disabled={loading}
              variant={status.isRunning ? 'destructive' : 'default'}
            >
              {status.isRunning ? (
                <><Square className="h-4 w-4 mr-2" /> Stop Scheduler</>
              ) : (
                <><Play className="h-4 w-4 mr-2" /> Start Scheduler</>
              )}
            </Button>
            
            <Button
              onClick={fetchStatus}
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            
            <Button
              onClick={() => setConfigMode(!configMode)}
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Manual Triggers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Manual Triggers
          </CardTitle>
          <CardDescription>
            Manually trigger specific notification checks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => controlScheduler('trigger', 'persistentHealth')}
              disabled={loading}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <div className="text-center">
                <div className="font-medium">Persistent Health</div>
                <div className="text-sm text-muted-foreground">Check for ongoing symptoms</div>
              </div>
            </Button>
            
            <Button
              onClick={() => controlScheduler('trigger', 'medicationReminders')}
              disabled={loading}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <Clock className="h-6 w-6 text-blue-500" />
              <div className="text-center">
                <div className="font-medium">Medication Reminders</div>
                <div className="text-sm text-muted-foreground">Send medication alerts</div>
              </div>
            </Button>
            
            <Button
              onClick={() => controlScheduler('trigger', 'streakMilestones')}
              disabled={loading}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
            >
              <TrendingUp className="h-6 w-6 text-green-500" />
              <div className="text-center">
                <div className="font-medium">Streak Milestones</div>
                <div className="text-sm text-muted-foreground">Celebrate achievements</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {status.activeTasks.length > 0 ? (
                status.activeTasks.map((task) => (
                  <div key={task} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="font-medium">{task}</span>
                    <Badge variant="outline">Active</Badge>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No active tasks</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Retry Queues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Retry Queues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(status.retryQueueSizes).map(([queue, size]) => (
                <div key={queue} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="font-medium">{queue}</span>
                  <Badge variant={size > 0 ? 'destructive' : 'secondary'}>
                    {size} items
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration */}
      {configMode && (
        <Card>
          <CardHeader>
            <CardTitle>Scheduler Configuration</CardTitle>
            <CardDescription>
              Adjust notification intervals and retry settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="persistentHealth">Persistent Health Check Interval (minutes)</Label>
                <Input
                  id="persistentHealth"
                  type="number"
                  placeholder={formatInterval(status.config.persistentHealthCheckInterval)}
                  value={config.persistentHealthCheckInterval ? config.persistentHealthCheckInterval / 60000 : ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    persistentHealthCheckInterval: parseInt(e.target.value) * 60000
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="medicationReminder">Medication Reminder Interval (minutes)</Label>
                <Input
                  id="medicationReminder"
                  type="number"
                  placeholder={formatInterval(status.config.medicationReminderInterval)}
                  value={config.medicationReminderInterval ? config.medicationReminderInterval / 60000 : ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    medicationReminderInterval: parseInt(e.target.value) * 60000
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="streakMilestone">Streak Milestone Interval (hours)</Label>
                <Input
                  id="streakMilestone"
                  type="number"
                  placeholder={formatInterval(status.config.streakMilestoneInterval)}
                  value={config.streakMilestoneInterval ? config.streakMilestoneInterval / 3600000 : ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    streakMilestoneInterval: parseInt(e.target.value) * 3600000
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxRetries">Max Retries</Label>
                <Input
                  id="maxRetries"
                  type="number"
                  placeholder={status.config.maxRetries.toString()}
                  value={config.maxRetries || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    maxRetries: parseInt(e.target.value)
                  }))}
                />
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex gap-3">
              <Button onClick={updateConfig} disabled={loading}>
                Update Configuration
              </Button>
              <Button 
                onClick={() => {
                  setConfigMode(false);
                  setConfig({});
                }} 
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Configuration Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-muted-foreground">Persistent Health</div>
              <div>{formatInterval(status.config.persistentHealthCheckInterval)}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Medication Reminders</div>
              <div>{formatInterval(status.config.medicationReminderInterval)}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Streak Milestones</div>
              <div>{formatInterval(status.config.streakMilestoneInterval)}</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Max Retries</div>
              <div>{status.config.maxRetries}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}