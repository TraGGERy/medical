'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/Progress';
import { 
  Heart, 
  Thermometer, 
  Activity, 
  Droplets, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Wifi, 
  WifiOff,
  Bell,
  BellOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HealthData {
  id: string;
  dataType: string;
  value: number;
  unit: string;
  timestamp: string;
  source: string;
}

interface HealthAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  dataType?: string;
  triggerValue?: number;
}

interface RealtimeDashboardProps {
  userId: string;
  className?: string;
}

const HEALTH_METRICS = {
  heart_rate: { icon: Heart, label: 'Heart Rate', color: 'text-red-500', normalRange: [60, 100] },
  temperature: { icon: Thermometer, label: 'Temperature', color: 'text-orange-500', normalRange: [36.1, 37.2] },
  oxygen_saturation: { icon: Activity, label: 'Oxygen Saturation', color: 'text-blue-500', normalRange: [95, 100] },
  blood_pressure: { icon: Droplets, label: 'Blood Pressure', color: 'text-purple-500', normalRange: [90, 140] },
};

const SEVERITY_COLORS = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

export default function RealtimeDashboard({ userId, className }: RealtimeDashboardProps) {
  const [healthData, setHealthData] = useState<HealthData[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Fetch initial data
  const fetchHealthData = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/realtime/health-data?includeAlerts=true&limit=50', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setHealthData(result.data || []);
          setAlerts(result.alerts || []);
          setLastUpdate(new Date());
        } else {
          console.warn('API returned unsuccessful response:', result);
        }
      } else {
        console.warn('API request failed with status:', response.status);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Health data fetch timed out');
      } else {
        console.warn('Failed to fetch health data:', error instanceof Error ? error.message : String(error));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup real-time connection (fallback to polling if WebSocket fails)
  useEffect(() => {
    let ws: WebSocket | null = null;
    const reconnectTimeout: { current: NodeJS.Timeout | null } = { current: null };
    let pollingInterval: NodeJS.Timeout | null = null;
    let usePolling = false;

    const startPolling = () => {
       console.log('Starting polling fallback for real-time updates');
       usePolling = true;
       setIsConnected(true); // Consider polling as "connected"
       
       let consecutiveErrors = 0;
       const maxErrors = 3;
       
       pollingInterval = setInterval(async () => {
         try {
           await fetchHealthData();
           consecutiveErrors = 0; // Reset error count on success
         } catch (error: unknown) {
           consecutiveErrors++;
           console.warn(`Polling failed (${consecutiveErrors}/${maxErrors}):`, error);
           
           // Stop polling after too many consecutive errors
           if (consecutiveErrors >= maxErrors) {
             console.warn('Too many polling errors, stopping real-time updates');
             setIsConnected(false);
             if (pollingInterval) {
               clearInterval(pollingInterval);
             }
           }
         }
       }, 5000); // Poll every 5 seconds
     };

    const connectWebSocket = () => {
      if (usePolling) return; // Don't try WebSocket if already using polling
      
      try {
        // Try WebSocket connection
        const wsUrl = `ws://localhost:3001/api/realtime/websocket`;
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
        };
        
        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
              case 'health_data_update':
                setHealthData(prev => {
                  const updated = [...prev];
                  const existingIndex = updated.findIndex(d => d.id === message.data.id);
                  if (existingIndex >= 0) {
                    updated[existingIndex] = message.data;
                  } else {
                    updated.unshift(message.data);
                  }
                  return updated.slice(0, 50); // Keep only latest 50 records
                });
                setLastUpdate(new Date());
                break;
                
              case 'health_alert':
                setAlerts(prev => [message.alert, ...prev]);
                if (notificationsEnabled && 'Notification' in window) {
                  new Notification(`Health Alert: ${message.alert.title}`, {
                    body: message.alert.message,
                    icon: '/favicon.ico',
                  });
                }
                break;
                
              case 'alert_resolved':
                setAlerts(prev => prev.filter(alert => alert.id !== message.alertId));
                break;
            }
          } catch (error: unknown) {
            console.warn('Failed to parse WebSocket message:', error);
          }
        };
        
        ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          setIsConnected(false);
          // Fall back to polling if WebSocket fails
          if (!usePolling && event.code !== 1000) {
            startPolling();
          }
        };
        
        ws.onerror = (error) => {
          console.warn('WebSocket connection failed, falling back to polling');
          setIsConnected(false);
          // Fall back to polling immediately
          if (!usePolling) {
            startPolling();
          }
        };
      } catch (error) {
        console.warn('Failed to initialize WebSocket, using polling fallback');
        setIsConnected(false);
        if (!usePolling) {
          startPolling();
        }
      }
    };

    // Initial data fetch
    fetchHealthData();
    
    // Try WebSocket first, fall back to polling if it fails
    connectWebSocket();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (ws) {
        ws.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [fetchHealthData, notificationsEnabled]);

  // Get latest value for each metric type
  const getLatestMetric = (dataType: string) => {
    if (!Array.isArray(healthData)) {
      return undefined;
    }
    return healthData
      .filter(d => d.dataType === dataType)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  // Check if value is in normal range
  const isInNormalRange = (dataType: string, value: number) => {
    const metric = HEALTH_METRICS[dataType as keyof typeof HEALTH_METRICS];
    if (!metric?.normalRange) return true;
    const [min, max] = metric.normalRange;
    return value >= min && value <= max;
  };

  // Mark alert as read
  const markAlertAsRead = async (alertId: string) => {
    try {
      const response = await fetch('/api/realtime/alerts?action=mark_read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      });
      
      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, isRead: true } : alert
        ));
      }
    } catch (error: unknown) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Connection Status & Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={cn(
                'w-3 h-3 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )}></div>
              <CardTitle className="text-lg">
                Real-time Health Monitoring
              </CardTitle>
              {isConnected ? <Wifi className="w-4 h-4 text-green-500" /> : <WifiOff className="w-4 h-4 text-red-500" />}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              >
                {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchHealthData}>
                Refresh
              </Button>
            </div>
          </div>
          <CardDescription>
            {lastUpdate ? `Last updated: ${lastUpdate.toLocaleTimeString()}` : 'No data available'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>Active Health Alerts ({alerts.filter(a => !a.isRead).length} unread)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <Alert key={alert.id} className={cn('cursor-pointer', SEVERITY_COLORS[alert.severity])} onClick={() => markAlertAsRead(alert.id)}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex items-center justify-between">
                  <span>{alert.title}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={SEVERITY_COLORS[alert.severity]}>
                      {alert.severity}
                    </Badge>
                    {!alert.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                  </div>
                </AlertTitle>
                <AlertDescription>
                  {alert.message}
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Health Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(HEALTH_METRICS).map(([dataType, config]) => {
          const latestData = getLatestMetric(dataType);
          const Icon = config.icon;
          const isNormal = latestData ? isInNormalRange(dataType, latestData.value) : true;
          
          return (
            <Card key={dataType} className={cn(
              'transition-all duration-200',
              !isNormal && 'border-orange-200 bg-orange-50'
            )}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className={cn('w-5 h-5', config.color)} />
                  {isNormal ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                  )}
                </div>
                <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {latestData ? (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {latestData.value} {latestData.unit}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(latestData.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Source: {latestData.source}
                    </div>
                    {config.normalRange && (
                      <div className="text-xs text-gray-500">
                        Normal: {config.normalRange[0]}-{config.normalRange[1]} {latestData.unit}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">No data available</div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Data Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Health Data</CardTitle>
          <CardDescription>
            Latest {healthData.length} health measurements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {healthData.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {healthData.slice(0, 10).map((data) => {
                const metric = HEALTH_METRICS[data.dataType as keyof typeof HEALTH_METRICS];
                const Icon = metric?.icon || Activity;
                const isNormal = isInNormalRange(data.dataType, data.value);
                
                return (
                  <div key={data.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <Icon className={cn('w-4 h-4', metric?.color || 'text-gray-500')} />
                      <div>
                        <div className="font-medium text-sm">
                          {metric?.label || data.dataType}: {data.value} {data.unit}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(data.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {data.source}
                      </Badge>
                      {isNormal ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No health data available. Connect a device or manually input data to start monitoring.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}