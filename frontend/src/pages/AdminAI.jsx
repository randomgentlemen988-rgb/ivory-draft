import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Save,
  GitBranch,
  GitPullRequest,
  FileCode,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ChevronRight,
  Inbox,
  RefreshCw,
  Zap,
} from "lucide-react";

// Risk level configuration
const RISK_LEVELS = {
  low: { label: "LOW", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  medium: { label: "MEDIUM", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  high: { label: "HIGH", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  critical: { label: "CRITICAL", color: "text-red-500 animate-pulse", bg: "bg-red-500/20", border: "border-red-500/30" },
};

// Task status configuration
const TASK_STATUS = {
  draft: { label: "DRAFT", icon: FileCode, color: "text-zinc-400", bg: "bg-zinc-500/10" },
  planning: { label: "PLANNING", icon: Loader2, color: "text-blue-400", bg: "bg-blue-500/10", spin: true },
  planned: { label: "PLANNED", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  in_progress: { label: "IN PROGRESS", icon: RefreshCw, color: "text-amber-400", bg: "bg-amber-500/10", spin: true },
  completed: { label: "COMPLETED", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  failed: { label: "FAILED", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
};

// Mock data for demonstration
const MOCK_HISTORY = [
  {
    id: "task-001",
    title: "Add spectator mode to GameRoom",
    status: "completed",
    risk: "medium",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "task-002",
    title: "Implement real-time word count",
    status: "completed",
    risk: "low",
    timestamp: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: "task-003",
    title: "Add dark/light theme toggle",
    status: "failed",
    risk: "low",
    timestamp: new Date(Date.now() - 259200000).toISOString(),
  },
];

// Risk Badge Component
function RiskBadge({ level }) {
  const config = RISK_LEVELS[level] || RISK_LEVELS.low;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] tracking-widest ${config.color} ${config.bg} border ${config.border}`}
    >
      <AlertTriangle className="w-3 h-3" />
      {config.label} RISK
    </span>
  );
}

// Status Badge Component
function StatusBadge({ status }) {
  const config = TASK_STATUS[status] || TASK_STATUS.draft;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] tracking-widest ${config.color} ${config.bg}`}
    >
      <Icon className={`w-3 h-3 ${config.spin ? "animate-spin" : ""}`} />
      {config.label}
    </span>
  );
}

// Empty State Component
function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-zinc-600" />
      </div>
      <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-2">{title}</div>
      <p className="text-sm text-zinc-600 max-w-[240px]">{description}</p>
    </div>
  );
}

// Error State Component
function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <XCircle className="w-5 h-5 text-red-400" />
      </div>
      <div className="font-mono text-[10px] tracking-[0.3em] text-red-400 mb-2">ERROR</div>
      <p className="text-sm text-zinc-400 max-w-[280px] mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hairline text-xs font-mono hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      )}
    </div>
  );
}

// Loading Skeleton for Plan Panel
function PlanSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-3 w-3/4" />
      <div className="pt-4">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="pt-4">
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

// Task Card Component
function TaskCard({ task, isActive, onClick }) {
  const statusConfig = TASK_STATUS[task.status] || TASK_STATUS.draft;
  const riskConfig = RISK_LEVELS[task.risk] || RISK_LEVELS.low;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-start gap-3 ${
        isActive ? "bg-white/5 border-l-2 border-white/40" : "border-l-2 border-transparent"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm text-zinc-200 leading-relaxed line-clamp-2">{task.title}</div>
        <div className="flex items-center gap-2 mt-2">
          <StatusBadge status={task.status} />
          <span className={`font-mono text-[9px] ${riskConfig.color}`}>{riskConfig.label}</span>
        </div>
        <div className="font-mono text-[10px] tracking-widest text-zinc-600 mt-1.5">
          {new Date(task.timestamp).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-1" />
    </button>
  );
}

// File Change Item Component
function FileChangeItem({ file, changeType }) {
  const colors = {
    modify: "text-amber-400",
    add: "text-emerald-400",
    delete: "text-red-400",
  };

  const labels = {
    modify: "M",
    add: "A",
    delete: "D",
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors rounded">
      <span
        className={`font-mono text-[10px] w-4 h-4 flex items-center justify-center rounded ${colors[changeType]} bg-current/10`}
      >
        {labels[changeType]}
      </span>
      <code className="text-xs text-zinc-300 font-mono truncate flex-1">{file}</code>
    </div>
  );
}

export default function AdminAI() {
  const { user } = useAuth();

  // State
  const [featureRequest, setFeatureRequest] = useState("");
  const [currentTask, setCurrentTask] = useState(null);
  const [taskHistory, setTaskHistory] = useState([]);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [filesToChange, setFilesToChange] = useState([]);
  const [riskLevel, setRiskLevel] = useState(null);

  // UI States
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [error, setError] = useState(null);

  const isAdmin = user && user.role === "admin";

  // Load history on mount (must be before any early returns)
  useEffect(() => {
    if (!isAdmin) return;
    
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      setError(null);
      try {
        // Simulated delay - replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 800));
        setTaskHistory(MOCK_HISTORY);
      } catch (e) {
        setError("Failed to load task history");
        toast.error("Failed to load task history");
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, [isAdmin]);

  // Check admin access (after all hooks)
  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <ErrorState
          message="Access denied. Admin privileges required to access AI Forge."
          onRetry={null}
        />
      </div>
    );
  }

  // Handlers
  const handleGeneratePlan = async () => {
    if (!featureRequest.trim()) {
      toast.error("Please describe the feature you want to build");
      return;
    }

    setIsGeneratingPlan(true);
    setError(null);

    try {
      // Simulated delay - replace with actual AI API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock generated plan
      const mockPlan = {
        summary: `Implement: ${featureRequest}`,
        steps: [
          "1. Analyze current codebase structure and identify affected components",
          "2. Design data models and API contracts if needed",
          "3. Create or modify React components following Ivory Draft patterns",
          "4. Implement business logic and state management",
          "5. Add error handling and loading states",
          "6. Write unit and integration tests",
          "7. Update documentation and component exports",
        ],
        estimatedComplexity: "Medium",
        dependencies: ["None identified"],
      };

      const mockFiles = [
        { file: "frontend/src/components/NewFeature.jsx", changeType: "add" },
        { file: "frontend/src/pages/Dashboard.jsx", changeType: "modify" },
        { file: "frontend/src/lib/api.js", changeType: "modify" },
        { file: "frontend/src/hooks/useNewFeature.js", changeType: "add" },
      ];

      const mockRisk = featureRequest.toLowerCase().includes("auth")
        ? "high"
        : featureRequest.toLowerCase().includes("delete")
          ? "critical"
          : featureRequest.length > 100
            ? "medium"
            : "low";

      setGeneratedPlan(mockPlan);
      setFilesToChange(mockFiles);
      setRiskLevel(mockRisk);
      setCurrentTask({
        id: `task-${Date.now()}`,
        title: featureRequest,
        status: "planned",
        risk: mockRisk,
        timestamp: new Date().toISOString(),
      });

      toast.success("Plan generated successfully");
    } catch (e) {
      setError("Failed to generate plan. Please try again.");
      toast.error("Failed to generate plan");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!featureRequest.trim() && !generatedPlan) {
      toast.error("Nothing to save");
      return;
    }

    setIsSavingDraft(true);
    try {
      await api.post("/admin/ai/drafts", {
        title: featureRequest.trim().slice(0, 100) || "Untitled Draft",
        description: featureRequest.trim(),
        plan: generatedPlan,
        files: filesToChange,
        risk: riskLevel,
      });
      toast.success("Draft saved");
    } catch (e) {
      const message = e.response?.data?.error || "Failed to save draft";
      toast.error(message);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!generatedPlan) {
      toast.error("Generate a plan first");
      return;
    }

    setIsCreatingBranch(true);
    try {
      // Simulated delay - replace with actual Git API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Branch created: feature/ai-generated-task");
    } catch (e) {
      toast.error("Failed to create branch");
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const handleCreatePR = async () => {
    if (!generatedPlan) {
      toast.error("Generate a plan first");
      return;
    }

    setIsCreatingPR(true);
    try {
      // Simulated delay - replace with actual Git API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Pull request created");
    } catch (e) {
      toast.error("Failed to create pull request");
    } finally {
      setIsCreatingPR(false);
    }
  };

  const handleSelectTask = (task) => {
    setCurrentTask(task);
    setFeatureRequest(task.title);
    setRiskLevel(task.risk);
    // In a real app, you would fetch the full task details here
    setGeneratedPlan(null);
    setFilesToChange([]);
  };

  const handleClear = () => {
    setFeatureRequest("");
    setCurrentTask(null);
    setGeneratedPlan(null);
    setFilesToChange([]);
    setRiskLevel(null);
    setError(null);
  };

  // Derived state
  const hasContent = featureRequest.trim().length > 0;
  const hasPlan = generatedPlan !== null;
  const isAnyLoading = isGeneratingPlan || isSavingDraft || isCreatingBranch || isCreatingPR;

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-10 stagger" data-testid="admin-ai-page">
      {/* Header */}
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-2">
          DEVELOPMENT TOOLKIT
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl md:text-5xl tracking-tighter">
              AI <span className="shimmer-text">Forge</span>
            </h1>
            <p className="text-zinc-500 mt-2 text-sm">
              Describe features, generate plans, and create implementation branches.
            </p>
          </div>
          {riskLevel && <RiskBadge level={riskLevel} />}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Task History */}
        <div className="lg:col-span-3 hairline rounded-2xl bg-zinc-950 overflow-hidden h-fit lg:sticky lg:top-6">
          <div className="px-5 py-4 hairline-b flex items-center justify-between">
            <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">
              TASK HISTORY
            </div>
            <Clock className="w-3.5 h-3.5 text-zinc-600" />
          </div>

          <div className="max-h-[500px] overflow-y-auto divide-y divide-white/5">
            {isLoadingHistory ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : error && taskHistory.length === 0 ? (
              <ErrorState message={error} onRetry={() => window.location.reload()} />
            ) : taskHistory.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="NO TASKS YET"
                description="Your generated tasks will appear here"
              />
            ) : (
              taskHistory.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isActive={currentTask?.id === task.id}
                  onClick={() => handleSelectTask(task)}
                />
              ))
            )}
          </div>
        </div>

        {/* Center - Main Content */}
        <div className="lg:col-span-6 space-y-6">
          {/* Feature Request Input */}
          <div className="glass rounded-2xl p-6 hairline">
            <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-4 flex items-center gap-2">
              <Zap className="w-3 h-3" />
              FEATURE REQUEST
            </div>
            <textarea
              value={featureRequest}
              onChange={(e) => setFeatureRequest(e.target.value)}
              placeholder="Describe the feature you want to build in detail...

Example: Add a spectator mode where users can watch ongoing matches without participating. Spectators should see real-time updates but cannot submit text or vote."
              disabled={isGeneratingPlan}
              className="w-full bg-zinc-950 hairline rounded-lg p-4 text-sm placeholder:text-zinc-600 resize-none h-40 focus:outline-none focus:border-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
              data-testid="admin-ai-feature-request"
            />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={handleGeneratePlan}
                disabled={!hasContent || isGeneratingPlan}
                className="bg-white text-black h-10 px-4 rounded-md font-medium hover:bg-zinc-200 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="admin-ai-generate-plan"
              >
                {isGeneratingPlan ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Plan
                  </>
                )}
              </button>

              <button
                onClick={handleSaveDraft}
                disabled={!hasContent || isSavingDraft || isGeneratingPlan}
                className="bg-zinc-900 text-zinc-200 h-10 px-4 rounded-md font-medium hover:bg-zinc-800 transition-colors inline-flex items-center justify-center gap-2 hairline disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="admin-ai-save-draft"
              >
                {isSavingDraft ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Draft
              </button>

              <button
                onClick={handleCreateBranch}
                disabled={!hasPlan || isCreatingBranch || isAnyLoading}
                className="bg-zinc-900 text-zinc-200 h-10 px-4 rounded-md font-medium hover:bg-zinc-800 transition-colors inline-flex items-center justify-center gap-2 hairline disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="admin-ai-create-branch"
              >
                {isCreatingBranch ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GitBranch className="w-4 h-4" />
                )}
                Create Branch
              </button>

              <button
                onClick={handleCreatePR}
                disabled={!hasPlan || isCreatingPR || isAnyLoading}
                className="bg-zinc-900 text-zinc-200 h-10 px-4 rounded-md font-medium hover:bg-zinc-800 transition-colors inline-flex items-center justify-center gap-2 hairline disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="admin-ai-create-pr"
              >
                {isCreatingPR ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <GitPullRequest className="w-4 h-4" />
                )}
                Create PR
              </button>

              {(hasContent || hasPlan) && (
                <button
                  onClick={handleClear}
                  disabled={isAnyLoading}
                  className="text-zinc-500 h-10 px-4 rounded-md font-medium hover:text-zinc-300 hover:bg-zinc-900/50 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Generated Plan Panel */}
          <div className="hairline rounded-2xl bg-zinc-950 overflow-hidden">
            <div className="px-6 py-4 hairline-b flex items-center justify-between">
              <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">
                GENERATED PLAN
              </div>
              {currentTask && <StatusBadge status={currentTask.status} />}
            </div>

            {isGeneratingPlan ? (
              <PlanSkeleton />
            ) : error && !generatedPlan ? (
              <ErrorState message={error} onRetry={handleGeneratePlan} />
            ) : generatedPlan ? (
              <div className="p-6 space-y-6">
                {/* Summary */}
                <div>
                  <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-2">
                    SUMMARY
                  </div>
                  <p className="text-zinc-200 text-sm leading-relaxed">{generatedPlan.summary}</p>
                </div>

                {/* Implementation Steps */}
                <div>
                  <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-3">
                    IMPLEMENTATION STEPS
                  </div>
                  <div className="space-y-2">
                    {generatedPlan.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 text-sm text-zinc-300 leading-relaxed"
                      >
                        <span className="font-mono text-[10px] text-zinc-600 mt-0.5 w-4 flex-shrink-0">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span>{step.replace(/^\d+\.\s*/, "")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-1">
                      COMPLEXITY
                    </div>
                    <div className="text-sm text-zinc-300">{generatedPlan.estimatedComplexity}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-1">
                      DEPENDENCIES
                    </div>
                    <div className="text-sm text-zinc-300">
                      {generatedPlan.dependencies.join(", ")}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="NO PLAN YET"
                description="Describe a feature above and click Generate Plan to create an implementation roadmap"
              />
            )}
          </div>
        </div>

        {/* Right Sidebar - Files & Status Cards */}
        <div className="lg:col-span-3 space-y-6">
          {/* Current Task Status Card */}
          {currentTask && (
            <div className="glass rounded-2xl p-5 hairline">
              <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-3">
                CURRENT TASK
              </div>
              <div className="text-sm text-zinc-200 leading-relaxed mb-3 line-clamp-3">
                {currentTask.title}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={currentTask.status} />
                {currentTask.risk && <RiskBadge level={currentTask.risk} />}
              </div>
              <div className="font-mono text-[10px] tracking-widest text-zinc-600 mt-3">
                {new Date(currentTask.timestamp).toLocaleString()}
              </div>
            </div>
          )}

          {/* Files Likely to Change */}
          <div className="hairline rounded-2xl bg-zinc-950 overflow-hidden">
            <div className="px-5 py-4 hairline-b flex items-center justify-between">
              <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">
                FILES TO CHANGE
              </div>
              <FileCode className="w-3.5 h-3.5 text-zinc-600" />
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {isGeneratingPlan ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : filesToChange.length === 0 ? (
                <EmptyState
                  icon={FileCode}
                  title="NO FILES IDENTIFIED"
                  description="Generate a plan to see which files will be affected"
                />
              ) : (
                <div className="py-2">
                  {filesToChange.map((item, idx) => (
                    <FileChangeItem key={idx} file={item.file} changeType={item.changeType} />
                  ))}
                </div>
              )}
            </div>

            {filesToChange.length > 0 && (
              <div className="px-5 py-3 hairline-t bg-zinc-900/40">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>{filesToChange.length} files</span>
                  <span>
                    +{filesToChange.filter((f) => f.changeType === "add").length} /{" "}
                    ~{filesToChange.filter((f) => f.changeType === "modify").length} /{" "}
                    -{filesToChange.filter((f) => f.changeType === "delete").length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-px hairline rounded-xl overflow-hidden bg-zinc-900/40">
            <div className="bg-black/40 p-4">
              <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-1">
                TASKS TODAY
              </div>
              <div className="font-mono text-xl tabular-nums">
                {taskHistory.filter((t) => {
                  const today = new Date().toDateString();
                  return new Date(t.timestamp).toDateString() === today;
                }).length}
              </div>
            </div>
            <div className="bg-black/40 p-4">
              <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-1">
                SUCCESS RATE
              </div>
              <div className="font-mono text-xl tabular-nums">
                {taskHistory.length > 0
                  ? Math.round(
                      (taskHistory.filter((t) => t.status === "completed").length /
                        taskHistory.length) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
