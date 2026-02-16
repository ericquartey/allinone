import React, { FC, useState, useEffect } from 'react';
import {
  Activity, Zap, Clock, TrendingUp, TrendingDown,
  AlertCircle, CheckCircle, RefreshCw, Database,
  Globe, Cpu, HardDrive, Network, Eye, Settings
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// Types
interface WebVital {
  name: string;
  label: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: { good: number; poor: number };
  unit: string;
  description: string;
}

interface APIMetric {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
}

interface BundleMetric {
  name: string;
  size: number;
  gzipSize: number;
  loadTime: number;
  cached: boolean;
}

interface PerformanceSnapshot {
  timestamp: Date;
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  memoryUsage: number;
  cpuUsage: number;
}

export const PerformanceMonitoringDashboard: FC = () => {
  // State
  const [webVitals, setWebVitals] = useState<WebVital[]>([]);
  const [apiMetrics, setApiMetrics] = useState<APIMetric[]>([]);
  const [bundleMetrics, setBundleMetrics] = useState<BundleMetric[]>([]);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceSnapshot[]>([]);
  const [activeTab, setActiveTab] = useState<'vitals' | 'api' | 'bundle' | 'history'>('vitals');
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Initialize Web Vitals
  useEffect(() => {
    const vitals: WebVital[] = [
      {
        name: 'FCP',
        label: 'First Contentful Paint',
        value: 1200,
        rating: 'good',
        threshold: { good: 1800, poor: 3000 },
        unit: 'ms',
        description: 'Tempo per il primo rendering di contenuto'
      },
      {
        name: 'LCP',
        label: 'Largest Contentful Paint',
        value: 1800,
        rating: 'good',
        threshold: { good: 2500, poor: 4000 },
        unit: 'ms',
        description: 'Tempo per il rendering dell\'elemento principale'
      },
      {
        name: 'FID',
        label: 'First Input Delay',
        value: 45,
        rating: 'good',
        threshold: { good: 100, poor: 300 },
        unit: 'ms',
        description: 'Tempo di risposta alla prima interazione utente'
      },
      {
        name: 'CLS',
        label: 'Cumulative Layout Shift',
        value: 0.05,
        rating: 'good',
        threshold: { good: 0.1, poor: 0.25 },
        unit: '',
        description: 'Stabilità visiva della pagina'
      },
      {
        name: 'TTFB',
        label: 'Time to First Byte',
        value: 320,
        rating: 'good',
        threshold: { good: 600, poor: 1500 },
        unit: 'ms',
        description: 'Tempo di risposta del server'
      },
      {
        name: 'TTI',
        label: 'Time to Interactive',
        value: 2400,
        rating: 'needs-improvement',
        threshold: { good: 3800, poor: 7300 },
        unit: 'ms',
        description: 'Tempo per l\'interattività completa'
      }
    ];

    setWebVitals(vitals);
  }, []);

  // Initialize API Metrics
  useEffect(() => {
    const apis: APIMetric[] = [
      {
        endpoint: '/api/lists',
        method: 'GET',
        avgResponseTime: 145,
        minResponseTime: 98,
        maxResponseTime: 320,
        requestCount: 1247,
        errorCount: 3,
        errorRate: 0.24
      },
      {
        endpoint: '/api/operations',
        method: 'POST',
        avgResponseTime: 234,
        minResponseTime: 156,
        maxResponseTime: 890,
        requestCount: 892,
        errorCount: 12,
        errorRate: 1.35
      },
      {
        endpoint: '/api/stock',
        method: 'GET',
        avgResponseTime: 178,
        minResponseTime: 112,
        maxResponseTime: 456,
        requestCount: 2134,
        errorCount: 8,
        errorRate: 0.37
      },
      {
        endpoint: '/api/machines/status',
        method: 'GET',
        avgResponseTime: 89,
        minResponseTime: 45,
        maxResponseTime: 234,
        requestCount: 5678,
        errorCount: 1,
        errorRate: 0.02
      },
      {
        endpoint: '/api/reports/export',
        method: 'POST',
        avgResponseTime: 2345,
        minResponseTime: 1234,
        maxResponseTime: 5678,
        requestCount: 45,
        errorCount: 2,
        errorRate: 4.44
      }
    ];

    setApiMetrics(apis);
  }, []);

  // Initialize Bundle Metrics
  useEffect(() => {
    const bundles: BundleMetric[] = [
      { name: 'main.js', size: 587, gzipSize: 168, loadTime: 234, cached: true },
      { name: 'vendor.js', size: 1245, gzipSize: 412, loadTime: 456, cached: true },
      { name: 'dashboard.js', size: 89, gzipSize: 28, loadTime: 45, cached: false },
      { name: 'lists.js', size: 124, gzipSize: 42, loadTime: 67, cached: false },
      { name: 'styles.css', size: 78, gzipSize: 18, loadTime: 23, cached: true },
      { name: 'icons.woff2', size: 245, gzipSize: 245, loadTime: 89, cached: true }
    ];

    setBundleMetrics(bundles);
  }, []);

  // Generate performance history
  useEffect(() => {
    const history: PerformanceSnapshot[] = [];
    const now = Date.now();

    for (let i = 30; i >= 0; i--) {
      history.push({
        timestamp: new Date(now - i * 60 * 1000),
        fcp: 1100 + Math.random() * 400,
        lcp: 1700 + Math.random() * 600,
        fid: 30 + Math.random() * 50,
        cls: 0.03 + Math.random() * 0.08,
        ttfb: 280 + Math.random() * 120,
        memoryUsage: 45 + Math.random() * 15,
        cpuUsage: 20 + Math.random() * 30
      });
    }

    setPerformanceHistory(history);
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      // Update Web Vitals
      setWebVitals(prev => prev.map(vital => {
        const variation = (Math.random() - 0.5) * 0.1;
        const newValue = vital.value * (1 + variation);
        const rating = getRating(newValue, vital.threshold);
        return { ...vital, value: newValue, rating };
      }));

      // Add new performance snapshot
      setPerformanceHistory(prev => {
        const last = prev[prev.length - 1];
        const newSnapshot: PerformanceSnapshot = {
          timestamp: new Date(),
          fcp: last.fcp + (Math.random() - 0.5) * 100,
          lcp: last.lcp + (Math.random() - 0.5) * 150,
          fid: last.fid + (Math.random() - 0.5) * 10,
          cls: Math.max(0, last.cls + (Math.random() - 0.5) * 0.02),
          ttfb: last.ttfb + (Math.random() - 0.5) * 50,
          memoryUsage: Math.max(0, Math.min(100, last.memoryUsage + (Math.random() - 0.5) * 5)),
          cpuUsage: Math.max(0, Math.min(100, last.cpuUsage + (Math.random() - 0.5) * 10))
        };
        return [...prev.slice(-30), newSnapshot];
      });

      setLastUpdate(new Date());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Helpers
  const getRating = (value: number, threshold: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' => {
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'needs-improvement': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRatingIcon = (rating: string) => {
    switch (rating) {
      case 'good': return <CheckCircle className="w-4 h-4" />;
      case 'needs-improvement': return <AlertCircle className="w-4 h-4" />;
      case 'poor': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const formatTime = (ms: number): string => {
    return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
  };

  const formatSize = (kb: number): string => {
    return kb < 1024 ? `${kb}KB` : `${(kb / 1024).toFixed(2)}MB`;
  };

  const getTotalBundleSize = () => {
    return bundleMetrics.reduce((sum, bundle) => sum + bundle.size, 0);
  };

  const getTotalGzipSize = () => {
    return bundleMetrics.reduce((sum, bundle) => sum + bundle.gzipSize, 0);
  };

  const getAvgAPIResponseTime = () => {
    const total = apiMetrics.reduce((sum, api) => sum + (api.avgResponseTime * api.requestCount), 0);
    const count = apiMetrics.reduce((sum, api) => sum + api.requestCount, 0);
    return Math.round(total / count);
  };

  const getTotalAPIErrors = () => {
    return apiMetrics.reduce((sum, api) => sum + api.errorCount, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Performance Monitoring</h1>
                <p className="text-gray-600">Real-time performance metrics and Web Vitals</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Last update: {lastUpdate.toLocaleTimeString('it-IT')}
              </div>
              <button
                onClick={() => setIsMonitoring(!isMonitoring)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  isMonitoring
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isMonitoring ? 'animate-spin' : ''}`} />
                {isMonitoring ? 'Monitoring' : 'Paused'}
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Avg Load Time</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{formatTime(webVitals[1]?.value || 0)}</div>
              <div className="text-xs text-blue-700 mt-1">LCP metric</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Network className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">API Response</span>
              </div>
              <div className="text-2xl font-bold text-green-900">{getAvgAPIResponseTime()}ms</div>
              <div className="text-xs text-green-700 mt-1">Average time</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-900">Bundle Size</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">{formatSize(getTotalGzipSize())}</div>
              <div className="text-xs text-purple-700 mt-1">Gzipped</div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">API Errors</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">{getTotalAPIErrors()}</div>
              <div className="text-xs text-orange-700 mt-1">Total errors</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6 border-b border-gray-200">
            {(['vitals', 'api', 'bundle', 'history'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-2 font-medium transition capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'vitals' ? 'Web Vitals' : tab === 'api' ? 'API Metrics' : tab === 'bundle' ? 'Bundle Analysis' : 'History'}
              </button>
            ))}
          </div>
        </div>

        {/* Web Vitals Tab */}
        {activeTab === 'vitals' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {webVitals.map(vital => (
                <div key={vital.name} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{vital.label}</h3>
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRatingColor(vital.rating)}`}>
                          {getRatingIcon(vital.rating)}
                          {vital.rating.toUpperCase().replace('-', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{vital.description}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-4xl font-bold text-gray-900">
                      {vital.unit === 'ms' ? formatTime(vital.value) : vital.value.toFixed(3)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Good</span>
                      <span className="text-green-600 font-medium">
                        {'<'} {vital.threshold.good}{vital.unit}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          vital.rating === 'good' ? 'bg-green-500' :
                          vital.rating === 'needs-improvement' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(100, (vital.value / vital.threshold.poor) * 100)}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Poor</span>
                      <span className="text-red-600 font-medium">
                        {'>'} {vital.threshold.poor}{vital.unit}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Metrics Tab */}
        {activeTab === 'api' && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min/Max</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Error Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {apiMetrics.map((api, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <code className="text-sm font-mono text-gray-900">{api.endpoint}</code>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        api.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                        api.method === 'POST' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {api.method}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${
                        api.avgResponseTime < 200 ? 'text-green-600' :
                        api.avgResponseTime < 500 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {api.avgResponseTime}ms
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {api.minResponseTime}ms / {api.maxResponseTime}ms
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {api.requestCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${
                        api.errorCount === 0 ? 'text-green-600' :
                        api.errorCount < 10 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {api.errorCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        api.errorRate < 1 ? 'bg-green-100 text-green-700' :
                        api.errorRate < 3 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {api.errorRate.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bundle Analysis Tab */}
        {activeTab === 'bundle' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Bundle Size Overview</h3>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 mb-1">Total Uncompressed</div>
                  <div className="text-2xl font-bold text-blue-900">{formatSize(getTotalBundleSize())}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 mb-1">Total Gzipped</div>
                  <div className="text-2xl font-bold text-green-900">{formatSize(getTotalGzipSize())}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-600 mb-1">Compression Ratio</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {((getTotalGzipSize() / getTotalBundleSize()) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {bundleMetrics.map(bundle => (
                  <div key={bundle.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <code className="text-sm font-mono font-medium">{bundle.name}</code>
                        {bundle.cached && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Cached</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Size: {formatSize(bundle.size)}</span>
                        <span>Gzip: {formatSize(bundle.gzipSize)}</span>
                        <span>Load: {bundle.loadTime}ms</span>
                      </div>
                    </div>
                    <div className="w-48 h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${(bundle.gzipSize / getTotalGzipSize()) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* LCP History Chart */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Largest Contentful Paint (LCP)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={performanceHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(time) => new Date(time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  />
                  <YAxis label={{ value: 'ms', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    labelFormatter={(time) => new Date(time).toLocaleTimeString('it-IT')}
                    formatter={(value: number) => [`${Math.round(value)}ms`, 'LCP']}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="lcp" stroke="#3b82f6" strokeWidth={2} dot={false} name="LCP" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Resource Usage Charts */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Memory Usage</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={performanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" hide />
                    <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Memory']} />
                    <Area type="monotone" dataKey="memoryUsage" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">CPU Usage</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={performanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" hide />
                    <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'CPU']} />
                    <Area type="monotone" dataKey="cpuUsage" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
