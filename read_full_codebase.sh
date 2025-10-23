#!/bin/bash

# Script to read the full @tscircuit/core codebase
# This is a TypeScript/React library for building electronic circuit designs

echo "=== @tscircuit/core Codebase Overview ==="
echo "This is a React-based library for designing electronic circuits and PCBs"
echo "It converts React components into Circuit JSON format"
echo ""

echo "=== PROJECT METADATA ==="
echo "Reading package.json..."
cat package.json | head -30
echo ""

echo "Reading README.md..."
cat README.md
echo ""

echo "=== MAIN ENTRY POINTS ==="
echo "Main index.ts:"
cat index.ts
echo ""

echo "Library index.ts:"
cat lib/index.ts
echo ""

echo "=== CORE ARCHITECTURE ==="
echo "RootCircuit (Main Circuit Class):"
cat lib/RootCircuit.ts
echo ""

echo "=== BASE COMPONENT SYSTEM ==="
echo "PrimitiveComponent (Base class for all components):"
cat lib/components/base-components/PrimitiveComponent/PrimitiveComponent.ts
echo ""

echo "NormalComponent (Extended component class):"
cat lib/components/base-components/NormalComponent/NormalComponent.ts
echo ""

echo "Renderable (Rendering base class):"
cat lib/components/base-components/Renderable.ts
echo ""

echo "=== COMPONENT EXPORTS ==="
echo "Components index:"
cat lib/components/index.ts
echo ""

echo "=== EXAMPLE COMPONENTS ==="
echo "Resistor component:"
cat lib/components/normal-components/Resistor.ts
echo ""

echo "Capacitor component:"
cat lib/components/normal-components/Capacitor.ts
echo ""

echo "Board component:"
cat lib/components/normal-components/Board.ts
echo ""

echo "=== PRIMITIVE COMPONENTS ==="
echo "Trace component:"
cat lib/components/primitive-components/Trace/Trace.ts
echo ""

echo "Port component:"
cat lib/components/primitive-components/Port.ts
echo ""

echo "Net component:"
cat lib/components/primitive-components/Net.ts
echo ""

echo "=== HOOKS SYSTEM ==="
echo "useResistor hook:"
cat lib/hooks/use-resistor.tsx
echo ""

echo "useCapacitor hook:"
cat lib/hooks/use-capacitor.tsx
echo ""

echo "createUseComponent (Hook factory):"
cat lib/hooks/create-use-component.tsx
echo ""

echo "useRenderedCircuit hook:"
cat lib/hooks/use-rendered-circuit.ts
echo ""

echo "=== FIBER/REACT INTEGRATION ==="
echo "React element creation:"
cat lib/fiber/create-instance-from-react-element.ts
echo ""

echo "Component catalogue:"
cat lib/fiber/catalogue.ts
echo ""

echo "Intrinsic JSX declarations:"
cat lib/fiber/intrinsic-jsx.ts
echo ""

echo "Component registration:"
cat lib/register-catalogue.ts
echo ""

echo "=== SELECTORS ==="
echo "Selector system:"
cat lib/sel/sel.ts
echo ""

echo "=== UTILITIES ==="
echo "Public exports:"
cat lib/utils/public-exports.ts
echo ""

echo "Constants:"
cat lib/utils/constants.ts
echo ""

echo "=== ERROR HANDLING ==="
echo "Invalid Props error:"
cat lib/errors/InvalidProps.ts
echo ""

echo "AutoRouter error:"
cat lib/errors/AutorouterError.ts
echo ""

echo "Trace Connection error:"
cat lib/errors/TraceConnectionError.ts
echo ""

echo "=== CONFIGURATION FILES ==="
echo "TypeScript config:"
cat tsconfig.json
echo ""

echo "Biome config:"
cat biome.json
echo ""

echo "Bun config:"
cat bunfig.toml
echo ""

echo "=== EXAMPLE USAGE ==="
echo "Example test file:"
cat tests/examples/example1.test.tsx
echo ""

echo "Fixture helper:"
cat tests/fixtures/get-test-fixture.ts
echo ""

echo "=== BENCHMARKING ==="
echo "Benchmark entry:"
cat benchmarking/index.ts
echo ""

echo "=== DOCUMENTATION ==="
echo "Development guide:"
cat docs/DEVELOPMENT.md
echo ""

echo "Creating new components guide:"
cat docs/CREATING_NEW_COMPONENTS.md
echo ""

echo "=== DIRECTORY STRUCTURE ==="
echo "Complete file tree:"
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" | grep -v node_modules | grep -v dist | sort

echo ""
echo "=== SCRIPT COMPLETE ==="
echo "The @tscircuit/core codebase has been fully displayed."
echo "This library provides React components for designing electronic circuits,"
echo "converting them to Circuit JSON format which can then be used to generate"
echo "schematics, PCB layouts, and manufacturing files."