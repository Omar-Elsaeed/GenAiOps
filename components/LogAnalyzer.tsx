



import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { analyzeLogs, getLogDetails } from '../services/geminiService';
import { PulsingText } from './Spinner';
import type { LogAnalysisResult, LogEntry, LogSeverity } from '../types';
import { ClipboardDocumentIcon, MagnifyingGlassIcon } from '../constants';

const SeverityBadge: React.FC<{ severity: LogSeverity }> = ({ severity }) => {
  const severityClasses: Record<LogSeverity, string> = {
    CRITICAL: 'bg-red-100 text-red-800',
    ERROR: 'bg-red-100 text-red-800',
    WARNING: 'bg-yellow-100 text-yellow-800',
    INFO: 'bg-blue-100 text-blue-800',
    UNKNOWN: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${severityClasses[severity] || severityClasses.UNKNOWN}`}>
      {severity}
    </span>
  );
};

const LogEventCard: React.FC<{
  event: LogEntry;
  isExpanded: boolean;
  isLoadingDetails: boolean;
  onToggleDetails: () => void;
}> = ({ event, isExpanded, isLoadingDetails, onToggleDetails }) => {
  const canShowDetails = event.severity === 'ERROR' || event.severity === 'CRITICAL';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-3 transition-all duration-300 hover:border-primary/50">
      <div className="flex justify-between items-start mb-2">
        <div className="font-mono text-sm text-gray-500">{event.timestamp}</div>
        <div className="flex items-center space-x-2">
            <SeverityBadge severity={event.severity} />
            <button onClick={handleCopy} title="Copy log details" className="text-gray-400 hover:text-gray-600">
                <ClipboardDocumentIcon className="w-4 h-4" />
            </button>
        </div>
      </div>
      <p className="text-gray-700 text-sm font-mono">{event.message}</p>
      
      {event.suggestion && !isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-secondary font-semibold">Suggestion:</p>
          <p className="text-sm text-gray-600">{event.suggestion}</p>
        </div>
      )}

      {canShowDetails && (
        <button
          onClick={onToggleDetails}
          disabled={isLoadingDetails}
          className="text-xs mt-3 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          {isLoadingDetails ? 'Loading...' : isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      )}

      {isExpanded && event.details && (
        <div className="mt-4 pt-3 border-t border-gray-200 prose prose-sm max-w-none prose-p:text-gray-600">
          <ReactMarkdown>{event.details}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

const StreamingStatus: React.FC<{ isStreaming: boolean }> = ({ isStreaming }) => {
  const statusColor = isStreaming ? 'bg-green-500' : 'bg-gray-400';
  const statusText = isStreaming ? 'Live' : 'Disconnected';
  return (
    <div className="flex items-center space-x-2 mt-4">
      <div className={`w-3 h-3 rounded-full ${statusColor} ${isStreaming ? 'animate-pulse' : ''}`}></div>
      <span className="text-sm font-medium text-gray-500">{statusText}</span>
    </div>
  );
};

const SEVERITY_LEVELS: LogSeverity[] = ['CRITICAL', 'ERROR', 'WARNING', 'INFO'];

const SeverityFilter: React.FC<{
  selected: LogSeverity[];
  onChange: (severities: LogSeverity[]) => void;
}> = ({ selected, onChange }) => {
  const handleToggle = (severity: LogSeverity) => {
    const newSelected = selected.includes(severity)
      ? selected.filter(s => s !== severity)
      : [...selected, severity];
    onChange(newSelected);
  };

  return (
    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
      <span className="text-sm font-medium text-gray-500">Filter by:</span>
      {SEVERITY_LEVELS.map(level => (
        <button
          key={level}
          onClick={() => handleToggle(level)}
          className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors duration-200 ${
            selected.includes(level)
              ? 'bg-primary text-white shadow-sm'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {level}
        </button>
      ))}
      {selected.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
          title="Clear filter"
        >
          Clear
        </button>
      )}
    </div>
  );
};

const generateRandomLog = (): LogEntry => {
    const severities: LogSeverity[] = ['INFO', 'WARNING', 'ERROR', 'CRITICAL'];
    const messages: Record<LogSeverity, string[]> = {
        INFO: ['User logged in successfully.', 'Data processed for request #12345.', 'Service is healthy.'],
        WARNING: ['High memory usage detected: 92%.', 'API response time is above threshold: 550ms.'],
        ERROR: ['Failed to connect to database: Timeout.', 'Null pointer exception at user service.'],
        CRITICAL: ['Service unavailable: All instances are down.', 'Critical security vulnerability detected!'],
        UNKNOWN: []
    };
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const message = messages[severity][Math.floor(Math.random() * messages[severity].length)];
    return {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        severity,
        message,
    };
};

const LogSummaryChart: React.FC<{ events: LogEntry[] }> = ({ events }) => {
    const summary = useMemo(() => {
        const counts = { CRITICAL: 0, ERROR: 0, WARNING: 0, INFO: 0, UNKNOWN: 0 };
        events.forEach(event => {
            if (event.severity in counts) {
                counts[event.severity]++;
            }
        });
        const total = events.length;
        if (total === 0) return [];
        return Object.entries(counts).map(([severity, count]) => ({
            severity: severity as LogSeverity,
            count,
            percentage: (count / total) * 100,
        }));
    }, [events]);

    const severityColors: Record<LogSeverity, string> = {
        CRITICAL: 'bg-red-500',
        ERROR: 'bg-red-400',
        WARNING: 'bg-yellow-400',
        INFO: 'bg-blue-400',
        UNKNOWN: 'bg-gray-400',
    };

    if (events.length === 0) return null;

    return (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-500 mb-3">Severity Distribution</h4>
            <div className="w-full flex rounded-full h-3 overflow-hidden bg-gray-200">
                {summary.map(item => item.percentage > 0 && (
                    <div 
                        key={item.severity}
                        className={`${severityColors[item.severity]} transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                        title={`${item.severity}: ${item.count} (${item.percentage.toFixed(1)}%)`}
                    ></div>
                ))}
            </div>
            <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 mt-3">
                {summary.map(item => item.count > 0 && (
                    <div key={item.severity} className="flex items-center text-xs text-gray-500">
                        <span className={`w-2 h-2 rounded-full mr-1.5 ${severityColors[item.severity]}`}></span>
                        {item.severity}: {item.count}
                    </div>
                ))}
            </div>
        </div>
    );
};

export const LogAnalyzer: React.FC = () => {
  const [logs, setLogs] = useState('');
  const [analysis, setAnalysis] = useState<LogAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'timestamp' | 'severity'>('timestamp');
  const [isStreaming, setIsStreaming] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<LogSeverity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(false);
  
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());

  const getEventKey = (event: LogEntry) => `${event.timestamp}-${event.message}`;

  const handleAnalyze = useCallback(async () => {
    if (!logs.trim()) {
      setError('Log input cannot be empty.');
      return;
    }
    setError('');
    setIsLoading(true);
    if (!isAutoRefresh) {
      setAnalysis(null);
      setExpandedLogs(new Set());
      setLoadingDetails(new Set());
    }
    
    try {
      const result = await analyzeLogs(logs);
      if (result.summary.startsWith('An error occurred')) {
        setError(result.summary);
        setAnalysis(null);
      } else {
        setAnalysis(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to analyze logs: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [logs, isAutoRefresh]);

  useEffect(() => {
    if (!isStreaming) return;
    setAnalysis({
      summary: 'Live log stream started. New events will appear below.',
      events: [],
    });
    setError('');
    const intervalId = setInterval(() => {
      const newLog = generateRandomLog();
      setAnalysis(prev => ({
        summary: prev?.summary || 'Live log stream...',
        events: [newLog, ...(prev?.events || [])]
      }));
    }, 2000);
    return () => clearInterval(intervalId);
  }, [isStreaming]);
  
  useEffect(() => {
    if (!isAutoRefresh || isStreaming || !logs.trim() || isLoading) return;
    const intervalId = setInterval(() => { handleAnalyze(); }, 30000);
    return () => clearInterval(intervalId);
  }, [isAutoRefresh, isStreaming, logs, handleAnalyze, isLoading]);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearchQuery(searchQuery); }, 300);
    return () => { clearTimeout(handler); };
  }, [searchQuery]);

  const handleToggleDetails = useCallback(async (eventToToggle: LogEntry) => {
    const eventKey = getEventKey(eventToToggle);
    const isExpanding = !expandedLogs.has(eventKey);
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (isExpanding) next.add(eventKey); else next.delete(eventKey);
      return next;
    });
    if (isExpanding && !eventToToggle.details) {
      setLoadingDetails(prev => new Set(prev).add(eventKey));
      try {
        const details = await getLogDetails(eventToToggle.message);
        setAnalysis(prev => {
          if (!prev) return null;
          const eventIndex = prev.events.findIndex(e => getEventKey(e) === eventKey);
          if (eventIndex === -1) return prev;
          const newEvents = [...prev.events];
          newEvents[eventIndex] = { ...newEvents[eventIndex], details };
          return { ...prev, events: newEvents };
        });
      } catch (err) {
        setAnalysis(prev => {
          if (!prev) return null;
          const eventIndex = prev.events.findIndex(e => getEventKey(e) === eventKey);
          if (eventIndex === -1) return prev;
          const newEvents = [...prev.events];
          newEvents[eventIndex] = { ...newEvents[eventIndex], details: 'Failed to fetch details.' };
          return { ...prev, events: newEvents };
        });
      } finally {
        setLoadingDetails(prev => { const next = new Set(prev); next.delete(eventKey); return next; });
      }
    }
  }, [analysis, expandedLogs]);


  const sortedEvents = useMemo(() => {
    if (!analysis?.events) return [];
    const severityOrder: Record<LogSeverity, number> = { CRITICAL: 0, ERROR: 1, WARNING: 2, INFO: 3, UNKNOWN: 4 };
    let filteredEvents = analysis.events;
    if (severityFilter.length > 0) {
        filteredEvents = filteredEvents.filter(event => severityFilter.includes(event.severity));
    }
    if (debouncedSearchQuery.trim() !== '') {
        filteredEvents = filteredEvents.filter(event => 
            event.message.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );
    }
    return [...filteredEvents].sort((a, b) => {
      if (sortBy === 'severity') return severityOrder[a.severity] - severityOrder[b.severity];
      return b.timestamp.localeCompare(a.timestamp);
    });
  }, [analysis, sortBy, severityFilter, debouncedSearchQuery]);

  const handleToggleStreaming = () => {
      setIsStreaming(prev => !prev);
      if (isStreaming) setAnalysis(null);
      setExpandedLogs(new Set());
      setLoadingDetails(new Set());
      setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
            <div>
                <h3 className="text-lg font-semibold text-gray-900">Real-time Log Streaming</h3>
                <p className="text-sm text-gray-500 mt-1">Simulates a WebSocket connection for live log updates.</p>
            </div>
            <button
                onClick={handleToggleStreaming}
                className={`mt-4 sm:mt-0 px-6 py-2 font-semibold rounded-lg shadow-sm transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isStreaming 
                    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' 
                    : 'bg-secondary text-white hover:bg-green-600 focus:ring-green-500'
                }`}
            >
                {isStreaming ? 'Stop Stream' : 'Start Stream'}
            </button>
        </div>
        <StreamingStatus isStreaming={isStreaming} />
      </div>

      {!isStreaming && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analyze Batch Logs</h3>
          <textarea
            value={logs}
            onChange={(e) => setLogs(e.target.value)}
            placeholder="[INFO] 2023-10-27 10:00:00 - Application starting..."
            className="w-full h-64 p-3 bg-gray-50 text-gray-800 rounded-md border border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 font-mono text-sm"
            disabled={isLoading}
          />
          {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
          <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
            <button
                onClick={handleAnalyze}
                disabled={isLoading || !logs.trim()}
                className="px-6 py-2 bg-primary text-white font-semibold rounded-lg shadow-sm hover:bg-primary-light transition-colors duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Analyzing...' : 'Analyze Logs'}
            </button>
            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    id="auto-refresh-toggle"
                    checked={isAutoRefresh}
                    onChange={(e) => setIsAutoRefresh(e.target.checked)}
                    disabled={isLoading || !logs.trim()}
                    className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary focus:ring-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                />
                <label 
                    htmlFor="auto-refresh-toggle" 
                    className={`text-sm text-gray-600 transition-opacity ${isLoading || !logs.trim() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                    Auto-refresh every 30s
                </label>
            </div>
          </div>
        </div>
      )}

      {(isLoading || analysis) && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">Analysis Result</h3>

          {isLoading && !analysis ? (
            <div className="mt-4">
                <PulsingText text="Gemini is analyzing the logs..." />
            </div>
          ) : analysis ? (
            <div className="mt-6">
              <LogSummaryChart events={analysis.events} />
              {analysis.events.length > 0 && (
                <div className="space-y-4 mb-6 pb-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:max-w-xs">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white text-gray-800 text-sm rounded-md py-2 pl-10 pr-4 border border-gray-300 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <label htmlFor="sort-by" className="text-sm font-medium text-gray-500">Sort by:</label>
                            <select
                            id="sort-by"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'timestamp' | 'severity')}
                            className="bg-white text-gray-800 text-sm rounded-md py-2 px-2 border border-gray-300 focus:ring-primary focus:border-primary"
                            >
                            <option value="timestamp">Timestamp</option>
                            <option value="severity">Severity</option>
                            </select>
                        </div>
                    </div>
                    <SeverityFilter selected={severityFilter} onChange={setSeverityFilter} />
                </div>
              )}
              <div className="prose prose-sm max-w-none prose-invert mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">{analysis.summary}</p>
              </div>
              <div>
                {sortedEvents.length > 0 ? (
                    sortedEvents.map(event => {
                      const eventKey = getEventKey(event);
                      return (
                        <LogEventCard
                          key={eventKey}
                          event={event}
                          isExpanded={expandedLogs.has(eventKey)}
                          isLoadingDetails={loadingDetails.has(eventKey)}
                          onToggleDetails={() => handleToggleDetails(event)}
                        />
                      );
                    })
                ) : (
                    analysis.events.length > 0 ? (
                        <p className="text-gray-500 text-center py-4">No logs match the current search or filter.</p>
                    ) : (
                        !isStreaming && <p className="text-gray-500 text-sm">No events to display.</p>
                    )
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};