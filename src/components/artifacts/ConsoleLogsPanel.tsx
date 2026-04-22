'use client';

import { useState, useEffect, useMemo } from 'react';
import { Terminal, Search, Filter, Download, AlertCircle, Info, AlertTriangle, XCircle } from 'lucide-react';

export interface ConsoleLogEntry {
  type: string;
  text: string;
  timestamp: string;
  location?: string;
}

interface ConsoleLogsPanelProps {
  logsUrl?: string;
  logs?: ConsoleLogEntry[];
  className?: string;
}

const LOG_TYPE_STYLES: Record<string, { icon: React.ElementType; bgColor: string; textColor: string }> = {
  log: { icon: Info, bgColor: 'bg-blue-500/10', textColor: 'text-blue-400' },
  info: { icon: Info, bgColor: 'bg-blue-500/10', textColor: 'text-blue-400' },
  warn: { icon: AlertTriangle, bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-400' },
  warning: { icon: AlertTriangle, bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-400' },
  error: { icon: XCircle, bgColor: 'bg-red-500/10', textColor: 'text-red-400' },
  debug: { icon: Terminal, bgColor: 'bg-gray-500/10', textColor: 'text-gray-400' },
};

export function ConsoleLogsPanel({ logsUrl, logs: propLogs, className = '' }: ConsoleLogsPanelProps) {
  const [logs, setLogs] = useState<ConsoleLogEntry[]>(propLogs || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

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
          console.error('Failed to fetch console logs:', err);
          setError('Failed to load console logs');
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

  // Filter and search logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Filter by type
      if (filterType !== 'all' && log.type !== filterType) {
        return false;
      }
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          log.text.toLowerCase().includes(query) ||
          log.location?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [logs, filterType, searchQuery]);

  // Get unique log types for filter dropdown
  const logTypes = useMemo(() => {
    const types = new Set(logs.map(log => log.type));
    return Array.from(types);
  }, [logs]);

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'console-logs.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-muted-foreground">Loading console logs...</span>
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
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-card-foreground">Console Logs</span>
          <span className="text-xs text-muted-foreground">({filteredLogs.length} / {logs.length})</span>
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
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-card border border-border rounded text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="pl-8 pr-8 py-1.5 bg-card border border-border rounded text-sm text-card-foreground appearance-none focus:outline-none focus:border-ring"
          >
            <option value="all">All types</option>
            {logTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-auto font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            {logs.length === 0 ? 'No console logs recorded' : 'No logs match your filters'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {filteredLogs.map((log, index) => {
              const style = LOG_TYPE_STYLES[log.type] || LOG_TYPE_STYLES.log;
              const Icon = style.icon;
              
              return (
                <div 
                  key={index} 
                  className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 ${style.bgColor}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${style.textColor}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-gray-500 mb-0.5">
                        <span className={`uppercase text-[10px] font-semibold ${style.textColor}`}>
                          {log.type}
                        </span>
                        <span>{formatTimestamp(log.timestamp)}</span>
                        {log.location && (
                          <span className="truncate" title={log.location}>
                            {log.location}
                          </span>
                        )}
                      </div>
                      <pre className={`whitespace-pre-wrap break-all text-foreground`}>
                        {log.text}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
