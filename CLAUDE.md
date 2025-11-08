# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

- If a class function is too long, create a file `ClassName_fnName.ts` and call the function from the class file

**API Priority:**
1. Explicit `thickness` on trace (highest priority)
2. Direct `minTraceWidth` prop on group
3. `autorouter.minTraceWidth` in group (legacy, lowest priority)

## Technology Stack

- React + custom React Reconciler
- TypeScript (strict mode, ESNext target)
- Zod for prop validation
- circuit-json ecosystem for data interchange
- Biome for formatting/linting
- External services: @tscircuit/footprinter, @tscircuit/capacity-autorouter

## Build Configuration

- ESM output with TypeScript declarations
- Path mapping for `lib/*` imports
- Biome enforces kebab-case file naming, space indentation, double quotes for JSX
