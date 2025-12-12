import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle, AlertTriangle, Info, X, Filter, Search, ChevronDown, ChevronRight, CheckCircle, FileText, Clock, Tag, ExternalLink, RefreshCw, Settings } from 'lucide-react';
import { useIDEStore } from '@/store/useIDEStore';
import { Problem, ProblemTag, ProblemsFilter, ProblemsCollection } from '@/types';
import { clsx } from 'clsx';

interface ProblemsPanelProps {
  className?: string;
}

interface ProblemGroup {
  resource: string;
  problems: Problem[];
  severity: 'error' | 'warning' | 'info';
  count: number;
  expanded: boolean;
}

interface ProblemSource {
  name: string;
  count: number;
  problems: Problem[];
}

export function ProblemsPanel({ className }: ProblemsPanelProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [collections, setCollections] = useState<ProblemsCollection[]>([]);
  const [filter, setFilter] = useState<ProblemsFilter>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSourceMenu, setShowSourceMenu] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  const { openFiles, activeTabId, diagnostics, getDiagnostics } = useIDEStore();

  // Refresh problems when files change
  useEffect(() => {
    if (!autoRefresh) return;

    const refreshProblems = () => {
      const allProblems: Problem[] = [];

      // Get problems for all open files
      Object.keys(openFiles).forEach(filePath => {
        const fileDiagnostics = diagnostics?.[filePath] || [];

        fileDiagnostics.forEach(diagnostic => {
          const problem: Problem = {
            id: `${filePath}-${diagnostic.range.start.line}-${diagnostic.range.start.character}`,
            resource: filePath,
            severity: diagnostic.severity as 'error' | 'warning' | 'info',
            message: diagnostic.message,
            code: diagnostic.code,
            source: diagnostic.source || 'unknown',
            startLineNumber: diagnostic.range.start.line + 1,
            startColumn: diagnostic.range.start.character + 1,
            endLineNumber: diagnostic.range.end.line + 1,
            endColumn: diagnostic.range.end.character + 1,
            tags: diagnostic.tags,
          };

          allProblems.push(problem);
        });
      });

      // Get problems from other services (linting, TypeScript, etc.)
      if (getDiagnostics) {
        const externalDiagnostics = getDiagnostics();
        externalDiagnostics.forEach(diagnostic => {
          const problem: Problem = {
            id: `external-${Date.now()}-${Math.random()}`,
            resource: diagnostic.resource,
            severity: diagnostic.severity as 'error' | 'warning' | 'info',
            message: diagnostic.message,
            code: diagnostic.code,
            source: diagnostic.source || 'external',
            startLineNumber: diagnostic.range.start.line + 1,
            startColumn: diagnostic.range.start.character + 1,
            endLineNumber: diagnostic.range.end.line + 1,
            endColumn: diagnostic.range.end.character + 1,
          };

          allProblems.push(problem);
        });
      }

      // Sort by severity and line number
      allProblems.sort((a, b) => {
        const severityOrder = { error: 0, warning: 1, info: 2 };
        const aSeverity = severityOrder[a.severity];
        const bSeverity = severityOrder[b.severity];

        if (aSeverity !== bSeverity) {
          return aSeverity - bSeverity;
        }

        // Within same severity, sort by resource then line
        if (a.resource !== b.resource) {
          return a.resource.localeCompare(b.resource);
        }

        return a.startLineNumber - b.startLineNumber;
      });

      setProblems(allProblems);
      setLastRefresh(Date.now());
    };

    refreshProblems();

    // Set up periodic refresh
    const interval = setInterval(refreshProblems, 5000);
    return () => clearInterval(interval);
  }, [openFiles, diagnostics, autoRefresh, getDiagnostics]);

  // Group problems by resource
  const problemGroups = useMemo(() => {
    const groups = new Map<string, ProblemGroup>();

    // Filter problems based on current filter
    const filteredProblems = problems.filter(problem => {
      // Type filter
      if (filter.type && filter.type !== 'all' && problem.severity !== filter.type) {
        return false;
      }

      // Source filter
      if (filter.source && problem.source !== filter.source) {
        return false;
      }

      // Resource filter
      if (filter.resource && !problem.resource.includes(filter.resource)) {
        return false;
      }

      // Tag filter
      if (filter.tag) {
        const hasTag = problem.tags?.includes(filter.tag);
        if (filter.tag === ProblemTag.Unnecessary && !hasTag) return false;
        if (filter.tag === ProblemTag.Deprecated && !hasTag) return false;
      }

      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const inMessage = problem.message.toLowerCase().includes(query);
        const inResource = problem.resource.toLowerCase().includes(query);
        const inSource = problem.source?.toLowerCase().includes(query);
        const inCode = typeof problem.code === 'string' && problem.code.toLowerCase().includes(query);

        if (!inMessage && !inResource && !inSource && !inCode) {
          return false;
        }
      }

      return true;
    });

    // Group by resource
    filteredProblems.forEach(problem => {
      if (!groups.has(problem.resource)) {
        groups.set(problem.resource, {
          resource: problem.resource,
          problems: [],
          severity: problem.severity,
          count: 0,
          expanded: expandedResources.has(problem.resource),
        });
      }

      const group = groups.get(problem.resource)!;
      group.problems.push(problem);
      group.count++;

      // Update highest severity for the group
      const severityOrder = { error: 0, warning: 1, info: 2 };
      if (severityOrder[problem.severity] < severityOrder[group.severity]) {
        group.severity = problem.severity;
      }
    });

    return Array.from(groups.values()).sort((a, b) => {
      // Sort by severity first, then by resource name
      const severityOrder = { error: 0, warning: 1, info: 2 };
      const aSeverity = severityOrder[a.severity];
      const bSeverity = severityOrder[b.severity];

      if (aSeverity !== bSeverity) {
        return aSeverity - bSeverity;
      }

      return a.resource.localeCompare(b.resource);
    });
  }, [problems, filter, searchQuery, expandedResources]);

  // Group problems by source
  const problemSources = useMemo(() => {
    const sources = new Map<string, ProblemSource>();

    const filteredProblems = problems.filter(problem => {
      // Apply same filters as above
      if (filter.type && filter.type !== 'all' && problem.severity !== filter.type) {
        return false;
      }
      if (searchQuery && !problem.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !problem.resource.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });

    filteredProblems.forEach(problem => {
      const sourceName = problem.source || 'unknown';
      if (!sources.has(sourceName)) {
        sources.set(sourceName, {
          name: sourceName,
          count: 0,
          problems: [],
        });
      }

      const source = sources.get(sourceName)!;
      source.problems.push(problem);
      source.count++;
    });

    return Array.from(sources.values()).sort((a, b) => b.count - a.count);
  }, [problems, filter, searchQuery]);

  // Get problem statistics
  const problemStats = useMemo(() => {
    const stats = { errors: 0, warnings: 0, infos: 0, total: 0 };

    problems.forEach(problem => {
      if (problem.severity === 'error') stats.errors++;
      else if (problem.severity === 'warning') stats.warnings++;
      else if (problem.severity === 'info') stats.infos++;
      stats.total++;
    });

    return stats;
  }, [problems]);

  const toggleResourceExpansion = useCallback((resource: string) => {
    setExpandedResources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resource)) {
        newSet.delete(resource);
      } else {
        newSet.add(resource);
      }
      return newSet;
    });
  }, []);

  const goToProblem = useCallback((problem: Problem) => {
    // This would integrate with the editor to navigate to the problem location
    console.log('Navigate to problem:', problem);
    setSelectedProblem(problem);
  }, []);

  const applyQuickFix = useCallback(async (problem: Problem, fixIndex: number) => {
    // This would integrate with code actions to apply quick fixes
    console.log('Apply quick fix:', problem, fixIndex);
  }, []);

  const clearFilter = useCallback(() => {
    setFilter({ type: 'all' });
    setSearchQuery('');
    setShowFilterMenu(false);
    setShowSourceMenu(false);
  }, []);

  const refreshProblems = useCallback(() => {
    setLastRefresh(Date.now());
    // Trigger re-diagnostics
    if (getDiagnostics) {
      getDiagnostics();
    }
  }, [getDiagnostics]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getTagIcon = (tag?: ProblemTag) => {
    switch (tag) {
      case ProblemTag.Unnecessary:
        return <AlertCircle className="w-3 h-3 text-gray-400" title="Unnecessary code" />;
      case ProblemTag.Deprecated:
        return <AlertTriangle className="w-3 h-3 text-orange-400" title="Deprecated code" />;
      default:
        return null;
    }
  };

  const getSourceColor = (source: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-yellow-500'
    ];
    const index = source.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className={clsx('problems-panel flex flex-col h-full bg-gray-900 text-gray-100', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium">Problems</h2>
            <span className="text-sm text-gray-400">({problemStats.total})</span>
          </div>

          {/* Severity counts */}
          <div className="flex items-center gap-3 text-sm">
            {problemStats.errors > 0 && (
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-red-500" />
                <span className="text-red-500">{problemStats.errors}</span>
              </div>
            )}
            {problemStats.warnings > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                <span className="text-yellow-500">{problemStats.warnings}</span>
              </div>
            )}
            {problemStats.infos > 0 && (
              <div className="flex items-center gap-1">
                <Info className="w-3 h-3 text-blue-500" />
                <span className="text-blue-500">{problemStats.infos}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter problems..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-2 py-1 bg-gray-700 text-sm rounded w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="flex items-center gap-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              <Filter className="w-4 h-4" />
              <span>{filter.type === 'all' ? 'All' : filter.type}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showFilterMenu && (
              <div className="absolute right-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-10 min-w-32">
                <button
                  onClick={() => { setFilter({ type: 'all' }); setShowFilterMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-700 text-sm"
                >
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  All Problems
                </button>
                <button
                  onClick={() => { setFilter({ type: 'errors' }); setShowFilterMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-700 text-sm"
                >
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Errors
                </button>
                <button
                  onClick={() => { setFilter({ type: 'warnings' }); setShowFilterMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-700 text-sm"
                >
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  Warnings
                </button>
                <button
                  onClick={() => { setFilter({ type: 'info' }); setShowFilterMenu(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-700 text-sm"
                >
                  <Info className="w-4 h-4 text-blue-500" />
                  Info
                </button>
              </div>
            )}
          </div>

          {/* Auto refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={clsx(
              'p-2 hover:bg-gray-700 rounded',
              autoRefresh ? 'text-blue-400' : 'text-gray-400'
            )}
            title={autoRefresh ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
          >
            <RefreshCw className={clsx('w-4 h-4', autoRefresh && 'animate-spin')} />
          </button>

          {/* Settings */}
          <button
            className="p-2 hover:bg-gray-700 rounded"
            title="Problems Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Last refresh info */}
      <div className="px-4 py-1 bg-gray-800 border-b border-gray-700 text-xs text-gray-400">
        Last updated: {new Date(lastRefresh).toLocaleTimeString()}
      </div>

      {/* Problem List */}
      <div className="flex-1 overflow-y-auto">
        {problemGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <CheckCircle className="w-12 h-12 mb-4 text-green-400" />
            <div className="text-lg mb-2">No Problems Found</div>
            <div className="text-sm mb-4">
              {searchQuery || filter.type !== 'all' ? 'Try adjusting your filters' : 'Your code looks clean!'}
            </div>
            {searchQuery && (
              <button
                onClick={clearFilter}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {problemGroups.map(group => (
              <div key={group.resource} className="border-l-4 border-l-transparent hover:border-l-gray-600 transition-colors">
                {/* Resource header */}
                <div
                  className="flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-750 cursor-pointer"
                  onClick={() => toggleResourceExpansion(group.resource)}
                >
                  <div className="flex items-center gap-3">
                    <button className="p-1 hover:bg-gray-700 rounded">
                      {group.expanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium truncate max-w-xs">
                      {group.resource.split('/').pop() || group.resource}
                    </span>
                    <span className="text-xs text-gray-400 truncate">
                      {group.resource}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Problem counts */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-red-500" />
                        <span className="text-xs text-red-500">
                          {group.problems.filter(p => p.severity === 'error').length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-yellow-500">
                          {group.problems.filter(p => p.severity === 'warning').length}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Info className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-blue-500">
                          {group.problems.filter(p => p.severity === 'info').length}
                        </span>
                      </div>
                    </div>

                    {/* Source indicators */}
                    <div className="flex items-center gap-1">
                      {Array.from(new Set(group.problems.map(p => p.source))).slice(0, 3).map(source => (
                        <div
                          key={source}
                          className={clsx('w-2 h-2 rounded-full', getSourceColor(source || 'unknown'))}
                          title={source || 'unknown'}
                        />
                      ))}
                      {new Set(group.problems.map(p => p.source)).size > 3 && (
                        <span className="text-xs text-gray-400">+</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Problem details */}
                {group.expanded && (
                  <div className="bg-gray-900">
                    {group.problems.map((problem, index) => (
                      <div
                        key={problem.id}
                        className={clsx(
                          'px-4 py-3 border-l-4 hover:bg-gray-800 cursor-pointer transition-colors',
                          selectedProblem?.id === problem.id && 'bg-blue-950',
                          problem.severity === 'error' && 'border-l-red-500',
                          problem.severity === 'warning' && 'border-l-yellow-500',
                          problem.severity === 'info' && 'border-l-blue-500'
                        )}
                        onClick={() => goToProblem(problem)}
                      >
                        <div className="flex items-start gap-3">
                          {/* Severity icon */}
                          <div className="mt-0.5">
                            {getSeverityIcon(problem.severity)}
                          </div>

                          {/* Problem content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-100 break-words">
                                  {problem.message}
                                </div>

                                {/* Location info */}
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                                  <span>Line {problem.startLineNumber}</span>
                                  {problem.startColumn > 1 && (
                                    <span>Column {problem.startColumn}</span>
                                  )}
                                  <span>•</span>
                                  <span>{problem.source || 'unknown'}</span>
                                </div>

                                {/* Problem code */}
                                {problem.code && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs px-1 py-0.5 bg-gray-700 rounded text-gray-300 font-mono">
                                      {typeof problem.code === 'string' ? problem.code : problem.code.value}
                                    </span>
                                    {typeof problem.code === 'object' && problem.code.target && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          window.open(problem.code!.target, '_blank');
                                        }}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        Documentation
                                      </button>
                                    )}
                                  </div>
                                )}

                                {/* Tags */}
                                {problem.tags && problem.tags.length > 0 && (
                                  <div className="flex items-center gap-1 mt-1">
                                    {problem.tags.map(tag => (
                                      <div key={tag} className="flex items-center gap-1">
                                        {getTagIcon(tag)}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                                {problem.severity === 'error' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Apply quick fix logic
                                    }}
                                    className="p-1 hover:bg-gray-700 rounded text-xs"
                                    title="Quick Fix Available"
                                  >
                                    <Settings className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-t border-gray-700 text-xs">
        <div className="flex items-center gap-4">
          <span>Auto-refresh: {autoRefresh ? 'On' : 'Off'}</span>
          {searchQuery && (
            <span>Filter: "{searchQuery}"</span>
          )}
          {filter.type !== 'all' && (
            <span className={getSeverityColor(filter.type)}>
              {filter.type === 'all' ? 'All Severities' : filter.type.charAt(0).toUpperCase() + filter.type.slice(1)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-gray-400">
          {problemStats.total > 0 && (
            <button
              onClick={clearFilter}
              className="hover:text-white transition-colors"
            >
              Clear Filters
            </button>
          )}
          <span>{problemStats.total} problems</span>
        </div>
      </div>
    </div>
  );
}

export default ProblemsPanel;