'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Watch,
  Heart,
  Activity,
  Wifi,
  WifiOff,
  Plus,
  Settings,
  RefreshCw,
  Battery,
  Bluetooth,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Device {
  id: string;
  name: string;
  type: 'apple_health' | 'fitbit' | 'garmin' | 'samsung_health';
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync: string;
  batteryLevel?: number;
  dataTypes: string[];
}

interface BiometricData {
  id: string;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  deviceId: string;
}

const mockDevices: Device[] = [
  {
    id: '1',
    name: 'iPhone Health',
    type: 'apple_health',
    status: 'connected',
    lastSync: '2024-01-15T10:30:00Z',
    dataTypes: ['steps', 'heart_rate', 'sleep']
  },
  {
    id: '2',
    name: 'Fitbit Charge 5',
    type: 'fitbit',
    status: 'syncing',
    lastSync: '2024-01-15T09:45:00Z',
    batteryLevel: 75,
    dataTypes: ['steps', 'heart_rate', 'calories', 'sleep']
  }
];

const mockBiometricData: BiometricData[] = [
  { id: '1', type: 'heart_rate', value: 72, unit: 'bpm', timestamp: '2024-01-15T10:30:00Z', deviceId: '1' },
  { id: '2', type: 'steps', value: 8543, unit: 'steps', timestamp: '2024-01-15T10:30:00Z', deviceId: '2' },
  { id: '3', type: 'calories', value: 2150, unit: 'cal', timestamp: '2024-01-15T10:30:00Z', deviceId: '2' }
];

const deviceIcons = {
  apple_health: Smartphone,
  fitbit: Watch,
  garmin: Watch,
  samsung_health: Smartphone
};

const deviceColors = {
  apple_health: 'from-gray-600 to-gray-800',
  fitbit: 'from-green-500 to-green-700',
  garmin: 'from-blue-500 to-blue-700',
  samsung_health: 'from-purple-500 to-purple-700'
};

const statusColors = {
  connected: 'bg-green-100 text-green-800',
  disconnected: 'bg-red-100 text-red-800',
  syncing: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800'
};

const statusIcons = {
  connected: CheckCircle,
  disconnected: WifiOff,
  syncing: RefreshCw,
  error: AlertCircle
};

export default function DeviceManagement() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [biometricData, setBiometricData] = useState<BiometricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showConnectionWizard, setShowConnectionWizard] = useState(false);

  // Fetch devices and biometric data on component mount
  useEffect(() => {
    fetchDevices();
    fetchBiometricData();
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch('/api/devices/list');
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
      // Fallback to mock data
      setDevices(mockDevices);
    } finally {
      setLoading(false);
    }
  };

  const fetchBiometricData = async () => {
    try {
      const response = await fetch('/api/biometrics/sample_user');
      if (response.ok) {
        const data = await response.json();
        setBiometricData(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching biometric data:', error);
      // Fallback to mock data
      setBiometricData(mockBiometricData);
    }
  };

  const handleSyncDevice = async (deviceId: string) => {
    setSyncing(deviceId);
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, status: 'syncing' }
        : device
    ));

    try {
      const response = await fetch('/api/devices/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceId, forceSync: true })
      });

      const result = await response.json();
      
      if (result.success) {
        setDevices(prev => prev.map(device => 
          device.id === deviceId 
            ? { ...device, status: 'connected', lastSync: new Date().toISOString() }
            : device
        ));
        // Refresh biometric data after successful sync
        fetchBiometricData();
      } else {
        setDevices(prev => prev.map(device => 
          device.id === deviceId 
            ? { ...device, status: 'error' }
            : device
        ));
      }
    } catch (error) {
      console.error('Error syncing device:', error);
      setDevices(prev => prev.map(device => 
        device.id === deviceId 
          ? { ...device, status: 'error' }
          : device
      ));
    } finally {
      setSyncing(null);
    }
  };

  const handleDisconnectDevice = (deviceId: string) => {
    setDevices(prev => prev.map(device => 
      device.id === deviceId 
        ? { ...device, status: 'disconnected' }
        : device
    ));
  };

  const handleConnectDevice = async (deviceType: string, deviceName: string) => {
    try {
      const response = await fetch('/api/devices/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceType,
          deviceName
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // If there's an auth URL, open it for OAuth flow
        if (result.authUrl) {
          window.open(result.authUrl, '_blank', 'width=600,height=700');
        }
        
        // Refresh devices list
        fetchDevices();
        setShowConnectionWizard(false);
      } else {
        console.error('Failed to connect device:', result.error);
      }
    } catch (error) {
      console.error('Error connecting device:', error);
    }
  };

  const formatLastSync = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const getLatestMetric = (type: string) => {
    return biometricData
      .filter(data => data.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Device Management</h1>
            <p className="text-gray-600 mt-1">Connect and manage your health devices</p>
          </div>
          <Button disabled className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Plus className="w-4 h-4 mr-2" />
            Connect Device
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Device Management</h1>
          <p className="text-gray-600 mt-1">Connect and manage your health devices</p>
        </div>
        <Button 
          onClick={() => setShowConnectionWizard(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Connect Device
        </Button>
      </div>

      {/* Connected Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {devices.map((device, index) => {
          const DeviceIcon = deviceIcons[device.type];
          const StatusIcon = statusIcons[device.status];
          
          return (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r',
                        deviceColors[device.type]
                      )}>
                        <DeviceIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{device.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={statusColors[device.status]}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {device.status}
                          </Badge>
                          {device.batteryLevel && (
                            <Badge variant="outline" className="text-xs">
                              <Battery className="w-3 h-3 mr-1" />
                              {device.batteryLevel}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncDevice(device.id)}
                        disabled={device.status === 'syncing' || syncing === device.id}
                      >
                        <RefreshCw className={cn(
                          'w-4 h-4',
                          (device.status === 'syncing' || syncing === device.id) && 'animate-spin'
                        )} />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Last sync:</span>
                      <span className="font-medium">{formatLastSync(device.lastSync)}</span>
                    </div>
                    
                    <div>
                      <span className="text-sm text-gray-600 mb-2 block">Data types:</span>
                      <div className="flex flex-wrap gap-1">
                        {device.dataTypes.map((type) => (
                          <Badge key={type} variant="secondary" className="text-xs">
                            {type.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {device.status === 'connected' && (
                      <div className="pt-2 border-t">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDisconnectDevice(device.id)}
                          className="w-full"
                        >
                          Disconnect
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Real-time Data Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Latest Health Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['heart_rate', 'steps', 'calories'].map((type) => {
              const metric = getLatestMetric(type);
              if (!metric) return null;
              
              return (
                <div key={type} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 capitalize">
                      {type.replace('_', ' ')}
                    </span>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {metric.value.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-600">{metric.unit}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatLastSync(metric.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Connection Wizard Modal */}
      {showConnectionWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold mb-4">Connect New Device</h3>
            <div className="space-y-3">
              {[
                { type: 'apple_health', name: 'Apple Health', icon: Smartphone },
                { type: 'fitbit', name: 'Fitbit', icon: Watch },
                { type: 'garmin', name: 'Garmin', icon: Watch },
                { type: 'samsung_health', name: 'Samsung Health', icon: Smartphone }
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.type}
                    className="w-full flex items-center p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    onClick={() => handleConnectDevice(option.type, option.name)}
                  >
                    <Icon className="w-5 h-5 mr-3 text-gray-600" />
                    <span className="font-medium">{option.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowConnectionWizard(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}