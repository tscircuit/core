# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Essential Commands

**Build & Development:**

- `bun run build` - Build package using tsup (ESM format with TypeScript declarations)
- `bun run format` - Format code using Biome
- `bun test` - Run tests using Bun's built-in test runner
- `bun test <file-pattern>` - Run specific tests
- `bunx tsc --noEmit` - Typecheck the project

## Core Architecture

@tscircuit/core is a React-based circuit design system that converts React components into Circuit JSON, which renders as PCB layouts, schematic diagrams, and 3D models.

### Component Hierarchy

- **Normal Components**: Electronic components (resistors, capacitors, chips, etc.) in `lib/components/normal-components/`
- **Primitive Components**: Low-level elements (traces, holes, ports, silkscreen, etc.) in `lib/components/primitive-components/`
- **Base Components**: Abstract classes `Renderable` and `NormalComponent` in `lib/components/base-components/`

### Render Phase System

The system uses a 42-phase rendering pipeline:

1. React subtree rendering
2. Source component creation
3. Schematic layout and rendering
4. PCB layout and routing
5. 3D CAD model generation

Components implement specific phase methods like `doInitialSourceRender()`, `doInitialSchematicComponentRender()`, `doInitialPcbComponentRender()`.

### Key Directories

- `lib/fiber/` - React reconciler integration for JSX-to-class-instance conversion
- `lib/utils/autorouting/` - PCB trace routing algorithms
- `lib/utils/schematic/` - Schematic layout utilities
- `lib/utils/edit-events/` - Manual editing system
- `lib/sel/` - CSS-like selector system for component querying

## Testing Patterns

Uses Bun's native test runner with extensive snapshot testing:

```tsx
const { circuit } = getTestFixture()
circuit.add(
  <board>
    <resistor name="R1" />
  </board>
)
circuit.render()
expect(circuit).toMatchPcbSnapshot(import.meta.path)
```

**Test Structure:**

- Tests in `tests/` organized by component type
- Generates `.snap.svg` files for visual regression testing
- Supports both PCB and schematic view snapshots
- Special categories: examples, features, repros, subcircuits
- `BUN_UPDATE_SNAPSHOTS=1 bun test path/to/file.test.ts` to update snapshots
- Only one test per file, otherwise split into multiple enumerated files e.g. `fn1.test.ts`, `fn2.test.ts`, etc.
- Almost all tests should have a visual snapshot with clear text (e.g pinLabels) or <pcbnotetext /> such that looking at JUST the svg is enough to understand what is being tested or the expected output
- Don't add trivial `expect` or assertions, the visual snapshots methods e.g. `toMatchSchematicSnapshot`, `toMatchPcbSnapshot` etc. are the most important part of the test

## Component Development

**Creating New Components:**

1. Define props using @tscircuit/props package
2. Extend `NormalComponent` or `PrimitiveComponent`
3. Implement required render phase methods
4. Add to component catalogue in `lib/fiber/catalogue.ts`
5. Write comprehensive tests with snapshot comparisons

**Selector System:**

```tsx
circuit.selectAll(".R1 > .pin1") // Find pin1 of resistor R1
circuit.selectOne("resistor") // Find first resistor
```

**Breaking up class files:**

- If a class INSTANCE FUNCTION is too long, create a file `ClassName_fnName.ts` and call the function from the class file
- - Do not use this pattern for non-instance methods

## Technology Stack

- React + custom React Reconciler
- TypeScript (strict mode, ESNext target)
- Zod for prop validation
- circuit-json ecosystem for data interchange
- Biome for formatting/linting
- External services: @tscircuit/footprinter, @tscircuit/capacity-autorouter

## Code Conventions

- **Enum / discriminant values use underscores, not hyphens.** Any string-literal
  union or enum-like value (e.g. snapshot modes, circuit-json `type` fields,
  warning names) must be `snake_case`: use `schematic_stacked`, not
  `schematic-stacked`. This keeps values consistent with the circuit-json
  ecosystem (`schematic_component`, `source_property_ignored_warning`, etc.).

### Domain Types and Naming

- Use the most concrete domain term available. Avoid vague names such as
  `component`, `item`, `reference`, or `index` when the value has a more precise
  role.
- Do not introduce transport, protocol, or serialization vocabulary into the
  internal domain model. Translate domain identifiers into boundary-specific
  fields only at the serialization or adapter boundary.
- **`Map<string, ...>` is banned.** Always use an existing named or branded key
  type, such as `Map<SchematicPortId, ...>`, and name mapping variables to make
  both key and value meanings clear.
- Do not widen domain identifiers or keys to `string` in parameters, return
  types, collections, or intermediate values. Use or export the canonical named
  or branded type, such as `SourceTraceId` or `SubcircuitConnectivityMapKey`.
- Prefer inferred local types when the initializer already has the correct
  domain type. Avoid redundant primitive annotations such as `: string` or
  `: number`; they can erase more specific types.
- Prefer canonical exported domain types over reconstructing equivalent types
  with `Omit`, `NonNullable`, indexed access, or ad hoc aliases. If an external
  dependency does not export the identifier type, define one named boundary
  alias from its canonical interface instead of repeating inline derivations.
- Reuse an existing domain interface when a function needs part of its behavior.
  Use `Pick<ExistingInterface, "method">` for a deliberately narrow dependency
  instead of creating a duplicate structural interface.
- Name loop variables, parameters, collections, and intermediate values after
  their precise domain role and representation, such as `srjConnections`. When
  nearby values share a type, distinguish their roles in their names, such as
  `positiveSubcircuitConnectivityMapKey` and
  `negativeSubcircuitConnectivityMapKey`.
- Name helpers after their full domain operation, including a representation
  qualifier such as `Srj` when it identifies the boundary being handled. Do not
  use `Required` to signal throwing; when throwing must be explicit in the name,
  use an `OrThrow` suffix.
- Do not add runtime type guards after a trusted typed API. Parse or refine once
  at an untrusted boundary; redundant internal guards add noise and hide broken
  type contracts.

## Build Configuration

- ESM output with TypeScript declarations
- Path mapping for `lib/*` imports
- Biome enforces kebab-case file naming, space indentation, double quotes for JSX

## IMPORTANT REVIEW RULES

- Do not assign/change to _parsedProps or props
- Do not add a ton of instance methods to classes, especially large classes like NormalComponent
