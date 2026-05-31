import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Trophy,
  Sparkles,
  BookOpen,
  Users,
  Zap,
  PenLine,
  ArrowRight,
  Star,
} from "lucide-react";

const FEATURES = [
  {
    icon: Clock,
    title: "20-Minute Sprints",
    desc: "Six rounds, precision-timed. A 30-second grace zone. Then the gates close.",
  },
  {
    icon: BookOpen,
    title: "200+ Prompt Cards",
    desc: "Hand-curated across 18 genres, with rare modifiers, AI-generated rounds, and seasonal drops.",
  },
  {
    icon: Users,
    title: "2–6 Live Competitors",
    desc: "Public lobbies, private rooms, invite codes, and spectator seats for the final duel.",
  },
  {
    icon: Trophy,
    title: "Ranked Seasons",
    desc: "Climb the literary ladder. Earn badges, win duels, defend your standing.",
  },
  {
    icon: Sparkles,
    title: "Final Duel Round",
    desc: "After Round 5, the top two enter a sealed duel — dialogue required, no second chances.",
  },
  {
    icon: Zap,
    title: "Distraction-Free Studio",
    desc: "An editor inspired by Linear and Notion. Auto-save, focus mode, typewriter cadence.",
  },
];

const TESTIMONIALS = [
  {
    name: "Mara V.",
    role: "MFA, Iowa",
    text: "It's the only place online where I write under real pressure and still leave proud.",
  },
  {
    name: "Devon K.",
    role: "Game Designer",
    text: "The pacing, the prompts, the silence between rounds — Ivory Draft feels like a sport.",
  },
  {
    name: "Priya R.",
    role: "Novelist",
    text: "I've drafted three openings here that became chapters. The duel mode is electric.",
  },
];

export default function Landing() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen ivory-shader-page text-white"
      data-testid="landing-page"
    >
      <div className="ivory-shader-content">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="absolute inset-0 bg-radial-fade" />

          <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-10 pb-28">
            {/* top bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-white text-black flex items-center justify-center">
                  <PenLine className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-display font-semibold tracking-tight">
                    Ivory Draft
                  </div>
                  <div className="font-mono text-[9px] tracking-[0.3em] text-zinc-500 -mt-0.5">
                    DRAFT.ARENA
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="#features"
                  className="hidden md:block text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Features
                </a>
                <a
                  href="#how"
                  className="hidden md:block text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  How it works
                </a>
                <a
                  href="#voices"
                  className="hidden md:block text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  Voices
                </a>

                {user ? (
                  <button
                    data-testid="hero-dashboard-button"
                    onClick={() => navigate("/dashboard")}
                    className="h-9 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
                  >
                    Enter dashboard
                  </button>
                ) : (
                  <button
                    data-testid="hero-signin-button"
                    onClick={login}
                    className="h-9 px-4 rounded-md bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
                  >
                    Sign in
                  </button>
                )}
              </div>
            </div>

            {/* hero copy */}
            <div className="mt-24 max-w-4xl">
              <div className="font-mono text-[11px] tracking-[0.35em] text-zinc-400 mb-6 flex items-center gap-3">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                SEASON 01 · NOW IN OPEN BETA
              </div>

              <h1 className="font-display font-medium text-5xl sm:text-6xl lg:text-7xl tracking-tighter leading-[1.02]">
                The competitive arena
                <br />
                for serious writers.
              </h1>

              <p className="mt-7 text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed">
                Six rounds. Twenty minutes each. Top two writers advance to a
                final, dialogue-only duel. No talent show. No retries. Just the
                page, the prompt, and your nerve.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                {user ? (
                  <button
                    data-testid="hero-enter-dashboard"
                    onClick={() => navigate("/dashboard")}
                    className="group inline-flex items-center gap-2 bg-white text-black px-6 h-11 rounded-md font-medium hover:bg-zinc-200 transition-colors"
                  >
                    Open my dashboard
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ) : (
                  <button
                    data-testid="hero-cta-signin"
                    onClick={login}
                    className="group inline-flex items-center gap-2 bg-white text-black px-6 h-11 rounded-md font-medium hover:bg-zinc-200 transition-colors"
                  >
                    Sign in with Google
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}

                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-5 h-11 rounded-md hairline hover:bg-white/5 text-zinc-300 transition-colors"
                >
                  Tour the arena
                </a>
              </div>

              {/* live stats strip */}
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-px hairline rounded-xl overflow-hidden bg-zinc-900/40">
                {[
                  { k: "ROUNDS PER MATCH", v: "6" },
                  { k: "MIN/MAX WORDS", v: "175–600" },
                  { k: "PROMPT GENRES", v: "18" },
                  { k: "FINAL DUEL", v: "DIALOGUE-ONLY" },
                ].map((s) => (
                  <div key={s.k} className="px-5 py-5 bg-black/40">
                    <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">
                      {s.k}
                    </div>
                    <div className="font-mono text-2xl tabular-nums mt-2 text-white">
                      {s.v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section
          id="features"
          className="relative max-w-7xl mx-auto px-6 lg:px-10 py-24"
        >
          <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-3">
            FEATURE INDEX · 01
          </div>

          <h2 className="font-display text-3xl md:text-4xl tracking-tight max-w-2xl">
            A literary game built like a precision instrument.
          </h2>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px hairline rounded-2xl overflow-hidden bg-zinc-900/40">
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;

              return (
                <div key={feature.title} className="bg-black/40 p-7 lift">
                  <div className="flex items-center justify-between mb-5">
                    <Icon className="w-5 h-5 text-zinc-300" />
                    <span className="font-mono text-[10px] text-zinc-600 tracking-[0.3em]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="font-display text-lg font-medium mb-2 tracking-tight">
                    {feature.title}
                  </div>

                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section
          id="how"
          className="relative max-w-7xl mx-auto px-6 lg:px-10 py-20"
        >
          <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-3">
            PROTOCOL · 02
          </div>

          <h2 className="font-display text-3xl md:text-4xl tracking-tight max-w-2xl">
            A single match, end to end.
          </h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                n: "01",
                t: "Enter a lobby",
                d: "Public room, private invite, or quick match. 2–6 writers per game.",
              },
              {
                n: "02",
                t: "Five rounds, scored blind",
                d: "Random prompts. 20 minutes each. Submissions anonymized for judging.",
              },
              {
                n: "03",
                t: "Top 2 advance",
                d: "After Round 5, leaderboard locks. The final two enter the duel chamber.",
              },
              {
                n: "04",
                t: "Final duel · dialogue",
                d: "One round. Dialogue required. The arena crowns a draft champion.",
              },
            ].map((step) => (
              <div
                key={step.n}
                className="hairline rounded-xl p-6 bg-zinc-950 lift"
              >
                <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">
                  STEP {step.n}
                </div>
                <div className="font-display text-xl mt-3 tracking-tight">
                  {step.t}
                </div>
                <div className="text-sm text-zinc-400 mt-2 leading-relaxed">
                  {step.d}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section
          id="voices"
          className="relative max-w-7xl mx-auto px-6 lg:px-10 py-20"
        >
          <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500 mb-3">
            VOICES · 03
          </div>

          <h2 className="font-display text-3xl md:text-4xl tracking-tight max-w-2xl">
            From the writers in the arena.
          </h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial) => (
              <div
                key={testimonial.name}
                className="hairline rounded-xl p-7 bg-zinc-950 lift"
              >
                <div className="flex gap-0.5 mb-4">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <Star
                      key={star}
                      className="w-3 h-3 fill-amber-300 text-amber-300"
                    />
                  ))}
                </div>

                <p className="text-zinc-200 leading-relaxed">
                  &quot;{testimonial.text}&quot;
                </p>

                <div className="mt-5 hairline-t pt-4">
                  <div className="text-sm font-medium">
                    {testimonial.name}
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.25em] text-zinc-500 uppercase">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="relative max-w-7xl mx-auto px-6 lg:px-10 py-24">
          <div className="hairline rounded-2xl p-10 md:p-16 bg-zinc-950 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-30" />

            <div className="relative">
              <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">
                SEASON 01 · NOW LIVE
              </div>

              <h2 className="mt-4 font-display text-3xl md:text-5xl tracking-tighter">
                Step into the ivory arena.
              </h2>

              <p className="mt-4 text-zinc-400 max-w-xl mx-auto">
                Six rounds. One winner. Your name on the wall.
              </p>

              <div className="mt-8 flex justify-center">
                {user ? (
                  <button
                    data-testid="cta-dashboard"
                    onClick={() => navigate("/dashboard")}
                    className="bg-white text-black px-6 h-11 rounded-md font-medium hover:bg-zinc-200 transition-colors"
                  >
                    Open my dashboard
                  </button>
                ) : (
                  <button
                    data-testid="cta-signin"
                    onClick={login}
                    className="bg-white text-black px-6 h-11 rounded-md font-medium hover:bg-zinc-200 transition-colors"
                  >
                    Sign in with Google
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <footer className="hairline-t">
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="font-mono text-[10px] tracking-[0.3em] text-zinc-500">
              © IVORY DRAFT · ALL RIGHTS RESERVED · WRITERS RETAIN OWNERSHIP
            </div>

            <div className="flex gap-6 text-xs text-zinc-500">
              <a href="#" className="hover:text-white transition-colors">
                Code of Conduct
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}