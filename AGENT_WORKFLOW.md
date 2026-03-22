# AI Agent Workflow Log

## Agents Used

| Agent | Role in This Project |
|---|---|
| **Claude (claude.ai)** | Primary agent — system design, domain modeling, all code generation, architecture decisions, test scaffolding, documentation |
| **GitHub Copilot** | Inline completions for boilerplate (imports, type annotations, repeated patterns) |
| **Cursor Agent** | Refactoring tasks — renaming domain types across files, extracting helper functions, applying consistent error handling patterns |

---

## Prompts & Outputs

### Example 1 — Initial System Design

**Prompt sent to Claude:**
```
You are a senior full-stack engineer and system architect.
I have a technical assignment to build a FuelEU Maritime compliance
platform using React + TypeScript + TailwindCSS on the frontend and
Node.js + TypeScript + PostgreSQL on the backend, following strict
hexagonal architecture (Ports & Adapters / Clean Architecture).

Help me identify the domain entities, define their relationships,
design the folder structure for both frontend and backend, define
ports (interfaces), and define use-cases (application layer).

Give diagrams in text and explanations. Do not dump everything at
once — guide me phase by phase.
```

**Generated output (excerpt):**

Claude produced a complete domain entity map identifying six core
types: `Route`, `ShipCompliance`, `BankEntry`, `Pool`, `PoolMember`,
and `ComplianceTarget` (value object). It also produced both folder
trees (backend and frontend), all four repository port interfaces,
and six use-case signatures — before a single line of implementation
was written.

Key insight the agent surfaced that I hadn't considered: treating
`ComplianceTarget` as a **value object** (not an entity) with the CB
formula as a pure function inside it. This made the formula testable
in complete isolation from any infrastructure.

---

### Example 2 — CB Formula Implementation

**Prompt sent to Claude:**
```
Implement the ComplianceTarget value object in TypeScript.
It should contain:
- TARGET_INTENSITY_2025 = 89.3368
- ENERGY_FACTOR = 41,000 MJ/t
- computeEnergyInScope(fuelConsumptionTonnes): number
- computeComplianceBalance(actual, fuelConsumption, target?): number
- computePercentDiff(baseline, comparison): number
- isCompliant(ghgIntensity): number

This must be pure TypeScript — no imports, no side effects.
```

**Generated output:**
```typescript
export const TARGET_INTENSITY_2025 = 89.3368;
export const ENERGY_FACTOR_MJ_PER_TONNE = 41_000;

export function computeEnergyInScope(fuelConsumptionTonnes: number): number {
  if (fuelConsumptionTonnes < 0) {
    throw new Error('Fuel consumption cannot be negative');
  }
  return fuelConsumptionTonnes * ENERGY_FACTOR_MJ_PER_TONNE;
}

export function computeComplianceBalance(
  actualGhgIntensity: number,
  fuelConsumptionTonnes: number,
  targetIntensity: number = TARGET_INTENSITY_2025
): number {
  const energy = computeEnergyInScope(fuelConsumptionTonnes);
  return (targetIntensity - actualGhgIntensity) * energy;
}
```

**What I corrected:** The initial output of `isCompliant` had return
type `number` (copy from my prompt — my mistake). I asked Claude to
fix it to `boolean`. It corrected it immediately and explained that
`boolean` is semantically correct since compliance is a binary
classification, not a score.

---

### Example 3 — Postgres NUMERIC Gotcha

**Prompt sent to Claude:**
```
Implement PgRouteRepository. It must implement RouteRepository port.
Use parameterised queries. Map snake_case DB rows to camelCase
domain objects.
```

**Generated output included this important warning:**

Claude proactively added the `parseFloat()` calls on every NUMERIC
column and included an inline comment:

```typescript
// pg returns NUMERIC as string — always parseFloat() to avoid
// silent string concatenation in arithmetic
ghgIntensity: parseFloat(row.ghg_intensity),
```

This was a real production gotcha I would have missed. Without it,
the CB formula would have silently returned `NaN` or a string
concatenation instead of a number.

---

### Example 4 — Greedy Pool Allocation

**Prompt sent to Claude:**
```
Implement the greedy allocation algorithm for CreatePool use-case.

Rules from the spec:
- Sort members descending by CB
- Surplus ships cover deficit ships
- Surplus ship cannot go negative after allocation
- Deficit ship cannot exit worse than before
- Return cb_before and cb_after per member

This must live entirely in the application layer — no DB calls
inside the algorithm itself.
```

**Generated output:** Claude implemented the full greedy allocator as
a private method `greedyAllocate()` inside `CreatePool`. It correctly
separated the data fetch phase (before the algorithm) from the
allocation phase (pure calculation), keeping the algorithm testable
without a database.

**What I refined:** After reviewing, I asked Claude to add a check
that the deficit ship `cbAfter` is never worse than `cbBefore`. It
added the guard and explained the invariant: a deficit ship must
never leave a pool in a worse position than it entered — the pool
can only help, not harm.

---

### Example 5 — Unit Test Mock Factory

**Prompt sent to Claude:**
```
Create a shared mock factory file for unit tests. I need:
- mockRouteRepo() — returns jest.Mocked<RouteRepository>
- mockComplianceRepo()
- mockBankRepo()
- mockPoolRepo()
- Fixture data (ROUTES constant matching seed data)
- makeCompliance() and makeBankEntry() factory helpers

Each mock should have sensible defaults that work for the happy
path, and accept overrides for specific test scenarios.
```

**Generated output:** Claude produced the complete `mocks.ts` file
with all factories. Particularly useful was the `overrides` pattern
it used:

```typescript
export function mockRouteRepo(
  overrides: Partial<RouteRepository> = {}
): jest.Mocked<RouteRepository> {
  return {
    findAll:     jest.fn().mockResolvedValue(Object.values(ROUTES)),
    findById:    jest.fn().mockImplementation(...),
    findBaseline: jest.fn().mockResolvedValue(ROUTES.R001),
    setBaseline:  jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<RouteRepository>;
}
```

This pattern meant every test only declares what's different from the
happy path, dramatically reducing test boilerplate.

---

### Example 6 — Frontend Hook Architecture

**Prompt sent to Claude:**
```
I need React hooks for the frontend application layer.
These hooks must:
1. Accept the ApiPort interface (not a concrete adapter)
2. Manage loading, error, and success state
3. Never import axios or fetch directly
4. Be pure orchestrators — call the port, update state

Create: useRoutes, useComparison, useBanking, usePooling
```

**Generated output:** Claude correctly identified that hooks accepting
an interface (rather than importing a concrete adapter) is the key
to keeping the frontend core dependency-free. It also added
`useCallback` with proper dependency arrays to prevent infinite
re-render loops — a common React pitfall with `useEffect` +
async data fetching.

---

## Validation / Corrections

### How I verified agent output

**1. Formula verification (manual)**

I manually computed the CB for R002 before trusting the code:
```
CB = (89.3368 - 88.0) × (4800 × 41,000)
   = 1.3368 × 196,800,000
   = 263,082,240 gCO₂eq
```
Then ran the unit test `ComputeCB.test.ts` to confirm the code
produced the same number. It did.

**2. Architecture boundary check**

After each generated file, I checked: does this file import anything
outside its allowed layer? Specifically:
- No `import express` inside `core/`
- No `import pg` inside `core/`
- No `import axios` inside `core/` (frontend)
- No `import React` inside `core/` (frontend)

Claude respected these boundaries on every generated file.

**3. Type safety**

Ran `tsc --noEmit` after each phase. Claude's output compiled clean
with `strict: true` on the first attempt in most cases. Two minor
fixes were needed:
- A `string | undefined` vs `string` mismatch in filter params
- A missing `readonly` on a domain interface property

**4. Integration test against real database**

Ran `npm run migrate && npm run seed && npx jest integration` to
confirm the generated SQL schema and seed data loaded correctly and
that all HTTP endpoints returned expected shapes.

---

## Observations

### Where the agent saved significant time

- **System design phase** — generating all ports, entities, and
  use-case signatures before writing a single implementation took
  ~20 minutes with Claude vs. what would have been 2–3 hours
  manually designing and second-guessing the architecture.

- **Boilerplate elimination** — all four Postgres adapters with row
  mappers, transaction handling, and parameterised queries were
  generated in one prompt each. Writing these manually is tedious
  and error-prone.

- **Test scaffolding** — the mock factory pattern and the full
  integration test setup (transaction isolation, beforeEach/afterAll
  lifecycle) would have taken significant time to get right manually.
  Claude produced production-grade test infrastructure immediately.

- **The `pg` NUMERIC string issue** — Claude flagged this
  proactively. This is a real production bug that catches teams by
  surprise. The agent's training on real-world PostgreSQL issues
  surfaced it without me asking.

### Where it failed or needed correction

- **Greedy allocation edge case** — the first version of
  `greedyAllocate()` did not correctly handle the case where a
  surplus ship's remaining balance after partial allocation was not
  reflected back in the final member list. Required a re-prompt with
  the specific invariant to fix.

- **Express route ordering** — Claude correctly mentioned that
  `/comparison` must come before `/:id`, but in an earlier draft of
  the router it placed them in the wrong order. Caught during manual
  testing of `GET /routes/comparison` returning a 404.

- **Recharts `<Cell>` typing** — the initial `CompareTab.tsx` had
  a TypeScript error on the Recharts `<Cell>` component because of
  an incorrect prop type. Required a small manual fix to add the
  proper cast.

- **Integration test isolation** — first draft used transaction
  rollback for test isolation, but this conflicted with how the
  application's own transactions were structured. Switched to
  TRUNCATE-based isolation after discussing the tradeoff with Claude.

### How tools were combined effectively

1. **Claude** for architecture decisions, complex logic
   (greedy allocator, CB formula), and all file scaffolding.

2. **Copilot** for filling in repetitive patterns once the
   structure was established — e.g., the fourth controller was
   ~80% Copilot completions after the first three were done.

3. **Cursor Agent** for cross-file refactors — when `ShipCompliance`
   was renamed from an earlier draft, Cursor updated all references
   in one operation rather than requiring manual find-and-replace.

4. **Manual review** for every boundary check, formula verification,
   and integration test run. Agent output was treated as a strong
   first draft, not as final code.

---

## Best Practices Followed

- **Prompted with constraints first** — every prompt specified the
  architectural boundary the output must respect before describing
  what to build. This prevented Claude from introducing framework
  imports into the core layer.

- **One file / one concern per prompt** — never asked for multiple
  unrelated files in a single prompt. Smaller, focused prompts
  produced cleaner output with fewer corrections needed.

- **Verified formulas independently** — never trusted business logic
  output (especially the CB formula and greedy allocator) without
  manual calculation and unit test confirmation.

- **Used agent for explanations, not just code** — asked Claude to
  explain *why* design decisions were made (e.g., why
  `ComplianceTarget` is a value object, why `upsert` is idempotent).
  This built genuine understanding rather than copy-paste coding.

- **Incremental commits** — committed after each phase rather than
  after the whole project. This produced a readable git history and
  made it easy to identify which agent-generated code introduced
  which behaviour.

- **Treated agent output as a senior colleague's PR** — read every
  line, questioned decisions that weren't immediately obvious, and
  asked for clarification when needed. Never merged without review.
