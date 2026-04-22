'use client';

import { useState, useEffect, useMemo } from 'react';
import { Globe, Search, Filter, Download, AlertCircle, ChevronDown, ChevronRight, Clock, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

export interface NetworkLogEntry {
  type: 'request' | 'response' | 'failed';
  url: string;
  method?: string;
  status?: number;
  statusText?: string;
  resourceType?: string;
  timestamp: string;
  duration?: number;
  error?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  size?: number;
  mimeType?: string;
  responseBodyTruncated?: boolean;
  responseJsonPreview?: unknown;
}

interface NetworkLogsPanelProps {
  logsUrl?: string;
  logs?: NetworkLogEntry[];
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  '2': 'text-green-400',
  '3': 'text-blue-400',
  '4': 'text-yellow-400',
  '5': 'text-red-400',
};

const RESOURCE_TYPE_COLORS: Record<string, string> = {
  document: 'bg-blue-500/20 text-blue-400',
  script: 'bg-yellow-500/20 text-yellow-400',
  stylesheet: 'bg-purple-500/20 text-purple-400',
  image: 'bg-green-500/20 text-green-400',
  fetch: 'bg-cyan-500/20 text-cyan-400',
  xhr: 'bg-cyan-500/20 text-cyan-400',
  font: 'bg-pink-500/20 text-pink-400',
  other: 'bg-gray-500/20 text-gray-400',
};

export function NetworkLogsPanel({ logsUrl, logs: propLogs, className = '' }: NetworkLogsPanelProps) {
  const [logs, setLogs] = useState<NetworkLogEntry[]>(propLogs || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<NetworkLogEntry | null>(null);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  // Fetch logs from URL if provided
  useEffect(() => {
    if (logsUrl) {
      setIsLoading(true);
      setError(null);
      
      fetch(logsUrl)
        .then(res => res.json())
        .then(data => {
          setLogs(Array.isArray(data) ? data : []);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to fetch network logs:', err);
          setError('Failed to load network logs');
          setIsLoading(false);
        });
    }
  }, [logsUrl]);

  // Update logs when prop changes
  useEffect(() => {
    if (propLogs) {
      setLogs(propLogs);
    }
  }, [propLogs]);

  // Get only response logs (they contain all the info we need)
  const responseLogs = useMemo(() => {
    return logs.filter(log => log.type === 'response' || log.type === 'failed');
  }, [logs]);

  // Filter and search logs
  const filteredLogs = useMemo(() => {
    return responseLogs.filter(log => {
      // Filter by resource type
      if (filterType !== 'all' && log.resourceType !== filterType) {
        return false;
      }
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          log.url.toLowerCase().includes(query) ||
          log.method?.toLowerCase().includes(query) ||
          log.status?.toString().includes(query)
        );
      }
      return true;
    });
  }, [responseLogs, filterType, searchQuery]);

  // Get unique resource types for filter dropdown
  const resourceTypes = useMemo(() => {
    const types = new Set(responseLogs.map(log => log.resourceType).filter(Boolean));
    return Array.from(types) as string[];
  }, [responseLogs]);

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'network-logs.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (ms?: number) => {
    if (ms === undefined) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatSize = (bytes?: number) => {
    if (bytes === undefined) return '-';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-gray-400';
    const firstDigit = status.toString()[0];
    return STATUS_COLORS[firstDigit] || 'text-gray-400';
  };

  const getResourceTypeColor = (type?: string) => {
    return RESOURCE_TYPE_COLORS[type || 'other'] || RESOURCE_TYPE_COLORS.other;
  };

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  };

  const toggleExpanded = (index: number) => {
    setExpandedLog(expandedLog === index ? null : index);
  };

  if (isLoading) {
    return (
      <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-muted-foreground">Loading network logs...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center h-32 text-red-500">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-4 py-2 bg-muted border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-card-foreground">Network Logs</span>
          <span className="text-xs text-muted-foreground">({filteredLogs.length} / {responseLogs.length})</span>
        </div>
        <button
          onClick={handleDownload}
          className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-accent-foreground transition-colors cursor-pointer"
          title="Download logs"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      {/* Search and filter */}
      <div className="px-4 py-2 bg-muted/50 border-b border-border flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by URL, method, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-muted border border-border rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="pl-8 pr-8 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white appearance-none focus:outline-none focus:border-blue-500"
          >
            <option value="all">All types</option>
            {resourceTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table header */}
      <div className="px-4 py-2 bg-gray-100/50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700 grid grid-cols-12 gap-2 text-xs text-gray-500 font-medium">
        <div className="col-span-1"></div>
        <div className="col-span-1">Status</div>
        <div className="col-span-1">Method</div>
        <div className="col-span-5">URL</div>
        <div className="col-span-1">Type</div>
        <div className="col-span-1">Size</div>
        <div className="col-span-2">Time</div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-auto font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            {responseLogs.length === 0 ? 'No network requests recorded' : 'No requests match your filters'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredLogs.map((log, index) => (
              <div key={index}>
                {/* Main row */}
                <div 
                  className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 cursor-pointer grid grid-cols-12 gap-2 items-center ${
                    log.type === 'failed' ? 'bg-red-500/5' : ''
                  }`}
                  onClick={() => toggleExpanded(index)}
                >
                  <div className="col-span-1">
                    {expandedLog === index ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                  <div className={`col-span-1 font-semibold ${getStatusColor(log.status)}`}>
                    {log.type === 'failed' ? 'ERR' : log.status || '-'}
                  </div>
                  <div className="col-span-1 text-muted-foreground">
                    {log.method || '-'}
                  </div>
                  <div className="col-span-5 text-foreground truncate" title={log.url}>
                    {formatUrl(log.url)}
                  </div>
                  <div className="col-span-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${getResourceTypeColor(log.resourceType)}`}>
                      {log.resourceType || 'other'}
                    </span>
                  </div>
                  <div className="col-span-1 text-muted-foreground">
                    {formatSize(log.size)}
                  </div>
                  <div className="col-span-2 text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(log.duration)}
                  </div>
                </div>

                {/* Expanded details */}
                {expandedLog === index && (
                  <div className="px-4 py-3 bg-muted/30 border-t border-border">
                    <div className="space-y-3">
                      {/* Full URL */}
                      <div>
                        <div className="text-muted-foreground text-[10px] uppercase mb-1">Full URL</div>
                        <div className="text-foreground break-all">{log.url}</div>
                      </div>

                      {/* Error message */}
                      {log.error && (
                        <div>
                          <div className="text-red-500 dark:text-red-400 text-[10px] uppercase mb-1">Error</div>
                          <div className="text-red-500 dark:text-red-400">{log.error}</div>
                        </div>
                      )}

                      {/* Request Headers */}
                      {log.requestHeaders && Object.keys(log.requestHeaders).length > 0 && (
                        <div>
                          <div className="text-muted-foreground text-[10px] uppercase mb-1 flex items-center gap-1">
                            <ArrowUpFromLine className="h-3 w-3" />
                            Request Headers
                          </div>
                          <div className="bg-secondary rounded p-2 max-h-32 overflow-auto">
                            {Object.entries(log.requestHeaders).map(([key, value]) => (
                              <div key={key} className="flex">
                                <span className="text-cyan-600 dark:text-cyan-400 mr-2">{key}:</span>
                                <span className="text-foreground break-all">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Response Headers */}
                      {log.responseHeaders && Object.keys(log.responseHeaders).length > 0 && (
                        <div>
                          <div className="text-muted-foreground text-[10px] uppercase mb-1 flex items-center gap-1">
                            <ArrowDownToLine className="h-3 w-3" />
                            Response Headers
                          </div>
                          <div className="bg-secondary rounded p-2 max-h-32 overflow-auto">
                            {Object.entries(log.responseHeaders).map(([key, value]) => (
                              <div key={key} className="flex">
                                <span className="text-green-600 dark:text-green-400 mr-2">{key}:</span>
                                <span className="text-foreground break-all">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Request Body */}
                      {log.requestBody && (
                        <div>
                          <div className="text-muted-foreground text-[10px] uppercase mb-1">Request Body</div>
                          <pre className="bg-secondary rounded p-2 max-h-32 overflow-auto text-foreground whitespace-pre-wrap">
                            {log.requestBody}
                          </pre>
                        </div>
                      )}

                      {/* Response Body */}
                      {log.responseBody && (
                        <div>
                          <div className="text-muted-foreground text-[10px] uppercase mb-1">
                            Response Body
                            {log.responseBodyTruncated && (
                              <span className="text-yellow-600 dark:text-yellow-500 ml-2">(truncated)</span>
                            )}
                          </div>
                          <pre className="bg-secondary rounded p-2 max-h-48 overflow-auto text-foreground whitespace-pre-wrap">
                            {log.responseJsonPreview 
                              ? JSON.stringify(log.responseJsonPreview, null, 2)
                              : log.responseBody
                            }
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
