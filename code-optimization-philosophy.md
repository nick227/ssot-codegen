Code Efficiency & Memory Review

Find duplicated or nested iterations and unnecessary transformations.
Suggest consolidation, flattening, or vectorization to reduce passes and data movement.
Identify heavy heap allocations or temporary objects.
Remove avoidable intermediates and conversions. Simplify complex branching or nested logic for faster, clearer execution.

1. Performance Profiling Focus
Analyze the current codebase for loop efficiency, memory usage, and control flow clarity. Detect repeated traversals or unnecessary transformations. Recommend structural changes to reduce memory churn and CPU load, emphasizing in-place operations and simplified data paths.

2. Memory Efficiency Focus
Audit all iterative logic and data access sequences. Pinpoint points of excessive object creation or temporary allocations. Suggest strategies for minimizing heap pressure—such as caching, reusing buffers, and pruning intermediate collections.

3. Control Flow Simplification Focus
Review core algorithms and nested loop logic. Identify areas where branching or iterative complexity can be collapsed. Propose cleaner execution paths that reduce state overhead, improve readability, and yield measurable runtime and memory gains. Consolidate our loops and reduce heap size? let's scan the flows for memory optimization through logical reduction.

: Data Structures & Algorithmic Complexity
Pick the right structure (array/map/set/heap) for access patterns.
Replace O(n²) scans with indexing, hashing, or sorting + two-pointer.
Use contiguous data (arrays, structs-of-arrays) for cache friendliness.
Prefer binary search / prefix sums over repeated linear passes.

Function Size & Single Responsibility
Keep functions short; each does one thing clearly.
Extract helpers for branching or formatting tangents.
Pass explicit params; avoid hidden globals.
Return early to reduce nesting and cognitive load.

Module Cohesion & Boundaries
Group code by domain behavior, not technical layers only.
Prevent cycles; a module should never import its consumer.
Expose small, stable surfaces; keep internals private.
Enforce “one reason to change” per module.

Dependency Direction (Inversion in Code)
Accept interfaces/protocols, not concretes, in hot code.
Push I/O to edges; keep core logic pure and fast.
Inject strategies (sorting, filtering) rather than if-chains.
Wrap third-party libs behind thin adapters.

Immutability & Pure Functions
Prefer pure transforms; avoid shared mutable state.
Copy-on-write or persistent structures for safety-critical paths.
If mutating, confine it; document ownership and lifetime.
Eliminate incidental state for easier reasoning and testing.

Error Handling Patterns
Use typed/errors-with-context; no stringly-typed error logic.
Fail fast at boundaries; recover at callers with clear policies.
Avoid exceptions for control flow in hot loops.
Centralize mapping from internal errors → user messages.

State & Side-Effects Isolation
Separate compute (pure) from orchestrate (effects).
Funnel all effects through narrow seams.
Make side effects explicit in signatures.
Batch effects to reduce chatter and context switches.

Iteration & Traversal Minimization
Fuse passes: transform + filter + reduce in one scan when safe.
Replace nested loops with indexes, joins, or lookup tables.
Use iterators/generators to stream instead of materialize.
Break early on satisfied conditions.

Allocation & Object Lifecycle
Reuse buffers and builders in tight loops.
Avoid boxing/autoboxing on hot paths.
Prefer stack/local allocations over heap where language allows.
Clear or pool large temporaries to release pressure.

String Handling & Parsing
Avoid repeated concatenation; use builders.
Parse once; pass structured results, not substrings.
Normalize encodings at boundaries; keep internals uniform.
Precompile regex; replace with simple scans when possible.

Collections & Keys
Choose stable, comparable keys; avoid toString() as identity.
Use ordered maps/sets only when order is required.
Reserve/ensure capacity before bulk inserts.
Remove duplicates via hashing rather than O(n²) checks.

Concurrency & Async Code (Code-Level)
Guard shared state; choose lock-free or fine-grained locks.
Bound queues; propagate cancellations/timeouts.
Prefer message-passing or actors to shared mutation.
Avoid “fire-and-forget”; handle completions and errors.

Hot Path Shaping
Pull checks out of loops; hoist invariant computations.
Precompute strategy objects instead of branching per item.
Use lookup tables over switch-on-enum where dense.
Short-circuit common cases first for branch prediction.

Lazy vs. Eager Evaluation
Defer expensive work until needed; don’t precompute “just in case.”
Collapse laziness when it causes repeated traversals.
Memoize pure function results with bounded caches.
Be explicit about evaluation to avoid hidden costs.

Serialization & Data Transfer (Code-Side)
Keep DTOs minimal; avoid nesting that forces deep copies.
Prefer streaming parsers/encoders for large payloads.
Reuse buffers across (de)serialization.
Avoid reflection-heavy mappers on hot paths.

API of the Code (Interfaces & Naming)
Design small, orthogonal interfaces; no “fat” god types.
Name by intent and effect, not implementation.
Use precise types (sum/types/enums) over booleans and magic values.
Make illegal states unrepresentable.

Pattern Choice: Polymorphism over Conditionals
Replace sprawling switch/if trees with strategy/visitor where stable.
Table-driven logic for repetitive mappings.
Prefer data-driven rules to duplicated branches.
Keep extensibility isolated to one place.

Readability that Serves Performance
Flatten nested conditionals; guard clauses reduce indentation.
Align data and control flow left-to-right.
Keep variable lifetimes tight; limit scope aggressively.
Comment “why,” not “what,” for non-obvious optimizations.

Dead Code & Duplication Control
Remove unreachable paths and stale flags.
DRY shared logic into small utilities with clear contracts.
Detect copy-paste variants; unify behind parameters or templates.
Keep feature toggles close to their code and prune regularly.