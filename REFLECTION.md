# Reflection — AI-Assisted Development

## What I Learned Using AI Agents

The most valuable lesson was learning to treat AI agents as a
**design partner**, not a code generator. The biggest productivity
gains came from prompting Claude during the architecture phase —
before any implementation — rather than using it purely to write
boilerplate later.

Specifically, I learned that the quality of the agent's output is
almost entirely determined by the quality of the constraints in the
prompt. When I said "implement a route controller," I got acceptable
code. When I said "implement a route controller that takes repository
ports as constructor arguments, contains zero business logic, and
returns a 400 for validation errors and 404 for not-found errors
with a consistent { error: string } shape," I got production-grade
code on the first pass.

I also learned to distinguish between two types of agent tasks. The
first is **structural generation** — scaffolding folder trees,
writing boilerplate adapters, creating test infrastructure — where
agents are extremely reliable and the output needs only light review.
The second is **logic-heavy generation** — the CB formula, the greedy
allocation algorithm, transaction-safe FIFO deduction — where the
agent produces a strong starting point that must be verified
independently against the specification before trusting it.

The PostgreSQL NUMERIC-as-string issue that Claude flagged
proactively was a genuine revelation. It is a well-known production
gotcha that the agent's training had clearly internalised. This is
the category of value that cannot come from documentation alone —
it comes from exposure to real failure patterns.

## Efficiency Gains vs Manual Coding

Honest estimate: the AI-assisted approach reduced implementation time
by roughly 60–65% on this project.

The biggest savings were in the areas I expected least. The system
design phase (Phase 1) took about 25 minutes with Claude guiding the
domain model, port definitions, and use-case signatures. I estimate
this would have taken 3–4 hours manually, including the time to
second-guess decisions and look up hexagonal architecture examples.

The Postgres adapter layer (4 repositories with row mappers,
transactions, and parameterised queries) took about 40 minutes total.
Done manually, this is 4–6 hours of careful, repetitive work with
high risk of subtle bugs in the transaction logic.

The test suite was the other major gain. The mock factory pattern
that Claude introduced — `mockRouteRepo(overrides)` — reduced each
unit test to only expressing what is different from the happy path.
This is a pattern I knew abstractly but would not have implemented as
cleanly under time pressure.

Where the agent did NOT save meaningful time: debugging integration
test isolation issues (the transaction rollback vs TRUNCATE decision),
fixing the Express route ordering bug, and resolving TypeScript strict
mode errors in the Recharts components. These required careful manual
reading and understanding, which is exactly as it should be. The
hardest bugs require human attention.

## Improvements I Would Make Next Time

**Prompt templating.** I repeated similar constraint language across
many prompts (architectural boundary rules, error handling
conventions, TypeScript strict mode requirements). Next time I would
create a shared "system context" prompt that I prepend to every
session, so the agent has consistent constraints baked in from the
start rather than restated each time.

**Test-first prompting.** On this project I generated implementation
code and then generated tests. It would be more effective to prompt
for the test cases first (as a specification), review and correct
them, and then prompt for the implementation that satisfies them. This
mirrors TDD and forces the agent to reason about the expected
behaviour before producing code.

**Earlier prompt for edge cases.** I discovered some edge cases
(the surplus-ship-goes-negative pooling invariant, the idempotent CB
upsert) only during the testing phase. I should have included a
dedicated "what edge cases does this use-case need to handle?" prompt
during design, before any implementation.

**Separate agents for separate concerns.** On a larger project I
would use Claude for high-level architecture and complex logic,
Copilot for inline completions within established patterns, and a
dedicated refactoring agent (Cursor) for cross-file operations. On
this project the boundaries between these roles were somewhat ad hoc.
Defining them explicitly upfront would reduce context-switching.

**Version control the prompts.** Treat significant prompts as
artifacts, not ephemeral chat messages. Store them in
`docs/prompts/` alongside the code they produced. This makes the
AGENT_WORKFLOW documentation trivial to write and creates a reusable
library for future projects in the same domain.
