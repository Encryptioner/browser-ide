/**
 * Claude Code Panel
 *
 * Agentic coding interface similar to Claude Code CLI
 * Provides natural language coding assistance with tool execution
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { ClaudeCodeAgent, createGLMAgent, createAnthropicAgent } from '@/services/claude-agent';
import { useIDEStore } from '@/store/useIDEStore';
import { fileSystem } from '@/services/filesystem';
import { webContainer } from '@/services/webcontainer';
import { toast } from 'sonner';
import { Check, X, GitBranch, FileText, Terminal, Zap, Users, Clock, ChevronRight, Sparkles, Eye, Code, FilePlus, Layers, Share2, GitMerge, Play, Users2, Bot, MessageSquare, Lightbulb, Bug, Shield, Gauge, Cpu, Wand2, RefreshCw } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  artifacts?: {
    filesCreated?: string[];
    filesModified?: string[];
    filesDeleted?: string[];
    commandsExecuted?: string[];
  };
  pendingChanges?: PendingChange[];
}

interface PendingChange {
  id: string;
  type: 'create' | 'modify' | 'delete' | 'batch';
  filePath: string;
  oldContent?: string;
  newContent?: string;
  status: 'pending' | 'approved' | 'rejected';
  description: string;
  timestamp: number;
  batchId?: string; // For multi-file operations
}

interface MultiFileOperation {
  id: string;
  type: 'batch-refactor' | 'bulk-create' | 'mass-update' | 'template-apply';
  description: string;
  files: PendingChange[];
  status: 'planning' | 'executing' | 'review' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
}

interface CodeTemplate {
  id: string;
  name: string;
  description: string;
  category: 'component' | 'hook' | 'utility' | 'test' | 'api' | 'config';
  template: string;
  variables: TemplateVariable[];
}

interface TemplateVariable {
  name: string;
  type: 'string' | 'boolean' | 'choice';
  description: string;
  default?: string;
  options?: string[]; // For choice type
}

interface TeamSession {
  id: string;
  name: string;
  participants: TeamMember[];
  sharedChanges: SharedChange[];
  isActive: boolean;
  createdAt: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: 'owner' | 'editor' | 'viewer';
  cursor?: { file: string; line: number };
  isOnline: boolean;
}

interface SharedChange {
  id: string;
  authorId: string;
  change: PendingChange;
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  timestamp: number;
  reviews: Review[];
}

interface Review {
  authorId: string;
  status: 'approve' | 'reject' | 'comment';
  comment?: string;
  timestamp: number;
}

interface AIWorkflow {
  id: string;
  title: string;
  status: 'planning' | 'executing' | 'review' | 'completed' | 'failed';
  steps: WorkflowStep[];
  currentStep: number;
  startTime: number;
}

interface WorkflowStep {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  description: string;
  changes?: PendingChange[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  action: () => void;
  category: 'file' | 'git' | 'code' | 'search';
}

// Phase 5: AI Pair Programming & Natural Language Development Interfaces

interface AIPairProgrammingSession {
  id: string;
  name: string;
  isActive: boolean;
  mode: 'collaborative' | 'guided' | 'autonomous';
  aiPersonality: 'mentor' | 'peer' | 'reviewer' | 'architect';
  currentContext: {
    file: string | null;
    language: string;
    task: string | null;
    progress: number;
  };
  conversationHistory: EnhancedMessage[];
  codeSuggestions: CodeSuggestion[];
  realTimeCollaboration: {
    enabled: boolean;
    aiCursors: AICursor[];
    sharedEditor: boolean;
  };
  createdAt: number;
  lastActivity: number;
}

interface CodeSuggestion {
  id: string;
  type: 'completion' | 'refactoring' | 'optimization' | 'bug-fix' | 'feature' | 'test';
  title: string;
  description: string;
  code: string;
  file: string;
  lineStart: number;
  lineEnd: number;
  confidence: number;
  reasoning: string;
  alternatives: string[];
  impact: {
    performance: 'high' | 'medium' | 'low';
    maintainability: 'high' | 'medium' | 'low';
    security: 'improves' | 'neutral' | 'degrades';
  };
  status: 'pending' | 'applied' | 'rejected' | 'modified';
  timestamp: number;
}

interface AICursor {
  id: string;
  file: string;
  line: number;
  column: number;
  type: 'reading' | 'writing' | 'analyzing' | 'explaining';
  message: string;
  isVisible: boolean;
  timestamp: number;
}

interface NaturalLanguageRequest {
  id: string;
  type: 'feature' | 'bug-fix' | 'refactor' | 'test' | 'documentation' | 'optimization' | 'security';
  intent: string;
  context: {
    files: string[];
    language: string;
    framework?: string;
    requirements: string[];
  };
  complexity: 'simple' | 'moderate' | 'complex';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTime: number;
  generatedPlan: ImplementationPlan;
  status: 'analyzing' | 'planning' | 'implementing' | 'testing' | 'completed' | 'failed';
  createdAt: number;
}

interface ImplementationPlan {
  id: string;
  title: string;
  description: string;
  steps: PlanStep[];
  dependencies: string[];
  risks: Risk[];
  estimatedDuration: number;
  complexity: number;
  successCriteria: string[];
}

interface PlanStep {
  id: string;
  title: string;
  description: string;
  type: 'analysis' | 'creation' | 'modification' | 'testing' | 'deployment';
  files: string[];
  estimatedTime: number;
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: string;
}

interface Risk {
  id: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

interface IntelligentDebugging {
  id: string;
  session: string;
  type: 'syntax' | 'runtime' | 'logic' | 'performance' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  file: string;
  line?: number;
  code: string;
  rootCause: string;
  suggestions: DebugSuggestion[];
  autoFixAvailable: boolean;
  status: 'detected' | 'analyzing' | 'fixing' | 'resolved' | 'ignored';
  timestamp: number;
}

interface DebugSuggestion {
  id: string;
  type: 'fix' | 'refactor' | 'optimize' | 'test';
  title: string;
  description: string;
  code: string;
  confidence: number;
  sideEffects: string[];
  appliesTo: string[];
}

interface AutomatedRefactoring {
  id: string;
  type: 'extract-function' | 'rename-variable' | 'optimize-imports' | 'convert-to-async' | 'add-types' | 'remove-dead-code' | 'optimize-algorithm';
  title: string;
  description: string;
  scope: 'file' | 'function' | 'class' | 'project';
  impact: RefactoringImpact;
  changes: RefactoringChange[];
  status: 'analyzing' | 'ready' | 'applying' | 'applied' | 'rollback';
  timestamp: number;
}

interface RefactoringImpact {
  performance: 'improves' | 'neutral' | 'degrades';
  readability: 'improves' | 'neutral' | 'degrades';
  maintainability: 'improves' | 'neutral' | 'degrades';
  breakingChanges: number;
  testCoverage: number;
}

interface RefactoringChange {
  id: string;
  file: string;
  type: 'add' | 'remove' | 'modify';
  lineStart: number;
  lineEnd: number;
  oldCode?: string;
  newCode?: string;
  reason: string;
}

interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'xss' | 'sql-injection' | 'csrf' | 'auth-bypass' | 'data-leak' | 'insecure-config' | 'dependency';
  title: string;
  description: string;
  file: string;
  line?: number;
  code: string;
  cwe: string;
  owasp: string;
  recommendations: SecurityRecommendation[];
  autoFixAvailable: boolean;
  status: 'detected' | 'analyzing' | 'fixing' | 'resolved' | 'ignored';
  timestamp: number;
}

interface SecurityRecommendation {
  id: string;
  priority: number;
  title: string;
  description: string;
  implementation: string;
  code: string;
  impact: string;
}

interface PerformanceOptimization {
  id: string;
  category: 'runtime' | 'memory' | 'network' | 'rendering' | 'database';
  type: 'algorithm' | 'caching' | 'lazy-loading' | 'batching' | 'compression' | 'indexing';
  title: string;
  description: string;
  file: string;
  function?: string;
  currentPerformance: PerformanceMetrics;
  optimizedPerformance: PerformanceMetrics;
  improvement: number;
  implementation: string;
  complexity: 'simple' | 'moderate' | 'complex';
  status: 'detected' | 'analyzing' | 'implementing' | 'applied' | 'rollback';
  timestamp: number;
}

interface PerformanceMetrics {
  timeComplexity: string;
  spaceComplexity: string;
  executionTime: number;
  memoryUsage: number;
  bottlenecks: string[];
}

interface CodeGeneration {
  id: string;
  requirement: string;
  type: 'component' | 'api' | 'service' | 'test' | 'documentation' | 'migration';
  language: string;
  framework?: string;
  generatedCode: GeneratedCode[];
  tests: GeneratedTest[];
  documentation: string;
  quality: CodeQuality;
  status: 'analyzing' | 'generating' | 'testing' | 'completed' | 'failed';
  timestamp: number;
}

interface GeneratedCode {
  id: string;
  file: string;
  content: string;
  language: string;
  purpose: string;
  dependencies: string[];
  exports: string[];
  tests: string[];
}

interface GeneratedTest {
  id: string;
  file: string;
  framework: string;
  type: 'unit' | 'integration' | 'e2e' | 'performance';
  code: string;
  coverage: number;
  scenarios: string[];
}

interface CodeQuality {
  score: number;
  maintainability: number;
  readability: number;
  complexity: number;
  duplication: number;
  security: number;
  performance: number;
  tests: number;
  documentation: number;
}

interface EnhancedMessage extends Message {
  pairProgrammingSession?: string;
  codeSuggestions?: CodeSuggestion[];
  debuggingInfo?: IntelligentDebugging[];
  refactoringInfo?: AutomatedRefactoring[];
  performanceInfo?: PerformanceOptimization[];
  securityInfo?: SecurityVulnerability[];
  naturalLanguageRequest?: NaturalLanguageRequest;
  implementation?: CodeGeneration;
}

interface AIInsight {
  id: string;
  type: 'pattern' | 'best-practice' | 'anti-pattern' | 'optimization' | 'security' | 'performance';
  title: string;
  description: string;
  file: string;
  line?: number;
  code?: string;
  severity: 'info' | 'warning' | 'error';
  actionable: boolean;
  implementation?: string;
  references: string[];
  timestamp: number;
}

interface VoiceCommand {
  id: string;
  command: string;
  intent: string;
  parameters: Record<string, any>;
  confidence: number;
  result?: any;
  status: 'recognized' | 'processing' | 'completed' | 'failed';
  timestamp: number;
}

export function ClaudeCodePanel() {
  const { settings } = useIDEStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: '🚀 Claude Code Agent Ready\n\nI can help you code faster with natural language commands:\n\n• "Create a React component for user authentication"\n• "Add error handling to fetchUser function"\n• "Refactor this code to use async/await"\n• "Find all TODO comments in the project"\n• "Create a git commit for recent changes"\n\nJust type what you need, and I\'ll execute the necessary tasks!',
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [agent, setAgent] = useState<ClaudeCodeAgent | null>(null);
  const [providerType, setProviderType] = useState<'glm' | 'anthropic'>('glm');
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<AIWorkflow | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showPendingChanges, setShowPendingChanges] = useState(false);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [autoApplyChanges, setAutoApplyChanges] = useState(false);

  // Phase 4: Advanced AI Features
  const [multiFileOperations, setMultiFileOperations] = useState<MultiFileOperation[]>([]);
  const [activeOperation, setActiveOperation] = useState<MultiFileOperation | null>(null);
  const [showAdvancedDiff, setShowAdvancedDiff] = useState(false);
  const [selectedChanges, setSelectedChanges] = useState<string[]>([]);
  const [codeTemplates, setCodeTemplates] = useState<CodeTemplate[]>([]);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [teamSession, setTeamSession] = useState<TeamSession | null>(null);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [codeExplanation, setCodeExplanation] = useState<string>('');
  const [showCodeExplanation, setShowCodeExplanation] = useState(false);
  const [sideBySideDiff, setSideBySideDiff] = useState<{old: string; new: string; file: string} | null>(null);

  // Phase 5: AI Pair Programming & Natural Language Development
  const [pairProgrammingSession, setPairProgrammingSession] = useState<AIPairProgrammingSession | null>(null);
  const [showPairProgrammingPanel, setShowPairProgrammingPanel] = useState(false);
  const [naturalLanguageRequests, setNaturalLanguageRequests] = useState<NaturalLanguageRequest[]>([]);
  const [activeNaturalLanguageRequest, setActiveNaturalLanguageRequest] = useState<NaturalLanguageRequest | null>(null);
  const [showNaturalLanguagePanel, setShowNaturalLanguagePanel] = useState(false);
  const [codeSuggestions, setCodeSuggestions] = useState<CodeSuggestion[]>([]);
  const [activeCodeSuggestion, setActiveCodeSuggestion] = useState<CodeSuggestion | null>(null);
  const [showCodeSuggestionsPanel, setShowCodeSuggestionsPanel] = useState(false);
  const [intelligentDebugging, setIntelligentDebugging] = useState<IntelligentDebugging[]>([]);
  const [activeDebuggingSession, setActiveDebuggingSession] = useState<IntelligentDebugging | null>(null);
  const [showDebuggingPanel, setShowDebuggingPanel] = useState(false);
  const [automatedRefactoring, setAutomatedRefactoring] = useState<AutomatedRefactoring[]>([]);
  const [activeRefactoring, setActiveRefactoring] = useState<AutomatedRefactoring | null>(null);
  const [showRefactoringPanel, setShowRefactoringPanel] = useState(false);
  const [securityVulnerabilities, setSecurityVulnerabilities] = useState<SecurityVulnerability[]>([]);
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [performanceOptimizations, setPerformanceOptimizations] = useState<PerformanceOptimization[]>([]);
  const [showPerformancePanel, setShowPerformancePanel] = useState(false);
  const [codeGeneration, setCodeGeneration] = useState<CodeGeneration | null>(null);
  const [showCodeGenerationPanel, setShowCodeGenerationPanel] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [showInsightsPanel, setShowInsightsPanel] = useState(false);
  const [voiceCommands, setVoiceCommands] = useState<VoiceCommand[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [aiPersonality, setAiPersonality] = useState<'mentor' | 'peer' | 'reviewer' | 'architect'>('peer');
  const [pairProgrammingMode, setPairProgrammingMode] = useState<'collaborative' | 'guided' | 'autonomous'>('collaborative');
  const [realTimeCodeAnalysis, setRealTimeCodeAnalysis] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize agent when settings change
  useEffect(() => {
    const apiKey = providerType === 'glm'
      ? settings.ai.glmKey
      : settings.ai.anthropicKey;

    if (apiKey) {
      const newAgent = providerType === 'glm'
        ? createGLMAgent(apiKey)
        : createAnthropicAgent(apiKey);
      setAgent(newAgent);
    }
  }, [settings, providerType]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Quick actions for common tasks
  const quickActions: QuickAction[] = [
    {
      id: 'create-component',
      label: 'Create Component',
      icon: FileText,
      description: 'Generate a new React component',
      category: 'file',
      action: () => setInput('Create a new React component with TypeScript'),
    },
    {
      id: 'git-commit',
      label: 'Git Commit',
      icon: GitBranch,
      description: 'Commit current changes',
      category: 'git',
      action: () => setInput('Review and commit all current changes with an appropriate message'),
    },
    {
      id: 'fix-errors',
      label: 'Fix Errors',
      icon: Zap,
      description: 'Find and fix errors in current file',
      category: 'code',
      action: () => setInput('Find and fix any errors in the current file'),
    },
    {
      id: 'add-types',
      label: 'Add Types',
      icon: Terminal,
      description: 'Add TypeScript types',
      category: 'code',
      action: () => setInput('Add proper TypeScript types to improve type safety'),
    },
  ];

  // Phase 5: Enhanced Quick Actions for AI Pair Programming & Natural Language Development
  const phase5QuickActions: QuickAction[] = [
    {
      id: 'pair-programming',
      label: 'AI Pair Programming',
      icon: Bot,
      description: 'Start AI pair programming session',
      category: 'code',
      action: () => {
        setShowPairProgrammingPanel(true);
        setInput('Start an AI pair programming session to help me with coding');
      },
    },
    {
      id: 'natural-language-dev',
      label: 'Natural Language Dev',
      icon: MessageSquare,
      description: 'Describe what you want to build',
      category: 'code',
      action: () => {
        setShowNaturalLanguagePanel(true);
        setInput('I want to build a user authentication system with React and TypeScript');
      },
    },
    {
      id: 'intelligent-debugging',
      label: 'Intelligent Debugging',
      icon: Bug,
      description: 'AI-powered bug detection and fixing',
      category: 'code',
      action: () => {
        setShowDebuggingPanel(true);
        setInput('Analyze the current code for bugs and suggest fixes');
      },
    },
    {
      id: 'automated-refactoring',
      label: 'Automated Refactoring',
      icon: RefreshCw,
      description: 'AI-suggested code improvements',
      category: 'code',
      action: () => {
        setShowRefactoringPanel(true);
        setInput('Suggest refactoring opportunities for the current codebase');
      },
    },
    {
      id: 'security-scan',
      label: 'Security Scanner',
      icon: Shield,
      description: 'Automated vulnerability detection',
      category: 'code',
      action: () => {
        setShowSecurityPanel(true);
        setInput('Scan the codebase for security vulnerabilities and suggest fixes');
      },
    },
    {
      id: 'performance-optimization',
      label: 'Performance Optimizer',
      icon: Gauge,
      description: 'AI-driven performance improvements',
      category: 'code',
      action: () => {
        setShowPerformancePanel(true);
        setInput('Analyze and optimize the performance of the current code');
      },
    },
    {
      id: 'code-generation',
      label: 'Code Generation',
      icon: Cpu,
      description: 'Generate code from requirements',
      category: 'file',
      action: () => {
        setShowCodeGenerationPanel(true);
        setInput('Generate a complete REST API service for user management');
      },
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      icon: Lightbulb,
      description: 'Get intelligent code insights',
      category: 'code',
      action: () => {
        setShowInsightsPanel(true);
        setInput('Provide insights and recommendations for improving the codebase');
      },
    },
  ];

  // Combine Phase 4 and Phase 5 quick actions
  const allQuickActions = [...quickActions, ...phase5QuickActions];

  // Process pending changes
  const processPendingChange = useCallback(async (change: PendingChange, approved: boolean) => {
    try {
      if (approved) {
        switch (change.type) {
          case 'create':
          case 'modify':
            if (change.newContent) {
              await fileSystem.writeFile(change.filePath, change.newContent);
              toast.success(`✅ Applied: ${change.description}`);

              // File has been applied successfully
              console.log(`File ${change.type === 'create' ? 'created' : 'modified'}: ${change.filePath}`);
            }
            break;

          case 'delete':
            // Note: deleteFile would need to be implemented in fileSystem
            toast.success(`🗑️ Would delete: ${change.filePath}`);
            break;
        }

        // Update change status
        setPendingChanges(prev =>
          prev.map(c => c.id === change.id ? { ...c, status: 'approved' } : c)
        );
      } else {
        // Rejected change
        setPendingChanges(prev =>
          prev.map(c => c.id === change.id ? { ...c, status: 'rejected' } : c)
        );
        toast.info(`❌ Rejected: ${change.description}`);
      }
    } catch (error: any) {
      toast.error(`Failed to process change: ${error?.message || error}`);
    }
  }, []);

  // Apply all approved changes
  const applyApprovedChanges = useCallback(async () => {
    const approvedChanges = pendingChanges.filter(c => c.status === 'approved');

    for (const change of approvedChanges) {
      await processPendingChange(change, true);
    }

    setPendingChanges(prev => prev.filter(c => c.status !== 'approved'));
    toast.success(`✅ Applied ${approvedChanges.length} changes`);
  }, [pendingChanges, processPendingChange]);

  // Enhanced task execution with real-time updates
  const executeTaskWithWorkflow = useCallback(async (task: string) => {
    if (!agent) return;

    const workflow: AIWorkflow = {
      id: Date.now().toString(),
      title: task,
      status: 'planning',
      steps: [],
      currentStep: 0,
      startTime: Date.now(),
    };

    setActiveWorkflow(workflow);

    try {
      // Create workflow steps
      workflow.steps = [
        {
          id: '1',
          title: 'Analyzing request',
          status: 'pending',
          description: 'Understanding the task requirements',
        },
        {
          id: '2',
          title: 'Planning changes',
          status: 'pending',
          description: 'Creating a plan for implementation',
        },
        {
          id: '3',
          title: 'Executing changes',
          status: 'pending',
          description: 'Making the necessary code modifications',
        },
        {
          id: '4',
          title: 'Review',
          status: 'pending',
          description: 'Reviewing changes for approval',
        },
      ];

      workflow.status = 'executing';
      setActiveWorkflow({ ...workflow });

      // Execute with progress updates
      const result = await agent.executeTask(task, (progress) => {
        // Update workflow step based on progress
        if (progress.includes('Analyzing')) {
          workflow.steps[0].status = 'in_progress';
        } else if (progress.includes('Planning')) {
          workflow.steps[0].status = 'completed';
          workflow.steps[1].status = 'in_progress';
        } else if (progress.includes('Executing')) {
          workflow.steps[1].status = 'completed';
          workflow.steps[2].status = 'in_progress';
        } else if (progress.includes('Review')) {
          workflow.steps[2].status = 'completed';
          workflow.steps[3].status = 'in_progress';
        }

        setActiveWorkflow({ ...workflow });
      });

      workflow.status = result.success ? 'review' : 'failed';
      workflow.steps.forEach(step => {
        if (step.status === 'in_progress') {
          step.status = result.success ? 'completed' : 'failed';
        }
      });

      setActiveWorkflow({ ...workflow });

      if (result.success) {
        // Process changes from result
        const changes: PendingChange[] = [];

        if (result.artifacts?.filesCreated) {
          for (const filePath of result.artifacts.filesCreated) {
            changes.push({
              id: `create-${Date.now()}-${Math.random()}`,
              type: 'create',
              filePath,
              newContent: '', // Would be populated by agent
              status: 'pending',
              description: `Create new file: ${filePath}`,
              timestamp: Date.now(),
            });
          }
        }

        if (result.artifacts?.filesModified) {
          for (const filePath of result.artifacts.filesModified) {
            changes.push({
              id: `modify-${Date.now()}-${Math.random()}`,
              type: 'modify',
              filePath,
              oldContent: '', // Would be populated by reading current file
              newContent: '', // Would be populated by agent
              status: 'pending',
              description: `Modify file: ${filePath}`,
              timestamp: Date.now(),
            });
          }
        }

        setPendingChanges(prev => [...prev, ...changes]);

        if (autoApplyChanges) {
          // Auto-apply if enabled
          for (const change of changes) {
            await processPendingChange(change, true);
          }
        } else {
          setShowPendingChanges(true);
        }
      }

      return result;
    } catch (error) {
      workflow.status = 'failed';
      setActiveWorkflow({ ...workflow });
      throw error;
    }
  }, [agent, autoApplyChanges, processPendingChange]);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages((prev) => [
      ...prev,
      {
        ...message,
        id: Date.now().toString(),
        timestamp: Date.now(),
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !agent || isProcessing) return;

    const userMessage = input.trim();
    setInput('');
    setIsProcessing(true);

    // Add user message
    addMessage({
      role: 'user',
      content: userMessage,
    });

    try {
      // Execute with enhanced workflow
      const result = await executeTaskWithWorkflow(userMessage);

      if (result && result.success) {
        addMessage({
          role: 'assistant',
          content: result.output || 'Task completed successfully!',
          artifacts: result.artifacts,
          pendingChanges: pendingChanges.filter(c => c.status === 'pending'),
        });
      } else {
        addMessage({
          role: 'assistant',
          content: `❌ Error: ${result?.error || 'Unknown error'}`,
        });
      }
    } catch (error: any) {
      addMessage({
        role: 'assistant',
        content: `❌ Unexpected error: ${error.message}`,
      });
    } finally {
      setIsProcessing(false);
      setActiveWorkflow(null);
    }
  };

  const clearHistory = () => {
    agent?.clearHistory();
    setMessages([
      {
        id: '1',
        role: 'system',
        content: '🔄 History cleared. How can I help you?',
        timestamp: Date.now(),
      },
    ]);
    setPendingChanges([]);
    setActiveWorkflow(null);
    setMultiFileOperations([]);
    setActiveOperation(null);
  };

  // Phase 4: Multi-file Operations
  const executeMultiFileOperation = useCallback(async (operation: MultiFileOperation) => {
    setActiveOperation(operation);

    try {
      // Update operation status
      operation.status = 'executing';
      setMultiFileOperations(prev =>
        prev.map(op => op.id === operation.id ? { ...op, status: 'executing' } : op)
      );

      for (const change of operation.files) {
        if (change.status === 'pending') {
          await processPendingChange(change, true);
        }
      }

      operation.status = 'completed';
      operation.endTime = Date.now();
      setMultiFileOperations(prev =>
        prev.map(op => op.id === operation.id ? operation : op)
      );

      toast.success(`✅ Multi-file operation completed: ${operation.description}`);
    } catch (error: any) {
      operation.status = 'failed';
      operation.endTime = Date.now();
      setMultiFileOperations(prev =>
        prev.map(op => op.id === operation.id ? operation : op)
      );
      toast.error(`❌ Multi-file operation failed: ${error.message}`);
    } finally {
      setActiveOperation(null);
    }
  }, [processPendingChange]);

  const createBatchRefactor = useCallback(async (description: string, files: string[]) => {
    if (!agent) return;

    const operation: MultiFileOperation = {
      id: Date.now().toString(),
      type: 'batch-refactor',
      description,
      files: [],
      status: 'planning',
      startTime: Date.now(),
    };

    setMultiFileOperations(prev => [...prev, operation]);

    // Analyze files and create changes
    for (const filePath of files) {
      try {
        const result = await fileSystem.readFile(filePath);
        if (result.success && result.data) {
          const analysisPrompt = `Analyze this file for refactoring opportunities: ${filePath}\n\n${result.data}`;
          // This would use the AI agent to suggest refactoring
          // For now, we'll create a placeholder change
          const change: PendingChange = {
            id: `${operation.id}-${filePath}`,
            type: 'modify',
            filePath,
            oldContent: result.data,
            newContent: result.data, // Would be AI-refactored content
            status: 'pending',
            description: `Refactor ${filePath}`,
            timestamp: Date.now(),
            batchId: operation.id,
          };
          operation.files.push(change);
        }
      } catch (error: any) {
        console.error(`Failed to analyze file ${filePath}:`, error);
      }
    }

    setMultiFileOperations(prev =>
      prev.map(op => op.id === operation.id ? operation : op)
    );
  }, [agent]);

  // Phase 4: Advanced Diffing
  const showSideBySideDiff = useCallback(async (filePath: string) => {
    try {
      const currentResult = await fileSystem.readFile(filePath);
      if (!currentResult.success) return;

      // Find pending change for this file
      const pendingChange = pendingChanges.find(c => c.filePath === filePath);
      if (!pendingChange || !pendingChange.newContent) return;

      setSideBySideDiff({
        old: currentResult.data || '',
        new: pendingChange.newContent,
        file: filePath,
      });
      setShowAdvancedDiff(true);
    } catch (error: any) {
      toast.error(`Failed to load diff: ${error.message}`);
    }
  }, [pendingChanges]);

  const closeAdvancedDiff = () => {
    setShowAdvancedDiff(false);
    setSideBySideDiff(null);
  };

  // Phase 4: Code Templates
  const loadCodeTemplates = useCallback(() => {
    const templates: CodeTemplate[] = [
      {
        id: 'react-component-ts',
        name: 'React Component (TypeScript)',
        description: 'A complete React component with TypeScript and hooks',
        category: 'component',
        template: `import React, { useState, useEffect } from 'react';

interface {{ComponentName}}Props {
  {{#each props}}
  {{name}}: {{type}};
  {{/each}}
}

export const {{ComponentName}}: React.FC<{{ComponentName}}Props> = ({{#if hasProps}}{ {{#each props}}{{name}}, {{/each}} }{{/if}}) => {
  const [state, setState] = useState<{{StateType}}>({{defaultValue}});

  useEffect(() => {
    // Component logic here
  }, []);

  return (
    <div className="{{className}}">
      <h1>{{title}}</h1>
      {/* Component content */}
    </div>
  );
};

export default {{ComponentName}};`,
        variables: [
          { name: 'ComponentName', type: 'string', description: 'Component name' },
          { name: 'hasProps', type: 'boolean', description: 'Does component have props?', default: 'true' },
          { name: 'StateType', type: 'string', description: 'State type', default: 'any' },
          { name: 'defaultValue', type: 'string', description: 'Default state value', default: 'null' },
          { name: 'className', type: 'string', description: 'CSS class name', default: 'component' },
          { name: 'title', type: 'string', description: 'Component title', default: 'Component' },
        ],
      },
      {
        id: 'api-service',
        name: 'API Service',
        description: 'A service class for API interactions',
        category: 'api',
        template: `import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface {{ResponseType}} {
  {{#each responseFields}}
  {{name}}: {{type}};
  {{/each}}
}

export class {{ServiceName}} {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: {{timeout}},
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async {{methodName}}({{#if hasParams}}params: {{ParamType}}{{/if}}): Promise<{{ResponseType}}> {
    try {
      const response: AxiosResponse<{{ResponseType}}> = await this.client.{{method}}(
        '{{endpoint}}'{{#if hasParams}}, params{{/if}}
      );
      return response.data;
    } catch (error) {
      throw new Error(\`{{errorMessage}}: \${error}\`);
    }
  }
}

export const {{serviceNameInstance}} = new {{ServiceName}}('{{baseURL}}');`,
        variables: [
          { name: 'ServiceName', type: 'string', description: 'Service class name' },
          { name: 'serviceNameInstance', type: 'string', description: 'Instance variable name' },
          { name: 'ResponseType', type: 'string', description: 'Response type name' },
          { name: 'methodName', type: 'string', description: 'API method name' },
          { name: 'endpoint', type: 'string', description: 'API endpoint' },
          { name: 'method', type: 'choice', description: 'HTTP method', options: ['get', 'post', 'put', 'delete'], default: 'get' },
          { name: 'hasParams', type: 'boolean', description: 'Does method accept parameters?', default: 'false' },
          { name: 'ParamType', type: 'string', description: 'Parameter type', default: 'any' },
          { name: 'baseURL', type: 'string', description: 'Base URL', default: '/api' },
          { name: 'timeout', type: 'string', description: 'Request timeout', default: '10000' },
          { name: 'errorMessage', type: 'string', description: 'Error message prefix', default: 'API request failed' },
        ],
      },
    ];

    setCodeTemplates(templates);
  }, []);

  const applyCodeTemplate = useCallback(async (template: CodeTemplate, values: Record<string, any>, filePath: string) => {
    try {
      // Simple template substitution (in production, use a proper template engine)
      let content = template.template;

      // Replace {{variables}} with values
      Object.entries(values).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, String(value));
      });

      // Handle conditional blocks (simplified)
      content = content.replace(/{{#if (\w+)}}(.*?){{\/if}}/g, (match: string, condition: string, contentBlock: string) => {
        return values[condition] ? contentBlock : '';
      });

      // Handle loops (simplified)
      content = content.replace(/{{#each (\w+)}}(.*?){{\/each}}/g, (match: string, arrayName: string, contentBlock: string) => {
        const array = values[arrayName];
        if (!Array.isArray(array)) return '';
        return array.map((item: any) =>
          contentBlock.replace(/{{(\w+)}}/g, (subMatch: string, prop: string) => item[prop] || '')
        ).join('\n');
      });

      await fileSystem.writeFile(filePath, content);
      toast.success(`✅ Template applied: ${template.name}`);
    } catch (error: any) {
      toast.error(`❌ Failed to apply template: ${error.message}`);
    }
  }, []);

  // Phase 4: Team Collaboration
  const createTeamSession = useCallback((name: string) => {
    const session: TeamSession = {
      id: Date.now().toString(),
      name,
      participants: [
        {
          id: 'current-user',
          name: 'You',
          role: 'owner',
          isOnline: true,
        },
      ],
      sharedChanges: [],
      isActive: true,
      createdAt: Date.now(),
    };

    setTeamSession(session);
    setShowTeamPanel(true);
    toast.success(`✅ Team session created: ${name}`);
  }, []);

  const joinTeamSession = useCallback((sessionId: string) => {
    // In a real implementation, this would connect to a collaboration server
    // For now, we'll simulate joining a session
    const session: TeamSession = {
      id: sessionId,
      name: 'Collaboration Session',
      participants: [
        {
          id: 'current-user',
          name: 'You',
          role: 'editor',
          isOnline: true,
        },
        {
          id: 'other-user',
          name: 'Team Member',
          role: 'editor',
          isOnline: true,
          cursor: { file: 'src/App.tsx', line: 42 },
        },
      ],
      sharedChanges: [],
      isActive: true,
      createdAt: Date.now(),
    };

    setTeamSession(session);
    setShowTeamPanel(true);
    toast.success(`✅ Joined team session`);
  }, []);

  const shareChangeWithTeam = useCallback((change: PendingChange) => {
    if (!teamSession) return;

    const sharedChange: SharedChange = {
      id: Date.now().toString(),
      authorId: 'current-user',
      change,
      status: 'pending',
      timestamp: Date.now(),
      reviews: [],
    };

    setTeamSession(prev => prev ? {
      ...prev,
      sharedChanges: [...prev.sharedChanges, sharedChange],
    } : null);

    toast.success(`✅ Change shared with team`);
  }, [teamSession]);

  // Phase 4: Code Explanation
  const explainCode = useCallback(async (code: string, context?: string) => {
    if (!agent) return;

    try {
      const prompt = `Explain this code in detail${context ? ` in the context of: ${context}` : ''}:\n\n\`\`\`\n${code}\n\`\`\``;

      const result = await agent.executeTask(prompt);

      if (result.success && result.output) {
        setCodeExplanation(result.output);
        setShowCodeExplanation(true);
        toast.success('✅ Code explanation generated');
      } else {
        toast.error(`❌ Failed to explain code: ${result?.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      toast.error(`❌ Error explaining code: ${error.message}`);
    }
  }, [agent]);

  // Phase 4: WebContainer Integration
  const executeCodeInWebContainer = useCallback(async (code: string, language: 'javascript' | 'python' | 'typescript' = 'javascript') => {
    try {
      console.log(`🚀 Executing ${language} code in WebContainer...`);

      let result;
      switch (language) {
        case 'javascript':
          // For JavaScript, we'll write to a file and execute via spawn
          const jsWriteResult = await webContainer.writeFile('temp.js', code);
          if (jsWriteResult.success) {
            result = await webContainer.spawn('node', ['temp.js']);
          } else {
            result = { success: false, error: 'Failed to write JavaScript file' };
          }
          break;
        case 'python':
          // For Python, write to file and execute
          const pyWriteResult = await webContainer.writeFile('temp.py', code);
          if (pyWriteResult.success) {
            result = await webContainer.spawn('python3', ['temp.py']);
          } else {
            result = { success: false, error: 'Failed to write Python file' };
          }
          break;
        case 'typescript':
          // For TypeScript, compile then run
          const tsWriteResult = await webContainer.writeFile('temp.ts', code);
          if (tsWriteResult.success) {
            const compileResult = await webContainer.spawn('npx', ['tsc', 'temp.ts', '--noEmit', '--target', 'ES2020']);
            if (compileResult.success) {
              result = await webContainer.spawn('node', ['temp.js']);
            } else {
              result = compileResult;
            }
          } else {
            result = { success: false, error: 'Failed to write TypeScript file' };
          }
          break;
        default:
          result = { success: false, error: `Unsupported language: ${language}` };
      }

      if (result.success) {
        toast.success(`✅ ${language} code executed successfully`);
        if (result.stdout) {
          // Add execution result to messages
          addMessage({
            role: 'system',
            content: `📤 ${language} Execution Output:\n\n\`\`\`\n${result.stdout}\n\`\`\``,
          });
        }
        return { success: true, output: result.stdout };
      } else {
        toast.error(`❌ ${language} execution failed: ${result.error}`);
        if (result.stderr) {
          addMessage({
            role: 'system',
            content: `❌ ${language} Execution Error:\n\n\`\`\`\n${result.stderr}\n\`\`\``,
          });
        }
        return { success: false, error: result.error, output: result.stderr };
      }
    } catch (error: any) {
      toast.error(`❌ Failed to execute code: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, [addMessage]);

  const startDevelopmentServer = useCallback(async (port = 3000) => {
    try {
      console.log(`🌐 Starting development server on port ${port}...`);

      const result = await webContainer.run('dev', ['--', '--port', port.toString()]);

      if (result.success) {
        toast.success(`✅ Development server started on port ${port}`);
        const serverUrl = webContainer.getServerUrl();
        if (serverUrl) {
          addMessage({
            role: 'system',
            content: `🌐 Development server is running at: ${serverUrl}`,
          });
        }
        return { success: true, url: serverUrl };
      } else {
        toast.error(`❌ Failed to start development server: ${result.error}`);
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      toast.error(`❌ Failed to start server: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, [addMessage]);

  const installDependencies = useCallback(async (packages: string[], isDev = false) => {
    try {
      console.log(`📦 Installing packages: ${packages.join(', ')}`);

      for (const pkg of packages) {
        const result = await webContainer.exec('npm', [isDev ? 'install' : 'install', '--save', pkg]);

        if (result.success) {
          toast.success(`✅ Package installed: ${pkg}`);
        } else {
          toast.error(`❌ Failed to install ${pkg}: ${result.error}`);
        }
      }

      return { success: true };
    } catch (error: any) {
      toast.error(`❌ Failed to install packages: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, []);

  const setupProjectFromTemplate = useCallback(async (template: CodeTemplate, values: Record<string, any>) => {
    try {
      console.log(`🔧 Setting up project from template: ${template.name}`);

      // Get runtime info from template
      const runtime = webContainer.getRuntimes()[template.category] || webContainer.getRuntimes()['javascript'];

      // Substitute template variables
      let projectFiles = { ...runtime.files };
      Object.entries(runtime.files).forEach(([filePath, content]) => {
        let processedContent = content;
        Object.entries(values).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          processedContent = processedContent.replace(regex, String(value));
        });
        projectFiles[filePath] = processedContent;
      });

      // Setup WebContainer project
      const setupResult = await webContainer.setupProject({
        ...runtime,
        files: projectFiles,
      });

      if (setupResult.success) {
        toast.success(`✅ Project setup complete: ${template.name}`);

        // Install dependencies
        if (runtime.dependencies || runtime.devDependencies) {
          const allDeps = [
            ...Object.keys(runtime.dependencies || {}),
            ...Object.keys(runtime.devDependencies || {})
          ];
          await installDependencies(allDeps, Object.keys(runtime.devDependencies || {}).length > 0);
        }

        addMessage({
          role: 'system',
          content: `🎉 Project "${template.name}" has been set up successfully!\n\nFiles created:\n${Object.keys(projectFiles).map(f => `  • ${f}`).join('\n')}`,
        });

        return { success: true };
      } else {
        toast.error(`❌ Project setup failed: ${setupResult.error}`);
        return { success: false, error: setupResult.error };
      }
    } catch (error: any) {
      toast.error(`❌ Failed to setup project: ${error.message}`);
      return { success: false, error: error.message };
    }
  }, [installDependencies, addMessage]);

  // Phase 5: AI Pair Programming & Natural Language Development Functions

  // AI Pair Programming Session Management
  const startPairProgrammingSession = useCallback(async (mode: 'collaborative' | 'guided' | 'autonomous' = 'collaborative') => {
    if (!agent) return;

    try {
      const session: AIPairProgrammingSession = {
        id: Date.now().toString(),
        name: `AI Pair Programming Session ${new Date().toLocaleTimeString()}`,
        isActive: true,
        mode,
        aiPersonality: aiPersonality,
        currentContext: {
          file: null,
          language: 'typescript',
          task: null,
          progress: 0,
        },
        conversationHistory: messages,
        codeSuggestions: [],
        realTimeCollaboration: {
          enabled: true,
          aiCursors: [],
          sharedEditor: true,
        },
        createdAt: Date.now(),
        lastActivity: Date.now(),
      };

      setPairProgrammingSession(session);
      setShowPairProgrammingPanel(true);

      const greeting = mode === 'collaborative'
        ? `🤝 Let's code together! I'm your ${aiPersonality} AI pair programming partner. What are we working on today?`
        : mode === 'guided'
        ? `🎯 I'll guide you through the coding process step by step. What would you like to build?`
        : `🚀 I'll handle the heavy lifting! Just tell me what you need, and I'll code it for you.`;

      addMessage({
        id: Date.now().toString(),
        role: 'assistant',
        content: greeting,
        timestamp: Date.now(),
      });

      toast.success('✅ AI Pair Programming session started');
    } catch (error: any) {
      toast.error(`❌ Failed to start pair programming session: ${error.message}`);
    }
  }, [agent, aiPersonality, messages, addMessage]);

  const endPairProgrammingSession = useCallback(() => {
    if (pairProgrammingSession) {
      setPairProgrammingSession(null);
      setShowPairProgrammingPanel(false);

      addMessage({
        id: Date.now().toString(),
        role: 'system',
        content: `👋 Pair programming session ended. Great work collaborating!`,
        timestamp: Date.now(),
      });

      toast.success('✅ AI Pair Programming session ended');
    }
  }, [pairProgrammingSession, addMessage]);

  // Natural Language Development
  const processNaturalLanguageRequest = useCallback(async (request: string) => {
    if (!agent) return;

    try {
      const nlRequest: NaturalLanguageRequest = {
        id: Date.now().toString(),
        type: 'feature',
        intent: request,
        context: {
          files: [],
          language: 'typescript',
          framework: 'react',
          requirements: [],
        },
        complexity: 'moderate',
        priority: 'medium',
        estimatedTime: 300000, // 5 minutes
        generatedPlan: {
          id: Date.now().toString(),
          title: `Implement: ${request}`,
          description: `Generate code based on natural language request: "${request}"`,
          steps: [],
          dependencies: [],
          risks: [],
          estimatedDuration: 300000,
          complexity: 0.5,
          successCriteria: [],
        },
        status: 'analyzing',
        createdAt: Date.now(),
      };

      setActiveNaturalLanguageRequest(nlRequest);
      setNaturalLanguageRequests(prev => [...prev, nlRequest]);

      // Update status
      nlRequest.status = 'planning';
      setActiveNaturalLanguageRequest({ ...nlRequest });

      const planningPrompt = `Analyze this natural language development request and create a detailed implementation plan:

Request: "${request}"

Please provide:
1. Implementation steps
2. Required files
3. Dependencies
4. Potential risks
5. Estimated complexity
6. Success criteria

Format as a structured plan that I can review before implementation.`;

      const result = await agent.executeTask(planningPrompt);

      if (result.success && result.output) {
        // Parse the AI response to create implementation plan
        nlRequest.generatedPlan.description = result.output;
        nlRequest.status = 'implementing';
        setActiveNaturalLanguageRequest({ ...nlRequest });

        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: `📋 **Implementation Plan Created**\n\n${result.output}\n\nWould you like me to proceed with the implementation?`,
          timestamp: Date.now(),
        });

        // Generate code
        const implementationPrompt = `Based on the request "${request}", please generate complete, production-ready code. Include:

1. All necessary files with proper imports and exports
2. TypeScript types and interfaces
3. Error handling
4. Documentation comments
5. Unit tests where applicable

Focus on clean, maintainable, and well-structured code.`;

        const codeResult = await agent.executeTask(implementationPrompt);

        if (codeResult.success && codeResult.output) {
          const codeGeneration: CodeGeneration = {
            id: Date.now().toString(),
            requirement: request,
            type: 'component',
            language: 'typescript',
            framework: 'react',
            generatedCode: [{
              id: Date.now().toString(),
              file: 'generated-component.tsx',
              content: codeResult.output,
              language: 'typescript',
              purpose: request,
              dependencies: [],
              exports: [],
              tests: [],
            }],
            tests: [],
            documentation: `Generated from natural language request: "${request}"`,
            quality: {
              score: 0.8,
              maintainability: 0.8,
              readability: 0.9,
              complexity: 0.5,
              duplication: 0.1,
              security: 0.8,
              performance: 0.7,
              tests: 0.6,
              documentation: 0.9,
            },
            status: 'completed',
            timestamp: Date.now(),
          };

          setCodeGeneration(codeGeneration);
          setShowCodeGenerationPanel(true);

          nlRequest.status = 'completed';
          setActiveNaturalLanguageRequest({ ...nlRequest });

          // Create pending change for the generated code
          const change: PendingChange = {
            id: Date.now().toString(),
            type: 'create',
            filePath: 'generated-component.tsx',
            newContent: codeResult.output,
            status: 'pending',
            description: `Generated from natural language: "${request}"`,
            timestamp: Date.now(),
          };

          setPendingChanges(prev => [...prev, change]);

          addMessage({
            id: Date.now().toString(),
            role: 'assistant',
            content: `✅ **Code Generated Successfully**\n\nI've created the component based on your request. You can review the generated code in the Code Generation panel and apply it when ready.`,
            naturalLanguageRequest: nlRequest,
            implementation: codeGeneration,
            timestamp: Date.now(),
          });

          toast.success('✅ Natural language development completed');
        } else {
          toast.error(`❌ Code generation failed: ${codeResult?.error || 'Unknown error'}`);
          nlRequest.status = 'failed';
          setActiveNaturalLanguageRequest({ ...nlRequest });
        }
      } else {
        toast.error(`❌ Planning failed: ${result?.error || 'Unknown error'}`);
        nlRequest.status = 'failed';
        setActiveNaturalLanguageRequest({ ...nlRequest });
      }
    } catch (error: any) {
      toast.error(`❌ Natural language development failed: ${error.message}`);
    }
  }, [agent, addMessage]);

  // Intelligent Debugging
  const startIntelligentDebugging = useCallback(async (filePath?: string) => {
    if (!agent) return;

    try {
      const debuggingSession: IntelligentDebugging = {
        id: Date.now().toString(),
        session: Date.now().toString(),
        type: 'runtime',
        severity: 'medium',
        title: 'AI-Powered Code Analysis',
        description: 'Analyzing code for potential bugs and issues',
        file: filePath || 'current file',
        code: '',
        rootCause: '',
        suggestions: [],
        autoFixAvailable: true,
        status: 'detected',
        timestamp: Date.now(),
      };

      setActiveDebuggingSession(debuggingSession);
      setIntelligentDebugging(prev => [...prev, debuggingSession]);
      setShowDebuggingPanel(true);

      let codeToAnalyze = '';
      if (filePath) {
        const fileResult = await fileSystem.readFile(filePath);
        if (fileResult.success) {
          codeToAnalyze = fileResult.data || '';
        }
      }

      const debuggingPrompt = `Please analyze this code for potential bugs, issues, and improvements:

${codeToAnalyze ? `Code to analyze:\n\`\`\`\n${codeToAnalyze}\n\`\`\`` : 'Analyze the current project files'}

Focus on:
1. Runtime errors and exceptions
2. Logic errors and edge cases
3. Performance bottlenecks
4. Security vulnerabilities
5. TypeScript type issues
6. Best practices violations

For each issue found, provide:
- Severity level (low/medium/high/critical)
- Location (file and line number if applicable)
- Root cause analysis
- Specific fix suggestions with code examples
- Prevention strategies`;

      debuggingSession.status = 'analyzing';
      setActiveDebuggingSession({ ...debuggingSession });

      const result = await agent.executeTask(debuggingPrompt);

      if (result.success && result.output) {
        debuggingSession.status = 'resolved';
        debuggingSession.description = result.output;
        setActiveDebuggingSession({ ...debuggingSession });

        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: `🔍 **Intelligent Debugging Complete**\n\n${result.output}`,
          debuggingInfo: [debuggingSession],
          timestamp: Date.now(),
        });

        toast.success('✅ Intelligent debugging completed');
      } else {
        toast.error(`❌ Debugging analysis failed: ${result?.error || 'Unknown error'}`);
        debuggingSession.status = 'failed';
        setActiveDebuggingSession({ ...debuggingSession });
      }
    } catch (error: any) {
      toast.error(`❌ Intelligent debugging failed: ${error.message}`);
    }
  }, [agent, addMessage]);

  // Automated Refactoring
  const startAutomatedRefactoring = useCallback(async (scope: 'file' | 'function' | 'class' | 'project' = 'file') => {
    if (!agent) return;

    try {
      const refactoring: AutomatedRefactoring = {
        id: Date.now().toString(),
        type: 'extract-function',
        title: 'AI-Powered Refactoring Analysis',
        description: `Analyzing code for refactoring opportunities at ${scope} level`,
        scope,
        impact: {
          performance: 'improves',
          readability: 'improves',
          maintainability: 'improves',
          breakingChanges: 0,
          testCoverage: 0.8,
        },
        changes: [],
        status: 'analyzing',
        timestamp: Date.now(),
      };

      setActiveRefactoring(refactoring);
      setAutomatedRefactoring(prev => [...prev, refactoring]);
      setShowRefactoringPanel(true);

      const refactoringPrompt = `Please analyze the current codebase for refactoring opportunities. Focus on:

1. Code duplication and repeated patterns
2. Long functions that can be broken down
3. Complex conditional logic that can be simplified
4. Magic numbers and strings that should be constants
5. Inefficient algorithms or data structures
6. Missing error handling
7. Opportunities for design patterns
8. Type safety improvements
9. Performance optimizations
10. Modern JavaScript/TypeScript features

For each opportunity, provide:
- Type of refactoring needed
- Current code snippet
- Refactored code snippet
- Benefits of the change
- Risk assessment
- Estimated effort`;

      refactoring.status = 'ready';
      setActiveRefactoring({ ...refactoring });

      const result = await agent.executeTask(refactoringPrompt);

      if (result.success && result.output) {
        refactoring.status = 'applied';
        refactoring.description = result.output;
        setActiveRefactoring({ ...refactoring });

        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: `🔧 **Automated Refactoring Analysis Complete**\n\n${result.output}`,
          refactoringInfo: [refactoring],
          timestamp: Date.now(),
        });

        toast.success('✅ Automated refactoring analysis completed');
      } else {
        toast.error(`❌ Refactoring analysis failed: ${result?.error || 'Unknown error'}`);
        refactoring.status = 'failed';
        setActiveRefactoring({ ...refactoring });
      }
    } catch (error: any) {
      toast.error(`❌ Automated refactoring failed: ${error.message}`);
    }
  }, [agent, addMessage]);

  // Security Vulnerability Scanning
  const startSecurityScan = useCallback(async () => {
    if (!agent) return;

    try {
      const securityScan: SecurityVulnerability = {
        id: Date.now().toString(),
        severity: 'medium',
        type: 'xss',
        title: 'AI-Powered Security Analysis',
        description: 'Scanning codebase for security vulnerabilities',
        file: 'project files',
        code: '',
        cwe: 'CWE-79',
        owasp: 'A03:2021 – Injection',
        recommendations: [],
        autoFixAvailable: true,
        status: 'detected',
        timestamp: Date.now(),
      };

      setSecurityVulnerabilities(prev => [...prev, securityScan]);
      setShowSecurityPanel(true);

      const securityPrompt = `Please perform a comprehensive security analysis of the codebase. Check for:

1. **Injection Vulnerabilities**
   - SQL injection
   - XSS (Cross-Site Scripting)
   - Command injection
   - LDAP injection

2. **Authentication & Authorization**
   - Weak password policies
   - Session management issues
   - Improper access controls
   - Missing authentication

3. **Data Exposure**
   - Sensitive data in logs
   - Unencrypted data transmission
   - Information leakage in error messages

4. **Cryptography Issues**
   - Weak encryption algorithms
   - Hardcoded secrets/keys
   - Insecure random number generation

5. **Configuration & Infrastructure**
   - Insecure defaults
   - Exposed admin interfaces
   - Missing security headers
   - CORS misconfigurations

6. **Dependencies**
   - Vulnerable third-party packages
   - Outdated libraries

For each vulnerability found, provide:
- Severity level (low/medium/high/critical)
- CWE identifier
- OWASP category
- Location in code
- Detailed explanation
- Secure code example
- Prevention strategies

Format the analysis as a comprehensive security report.`;

      securityScan.status = 'analyzing';
      setSecurityVulnerabilities(prev => prev.map(s => s.id === securityScan.id ? securityScan : s));

      const result = await agent.executeTask(securityPrompt);

      if (result.success && result.output) {
        securityScan.status = 'resolved';
        securityScan.description = result.output;
        setSecurityVulnerabilities(prev => prev.map(s => s.id === securityScan.id ? securityScan : s));

        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: `🔒 **Security Analysis Complete**\n\n${result.output}`,
          securityInfo: [securityScan],
          timestamp: Date.now(),
        });

        toast.success('✅ Security vulnerability scan completed');
      } else {
        toast.error(`❌ Security scan failed: ${result?.error || 'Unknown error'}`);
        securityScan.status = 'failed';
        setSecurityVulnerabilities(prev => prev.map(s => s.id === securityScan.id ? securityScan : s));
      }
    } catch (error: any) {
      toast.error(`❌ Security scan failed: ${error.message}`);
    }
  }, [agent, addMessage]);

  // Performance Optimization
  const startPerformanceOptimization = useCallback(async () => {
    if (!agent) return;

    try {
      const optimization: PerformanceOptimization = {
        id: Date.now().toString(),
        category: 'runtime',
        type: 'algorithm',
        title: 'AI-Powered Performance Analysis',
        description: 'Analyzing codebase for performance optimization opportunities',
        file: 'project files',
        currentPerformance: {
          timeComplexity: 'O(n²)',
          spaceComplexity: 'O(n)',
          executionTime: 1000,
          memoryUsage: 50,
          bottlenecks: [],
        },
        optimizedPerformance: {
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(1)',
          executionTime: 100,
          memoryUsage: 25,
          bottlenecks: [],
        },
        improvement: 90,
        implementation: '',
        complexity: 'moderate',
        status: 'detected',
        timestamp: Date.now(),
      };

      setPerformanceOptimizations(prev => [...prev, optimization]);
      setShowPerformancePanel(true);

      const performancePrompt = `Please perform a comprehensive performance analysis of the codebase. Focus on:

1. **Algorithm Efficiency**
   - Time complexity analysis
   - Space complexity analysis
   - Inefficient loops and iterations
   - Suboptimal data structures

2. **Memory Management**
   - Memory leaks
   - Excessive object creation
   - Large object allocations
   - Garbage collection pressure

3. **I/O Operations**
   - Database query optimization
   - Network request efficiency
   - File system operations
   - Caching strategies

4. **Rendering Performance (if applicable)**
   - DOM manipulation efficiency
   - Rendering bottlenecks
   - Virtualization opportunities
   - Layout thrashing

5. **Async Operations**
   - Promise handling
   - Callback optimization
   - Event loop blocking
   - Worker thread opportunities

For each optimization found, provide:
- Current implementation analysis
- Bottleneck identification
- Optimized implementation
- Performance improvement metrics
- Code examples
- Implementation complexity
- Risk assessment

Include specific benchmarks and expected performance gains.`;

      optimization.status = 'analyzing';
      setPerformanceOptimizations(prev => prev.map(p => p.id === optimization.id ? optimization : p));

      const result = await agent.executeTask(performancePrompt);

      if (result.success && result.output) {
        optimization.status = 'applied';
        optimization.description = result.output;
        optimization.implementation = result.output;
        setPerformanceOptimizations(prev => prev.map(p => p.id === optimization.id ? optimization : p));

        addMessage({
          id: Date.now().toString(),
          role: 'assistant',
          content: `⚡ **Performance Analysis Complete**\n\n${result.output}`,
          performanceInfo: [optimization],
          timestamp: Date.now(),
        });

        toast.success('✅ Performance optimization analysis completed');
      } else {
        toast.error(`❌ Performance optimization failed: ${result?.error || 'Unknown error'}`);
        optimization.status = 'failed';
        setPerformanceOptimizations(prev => prev.map(p => p.id === optimization.id ? optimization : p));
      }
    } catch (error: any) {
      toast.error(`❌ Performance optimization failed: ${error.message}`);
    }
  }, [agent, addMessage]);

  // AI Code Suggestions (Real-time)
  const generateCodeSuggestions = useCallback(async (context: string, code: string) => {
    if (!agent || !realTimeCodeAnalysis) return;

    try {
      const suggestionPrompt = `Based on this code context, provide intelligent suggestions:

Context: ${context}
Current Code:
\`\`\`
${code}
\`\`\`

Provide suggestions for:
1. Code completion
2. Potential improvements
3. Bug fixes
4. Best practices
5. Performance optimizations

For each suggestion, include:
- Type (completion/refactoring/optimization/bug-fix)
- Confidence level (0-100%)
- Code implementation
- Reasoning
- Impact assessment

Format as a JSON array of suggestions.`;

      const result = await agent.executeTask(suggestionPrompt);

      if (result.success && result.output) {
        // Parse suggestions (simplified for this example)
        const suggestion: CodeSuggestion = {
          id: Date.now().toString(),
          type: 'completion',
          title: 'AI Code Suggestion',
          description: 'Intelligent code completion based on context',
          code: result.output,
          file: 'current',
          lineStart: 0,
          lineEnd: 0,
          confidence: 0.8,
          reasoning: 'Based on code patterns and context',
          alternatives: [],
          impact: {
            performance: 'medium',
            maintainability: 'high',
            security: 'neutral',
          },
          status: 'pending',
          timestamp: Date.now(),
        };

        setCodeSuggestions(prev => [...prev, suggestion]);
        setActiveCodeSuggestion(suggestion);
      }
    } catch (error: any) {
      console.error('Failed to generate code suggestions:', error);
    }
  }, [agent, realTimeCodeAnalysis]);

  // Voice Command Processing
  const startVoiceRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('❌ Voice recognition not supported in this browser');
      return;
    }

    try {
      setIsListening(true);

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.toLowerCase();

        const voiceCommand: VoiceCommand = {
          id: Date.now().toString(),
          command: transcript,
          intent: '',
          parameters: {},
          confidence: event.results[last][0].confidence,
          status: 'recognized',
          timestamp: Date.now(),
        };

        setVoiceCommands(prev => [...prev, voiceCommand]);

        // Process common voice commands
        if (transcript.includes('create component')) {
          setInput('Create a new React component with TypeScript');
        } else if (transcript.includes('fix errors')) {
          setInput('Find and fix any errors in the current file');
        } else if (transcript.includes('run test')) {
          setInput('Run all tests in the project');
        } else if (transcript.includes('commit')) {
          setInput('Review and commit all current changes');
        } else {
          setInput(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Voice recognition error:', event.error);
        toast.error(`❌ Voice recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      toast.success('🎤 Voice recognition started');
    } catch (error: any) {
      toast.error(`❌ Failed to start voice recognition: ${error.message}`);
      setIsListening(false);
    }
  }, []);

  const stopVoiceRecognition = useCallback(() => {
    setIsListening(false);
    toast.success('🔇 Voice recognition stopped');
  }, []);

  // Enhanced UI components
  const WorkflowProgress = ({ workflow }: { workflow: AIWorkflow }) => {
    const statusColors = {
      pending: 'text-gray-400',
      in_progress: 'text-blue-400',
      completed: 'text-green-400',
      failed: 'text-red-400',
      planning: 'text-yellow-400',
      executing: 'text-blue-400',
      review: 'text-purple-400',
    };

    const statusIcons = {
      pending: <Clock className="w-4 h-4" />,
      in_progress: <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />,
      completed: <Check className="w-4 h-4" />,
      failed: <X className="w-4 h-4" />,
      planning: <Sparkles className="w-4 h-4" />,
      executing: <Zap className="w-4 h-4" />,
      review: <FileText className="w-4 h-4" />,
    };

    return (
      <div className="workflow-progress bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            {workflow.title}
          </h3>
          <span className={`text-xs flex items-center gap-1 ${statusColors[workflow.status]}`}>
            {statusIcons[workflow.status]}
            {workflow.status}
          </span>
        </div>

        <div className="space-y-2">
          {workflow.steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                step.status === 'completed' ? 'bg-green-600' :
                step.status === 'in_progress' ? 'bg-blue-600' :
                step.status === 'failed' ? 'bg-red-600' : 'bg-gray-600'
              }`}>
                {statusIcons[step.status]}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-medium ${
                  step.status === 'completed' ? 'text-green-400' :
                  step.status === 'in_progress' ? 'text-blue-400' :
                  step.status === 'failed' ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < workflow.steps.length - 1 && (
                <div className="w-px h-4 bg-gray-600 ml-3" />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PendingChangesPanel = () => {
    const pendingOnly = pendingChanges.filter(c => c.status === 'pending');

    if (pendingOnly.length === 0) return null;

    return (
      <div className="pending-changes-panel bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-yellow-400" />
            Pending Changes ({pendingOnly.length})
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoApplyChanges(!autoApplyChanges)}
              className={`text-xs px-2 py-1 rounded ${
                autoApplyChanges ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
              title="Auto-apply future changes"
            >
              Auto-apply: {autoApplyChanges ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={applyApprovedChanges}
              className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              title="Apply all approved changes"
            >
              Apply Approved
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {pendingOnly.map((change) => (
            <div key={change.id} className="bg-gray-700 rounded p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    change.type === 'create' ? 'bg-green-600 text-white' :
                    change.type === 'modify' ? 'bg-yellow-600 text-white' :
                    'bg-red-600 text-white'
                  }`}>
                    {change.type.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-300 font-mono">{change.filePath}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => processPendingChange(change, true)}
                    className="p-1 text-green-400 hover:bg-green-600 hover:text-white rounded"
                    title="Approve and apply"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => processPendingChange(change, false)}
                    className="p-1 text-red-400 hover:bg-red-600 hover:text-white rounded"
                    title="Reject change"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400">{change.description}</p>
              {change.newContent && (
                <details className="mt-2">
                  <summary className="text-xs text-blue-400 cursor-pointer">Preview changes</summary>
                  <pre className="text-xs text-gray-300 mt-1 p-2 bg-gray-900 rounded overflow-x-auto">
                    {change.newContent.slice(0, 500)}
                    {change.newContent.length > 500 && '...'}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const QuickActionsPanel = () => {
    if (!showQuickActions) return null;

    return (
      <div className="quick-actions-panel bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            Quick Actions
          </h3>
          <button
            onClick={() => setShowQuickActions(false)}
            className="text-xs text-gray-400 hover:text-gray-200"
          >
            Hide
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => {
                  action.action();
                  setShowQuickActions(false);
                }}
                className="flex items-center gap-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-left transition-colors"
                title={action.description}
              >
                <Icon className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-sm text-gray-200">{action.label}</div>
                  <div className="text-xs text-gray-400">{action.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';

    return (
      <div
        key={message.id}
        className={`message flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`message-content max-w-3xl px-4 py-3 rounded-lg ${
            isUser
              ? 'bg-blue-600 text-white'
              : isSystem
              ? 'bg-gray-700 text-gray-300 italic'
              : 'bg-gray-800 text-gray-100'
          }`}
        >
          <div className="message-header flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold opacity-75">
              {isUser ? '👤 You' : isSystem ? '💡 System' : '🤖 Claude Code'}
            </span>
            <span className="text-xs opacity-50">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <div className="message-text whitespace-pre-wrap">{message.content}</div>

          {message.artifacts && (
            <div className="artifacts mt-3 pt-3 border-t border-gray-700 text-sm">
              {message.artifacts.filesCreated && message.artifacts.filesCreated.length > 0 && (
                <div className="mb-2">
                  <span className="font-semibold text-green-400">📝 Created:</span>
                  <ul className="ml-4 mt-1">
                    {message.artifacts.filesCreated.map((file, idx) => (
                      <li key={idx} className="text-xs text-gray-400">
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {message.artifacts.filesModified && message.artifacts.filesModified.length > 0 && (
                <div className="mb-2">
                  <span className="font-semibold text-yellow-400">✏️ Modified:</span>
                  <ul className="ml-4 mt-1">
                    {message.artifacts.filesModified.map((file, idx) => (
                      <li key={idx} className="text-xs text-gray-400">
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {message.artifacts.commandsExecuted && message.artifacts.commandsExecuted.length > 0 && (
                <div>
                  <span className="font-semibold text-blue-400">⚡ Executed:</span>
                  <ul className="ml-4 mt-1">
                    {message.artifacts.commandsExecuted.map((cmd, idx) => (
                      <li key={idx} className="text-xs text-gray-400 font-mono">
                        {cmd}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const apiKey = providerType === 'glm' ? settings.ai.glmKey : settings.ai.anthropicKey;
  const isConfigured = !!apiKey;

  if (!isConfigured) {
    return (
      <div className="claude-code-panel flex flex-col h-full bg-gray-900">
        <div className="panel-header px-4 py-3 bg-gray-800 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-100">🤖 Claude Code Agent</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🔑</div>
            <h3 className="text-xl font-semibold text-gray-100 mb-2">
              API Key Required
            </h3>
            <p className="text-gray-400 mb-4">
              Configure your {providerType === 'glm' ? 'GLM-4.6' : 'Anthropic'} API key in
              settings to use Claude Code Agent.
            </p>
            <button
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              onClick={() => {
                // Open settings dialog
                // This would be triggered via parent component
              }}
            >
              Open Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="claude-code-panel flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="panel-header px-4 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            Claude Code Agent
          </h2>

          {/* Mode toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRealTimeMode(!realTimeMode)}
              className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                realTimeMode ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
              title="Real-time collaboration mode"
            >
              <div className={`w-2 h-2 rounded-full ${realTimeMode ? 'bg-green-300' : 'bg-gray-400'}`} />
              Real-time
            </button>

            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                showQuickActions ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
              title="Show quick actions"
            >
              <Zap className="w-3 h-3" />
              Quick Actions
            </button>

            <button
              onClick={() => setShowPendingChanges(!showPendingChanges)}
              className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                pendingChanges.filter(c => c.status === 'pending').length > 0
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
              title="Show pending changes"
            >
              <FileText className="w-3 h-3" />
              Changes ({pendingChanges.filter(c => c.status === 'pending').length})
            </button>

            {/* Phase 4: Advanced Features */}
            <button
              onClick={() => {
                setShowTemplateGallery(!showTemplateGallery);
                if (codeTemplates.length === 0) loadCodeTemplates();
              }}
              className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                showTemplateGallery ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
              title="Code templates and snippets"
            >
              <Code className="w-3 h-3" />
              Templates
            </button>

            <button
              onClick={() => setShowAdvancedDiff(!showAdvancedDiff)}
              className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                showAdvancedDiff ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
              title="Advanced diffing and comparison"
            >
              <Layers className="w-3 h-3" />
              Diff
            </button>

            <button
              onClick={() => {
                setShowTeamPanel(!showTeamPanel);
                if (!teamSession) createTeamSession('New Session');
              }}
              className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                showTeamPanel ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
              title="Team collaboration"
            >
              <Share2 className="w-3 h-3" />
              Team
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Provider selector */}
          <select
            value={providerType}
            onChange={(e) => setProviderType(e.target.value as 'glm' | 'anthropic')}
            className="text-xs px-2 py-1 bg-gray-700 text-gray-100 border border-gray-600 rounded"
            disabled={isProcessing}
          >
            <option value="glm">GLM-4.6</option>
            <option value="anthropic">Claude</option>
          </select>

          {/* Clear button */}
          <button
            onClick={clearHistory}
            disabled={isProcessing}
            className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded disabled:opacity-50"
            title="Clear conversation history"
          >
            🔄 Clear
          </button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Quick Actions Panel */}
          <QuickActionsPanel />

          {/* Phase 5: AI Pair Programming Panel */}
          {showPairProgrammingPanel && pairProgrammingSession && (
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-400" />
                  AI Pair Programming: {pairProgrammingSession.name}
                </h3>
                <button
                  onClick={endPairProgrammingSession}
                  className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  ✕ End Session
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* AI Personality Selection */}
                <div className="bg-gray-700 rounded p-3">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">AI Personality</h4>
                  <select
                    value={aiPersonality}
                    onChange={(e) => setAiPersonality(e.target.value as 'mentor' | 'peer' | 'reviewer' | 'architect')}
                    className="w-full text-xs px-2 py-1 bg-gray-600 text-gray-100 border border-gray-500 rounded"
                  >
                    <option value="mentor">👨‍🏫 Mentor - Guiding and teaching</option>
                    <option value="peer">🤝 Peer - Collaborative partner</option>
                    <option value="reviewer">🔍 Reviewer - Code quality focus</option>
                    <option value="architect">🏗 Architect - System design focus</option>
                  </select>
                </div>

                {/* Pair Programming Mode */}
                <div className="bg-gray-700 rounded p-3">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Collaboration Mode</h4>
                  <select
                    value={pairProgrammingMode}
                    onChange={(e) => setPairProgrammingMode(e.target.value as 'collaborative' | 'guided' | 'autonomous')}
                    className="w-full text-xs px-2 py-1 bg-gray-600 text-gray-100 border border-gray-500 rounded"
                  >
                    <option value="collaborative">🤝 Collaborative - Code together</option>
                    <option value="guided">🎯 Guided - Step-by-step help</option>
                    <option value="autonomous">🚀 Autonomous - AI handles implementation</option>
                  </select>
                </div>

                {/* Real-time Code Analysis */}
                <div className="bg-gray-700 rounded p-3">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Real-time Analysis</h4>
                  <label className="flex items-center gap-2 text-xs text-gray-300">
                    <input
                      type="checkbox"
                      checked={realTimeCodeAnalysis}
                      onChange={(e) => setRealTimeCodeAnalysis(e.target.checked)}
                      className="rounded text-blue-600 bg-gray-600 border-gray-500"
                    />
                    Enable real-time code suggestions
                  </label>
                </div>
              </div>

              {/* Current Context */}
              <div className="bg-gray-700 rounded p-3 mb-4">
                <h4 className="text-xs font-medium text-gray-400 mb-2">Current Context</h4>
                <div className="text-xs text-gray-300 space-y-1">
                  <div>📁 File: {pairProgrammingSession.currentContext.file || 'None'}</div>
                  <div>💻 Language: {pairProgrammingSession.currentContext.language}</div>
                  <div>📋 Task: {pairProgrammingSession.currentContext.task || 'None'}</div>
                  <div>📊 Progress: {pairProgrammingSession.currentContext.progress}%</div>
                </div>
              </div>

              {/* AI Cursors */}
              {pairProgrammingSession.realTimeCollaboration.enabled && (
                <div className="bg-gray-700 rounded p-3 mb-4">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">AI Activity</h4>
                  <div className="space-y-1">
                    {pairProgrammingSession.realTimeCollaboration.aiCursors.map(cursor => (
                      <div key={cursor.id} className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          cursor.type === 'reading' ? 'bg-blue-400' :
                          cursor.type === 'writing' ? 'bg-green-400' :
                          cursor.type === 'analyzing' ? 'bg-yellow-400' :
                          'bg-purple-400'
                        }`} />
                        <span className="text-gray-300">
                          {cursor.type === 'reading' ? '📖 Reading' :
                           cursor.type === 'writing' ? '✍️ Writing' :
                           cursor.type === 'analyzing' ? '🔍 Analyzing' :
                           '💬 Explaining'} {cursor.file}:{cursor.line}
                        </span>
                        <span className="text-gray-500 text-xs">{cursor.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Suggestions */}
              {codeSuggestions.length > 0 && (
                <div className="bg-gray-700 rounded p-3 mb-4">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">AI Suggestions ({codeSuggestions.length})</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {codeSuggestions.map(suggestion => (
                      <div key={suggestion.id} className="bg-gray-600 rounded p-2 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-100">{suggestion.title}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            suggestion.status === 'applied' ? 'bg-green-600 text-white' :
                            suggestion.status === 'rejected' ? 'bg-red-600 text-white' :
                            'bg-yellow-600 text-white'
                          }`}>
                            {suggestion.confidence}% confidence
                          </span>
                        </div>
                        <p className="text-gray-300 mb-2">{suggestion.description}</p>
                        {suggestion.code && (
                          <details className="text-xs text-gray-400">
                            <summary className="cursor-pointer hover:text-gray-300">View code</summary>
                            <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded overflow-x-auto mt-1">
                              {suggestion.code}
                            </pre>
                          </details>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Apply suggestion logic would go here
                              setCodeSuggestions(prev => prev.map(s =>
                                s.id === suggestion.id ? { ...s, status: 'applied' } : s
                              ));
                            }}
                            className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                          >
                            <Check className="w-3 h-3" /> Apply
                          </button>
                          <button
                            onClick={() => {
                              setCodeSuggestions(prev => prev.map(s =>
                                s.id === suggestion.id ? { ...s, status: 'rejected' } : s
                              ));
                            }}
                            className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phase 5: Natural Language Development Panel */}
          {showNaturalLanguagePanel && (
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-400" />
                  Natural Language Development
                </h3>
                <button
                  onClick={() => setShowNaturalLanguagePanel(false)}
                  className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-4">
                {naturalLanguageRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-4">Describe what you want to build in natural language</p>
                    <p className="text-sm text-gray-400 mb-4">Examples:</p>
                    <ul className="text-sm text-gray-500 space-y-2">
                      <li>• "Create a user authentication system with React and TypeScript"</li>
                      <li>• "Build a REST API for managing products with error handling"</li>
                      <li>• "Generate a responsive dashboard with charts and filters"</li>
                      <li>• "Create a blog component with markdown support and comments"</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {naturalLanguageRequests.map(request => (
                      <div key={request.id} className="bg-gray-700 rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-100">{request.intent}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            request.status === 'completed' ? 'bg-green-600 text-white' :
                            request.status === 'failed' ? 'bg-red-600 text-white' :
                            request.status === 'implementing' ? 'bg-blue-600 text-white' :
                            'bg-yellow-600 text-white'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                          <div>Complexity: {request.complexity}</div>
                          <div>Priority: {request.priority}</div>
                          <div>Estimated Time: {Math.round(request.estimatedTime / 60000)} minutes</div>
                        </div>
                        {activeNaturalLanguageRequest?.id === request.id && request.generatedPlan.description && (
                          <div className="bg-gray-600 rounded p-2 mb-2">
                            <h5 className="text-xs font-medium text-gray-100 mb-1">Implementation Plan</h5>
                            <p className="text-xs text-gray-300">{request.generatedPlan.description}</p>
                          </div>
                        )}
                        {request.status === 'completed' && (
                          <div className="text-xs text-green-400">
                            ✅ Request completed successfully
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Phase 5: Intelligent Debugging Panel */}
          {showDebuggingPanel && (
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                  <Bug className="w-4 h-4 text-red-400" />
                  Intelligent Debugging
                </h3>
                <button
                  onClick={() => setShowDebuggingPanel(false)}
                  className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded"
                >
                  ✕ Close
                </button>
              </div>

              {intelligentDebugging.length === 0 ? (
                <div className="text-center py-8">
                  <Bug className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">AI-powered bug detection and fixing</p>
                  <button
                    onClick={() => startIntelligentDebugging()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                  >
                    Start Debugging Analysis
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {intelligentDebugging.map(debug => (
                    <div key={debug.id} className="bg-gray-700 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-100">{debug.title}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          debug.status === 'resolved' ? 'bg-green-600 text-white' :
                          debug.status === 'failed' ? 'bg-red-600 text-white' :
                          debug.status === 'analyzing' ? 'bg-blue-600 text-white' :
                          'bg-yellow-600 text-white'
                        }`}>
                          {debug.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        <div>Type: {debug.type}</div>
                        <div>Severity: {debug.severity}</div>
                        <div>File: {debug.file}</div>
                        {debug.line && <div>Line: {debug.line}</div>}
                      </div>
                      {debug.description && (
                        <div className="bg-gray-600 rounded p-2 mb-2">
                          <p className="text-xs text-gray-300">{debug.description}</p>
                        </div>
                      )}
                      {debug.suggestions.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-xs font-medium text-gray-100 mb-2">Suggestions</h5>
                          <div className="space-y-2">
                            {debug.suggestions.map((suggestion, idx) => (
                              <div key={suggestion.id} className="bg-gray-600 rounded p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-200">{suggestion.title}</span>
                                  <span className="text-xs text-gray-500">{suggestion.confidence}% confidence</span>
                                </div>
                                <p className="text-xs text-gray-300">{suggestion.description}</p>
                                {suggestion.code && (
                                  <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded overflow-x-auto mt-1">
                                    {suggestion.code}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Phase 5: Automated Refactoring Panel */}
          {showRefactoringPanel && (
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-purple-400" />
                  Automated Refactoring
                </h3>
                <button
                  onClick={() => setShowRefactoringPanel(false)}
                  className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded"
                >
                  ✕ Close
                </button>
              </div>

              {automatedRefactoring.length === 0 ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">AI-powered code refactoring and improvements</p>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      onClick={() => startAutomatedRefactoring('function')}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                    >
                      Function Level
                    </button>
                    <button
                      onClick={() => startAutomatedRefactoring('file')}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    >
                      File Level
                    </button>
                    <button
                      onClick={() => startAutomatedRefactoring('class')}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                    >
                      Class Level
                    </button>
                    <button
                      onClick={() => startAutomatedRefactoring('project')}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                    >
                      Project Level
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {automatedRefactoring.map(refactor => (
                    <div key={refactor.id} className="bg-gray-700 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-100">{refactor.title}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          refactor.status === 'applied' ? 'bg-green-600 text-white' :
                          refactor.status === 'failed' ? 'bg-red-600 text-white' :
                          refactor.status === 'ready' ? 'bg-blue-600 text-white' :
                          'bg-yellow-600 text-white'
                        }`}>
                          {refactor.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        <div>Type: {refactor.type}</div>
                        <div>Scope: {refactor.scope}</div>
                      </div>
                      {refactor.impact && (
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div className="text-gray-300">Performance: {refactor.impact.performance}</div>
                          <div className="text-gray-300">Readability: {refactor.impact.readability}</div>
                          <div className="text-gray-300">Maintainability: {refactor.impact.maintainability}</div>
                          <div className="text-gray-300">Breaking Changes: {refactor.impact.breakingChanges}</div>
                        </div>
                      )}
                      {refactor.description && (
                        <div className="bg-gray-600 rounded p-2 mb-2">
                          <p className="text-xs text-gray-300">{refactor.description}</p>
                        </div>
                      )}
                      {refactor.status === 'ready' && (
                        <button
                          onClick={() => {
                            // Apply refactoring logic
                            setAutomatedRefactoring(prev => prev.map(r =>
                              r.id === refactor.id ? { ...r, status: 'applying' } : r
                            ));
                          }}
                          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                        >
                          Apply Refactoring
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Phase 5: Security Scanner Panel */}
          {showSecurityPanel && (
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-yellow-400" />
                  Security Vulnerability Scanner
                </h3>
                <button
                  onClick={() => setShowSecurityPanel(false)}
                  className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded"
                >
                  ✕ Close
                </button>
              </div>

              {securityVulnerabilities.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">AI-powered security vulnerability detection</p>
                  <button
                    onClick={startSecurityScan}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium"
                  >
                    Start Security Scan
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {securityVulnerabilities.map(vuln => (
                    <div key={vuln.id} className="bg-gray-700 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-100">{vuln.title}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          vuln.status === 'resolved' ? 'bg-green-600 text-white' :
                          vuln.status === 'failed' ? 'bg-red-600 text-white' :
                          vuln.status === 'analyzing' ? 'bg-blue-600 text-white' :
                          'bg-yellow-600 text-white'
                        }`}>
                          {vuln.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        <div>Severity: {vuln.severity}</div>
                        <div>Type: {vuln.type}</div>
                        <div>File: {vuln.file}</div>
                        {vuln.line && <div>Line: {vuln.line}</div>}
                        <div>CWE: {vuln.cwe}</div>
                        <div>OWASP: {vuln.owasp}</div>
                      </div>
                      {vuln.description && (
                        <div className="bg-gray-600 rounded p-2 mb-2">
                          <p className="text-xs text-gray-300">{vuln.description}</p>
                        </div>
                      )}
                      {vuln.recommendations.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-xs font-medium text-gray-100 mb-2">Recommendations</h5>
                          <div className="space-y-2">
                            {vuln.recommendations.map((rec, idx) => (
                              <div key={rec.id} className="bg-gray-600 rounded p-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-200">{rec.title}</span>
                                  <span className="text-xs text-gray-500">Priority: {rec.priority}</span>
                                </div>
                                <p className="text-xs text-gray-300">{rec.description}</p>
                                {rec.code && (
                                  <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded overflow-x-auto mt-1">
                                    {rec.code}
                                  </pre>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Phase 5: Performance Optimization Panel */}
          {showPerformancePanel && (
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-green-400" />
                  Performance Optimization
                </h3>
                <button
                  onClick={() => setShowPerformancePanel(false)}
                  className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded"
                >
                  ✕ Close
                </button>
              </div>

              {performanceOptimizations.length === 0 ? (
                <div className="text-center py-8">
                  <Gauge className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">AI-powered performance optimization</p>
                  <button
                    onClick={startPerformanceOptimization}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                  >
                    Start Performance Analysis
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {performanceOptimizations.map(opt => (
                    <div key={opt.id} className="bg-gray-700 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-100">{opt.title}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          opt.status === 'applied' ? 'bg-green-600 text-white' :
                          opt.status === 'failed' ? 'bg-red-600 text-white' :
                          opt.status === 'analyzing' ? 'bg-blue-600 text-white' :
                          'bg-yellow-600 text-white'
                        }`}>
                          {opt.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        <div>Category: {opt.category}</div>
                        <div>Type: {opt.type}</div>
                        <div>Improvement: {opt.improvement}%</div>
                      </div>
                      {opt.currentPerformance && opt.optimizedPerformance && (
                        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                          <div>
                            <h5 className="font-medium text-gray-200 mb-1">Current</h5>
                            <div>Time: {opt.currentPerformance.timeComplexity}</div>
                            <div>Space: {opt.currentPerformance.spaceComplexity}</div>
                            <div>Time: {opt.currentPerformance.executionTime}ms</div>
                            <div>Memory: {opt.currentPerformance.memoryUsage}MB</div>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-200 mb-1">Optimized</h5>
                            <div>Time: {opt.optimizedPerformance.timeComplexity}</div>
                            <div>Space: {opt.optimizedPerformance.spaceComplexity}</div>
                            <div>Time: {opt.optimizedPerformance.executionTime}ms</div>
                            <div>Memory: {opt.optimizedPerformance.memoryUsage}MB</div>
                          </div>
                        </div>
                      )}
                      {opt.implementation && (
                        <div className="bg-gray-600 rounded p-2 mb-2">
                          <p className="text-xs text-gray-300">{opt.implementation}</p>
                        </div>
                      )}
                      {opt.status === 'ready' && (
                        <button
                          onClick={() => {
                            setPerformanceOptimizations(prev => prev.map(p =>
                              p.id === opt.id ? { ...p, status: 'applying' } : p
                            ));
                          }}
                          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                        >
                          Apply Optimization
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Phase 5: Code Generation Panel */}
          {showCodeGenerationPanel && codeGeneration && (
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Code Generation
                </h3>
                <button
                  onClick={() => setShowCodeGenerationPanel(false)}
                  className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded"
                >
                  ✕ Close
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-700 rounded p-3">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Requirement</h4>
                  <p className="text-sm text-gray-200">{codeGeneration.requirement}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-medium text-gray-400 mb-2">Type</h4>
                    <div className="text-sm text-gray-200">{codeGeneration.type}</div>
                    <div className="text-sm text-gray-200">{codeGeneration.language}</div>
                    {codeGeneration.framework && (
                      <div className="text-sm text-gray-200">{codeGeneration.framework}</div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-400 mb-2">Quality Score</h4>
                    <div className="text-2xl font-bold text-green-400">{Math.round(codeGeneration.quality.score * 100)}%</div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                      <div>Maintainability: {Math.round(codeGeneration.quality.maintainability * 100)}%</div>
                      <div>Readability: {Math.round(codeGeneration.quality.readability * 100)}%</div>
                      <div>Complexity: {Math.round(codeGeneration.quality.complexity * 100)}%</div>
                      <div>Security: {Math.round(codeGeneration.quality.security * 100)}%</div>
                      <div>Performance: {Math.round(codeGeneration.quality.performance * 100)}%</div>
                      <div>Tests: {Math.round(codeGeneration.quality.tests * 100)}%</div>
                    </div>
                  </div>
                </div>

                {codeGeneration.generatedCode.length > 0 && (
                  <div className="bg-gray-700 rounded p-3">
                    <h4 className="text-xs font-medium text-gray-400 mb-2">Generated Files ({codeGeneration.generatedCode.length})</h4>
                    <div className="space-y-2">
                      {codeGeneration.generatedCode.map(code => (
                        <div key={code.id} className="bg-gray-600 rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-200">{code.file}</span>
                            <span className="text-xs text-gray-500">{code.language}</span>
                          </div>
                          <p className="text-xs text-gray-300 mb-2">{code.purpose}</p>
                          <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded overflow-x-auto">
                            {code.content}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {codeGeneration.tests.length > 0 && (
                  <div className="bg-gray-700 rounded p-3">
                    <h4 className="text-xs font-medium text-gray-400 mb-2">Generated Tests ({codeGeneration.tests.length})</h4>
                    <div className="space-y-2">
                      {codeGeneration.tests.map(test => (
                        <div key={test.id} className="bg-gray-600 rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-200">{test.file}</span>
                            <span className="text-xs text-gray-500">{test.framework} - {test.type}</span>
                          </div>
                          <div className="text-xs text-gray-300 mb-1">Coverage: {test.coverage}%</div>
                          <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded overflow-x-auto">
                            {test.code}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-gray-700 rounded p-3">
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Documentation</h4>
                  <p className="text-xs text-gray-300">{codeGeneration.documentation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Phase 5: AI Insights Panel */}
          {showInsightsPanel && (
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  AI Code Insights
                </h3>
                <button
                  onClick={() => setShowInsightsPanel(false)}
                  className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded"
                >
                  ✕ Close
                </button>
              </div>

              {aiInsights.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300 mb-4">AI-powered code insights and recommendations</p>
                  <p className="text-sm text-gray-400 mb-4">Get intelligent suggestions for improving code quality, performance, security, and maintainability.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {aiInsights.map(insight => (
                    <div key={insight.id} className="bg-gray-700 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-100">{insight.title}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          insight.severity === 'error' ? 'bg-red-600 text-white' :
                          insight.severity === 'warning' ? 'bg-yellow-600 text-white' :
                          'bg-blue-600 text-white'
                        }`}>
                          {insight.severity}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        <div>Type: {insight.type}</div>
                        <div>File: {insight.file}</div>
                        {insight.line && <div>Line: {insight.line}</div>}
                      </div>
                      <p className="text-xs text-gray-300 mb-2">{insight.description}</p>
                      {insight.implementation && (
                        <details className="text-xs text-gray-400">
                          <summary className="cursor-pointer hover:text-gray-300">View implementation suggestion</summary>
                          <pre className="text-xs text-gray-300 bg-gray-900 p-2 rounded overflow-x-auto mt-1">
                            {insight.implementation}
                          </pre>
                        </details>
                      )}
                      {insight.references.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-xs font-medium text-gray-100 mb-1">References</h5>
                          <ul className="text-xs text-gray-500 space-y-1">
                            {insight.references.map((ref, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span>{ref}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Active Workflow */}
          {activeWorkflow && <WorkflowProgress workflow={activeWorkflow} />}

          {/* Pending Changes Panel */}
          {showPendingChanges && <PendingChangesPanel />}

          {/* Phase 4: Advanced Features Panels */}

          {/* Multi-file Operations Panel */}
          {multiFileOperations.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-400" />
                Multi-file Operations
              </h3>
              <div className="space-y-2">
                {multiFileOperations.map(operation => (
                  <div key={operation.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-100">{operation.description}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          operation.status === 'completed' ? 'bg-green-600 text-white' :
                          operation.status === 'executing' ? 'bg-blue-600 text-white' :
                          operation.status === 'failed' ? 'bg-red-600 text-white' :
                          'bg-gray-600 text-gray-300'
                        }`}>
                          {operation.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {operation.files.length} files • {Math.round((operation.endTime || Date.now() - operation.startTime) / 1000)}s
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {operation.status === 'planning' && (
                        <button
                          onClick={() => executeMultiFileOperation(operation)}
                          className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                        >
                          <Play className="w-3 h-3" /> Execute
                        </button>
                      )}
                      {operation.status === 'completed' && (
                        <button
                          onClick={() => setShowAdvancedDiff(true)}
                          className="text-xs px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                        >
                          <Eye className="w-3 h-3" /> Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code Templates Gallery */}
          {showTemplateGallery && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                <Code className="w-4 h-4 text-purple-400" />
                Code Templates & Snippets
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {codeTemplates.map(template => (
                  <div key={template.id} className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-100">{template.name}</h4>
                      <span className="text-xs px-2 py-1 bg-purple-600 text-white rounded">
                        {template.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{template.description}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const values: Record<string, any> = {};
                          template.variables.forEach(v => {
                            values[v.name] = v.default || (v.type === 'boolean' ? false : '');
                          });
                          applyCodeTemplate(template, values, `src/${template.name.replace(/\s+/g, '-').toLowerCase()}.tsx`);
                        }}
                        className="text-xs px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center gap-1"
                      >
                        <FilePlus className="w-3 h-3" /> Use Template
                      </button>
                      <button
                        onClick={() => explainCode(template.template, template.name)}
                        className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Explain
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Collaboration Panel */}
          {showTeamPanel && teamSession && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-100 mb-3 flex items-center gap-2">
                <Users2 className="w-4 h-4 text-green-400" />
                Team Session: {teamSession.name}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Participants */}
                <div>
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Participants ({teamSession.participants.length})</h4>
                  <div className="space-y-1">
                    {teamSession.participants.map(participant => (
                      <div key={participant.id} className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${participant.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
                        <span className="text-gray-100">{participant.name}</span>
                        <span className="text-gray-400">• {participant.role}</span>
                        {participant.cursor && (
                          <span className="text-blue-400">• {participant.cursor.file}:{participant.cursor.line}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shared Changes */}
                <div>
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Shared Changes ({teamSession.sharedChanges.length})</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {teamSession.sharedChanges.map(change => (
                      <div key={change.id} className="flex items-center justify-between p-2 bg-gray-700 rounded text-xs">
                        <span className="text-gray-100">{change.change.description}</span>
                        <span className={`px-2 py-1 rounded text-white ${
                          change.status === 'applied' ? 'bg-green-600' :
                          change.status === 'rejected' ? 'bg-red-600' :
                          'bg-yellow-600'
                        }`}>
                          {change.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => createTeamSession('New Session')}
                  className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1"
                >
                  <Users className="w-3 h-3" /> New Session
                </button>
                <button
                  onClick={() => joinTeamSession('demo-session')}
                  className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1"
                >
                  <GitMerge className="w-3 h-3" /> Join Session
                </button>
              </div>
            </div>
          )}

          {/* Advanced Diff Panel */}
          {showAdvancedDiff && sideBySideDiff && (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-400" />
                  Advanced Diff: {sideBySideDiff.file}
                </h3>
                <button
                  onClick={closeAdvancedDiff}
                  className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded"
                >
                  ✕ Close
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Original</h4>
                  <pre className="text-xs text-gray-300 bg-gray-900 p-3 rounded-lg overflow-x-auto h-64">
                    {sideBySideDiff.old}
                  </pre>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-400 mb-2">Proposed Changes</h4>
                  <pre className="text-xs text-gray-300 bg-gray-900 p-3 rounded-lg overflow-x-auto h-64">
                    {sideBySideDiff.new}
                  </pre>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => {
                    const change = pendingChanges.find(c => c.filePath === sideBySideDiff.file);
                    if (change) processPendingChange(change, true);
                  }}
                  className="text-xs px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Apply Changes
                </button>
                <button
                  onClick={() => {
                    const change = pendingChanges.find(c => c.filePath === sideBySideDiff.file);
                    if (change) processPendingChange(change, false);
                  }}
                  className="text-xs px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Reject Changes
                </button>
                <button
                  onClick={() => explainCode(sideBySideDiff.new, sideBySideDiff.file)}
                  className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Explain Changes
                </button>
              </div>
            </div>
          )}

          {/* Code Explanation Panel */}
          {showCodeExplanation && (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Code Explanation
                </h3>
                <button
                  onClick={() => setShowCodeExplanation(false)}
                  className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded"
                >
                  ✕ Close
                </button>
              </div>

              <div className="text-sm text-gray-300 bg-gray-900 p-4 rounded-lg">
                {codeExplanation.split('\n').map((line, idx) => (
                  <div key={idx} className="mb-2">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="messages-container space-y-4">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Enhanced Input */}
      <form onSubmit={handleSubmit} className="input-container p-4 bg-gray-800 border-t border-gray-700">
        {realTimeMode && (
          <div className="mb-3 p-2 bg-green-900 bg-opacity-30 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Real-time collaboration mode active - Changes will be applied instantly
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              realTimeMode
                ? "Type commands for instant execution (e.g., 'Create button component')"
                : "What would you like me to do? (e.g., 'Create a login component')"
            }
            className="flex-1 px-4 py-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {realTimeMode ? <Sparkles className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                {realTimeMode ? 'Execute' : 'Send'}
              </>
            )}
          </button>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            💡 Tip: Be specific! Try "Add error handling to the fetchUser function in src/api/user.ts"
          </div>

          {!showQuickActions && (
            <button
              onClick={() => setShowQuickActions(true)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Show Quick Actions
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
