"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#08090a] text-[#d0d6e0] flex flex-col items-center justify-center p-6 selection:bg-cyan-500/30 selection:text-cyan-200 font-sans antialiased">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-cyan-500/5 rounded-full blur-[140px]" />
      </div>

      <main className="relative w-full max-w-2xl flex flex-col items-center text-center my-auto">
        {/* Minimal status tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111317] border border-[#21242d] text-xs font-mono text-zinc-400 mb-6">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-zinc-300">typesafe/jev-1.13</span>
          <span className="text-zinc-600">/</span>
          <span className="text-emerald-400">ready</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
          Welcome to JEV Guide
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-lg mb-8 leading-relaxed">
          Calibrated probabilistic decisions on arbitrary state. Route, triage, and verify without generative hallucinations.
        </p>

        {/* Hairline Vector Illustration Plate */}
        <div className="w-full max-w-lg aspect-[5/4] relative rounded-2xl border border-[#1e2026] bg-[#0c0d10] shadow-2xl shadow-black/80 overflow-hidden mb-8 group">
          <iframe
            src="/hairline-agent.html?theme=dark"
            title="Executing Agent Illustration"
            className="w-full h-full border-0 block"
          />
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center pointer-events-none">
            <span className="text-[11px] font-mono text-zinc-500 bg-[#0c0d10]/80 backdrop-blur-sm px-3 py-1 rounded-full border border-zinc-800/60">
              hover to inspect state nodes
            </span>
          </div>
        </div>

        {/* Minimal Steps */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 text-left">
          {/* Step 1 */}
          <div className="p-4 rounded-xl bg-[#0f1014] border border-[#1d2028] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono text-cyan-400 font-semibold">
                  01 · Get API Key
                </span>
                <span className="text-[10px] font-mono text-zinc-500">OpenRouter</span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                Visit <a href="https://openrouter.ai/workspaces/default/keys" target="_blank" rel="noreferrer" className="text-zinc-200 underline hover:text-cyan-400">openrouter.ai/keys</a> and generate your <code className="text-cyan-300 font-mono text-[11px]">sk-or-v1-...</code> token.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl bg-[#0f1014] border border-[#1d2028] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono text-indigo-400 font-semibold">
                  02 · How to Test
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Interactive</span>
              </div>
              <p className="text-xs text-zinc-400 leading-normal">
                Input your state message, select questions (<code className="text-indigo-300 font-mono text-[11px]">noul</code>, <code className="text-indigo-300 font-mono text-[11px]">choice</code>, <code className="text-indigo-300 font-mono text-[11px]">score</code>), and inspect calibrated probabilities.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/jev"
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-sm tracking-wide shadow-lg shadow-cyan-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Go to JEV Use Case</span>
            <span className="font-mono">→</span>
          </Link>

          <a
            href="https://openrouter.ai/workspaces/default/keys"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#111317] hover:bg-[#161920] border border-[#232733] text-zinc-300 hover:text-white text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
          >
            <span>🔑 Get OpenRouter Key</span>
            <span className="text-zinc-500">↗</span>
          </a>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="mt-8 text-center text-xs font-mono text-zinc-600">
        System One · typesafe/jev-1.13 Decisions API
      </footer>
    </div>
  );
}
