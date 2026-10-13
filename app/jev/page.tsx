"use client";

import React, { useState } from "react";
import Link from "next/link";

interface DecisionAnswers {
  [key: string]: {
    type: "noul" | "choice" | "score";
    noul?: number;
    choice?: string;
    probabilities?: Record<string, number>;
    score?: string | number;
    distribution?: Record<string, number>;
    confidence?: number;
  };
}

const PRESETS = [
  {
    id: "support",
    title: "Support Ticket Escalation",
    state: "Help! My payouts have been failing for 3 days and my bank is rejecting the transfers.",
    questions: {
      is_urgent: {
        type: "noul",
        instructions: "Does this message convey urgency?",
        criteria: {
          true: "Explicitly time-sensitive",
          false: "No urgency expressed",
        },
      },
      department: {
        type: "choice",
        instructions: "Which team should handle this?",
        criteria: {
          billing: "Payments, invoicing, refunds",
          technical: "Bugs, outages, integrations",
          sales: "Pricing, upgrades, new accounts",
        },
      },
      frustration: {
        type: "score",
        instructions: "How frustrated is the customer?",
        criteria: ["Calm", "Frustrated", "Very angry"],
      },
    },
  },
  {
    id: "moderation",
    title: "Content Safety & Moderation",
    state: "Buy cheap crypto tokens right now on bit-scam.xyz to 100x your money overnight!!! Guaranteed!",
    questions: {
      is_spam: {
        type: "noul",
        instructions: "Is this message unsolicited commercial spam or a scam?",
        criteria: {
          true: "Promotional spam or deceptive scam",
          false: "Legitimate user discussion",
        },
      },
      risk_level: {
        type: "choice",
        instructions: "Assess safety risk category",
        criteria: {
          critical: "Financial fraud or phishing risk",
          medium: "Low quality promotional content",
          safe: "Harmless post",
        },
      },
      urgency_to_ban: {
        type: "score",
        instructions: "Severity level for moderation action",
        criteria: ["Ignore", "Flag for review", "Immediate quarantine"],
      },
    },
  },
  {
    id: "sales",
    title: "Sales Lead Qualification",
    state: "We are an enterprise team of 450 engineers looking to replace our current API infrastructure before Q3.",
    questions: {
      is_enterprise: {
        type: "noul",
        instructions: "Is the inquiry from a large enterprise team?",
        criteria: {
          true: "Over 50 users or explicit enterprise budget",
          false: "Individual or small team",
        },
      },
      timeline: {
        type: "choice",
        instructions: "When is the prospect planning to purchase?",
        criteria: {
          immediate: "Current quarter / urgent rollout",
          mid_term: "Next 1-2 quarters",
          exploratory: "Browsing or no clear timeline",
        },
      },
      buyer_intent: {
        type: "score",
        instructions: "Buying readiness signal",
        criteria: ["Casual interest", "Evaluating vendors", "Ready to purchase"],
      },
    },
  },
];

export default function JevUseCasePage() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [stateInput, setStateInput] = useState(PRESETS[0].state);
  const [questionsJson, setQuestionsJson] = useState(
    JSON.stringify(PRESETS[0].questions, null, 2)
  );
  const [activeCodeTab, setActiveCodeTab] = useState<"ts" | "fetch" | "curl" | "py">("fetch");
  const [copiedCode, setCopiedCode] = useState(false);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [execTimeMs, setExecTimeMs] = useState<number | null>(null);

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setSelectedPreset(preset);
    setStateInput(preset.state);
    setQuestionsJson(JSON.stringify(preset.questions, null, 2));
    setExecutionResult(null);
    setErrorMsg(null);
  };

  const handleRunDecision = async () => {
    setIsRunning(true);
    setErrorMsg(null);
    setExecutionResult(null);
    const startTime = performance.now();

    try {
      let parsedQuestions;
      try {
        parsedQuestions = JSON.parse(questionsJson);
      } catch (err: any) {
        throw new Error("Invalid JSON in Questions Schema: " + err.message);
      }

      // Try calling our internal API route first (which avoids CORS)
      const res = await fetch("/api/jev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: "typesafe/jev-1.13",
          state: stateInput,
          questions: parsedQuestions,
        }),
      });

      const data = await res.json();
      const elapsed = Math.round(performance.now() - startTime);
      setExecTimeMs(elapsed);

      if (!res.ok) {
        throw new Error(data.error || JSON.stringify(data));
      }

      setExecutionResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to execute decision");
    } finally {
      setIsRunning(false);
    }
  };

  const codeSnippets = {
    fetch: `// Direct fetch call using OpenRouter Decisions API
const response = await fetch('https://openrouter.ai/api/alpha/decisions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${showKey ? apiKey : "sk-or-v1-..."}',
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://myapp.com', // optional for leaderboard
    'X-Title': 'Decision Engine'        // optional
  },
  body: JSON.stringify({
    model: 'typesafe/jev-1.13',
    state: ${JSON.stringify(stateInput)},
    questions: ${questionsJson}
  })
});

const data = await response.json();
console.log('Decisions answers:', data.answers);`,

    ts: `import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: "${showKey ? apiKey : "<OPENROUTER_API_KEY>"}"
});

// The model answers narrow, typed questions about the state.
const decision = await openrouter.alpha.decisions.create({
  decisionsRequest: {
    model: "typesafe/jev-1.13",
    state: ${JSON.stringify(stateInput)},
    questions: ${questionsJson}
  }
});

const { is_urgent, department, frustration } = decision.answers;

// Automated deterministic workflow execution:
if (is_urgent?.noul > 0.8 && department?.choice === "billing") {
  console.log("⚡ Auto-escalating to Billing on-call queue!");
}`,

    curl: `curl https://openrouter.ai/api/alpha/decisions \\
  -H "Authorization: Bearer ${showKey ? apiKey : "sk-or-v1-..."}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "typesafe/jev-1.13",
    "state": "${stateInput.replace(/"/g, '\\"')}",
    "questions": ${questionsJson.replace(/\n/g, "\n    ")}
  }'`,

    py: `import requests
import json

url = "https://openrouter.ai/api/alpha/decisions"
headers = {
    "Authorization": f"Bearer ${showKey ? apiKey : 'sk-or-v1-...'}",
    "Content-Type": "application/json"
}
payload = {
    "model": "typesafe/jev-1.13",
    "state": ${JSON.stringify(stateInput)},
    "questions": ${questionsJson}
}

response = requests.post(url, headers=headers, json=payload)
data = response.json()
print("Answers:", data.get("answers"))`,
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(codeSnippets[activeCodeTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-[#e0e4ec] font-sans antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[500px] bg-cyan-600/10 rounded-full blur-[130px]" />
        <div className="absolute top-1/3 -right-20 w-[550px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between pb-8 mb-8 border-b border-[#1b1e28]">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#12141c] border border-zinc-800 hover:border-zinc-700"
            >
              <span>←</span>
              <span>Back to Home</span>
            </Link>
            <span className="text-zinc-600">/</span>
            <span className="font-mono text-xs uppercase tracking-wider text-cyan-400 font-semibold bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-md">
              System One · Decisions API
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400">Model:</span>
            <code className="text-xs font-mono bg-[#141724] text-cyan-300 px-2.5 py-1 rounded border border-cyan-900/50">
              typesafe/jev-1.13
            </code>
          </div>
        </header>

        {/* Hero Section */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-950/70 to-indigo-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Typesafe System One Decision Model
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            JEV USE CASE
          </h1>
          <p className="text-lg text-zinc-300 max-w-3xl leading-relaxed">
            Fast, deterministic, and calibrated probabilistic decisions on arbitrary state. 
            Unlike generative LLMs that output unpredictable text tokens, <span className="text-cyan-300 font-semibold">JEV (typesafe/jev-1.13)</span> answers 
            narrow, typed questions about a state with calibrated mathematical probabilities.
          </p>
        </div>

        {/* Section 1: What is JEV */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
              01
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              What is JEV?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
            {/* Card 1: Not Text Generation */}
            <div className="p-5 rounded-xl bg-[#0f1118] border border-[#1d2232] shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center text-lg mb-4">
                ⚡
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Not a Text Generator
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                JEV does <strong className="text-zinc-200">not</strong> generate freeform sentences or chat replies. It answers strict, typed questions about an input state (a string, object, or array) through OpenRouter&apos;s <code className="text-cyan-300 font-mono text-xs">/api/alpha/decisions</code> endpoint.
              </p>
            </div>

            {/* Card 2: Calibrated Probabilities */}
            <div className="p-5 rounded-xl bg-[#0f1118] border border-[#1d2232] shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg mb-4">
                🎯
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Calibrated Probabilities
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Returns true mathematical confidence distributions rather than arbitrary text guesses. Perfect for threshold-based branching (e.g. <code className="text-cyan-300 font-mono text-xs">is_urgent &gt; 0.85</code>).
              </p>
            </div>

            {/* Card 3: Code Owns Workflow */}
            <div className="p-5 rounded-xl bg-[#0f1118] border border-[#1d2232] shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg mb-4">
                🛠️
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Your Code Owns the Flow
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Ideal for deterministic tasks: automated routing, triage, ranking, content verification, compliance checks, and intent classification without fragile prompt parsing.
              </p>
            </div>
          </div>

          {/* 3 Primitives explanation */}
          <div className="p-6 rounded-xl bg-[#0d0f16] border border-[#1f2436]">
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              The 3 Decision Primitive Types in JEV:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-[#131622] border border-zinc-800">
                <span className="text-emerald-400 font-bold text-sm block mb-1">
                  1. type: &quot;noul&quot;
                </span>
                <p className="text-zinc-300 font-sans mb-2">
                  Binary yes/no calibrated probability from 0.0 to 1.0.
                </p>
                <div className="text-zinc-400">
                  <span className="text-zinc-500">e.g.</span> is_urgent: 0.94
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#131622] border border-zinc-800">
                <span className="text-cyan-400 font-bold text-sm block mb-1">
                  2. type: &quot;choice&quot;
                </span>
                <p className="text-zinc-300 font-sans mb-2">
                  Pick from custom named options with full probability distribution.
                </p>
                <div className="text-zinc-400">
                  <span className="text-zinc-500">e.g.</span> billing (82%), tech (14%), sales (4%)
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#131622] border border-zinc-800">
                <span className="text-purple-400 font-bold text-sm block mb-1">
                  3. type: &quot;score&quot;
                </span>
                <p className="text-zinc-300 font-sans mb-2">
                  Ordinal rank or position across an ordered rubric list.
                </p>
                <div className="text-zinc-400">
                  <span className="text-zinc-500">e.g.</span> [&quot;Calm&quot;, &quot;Frustrated&quot;, &quot;Very angry&quot;]
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Usage of Code */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono font-bold text-sm">
                02
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Usage of code !!
              </h2>
            </div>

            {/* Language Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#12141e] border border-zinc-800 text-xs font-mono">
              {(["fetch", "ts", "curl", "py"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCodeTab(tab)}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeCodeTab === tab
                      ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {tab === "fetch"
                    ? "JavaScript (fetch)"
                    : tab === "ts"
                    ? "TypeScript SDK"
                    : tab === "curl"
                    ? "cURL"
                    : "Python"}
                </button>
              ))}
              <button
                onClick={copyCodeToClipboard}
                className="ml-2 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-sans font-medium flex items-center gap-1 transition-all"
                title="Copy code"
              >
                {copiedCode ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-[#1e2333] bg-[#0b0d14] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#10131d] border-b border-[#1b1f2e] text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                <span className="ml-2 text-zinc-500">
                  {activeCodeTab === "fetch"
                    ? "decision-call.js"
                    : activeCodeTab === "ts"
                    ? "decision-sdk.ts"
                    : activeCodeTab === "curl"
                    ? "request.sh"
                    : "decision_script.py"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="text-[11px] text-zinc-400 hover:text-cyan-300 underline"
                >
                  {showKey ? "Hide API Key" : "Reveal API Key in Code"}
                </button>
              </div>
            </div>
            <pre className="p-5 text-xs sm:text-sm font-mono overflow-x-auto text-zinc-300 leading-relaxed">
              <code>{codeSnippets[activeCodeTab]}</code>
            </pre>
          </div>
        </section>

        {/* Section 3: Interactive Live Execution */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
                03
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Allow me to run by calling JEV !!
                </h2>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  Live playground hitting OpenRouter alpha decisions endpoint
                </p>
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-400 font-mono">Preset:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p)}
                  className={`px-3 py-1 text-xs rounded-md font-mono transition-all ${
                    selectedPreset.id === p.id
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                      : "bg-[#141724] text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[#0c0e17] border border-[#1b2030] shadow-2xl space-y-6">
            {/* Top configuration row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>OpenRouter API Key:</span>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    {showKey ? "Mask Key" : "Show Key"}
                  </button>
                </label>
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-[#121522] border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="sk-or-v1-... (or configured via OPENROUTER_API_KEY in .env.local)"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                  Endpoint &amp; Model Target:
                </label>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-2 text-xs font-mono bg-[#121522] border border-zinc-800 rounded-lg text-cyan-400 flex-1 truncate">
                    https://openrouter.ai/api/alpha/decisions
                  </div>
                  <div className="px-3 py-2 text-xs font-mono bg-cyan-950/60 border border-cyan-800/80 rounded-lg text-cyan-300 whitespace-nowrap">
                    typesafe/jev-1.13
                  </div>
                </div>
              </div>
            </div>

            {/* Input State Box */}
            <div>
              <label className="block text-xs font-mono text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Input State (Text / Object / Ticket):</span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {stateInput.length} chars
                </span>
              </label>
              <textarea
                value={stateInput}
                onChange={(e) => setStateInput(e.target.value)}
                rows={3}
                className="w-full p-3 text-sm font-sans bg-[#121522] border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
                placeholder="Enter customer message or state to classify..."
              />
            </div>

            {/* Questions JSON Schema */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-zinc-300">
                  Questions Definition (JSON Schema):
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">
                  noul, choice, score
                </span>
              </div>
              <textarea
                value={questionsJson}
                onChange={(e) => setQuestionsJson(e.target.value)}
                rows={9}
                className="w-full p-3 text-xs font-mono bg-[#10121d] border border-zinc-800 rounded-lg text-cyan-200 focus:outline-none focus:border-cyan-500 transition-colors leading-relaxed"
              />
            </div>

            {/* Run Button & Status */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRunDecision}
                  disabled={isRunning || !stateInput.trim()}
                  className={`px-6 py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg flex items-center gap-2.5 ${
                    isRunning
                      ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20 active:scale-95"
                  }`}
                >
                  {isRunning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Calling JEV (Decisions API)...</span>
                    </>
                  ) : (
                    <>
                      <span>▶</span>
                      <span>Run JEV Decision</span>
                    </>
                  )}
                </button>

                {execTimeMs !== null && !isRunning && (
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded">
                    ⚡ {execTimeMs}ms latency
                  </span>
                )}
              </div>

              <div className="text-xs text-zinc-400 font-mono">
                Model executes on OpenRouter alpha decisions
              </div>
            </div>

            {/* Error Display */}
            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-xs font-mono">
                <div className="font-bold text-red-300 mb-1 flex items-center gap-1.5">
                  <span>⚠️</span> Execution Error:
                </div>
                <p className="whitespace-pre-wrap">{errorMsg}</p>
              </div>
            )}

            {/* Results Display */}
            {executionResult && (
              <div className="pt-4 border-t border-[#1d2334] space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    JEV Decision Output
                  </h3>
                  <span className="text-xs font-mono text-zinc-400">
                    ID: {executionResult.id || "decision_call"}
                  </span>
                </div>

                {/* Structured Answers Cards */}
                {executionResult.answers && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(executionResult.answers as DecisionAnswers).map(
                      ([key, ans]) => {
                        return (
                          <div
                            key={key}
                            className="p-4 rounded-xl bg-[#111420] border border-[#21273c] shadow-md flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-xs uppercase font-bold text-cyan-300">
                                  {key}
                                </span>
                                <span className="text-[10px] font-mono uppercase bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
                                  {ans.type}
                                </span>
                              </div>

                              {/* Rendering NOUL */}
                              {ans.type === "noul" && (
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-xs text-zinc-400">
                                      Probability (Yes):
                                    </span>
                                    <span className="text-xl font-mono font-extrabold text-emerald-400">
                                      {typeof ans.noul === "number"
                                        ? `${(ans.noul * 100).toFixed(1)}%`
                                        : "N/A"}
                                    </span>
                                  </div>
                                  {/* Progress bar */}
                                  <div className="w-full h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-500 ${
                                        (ans.noul ?? 0) > 0.7
                                          ? "bg-emerald-500"
                                          : (ans.noul ?? 0) > 0.3
                                          ? "bg-amber-500"
                                          : "bg-zinc-600"
                                      }`}
                                      style={{
                                        width: `${Math.min(
                                          100,
                                          Math.max(0, (ans.noul ?? 0) * 100)
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                  <div className="text-[11px] text-zinc-400 flex justify-between font-mono">
                                    <span>False (0%)</span>
                                    <span>True (100%)</span>
                                  </div>
                                </div>
                              )}

                              {/* Rendering CHOICE */}
                              {ans.type === "choice" && (
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-xs text-zinc-400">Selected:</span>
                                    <span className="text-lg font-mono font-bold text-cyan-300 uppercase">
                                      {ans.choice || "N/A"}
                                    </span>
                                  </div>

                                  {ans.probabilities && (
                                    <div className="space-y-1.5 mt-2">
                                      {Object.entries(ans.probabilities).map(
                                        ([optKey, prob]) => {
                                          const pct = (Number(prob) * 100).toFixed(1);
                                          const isSelected = ans.choice === optKey;
                                          return (
                                            <div key={optKey} className="text-xs">
                                              <div className="flex justify-between text-[11px] font-mono text-zinc-300 mb-0.5">
                                                <span
                                                  className={
                                                    isSelected
                                                      ? "text-cyan-300 font-bold"
                                                      : "text-zinc-400"
                                                  }
                                                >
                                                  {optKey}
                                                </span>
                                                <span className="text-zinc-400">{pct}%</span>
                                              </div>
                                              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                  className={`h-full ${
                                                    isSelected ? "bg-cyan-400" : "bg-zinc-600"
                                                  }`}
                                                  style={{ width: `${pct}%` }}
                                                />
                                              </div>
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Rendering SCORE */}
                              {ans.type === "score" && (
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-baseline justify-between">
                                    <span className="text-xs text-zinc-400">Rubric Score:</span>
                                    <span className="text-base font-mono font-bold text-purple-300">
                                      {String(ans.score)}
                                    </span>
                                  </div>
                                  <div className="p-2.5 rounded bg-[#161a29] border border-zinc-800 text-xs font-mono text-zinc-300">
                                    Calibrated Position: {String(ans.score)}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

                {/* Workflow Automation Simulation */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-[#101322] border border-cyan-800/40">
                  <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold uppercase mb-2">
                    <span>⚡</span> Simulated Application Action:
                  </div>
                  <div className="text-xs font-mono text-zinc-300 space-y-1">
                    {executionResult.answers?.is_urgent?.noul > 0.7 &&
                    executionResult.answers?.department?.choice === "billing" ? (
                      <p className="text-emerald-300 font-semibold">
                        🚨 ACTION TRIGGERED: High urgency billing ticket detected ({">"}70%).
                        Auto-assigned to Tier 2 Payouts On-Call Slack channel.
                      </p>
                    ) : executionResult.answers?.is_spam?.noul > 0.8 ? (
                      <p className="text-rose-300 font-semibold">
                        🛑 ACTION TRIGGERED: Spam probability {">"}80%. Auto-quarantined post
                        and flagged author account.
                      </p>
                    ) : executionResult.answers?.is_enterprise?.noul > 0.7 ? (
                      <p className="text-cyan-300 font-semibold">
                        💼 ACTION TRIGGERED: Enterprise deal signaled. Synced contact to
                        Salesforce and notified Enterprise Account Executive.
                      </p>
                    ) : (
                      <p className="text-zinc-400">
                        ✔️ Standard decision workflow completed. Answers successfully parsed
                        and actionable.
                      </p>
                    )}
                  </div>
                </div>

                {/* Full Raw JSON toggle */}
                <details className="rounded-xl border border-zinc-800 bg-[#0f121d] overflow-hidden text-xs">
                  <summary className="p-3 font-mono text-zinc-400 cursor-pointer hover:text-zinc-200 hover:bg-zinc-800/30">
                    View Complete Raw JSON Response
                  </summary>
                  <pre className="p-4 font-mono text-cyan-200 overflow-x-auto bg-[#090b12] border-t border-zinc-800 text-[11px] leading-relaxed">
                    {JSON.stringify(executionResult, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-zinc-800/80 text-center text-xs font-mono text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            Built with Typesafe Decisions API · Model:{" "}
            <code className="text-cyan-400">typesafe/jev-1.13</code>
          </div>
          <div>
            <Link href="/" className="text-cyan-400 hover:underline">
              Return to Main Agent Dashboard →
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
