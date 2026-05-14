import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Sparkles, Trash2 } from "lucide-react";

const GENRES = ["Fantasy","Horror","Sci-Fi","Mystery","Comedy","Drama","Romance","Psychological","Thriller","Historical Fiction","Dystopian","Adventure","Slice of Life","Noir","Mythological","Supernatural","Cyberpunk","Steampunk"];

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [newPrompt, setNewPrompt] = useState({ text: "", genre: "Fantasy", difficulty: "medium", modifier: "" });
  const [aiGenre, setAiGenre] = useState("Fantasy");
  const [aiDiff, setAiDiff] = useState("medium");
  const [aiBusy, setAiBusy] = useState(false);

  const load = async () => {
    try {
      const [s, u, p] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/prompts?limit=200"),
      ]);
      setStats(s.data);
      setUsers(u.data.users || []);
      setPrompts(p.data.prompts || []);
    } catch (e) { toast.error("Failed to load admin data"); }
  };

  useEffect(() => { load(); }, []);

  const createPrompt = async () => {
    if (!newPrompt.text.trim()) return;
    try {
      await api.post("/admin/prompts", { ...newPrompt, modifier: newPrompt.modifier || null });
      setNewPrompt({ text: "", genre: "Fantasy", difficulty: "medium", modifier: "" });
      toast.success("Prompt added");
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const deletePrompt = async (id) => {
    try { await api.delete(`/admin/prompts/${id}`); load(); } catch {}
  };

  const generateAi = async () => {
    setAiBusy(true);
    try {
      await api.post(`/prompts/ai?genre=${encodeURIComponent(aiGenre)}&difficulty=${aiDiff}`);
      toast.success("AI prompt added");
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "AI generation failed (configure OPENROUTER_API_KEY)");
    } finally { setAiBusy(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-10 py-10 stagger" data-testid="admin-page">
      <div className="mb-8">
        <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-2">CONTROL ROOM</div>
        <h1 className="font-display text-3xl md:text-5xl tracking-tighter">Admin</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px hairline rounded-2xl overflow-hidden bg-zinc-900/40 mb-10">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="bg-black/40 p-6" data-testid={`admin-stat-${k}`}>
              <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 uppercase">{k.replace(/_/g, " ")}</div>
              <div className="font-mono text-2xl tabular-nums mt-2">{v}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6 hairline">
          <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-3">ADD PROMPT</div>
          <textarea
            value={newPrompt.text}
            onChange={(e) => setNewPrompt({ ...newPrompt, text: e.target.value })}
            placeholder="Write a fresh prompt…"
            data-testid="admin-prompt-text"
            className="w-full bg-zinc-950 hairline rounded-md p-3 text-sm placeholder:text-zinc-600 resize-none h-24 focus:outline-none focus:border-zinc-500"
          />
          <div className="grid grid-cols-3 gap-3 mt-3">
            <select
              value={newPrompt.genre}
              onChange={(e) => setNewPrompt({ ...newPrompt, genre: e.target.value })}
              data-testid="admin-prompt-genre"
              className="bg-zinc-950 hairline rounded-md px-3 h-10 text-sm focus:outline-none focus:border-zinc-500"
            >
              {GENRES.map((g) => <option key={g}>{g}</option>)}
            </select>
            <select
              value={newPrompt.difficulty}
              onChange={(e) => setNewPrompt({ ...newPrompt, difficulty: e.target.value })}
              data-testid="admin-prompt-difficulty"
              className="bg-zinc-950 hairline rounded-md px-3 h-10 text-sm focus:outline-none focus:border-zinc-500"
            >
              {["easy", "medium", "hard", "expert"].map((d) => <option key={d}>{d}</option>)}
            </select>
            <button
              onClick={createPrompt}
              data-testid="admin-create-prompt"
              className="bg-white text-black h-10 rounded-md font-medium hover:bg-zinc-200 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 hairline">
          <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-3">GENERATE WITH AI · NEMOTRON</div>
          <div className="grid grid-cols-3 gap-3">
            <select
              value={aiGenre} onChange={(e) => setAiGenre(e.target.value)}
              className="bg-zinc-950 hairline rounded-md px-3 h-10 text-sm focus:outline-none focus:border-zinc-500"
              data-testid="admin-ai-genre"
            >
              {GENRES.map((g) => <option key={g}>{g}</option>)}
            </select>
            <select
              value={aiDiff} onChange={(e) => setAiDiff(e.target.value)}
              className="bg-zinc-950 hairline rounded-md px-3 h-10 text-sm focus:outline-none focus:border-zinc-500"
              data-testid="admin-ai-difficulty"
            >
              {["easy", "medium", "hard", "expert"].map((d) => <option key={d}>{d}</option>)}
            </select>
            <button
              onClick={generateAi}
              disabled={aiBusy}
              data-testid="admin-ai-generate"
              className="bg-white text-black h-10 rounded-md font-medium hover:bg-zinc-200 transition-colors inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" /> {aiBusy ? "Generating…" : "Generate"}
            </button>
          </div>
          <div className="font-mono text-[10px] tracking-widest text-zinc-500 mt-3">
            REQUIRES OPENROUTER_API_KEY IN BACKEND .ENV
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="hairline rounded-2xl bg-zinc-950 overflow-hidden">
          <div className="px-6 py-4 hairline-b font-mono text-[10px] tracking-[0.3em] text-zinc-500">PROMPTS · {prompts.length}</div>
          <div className="max-h-[480px] overflow-y-auto divide-y divide-white/5">
            {prompts.map((p) => (
              <div key={p.prompt_id} className="px-5 py-3 flex items-start gap-3 hover:bg-white/5 transition-colors">
                <div className="flex-1">
                  <div className="text-sm text-zinc-200 leading-relaxed">{p.text}</div>
                  <div className="font-mono text-[10px] tracking-widest text-zinc-500 mt-1">
                    {p.genre.toUpperCase()} · {p.difficulty.toUpperCase()} · {p.rarity.toUpperCase()}{p.is_ai ? " · AI" : ""}
                  </div>
                </div>
                <button onClick={() => deletePrompt(p.prompt_id)} className="text-zinc-500 hover:text-red-400 p-1" data-testid={`delete-prompt-${p.prompt_id}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="hairline rounded-2xl bg-zinc-950 overflow-hidden">
          <div className="px-6 py-4 hairline-b font-mono text-[10px] tracking-[0.3em] text-zinc-500">USERS · {users.length}</div>
          <div className="max-h-[480px] overflow-y-auto divide-y divide-white/5">
            {users.map((u) => (
              <div key={u.user_id} className="px-5 py-3 flex items-center gap-3">
                {u.picture ? <img src={u.picture} alt="" className="w-7 h-7 rounded-full" /> : <div className="w-7 h-7 rounded-full bg-zinc-800" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{u.name} <span className="font-mono text-[10px] tracking-widest text-zinc-500 ml-1">{u.role?.toUpperCase()}</span></div>
                  <div className="font-mono text-[10px] tracking-widest text-zinc-500 truncate">{u.email}</div>
                </div>
                <div className="font-mono text-xs tabular-nums text-zinc-400">{u.rank_points}RP</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
