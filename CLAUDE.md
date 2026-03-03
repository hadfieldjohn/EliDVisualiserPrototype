# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # Start dev server (localhost:3000)
npm run build    # Production build
npm test         # Run tests (watch mode)
npm test -- --watchAll=false  # Run tests once
```

## Architecture

This is a Create React App project that visualises campaign configuration rules as an interactive flow diagram. It is essentially a single-page tool: load a JSON config file, select an iteration, and the diagram renders.

**Entry point:** `src/App.js` — contains all business logic (no Redux, no routing, no external state management).

### Data flow

1. User uploads a `CampaignConfig` JSON file via file input.
2. `parseConfigRules()` in `App.js` transforms the JSON into ReactFlow `nodes` and `edges` arrays.
3. ReactFlow renders the diagram. The iteration dropdown filters which iteration's rules are displayed.

### Input JSON shape

The visualiser expects a JSON object with a `CampaignConfig` key containing:
- `Iterations[]` — each iteration has `IterationRules`, `IterationCohorts`, `DefaultCommsRouting`, `DefaultNotEligibleRouting`, `DefaultNotActionableRouting`, and `ActionsMapper`.
- `DefaultCommsRouting` — top-level fallback routing.

### Rule types in `IterationRules`

| Type | Meaning | Terminal node |
|------|---------|---------------|
| `F`  | Filter (not eligible) | "Filtered" (red) |
| `S`  | Suppression (not actionable) | "Suppressed" (orange) |
| `R`  | Routing for actionable records | "Action" (green) |
| `X`  | Routing for not-eligible records | "Filtered" (red) |
| `Y`  | Routing for not-actionable records | "Suppressed" (orange) |

Rules with the same `Priority` value are AND-clauses. Rules with different priorities are sequential (N/Y branches). `RuleStop: "Y"` on an S-type rule triggers a stop-icon indicator.

### Custom ReactFlow node types

All node types live in `src/<NodeName>/index.js` and are registered in `App.js`:

| Type key | Component | Handle layout | Used for |
|----------|-----------|---------------|----------|
| `decision` | `DecisionNode` | Y→Right, N→Bottom, TY←Left | AND-clause F/S rules |
| `leftdecision` | `LeftDecisionNode` | TN←Top, Y→Right, N→Bottom | First F/S rule in a priority group |
| `topdecision` | `TopDecisionNode` | T/R/TL←inputs, B/L/RS→outputs | Routing rules (R/X/Y type) |
| `markdown` | `MarkDownNode` | TN←Top | Comms routing action plans |
| `routingnode` | `RoutingNode` | TN←Top | (legacy routing display) |
| `inputnode` | `InputNode` | N→Bottom | Cohort input nodes (blue) |

### MarkDownNode label format

The label string uses `|` to separate rows and `~` to separate the collapsible trigger from its markdown body:
```
RoutingPlanName~markdown content|AnotherPlan~more content|
```

### Layout algorithm

Node positions are computed algorithmically in `parseConfigRules()`. Key spacing constants:
- `ruleSpace = 200` — vertical gap between rule rows
- Column width for F/S rules: 300px steps
- Column width for routing rules: 450px steps

`adjustFilterSuppressActionNodes()` repositions the three terminal nodes (Filtered, Suppressed, Action) after all F/S rules are placed, centring them relative to their rule columns.

### Icons

- `src/icons/RuleStopIcon.tsx` — shown on S-type rules where `RuleStop === "Y"` and it's the last rule in a priority group.
- `src/icons/VirtualCohortIcon.tsx` — shown on cohort nodes where `Virtual` is `"Y"` or `"y"`.

### PNG export

`downloadDiagram()` uses `html-to-image` to capture `.react-flow__viewport` and triggers a download as `vims_iteration.png`. Image dimensions are derived from `ruleHeight` and `ruleWidth` returned by `parseConfigRules()`.