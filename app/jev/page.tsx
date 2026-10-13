"use client";

import React, { useState } from "react";
import Link from "next/link";

interface SubAgentDef {
  id: string;
  name: string;
  role: string;
  description: string;
  questionKey: string;
}

const SUB_AGENTS: SubAgentDef[] = [
  {
    id: "db_write_agent",
    name: "db_write_agent",
    role: "Database Write Access",
    description: "Write access to app database for creation, updation, or deletion only.",
    questionKey: "needs_db_write",
  },
  {
    id: "memory_agent",
    name: "memory_agent",
    role: "User Memory & Preferences",
    description: "Recall old memory or user preferences when user asks or when older memory is needed to answer.",
    questionKey: "needs_memory",
  },
  {
    id: "analysis_agent",
    name: "analysis_agent",
    role: "Database Read & Analytics",
    description: "Read access to app database for tasks, issues, tickets and summarizing work and project status.",
    questionKey: "needs_analysis",
  },
  {
    id: "web_agent",
    name: "web_agent",
    role: "Live Web & Browsing",
    description: "Google search, scraping public URLs, news, and real-time internet lookups.",
    questionKey: "needs_web",
  },
  {
    id: "mcp_agent",
    name: "mcp_agent",
    role: "Third-Party Apps & Integrations",
    description: "Linear issues, Sentry errors, Slack messages, booking calendar meetings, external MCP tools.",
    questionKey: "needs_mcp",
  },
  {
    id: "sprint_agent",
    name: "sprint_agent",
    role: "Sprint Management",
    description: "Creating, managing sprints, team sprint updates, or anything regarding sprint.",
    questionKey: "needs_sprint",
  },
];

const PROMPT_SAMPLES = [
  {
    label: "💬 Simple Chit-Chat",
    prompt: "Hey! How is your day going? Just wanted to check in and say hi!",
  },
  {
    label: "💾 DB Write Only",
    prompt: "Delete user record with id #4092 from the database and insert a new audit log row.",
  },
  {
    label: "📊 Database Read & Analysis",
    prompt: "Read all pending issues and tickets from our app database and summarize the project status for this week.",
  },
  {
    label: "🧠 Memory Recall",
    prompt: "What were the user preferences and design rules I told you to remember earlier?",
  },
  {
    label: "🏃 Sprint Management",
    prompt: "Create a new sprint for next week, assign the team sprint goals, and summarize current sprint progress.",
  },
  {
    label: "🔌 Third-Party MCP (Linear/Slack)",
    prompt: "Create a Linear issue for this auth bug, post an alert in the #dev Slack channel, and check Sentry errors.",
  },
];

export default function JevPage() {
  const [activeTab, setActiveTab] = useState<"orchestrator" | "learn">("orchestrator");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);

  // Multi-Agent prompt & state
  const [promptInput, setPromptInput] = useState(
    "Create a Linear issue for this auth bug, post an alert in the #dev Slack channel, and check Sentry errors."
  );
  const [isRouting, setIsRouting] = useState(false);
  const [routingResult, setRoutingResult] = useState<any>(null);
  const [routingError, setRoutingError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  // Model & Reasoning Selection state
  const [modelPrompt, setModelPrompt] = useState(
    "Design and optimize an end-to-end distributed transaction consensus protocol with formal mathematical proofs, fault-tolerance edge cases, and deadlock prevention under Byzantine failures."
  );
  const [isSelectingModel, setIsSelectingModel] = useState(false);
  const [modelResult, setModelResult] = useState<any>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelLatencyMs, setModelLatencyMs] = useState<number | null>(null);

  const handleSelectModel = async () => {
    if (!modelPrompt.trim()) return;
    setIsSelectingModel(true);
    setModelError(null);
    setModelResult(null);
    const start = performance.now();

    const questions = {
      selected_model: {
        type: "choice",
        instructions:
          "Which AI model is best suited to execute this task efficiently and effectively based on task complexity, coding difficulty, and required capability? (Select exactly ONE model).",
        criteria: {
          "gpt-0ss-120b": "Fast, basic, low-complexity tasks, simple formatting, or short answers requiring no reasoning.",
          "gpt-4.1-mini": "Standard day-to-day coding, routine scripts, basic lookups, lightweight translation without deep reasoning.",
          "gpt-5.1-mini": "Moderate-to-high complexity tasks, multi-step code refactoring, system architecture, or logical reasoning.",
          "gpt-6-luna": "Extremely complex, mission-critical problems, formal mathematical proofs, advanced algorithmic design, deep architectural optimization, or hardest frontier challenges."
        }
      },
      reasoning_effort: {
        type: "choice",
        instructions:
          "What level of internal reasoning effort is required for this specific task? Note: gpt-0ss-120b and gpt-4.1-mini do not support reasoning (select 'none'). For gpt-5.1-mini select low, medium, or high. For gpt-6-luna select low, medium, high, or max.",
        criteria: {
          none: "No reasoning needed (straightforward response or model has no reasoning capability).",
          low: "Light multi-step thinking or quick validation.",
          medium: "Moderate problem solving, multi-file code logic, or debugging.",
          high: "Deep analytical thinking, complex architecture, or tricky edge cases.",
          max: "Maximum recursive deliberation, formal verification, or extreme difficulty."
        }
      }
    };

    try {
      const res = await fetch("/api/jev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: "typesafe/jev-1.13",
          state: modelPrompt.trim(),
          questions
        }),
      });

      const data = await res.json();
      setModelLatencyMs(Math.round(performance.now() - start));

      if (!res.ok) {
        throw new Error(data.error || JSON.stringify(data));
      }

      setModelResult(data);
    } catch (err: any) {
      setModelError(err.message || "Failed to select model with JEV");
    } finally {
      setIsSelectingModel(false);
    }
  };

  const handleRoute = async () => {
    if (!promptInput.trim()) return;
    setIsRouting(true);
    setRoutingError(null);
    setRoutingResult(null);
    const start = performance.now();

    const questions = {
      is_chitchat: {
        type: "noul",
        instructions:
          "Is this prompt simple conversational small talk, greeting, or casual chit-chat that requires NO third-party apps, NO database write, NO memory retrieval, NO web search, NO data analysis, and NO sprint planning?",
        criteria: {
          true: "Simple casual chit-chat handled directly by main agent",
          false: "Requires specialized action, tool, or integration",
        },
      },
      needs_db_write: {
        type: "noul",
        instructions:
          "Does this task explicitly require WRITE access to the application database for CREATION, UPDATION, or DELETION of internal records only? (Do not trigger for read-only queries or checking existing items).",
        criteria: {
          true: "Explicit database write, update, or deletion needed",
          false: "No write/mutation needed",
        },
      },
      needs_memory: {
        type: "noul",
        instructions:
          "Does this task require recalling past user memory, personal context, or saved preferences (e.g. 'do you remember me?', 'what did I say earlier?')?",
        criteria: {
          true: "Requires recalling past conversation, user facts, or preferences",
          false: "No memory recall needed",
        },
      },
      needs_analysis: {
        type: "noul",
        instructions:
          "Does this task require READ access to internal database records, tasks, or issues to compute metrics, analyze progress, or summarize work?",
        criteria: {
          true: "Requires reading database to analyze data, metrics, or work summary",
          false: "No analytical database read needed",
        },
      },
      needs_web: {
        type: "noul",
        instructions:
          "Does this task require live internet search, Google queries, or fetching public internet websites? (Do not trigger for internal queries).",
        criteria: {
          true: "Explicit live web browsing or public internet lookup required",
          false: "No external web search needed",
        },
      },
      needs_mcp: {
        type: "noul",
        instructions:
          "Does the user EXPLICITLY ask for third-party tools or external services (such as Linear, Slack, Sentry, Google Calendar, or MCP servers)? STRICT RULE: Do NOT trigger unless an external third-party tool or service is explicitly requested or mentioned.",
        criteria: {
          true: "Explicitly requests third-party app action (Linear, Sentry, Slack, Google Calendar, or MCP tool)",
          false: "No third-party tool or service explicitly requested",
        },
      },
      needs_sprint: {
        type: "noul",
        instructions:
          "Does this task involve sprints — including checking sprints, viewing sprint status, creating sprints, managing sprints, or sprint planning?",
        criteria: {
          true: "Involves sprint viewing, checking, planning, or management",
          false: "Unrelated to sprints",
        },
      },
    };

    try {
      const res = await fetch("/api/jev", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          model: "typesafe/jev-1.13",
          state: promptInput.trim(),
          questions,
        }),
      });

      const data = await res.json();
      setLatencyMs(Math.round(performance.now() - start));

      if (!res.ok) {
        throw new Error(data.error || JSON.stringify(data));
      }

      setRoutingResult(data);
    } catch (err: any) {
      setRoutingError(err.message || "Failed to route prompt");
    } finally {
      setIsRouting(false);
    }
  };

  // Evaluate JEV decisions
  const getDecision = () => {
    if (!routingResult?.answers) return null;
    const ans = routingResult.answers;
    const chitchatScore = ans.is_chitchat?.noul ?? 0;

    const scores = SUB_AGENTS.map((agent) => {
      const score = ans[agent.questionKey]?.noul ?? 0;
      return {
        ...agent,
        score,
        pct: (score * 100).toFixed(1),
      };
    });

    scores.sort((a, b) => b.score - a.score);
    const topScore = scores[0]?.score ?? 0;
    const isChitChat = chitchatScore > 0.65 && topScore < 0.50;

    let selected: typeof scores = [];
    if (!isChitChat) {
      // Rule 1: No limit to agent selection. Just don't select if below 50% (0.50)!
      selected = scores.filter((s) => s.score >= 0.50);
    }

    return {
      isChitChat,
      chitchatScore: (chitchatScore * 100).toFixed(1),
      scores,
      selected,
    };
  };

  const decision = getDecision();

  return (
    <div className="min-h-screen bg-[#090a0d] text-[#d6d9e0] font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Navigation Header */}
        <header className="flex items-center justify-between pb-6 mb-8 border-b border-[#1b1d24]">
          <Link
            href="/"
            className="text-xs font-mono text-zinc-400 hover:text-zinc-200 flex items-center gap-1.5 transition-colors"
          >
            <span>←</span>
            <span>Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500">Model:</span>
            <code className="text-xs font-mono text-cyan-400 bg-[#12141c] px-2 py-0.5 rounded border border-zinc-800">
              typesafe/jev-1.13
            </code>
          </div>
        </header>

        {/* Top Header: JEV - by Typesafe AI */}
        <div className="mb-8">
          <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-1">
            Typesafe AI
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            JEV
          </h1>
          <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Fast, calibrated decision model. Unlike generative LLMs that generate arbitrary sentences, JEV answers typed questions about arbitrary state with calibrated mathematical probabilities (noul, choice, score).
          </p>
        </div>

        {/* Tab Toggle: Test It vs Learn More */}
        <div className="flex items-center gap-2 p-1 rounded-lg bg-[#11131a] border border-[#1d202a] w-fit mb-8 text-xs font-mono">
          <button
            onClick={() => setActiveTab("orchestrator")}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === "orchestrator"
                ? "bg-cyan-950/80 text-cyan-300 font-semibold border border-cyan-800/80"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            ⚡ Test Multi-Agent Router
          </button>
          <button
            onClick={() => setActiveTab("learn")}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === "learn"
                ? "bg-cyan-950/80 text-cyan-300 font-semibold border border-cyan-800/80"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            📖 About JEV &amp; How to Use
          </button>
        </div>

        {/* TAB 1: Multi-Agent Orchestrator (Testing Real Scenario) */}
        {activeTab === "orchestrator" && (
          <div className="space-y-8">
            
            {/* Minimal Agent Topology Grid */}
            <div className="p-5 rounded-xl bg-[#0d0e14] border border-[#1a1d26] space-y-4">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-zinc-200 uppercase tracking-wide">
                  Agent Topology
                </span>
                <span className="text-zinc-500">1 Main Agent + 6 Sub-Agents</span>
              </div>

              {/* Main Agent Bar */}
              <div className="p-3 rounded-lg bg-[#12141c] border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-white mr-2">main_agent</span>
                  <span className="text-xs text-zinc-400">
                    Talks to user directly. If prompt is simple chit-chat, handles it with 0 sub-agents.
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">Active</span>
              </div>

              {/* 6 Sub-Agents Cards (Clean, Few Colors) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SUB_AGENTS.map((agent) => {
                  const isPicked = decision?.selected.some((s) => s.id === agent.id);
                  const agentScore = decision?.scores.find((s) => s.id === agent.id);

                  return (
                    <div
                      key={agent.id}
                      className={`p-3.5 rounded-lg transition-all ${
                        isPicked
                          ? "bg-[#141824] border border-cyan-500 text-white"
                          : "bg-[#11131a] border border-zinc-800/80 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-zinc-100">
                          {agent.name}
                        </span>
                        {isPicked && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 mb-1.5">
                        {agent.role}
                      </div>
                      <p className="text-xs text-zinc-400 leading-normal mb-2">
                        {agent.description}
                      </p>

                      {agentScore && (
                        <div className="pt-2 border-t border-zinc-800">
                          <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                            <span>Confidence:</span>
                            <span className={isPicked ? "text-cyan-300 font-bold" : "text-zinc-400"}>
                              {agentScore.pct}%
                            </span>
                          </div>
                          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isPicked ? "bg-cyan-400" : "bg-zinc-600"}`}
                              style={{ width: `${agentScore.pct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Prompt Textarea & Dispatch Action */}
            <div className="p-5 rounded-xl bg-[#0d0e14] border border-[#1a1d26] space-y-4">
              <label className="block text-xs font-mono font-semibold text-zinc-200">
                Write any prompt in textarea:
              </label>

              {/* Sample Prompts */}
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_SAMPLES.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPromptInput(s.prompt)}
                    className="px-2.5 py-1 text-xs font-mono rounded bg-[#13151f] border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                rows={3}
                placeholder="Write your prompt here to test JEV routing accuracy..."
                className="w-full p-3 text-sm bg-[#11131a] border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors font-sans"
              />

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 flex-wrap gap-3">
                <button
                  onClick={handleRoute}
                  disabled={isRouting || !promptInput.trim()}
                  className={`px-6 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    isRouting
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "bg-cyan-500 hover:bg-cyan-400 text-black active:scale-95"
                  }`}
                >
                  {isRouting ? "Evaluating with JEV..." : "Route Prompt with JEV"}
                </button>

                {latencyMs !== null && !isRouting && (
                  <span className="text-xs font-mono text-zinc-400">
                    Latency: <span className="text-cyan-300 font-bold">{latencyMs}ms</span>
                  </span>
                )}
              </div>

              {routingError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/80 text-red-200 text-xs font-mono">
                  Error: {routingError}
                </div>
              )}

              {/* Routing Verdict Display */}
              {decision && (
                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  <div className="text-xs font-mono text-zinc-400">Routing Decision:</div>

                  {decision.isChitChat ? (
                    <div className="p-4 rounded-lg bg-[#11141e] border border-zinc-700">
                      <div className="text-sm font-bold text-white font-mono mb-1">
                        💬 Handled by main_agent directly
                      </div>
                      <p className="text-xs text-zinc-400">
                        Classified as simple conversational chit-chat ({decision.chitchatScore}%). No sub-agents needed.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-[#11141e] border border-cyan-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-sm font-bold text-cyan-300">
                          ⚡ Dispatched {decision.selected.length} Sub-Agent(s) in Parallel:
                        </span>
                        <span className="text-zinc-500">&ge; 50% threshold</span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {decision.selected.map((ag) => (
                          <div
                            key={ag.id}
                            className="px-3 py-1.5 rounded bg-cyan-950 border border-cyan-700 text-xs font-mono text-cyan-200 flex items-center gap-2"
                          >
                            <span className="font-bold">{ag.name}</span>
                            <span className="text-zinc-400">({ag.pct}%)</span>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-zinc-400 font-mono pt-1">
                        Workflow: main_agent dispatched tasks to [{decision.selected.map((s) => s.name).join(", ")}] in parallel.
                      </p>
                    </div>
                  )}

                  {/* Raw Probabilities Accordion */}
                  <details className="text-xs font-mono text-zinc-500 pt-1">
                    <summary className="cursor-pointer hover:text-zinc-300">
                      View all calibrated probabilities
                    </summary>
                    <div className="p-3 mt-2 rounded bg-black/40 border border-zinc-800 text-zinc-400 space-y-1">
                      <div>is_chitchat: {decision.chitchatScore}%</div>
                      {decision.scores.map((s) => (
                        <div key={s.id}>
                          {s.name}: {s.pct}%
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}
            </div>

            {/* USE CASE 2: Model Selection & Reasoning Selection */}
            <div className="p-5 rounded-xl bg-[#0d0e14] border border-[#1a1d26] space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold mb-0.5">
                    Use Case 02 · Dynamic Model Routing
                  </div>
                  <h3 className="text-base font-bold text-white font-mono">
                    Model Selection &amp; Reasoning Effort Selection
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  Selects exactly 1 model + 1 reasoning level
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                JEV analyzes task complexity and picks the optimal model and calibrated reasoning effort:
              </p>

              {/* Supported Models Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs font-mono">
                <div className={`p-3 rounded-lg border transition-all ${
                  modelResult?.answers?.selected_model?.choice === "gpt-0ss-120b"
                    ? "bg-[#141824] border-cyan-400 text-white"
                    : "bg-[#11131a] border-zinc-800 text-zinc-400"
                }`}>
                  <div className="font-bold text-zinc-200">gpt-0ss-120b</div>
                  <div className="text-[11px] text-zinc-500 mt-1">Reasoning: none</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Fast, basic, low complexity</div>
                </div>

                <div className={`p-3 rounded-lg border transition-all ${
                  modelResult?.answers?.selected_model?.choice === "gpt-4.1-mini"
                    ? "bg-[#141824] border-cyan-400 text-white"
                    : "bg-[#11131a] border-zinc-800 text-zinc-400"
                }`}>
                  <div className="font-bold text-zinc-200">gpt-4.1-mini</div>
                  <div className="text-[11px] text-zinc-500 mt-1">Reasoning: none</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Routine tasks, day-to-day code</div>
                </div>

                <div className={`p-3 rounded-lg border transition-all ${
                  modelResult?.answers?.selected_model?.choice === "gpt-5.1-mini"
                    ? "bg-[#141824] border-cyan-400 text-white"
                    : "bg-[#11131a] border-zinc-800 text-zinc-400"
                }`}>
                  <div className="font-bold text-zinc-200">gpt-5.1-mini</div>
                  <div className="text-[11px] text-cyan-400 mt-1">Reasoning: low, med, high</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Moderate to high complexity</div>
                </div>

                <div className={`p-3 rounded-lg border transition-all ${
                  modelResult?.answers?.selected_model?.choice === "gpt-6-luna"
                    ? "bg-[#141824] border-cyan-400 text-white"
                    : "bg-[#11131a] border-zinc-800 text-zinc-400"
                }`}>
                  <div className="font-bold text-zinc-200">gpt-6-luna</div>
                  <div className="text-[11px] text-cyan-400 mt-1">Reasoning: low, med, high, max</div>
                  <div className="text-[10px] text-zinc-400 mt-1">Hardest frontier problems</div>
                </div>
              </div>

              {/* Sample Task Scenarios */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-zinc-400">
                  Quick Scenario Presets (click to test):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setModelPrompt("Convert this markdown table to HTML and fix typos.")}
                    className="px-2.5 py-1 text-xs font-mono rounded bg-[#13151f] border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Simple Formatting (gpt-0ss-120b)
                  </button>
                  <button
                    onClick={() => setModelPrompt("Write a standard Python script to parse CSV files and remove duplicate rows.")}
                    className="px-2.5 py-1 text-xs font-mono rounded bg-[#13151f] border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Routine Code (gpt-4.1-mini)
                  </button>
                  <button
                    onClick={() => setModelPrompt("Refactor an authentication microservice to handle multi-tenant JWT token rotation with Redis session revocation and edge-case testing.")}
                    className="px-2.5 py-1 text-xs font-mono rounded bg-[#13151f] border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Moderate Complexity (gpt-5.1-mini)
                  </button>
                  <button
                    onClick={() => setModelPrompt("Design and optimize an end-to-end distributed transaction consensus protocol with formal mathematical proofs, fault-tolerance edge cases, and deadlock prevention under Byzantine failures.")}
                    className="px-2.5 py-1 text-xs font-mono rounded bg-[#13151f] border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Extreme Difficulty (gpt-6-luna)
                  </button>
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={modelPrompt}
                onChange={(e) => setModelPrompt(e.target.value)}
                rows={3}
                placeholder="Describe your task scenario here to let JEV select the best model & reasoning effort..."
                className="w-full p-3 text-sm bg-[#11131a] border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors font-sans"
              />

              {/* Action Button */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 flex-wrap gap-3">
                <button
                  onClick={handleSelectModel}
                  disabled={isSelectingModel || !modelPrompt.trim()}
                  className={`px-6 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                    isSelectingModel
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "bg-cyan-500 hover:bg-cyan-400 text-black active:scale-95"
                  }`}
                >
                  {isSelectingModel ? "JEV Selecting Model & Reasoning..." : "Select Model & Reasoning with JEV"}
                </button>

                {modelLatencyMs !== null && !isSelectingModel && (
                  <span className="text-xs font-mono text-zinc-400">
                    Latency: <span className="text-cyan-300 font-bold">{modelLatencyMs}ms</span>
                  </span>
                )}
              </div>

              {modelError && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/80 text-red-200 text-xs font-mono">
                  Error: {modelError}
                </div>
              )}

              {/* Selection Result Display */}
              {modelResult?.answers && (
                <div className="pt-4 border-t border-zinc-800 space-y-3">
                  <div className="text-xs font-mono text-zinc-400">JEV Model Routing Decision:</div>

                  <div className="p-4 rounded-lg bg-[#11141e] border border-cyan-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Selected Model */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-mono text-zinc-400">Selected Model:</div>
                      <div className="text-base font-bold text-white font-mono">
                        🎯 {modelResult.answers.selected_model?.choice || "N/A"}
                      </div>
                      {modelResult.answers.selected_model?.probabilities && (
                        <div className="text-[11px] font-mono text-cyan-300">
                          Confidence:{" "}
                          {(
                            (modelResult.answers.selected_model.probabilities[
                              modelResult.answers.selected_model.choice
                            ] || 0) * 100
                          ).toFixed(1)}
                          %
                        </div>
                      )}
                    </div>

                    {/* Selected Reasoning Effort */}
                    <div className="space-y-1">
                      <div className="text-[11px] font-mono text-zinc-400">Reasoning Effort:</div>
                      <div className="text-base font-bold text-cyan-300 font-mono uppercase">
                        🧠 {modelResult.answers.reasoning_effort?.choice || "none"}
                      </div>
                      {modelResult.answers.reasoning_effort?.probabilities && (
                        <div className="text-[11px] font-mono text-zinc-400">
                          Confidence:{" "}
                          {(
                            (modelResult.answers.reasoning_effort.probabilities[
                              modelResult.answers.reasoning_effort.choice
                            ] || 0) * 100
                          ).toFixed(1)}
                          %
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Probabilities Breakdown */}
                  <details className="text-xs font-mono text-zinc-500 pt-1">
                    <summary className="cursor-pointer hover:text-zinc-300">
                      View all model candidate probabilities
                    </summary>
                    <div className="p-3 mt-2 rounded bg-black/40 border border-zinc-800 text-zinc-400 space-y-2">
                      <div>
                        <div className="font-bold text-zinc-300 mb-1">Model Distribution:</div>
                        {modelResult.answers.selected_model?.probabilities &&
                          Object.entries(modelResult.answers.selected_model.probabilities).map(([m, p]) => (
                            <div key={m} className="flex justify-between">
                              <span>{m}</span>
                              <span className="text-cyan-300">{(Number(p) * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                      </div>
                      <div className="pt-2 border-t border-zinc-800">
                        <div className="font-bold text-zinc-300 mb-1">Reasoning Distribution:</div>
                        {modelResult.answers.reasoning_effort?.probabilities &&
                          Object.entries(modelResult.answers.reasoning_effort.probabilities).map(([r, p]) => (
                            <div key={r} className="flex justify-between">
                              <span>{r}</span>
                              <span className="text-cyan-300">{(Number(p) * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </div>

            {/* Optional Key Configuration (Subtle & Minimal) */}
            <div className="p-3 rounded-lg bg-[#0d0e14] border border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-500">
              <div className="flex items-center gap-2">
                <span>API Key:</span>
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Loaded automatically from .env"
                  className="bg-[#12141c] border border-zinc-800 px-2 py-0.5 rounded text-zinc-300 w-64 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="text-zinc-400 hover:text-cyan-300 underline"
                >
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>
              <span>OpenRouter Decisions API</span>
            </div>
          </div>
        )}

        {/* TAB 2: About JEV & How to Use */}
        {activeTab === "learn" && (
          <div className="space-y-8">
            
            {/* What is JEV Section */}
            <div className="p-5 rounded-xl bg-[#0d0e14] border border-[#1a1d26] space-y-4">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                What is JEV (typesafe/jev-1.13)?
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                JEV is a <strong>System One Decision Model</strong> available on OpenRouter via the <code className="text-cyan-400">/api/alpha/decisions</code> endpoint.
                Unlike traditional generative LLMs (like GPT-4 or Claude) that stream freeform text, JEV answers typed questions about arbitrary state (strings, objects, or arrays) and returns <strong>calibrated probabilities</strong>.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#11131a] border border-zinc-800">
                  <span className="text-cyan-300 font-bold block mb-1">1. noul</span>
                  <p className="text-zinc-400 font-sans">
                    Calibrated binary probability from 0.0 to 1.0. Used for threshold checks.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#11131a] border border-zinc-800">
                  <span className="text-cyan-300 font-bold block mb-1">2. choice</span>
                  <p className="text-zinc-400 font-sans">
                    Pick from user-defined categories with normalized probability distributions.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[#11131a] border border-zinc-800">
                  <span className="text-cyan-300 font-bold block mb-1">3. score</span>
                  <p className="text-zinc-400 font-sans">
                    Ordinal position along an ordered rubric list.
                  </p>
                </div>
              </div>
            </div>

            {/* How to Use Code Section */}
            <div className="p-5 rounded-xl bg-[#0d0e14] border border-[#1a1d26] space-y-4">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                How to Use in Code
              </h2>
              <p className="text-xs text-zinc-400">
                Call OpenRouter&apos;s <code className="text-cyan-400 font-mono">/api/alpha/decisions</code> endpoint with model <code className="text-cyan-400 font-mono">typesafe/jev-1.13</code>:
              </p>

              <pre className="p-4 rounded-lg bg-[#08090d] border border-zinc-800 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
                <code>{`// Example: JEV Decision Request
const response = await fetch('https://openrouter.ai/api/alpha/decisions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + process.env.OPENROUTER_API_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'typesafe/jev-1.13',
    state: 'Create a Linear issue for auth bug and post in Slack',
    questions: {
      needs_mcp: {
        type: 'noul',
        instructions: 'Does this task require third-party tools like Linear, Slack, or Sentry?',
        criteria: {
          true: 'Requires third-party app action',
          false: 'No tools needed'
        }
      }
    }
  })
});

const data = await response.json();
console.log(data.answers.needs_mcp.noul); // Calibrated probability (e.g. 0.94)`}</code>
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
