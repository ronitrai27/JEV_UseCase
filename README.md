# JEV Decisions Playground & Guide

An interactive, minimal Next.js application demonstrating **System One Decision Models** using [`typesafe/jev-1.13`](https://openrouter.ai/models/typesafe/jev-1.13) via the OpenRouter Decisions API (`/api/alpha/decisions`).

---

## What is JEV?

**JEV** (`typesafe/jev-1.13`) is **not a text-generating LLM**. 

Instead of streaming arbitrary sentences or hallucinated responses, JEV evaluates an input **state** (string, object, or array) and answers strict, typed questions with **calibrated mathematical probabilities**.

Your code owns the business logic and acts directly on the returned probabilities — making JEV ideal for:
- 🚦 **Intelligent routing & triage**
- 🛡️ **Automated content moderation & safety checks**
- 💼 **Sales lead qualification & scoring**
- 🔍 **Verification, compliance, and deterministic workflows**

### The 3 Typed Question Primitives

1. **`noul`** (Binary Confidence):
   - A calibrated probability from `0.0` (No) to `1.0` (Yes).
   - *Example:* `is_urgent: 0.94` → `if (is_urgent > 0.8) escalate();`
2. **`choice`** (Categorical Pick):
   - Selects from your defined keys and returns the complete normalized probability distribution across options.
   - *Example:* `department: billing (82%), technical (14%), sales (4%)`
3. **`score`** (Ordinal Rubric):
   - Places the state along an ordered rubric list.
   - *Example:* `frustration: ["Calm", "Frustrated", "Very angry"]`

---

## What this Project Does

- **Minimal Welcome Guide (`/`)**: A clean landing page with an interactive isometric hairline vector canvas, setup steps, and direct links to get your OpenRouter API key.
- **Interactive Playground (`/jev`)**: 
  - Test JEV live in the browser with custom state messages and schema configurations.
  - Built-in presets: *Support Ticket Escalation*, *Content Safety*, and *Enterprise Lead Qualification*.
  - Live calibrated visual gauges for `noul`, `choice`, and `score`.
  - Workflow simulation demonstrating automated actions (e.g. auto-quarantine, Slack escalation).
- **Secure Backend API Route (`/api/jev`)**: Next.js route handler proxying requests to OpenRouter, supporting environment variables (`OPENROUTER_API_KEY`) or UI inputs without exposing server secrets.
- **Multi-Language Integration Snippets**: Ready-to-copy code in JavaScript `fetch`, TypeScript SDK (`@openrouter/sdk`), cURL, and Python.

---

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
# or npm install / yarn
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Add your OpenRouter API key:
```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```
> Get your API key from [openrouter.ai/keys](https://openrouter.ai/workspaces/default/keys).  
> *(You can also leave this blank and paste your key directly in the playground UI!)*

### 3. Run the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the guide or [http://localhost:3000/jev](http://localhost:3000/jev) for the interactive playground.

---

## Usage Example

```typescript
import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const decision = await openrouter.alpha.decisions.create({
  decisionsRequest: {
    model: "typesafe/jev-1.13",
    state: "Help! My payouts have been failing for 3 days and my bank is rejecting transfers.",
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
});

const { is_urgent, department, frustration } = decision.answers;

// Automated deterministic workflow execution:
if (is_urgent?.noul > 0.8 && department?.choice === "billing") {
  console.log("⚡ Auto-escalating to Billing on-call queue!");
}
```

---

## Tech Stack

- **Framework**: Next.js 16 (Turbopack, App Router)
- **UI & Styling**: React 19, Tailwind CSS v4
- **Model**: `typesafe/jev-1.13` via OpenRouter Decisions API
