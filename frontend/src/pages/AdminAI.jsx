import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function AdminAI() {
  const { user } = useAuth();
  
  // Check if user is admin
  if (!user || user.role !== "admin") {
    toast.error("Access denied: Admin only");
    // Redirect to home or dashboard? We'll just return null for now.
    return null;
  }

  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState([]); // Array of {prompt, plan, result, timestamp}
  const [plan, setPlan] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const generatePlan = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      // Placeholder for actual AI generation
      // In a real app, we would call an API endpoint here
      const fakePlan = `1. Understand the requirement: "${prompt}"\n2. Break down into components\n3. Design database schema\n4. Create API endpoints\n5. Implement frontend UI\n6. Write tests\n7. Deploy and monitor`;
      setPlan(fakePlan);
      // Add to history
      setHistory(prev => [
        ...prev,
        { prompt, plan: fakePlan, result: "", timestamp: new Date().toISOString() }
      ]);
      toast.success("Plan generated");
    } catch (e) {
      toast.error("Failed to generate plan");
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = () => {
    if (!plan.trim()) return;
    // Placeholder for saving draft
    // In a real app, we would call an API to save to database
    toast.success("Draft saved (placeholder)");
  };

  const clear = () => {
    setPrompt("");
    setPlan("");
    setResult("");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 stagger" data-testid="admin-ai-page">
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-2">AI FORGE</div>
        <h1 className="font-display text-3xl md:text-5xl tracking-tighter">Admin AI Forge</h1>
      </div>

      {/* Left column: input and controls */}
      <div className="glass rounded-2xl p-6 hairline mb-6">
        <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-4">
          DESCRIBE THE FEATURE YOU WANT TO BUILD
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the feature you want to build..."
          className="w-full bg-zinc-950 hairline rounded-md p-3 text-sm placeholder:text-zinc-600 resize-none h-24 focus:outline-none focus:border-zinc-500 mb-4"
        />
        <div className="flex flex-wrap gap-3">
          <button
            onClick={generatePlan}
            disabled={loading || !prompt.trim()}
            className="bg-white text-black h-10 rounded-md font-medium hover:bg-zinc-200 transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? "Generating..." : <span>Generate Plan</span>}
          </button>
          <button
            onClick={saveDraft}
            disabled={!plan.trim()}
            className="bg-white text-black h-10 rounded-md font-medium hover:bg-zinc-200 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            Save Draft
          </button>
          <button
            onClick={clear}
            className="bg-white text-black h-10 rounded-md font-medium hover:bg-zinc-200 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Right column: history and results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task History Panel */}
        <div className="hairline rounded-2xl bg-zinc-950 overflow-hidden">
          <div className="px-6 py-4 hairline-b font-mono text-[10px] tracking-[0.3em] text-zinc-500">
            TASK HISTORY ({history.length})
          </div>
          <div className="max-h-[400px] overflow-y-auto divide-y divide-white/5">
            {history.map((item, index) => (
              <div key={index} className="px-5 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors">
                <div className="flex-1">
                  <div className="text-sm text-zinc-200 leading-relaxed truncate max-w-[200px]">
                    {item.prompt}
                  </div>
                  <div className="font-mono text-[10px] tracking-widest text-zinc-500 mt-1">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <div className="px-5 py-3 text-center text-zinc-500">
                No history yet
              </div>
            )}
          </div>
        </div>

        {/* Plan/Results Panel */}
        <div className="hairline rounded-2xl bg-zinc-950 overflow-hidden">
          <div className="px-6 py-4 hairline-b font-mono text-[10px] tracking-[0.3em] text-zinc-500">
            PLAN / RESULTS
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-2">
              Generated Plan:
            </div>
            <div className="bg-zinc-900/40 rounded-md p-3 min-h-[100px] text-zinc-200 whitespace-pre-wrap">
              {plan || "No plan generated yet"}
            </div>
            <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-2">
              Results / Output:
            </div>
            <div className="bg-zinc-900/40 rounded-md p-3 min-h-[100px] text-zinc-200 whitespace-pre-wrap">
              {result || "Results will appear here after execution"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}