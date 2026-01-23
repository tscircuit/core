import type { ScaffoldProps } from "../../src/ScaffoldCalculator"
import {
  generateAllCombinations,
  generateDimensionRange,
  generateCustomSizes,
} from "../scaffold-size-generator"

type ScaffoldTemplate = {
  fileName: string
} & Partial<Omit<ScaffoldProps, "children">>

// Generate standard sizes programmatically
// You can add/remove dimensions from this array to control which scaffolds are generated

// Option 1: Explicit array
// const STANDARD_DIMENSIONS = [16, 32, 64];

// Option 2: Generate all values with specific increments
// Max aspect ratio of 4 means 16x64 is ok, but 16x80 is not (80/16 = 5 > 4)
const STANDARD_DIMENSIONS = generateDimensionRange(8, 64, 8)

const MAX_ASPECT_RATIO = 4

const generatedScaffolds = generateAllCombinations(
  "MedMed",
  STANDARD_DIMENSIONS,
  MAX_ASPECT_RATIO,
)

// Option 3: Multiple size ranges with different aspect ratio rules
// Uncomment this to use multiple ranges instead of Option 2
// const smallScaffolds = generateAllCombinations("MedMed", [16, 32], 4);
// const largeScaffolds = generateAllCombinations("MedMed", [64, 96, 128], 2);
// const generatedScaffolds = [
//   ...smallScaffolds,
//   ...largeScaffolds,
// ];

// Option 3b: Filter by specific allowed aspect ratios
// Only generate scaffolds with 1:1, 2:1, and 4:1 ratios (skip 3:1, 1.5:1, etc.)
// const ALLOWED_ASPECT_RATIOS = [1, 2, 4];
// const generatedScaffolds = generateAllCombinations("MedMed", generateDimensionRange(8, 64, 8), undefined, ALLOWED_ASPECT_RATIOS);

// Option 4: Add explicit size strings using generateCustomSizes
// Use this to add specific one-off sizes not covered by the programmatic generation
// Example: const explicitScaffoldSizes = generateCustomSizes("MedMed", ["128x128"]);
const explicitScaffoldSizes: ScaffoldTemplate[] = []

// Option 5: Manual explicit scaffold definitions (can include custom properties)
// Use this when you need to add custom properties beyond just size
// Example: { fileName: "Scaffold_MedMed_Custom", size: "100x200", customProp: value }
const explicitScaffolds: ScaffoldTemplate[] = []

// Export combined list (generated + explicit)
// Note: Explicit definitions will override generated ones if they have the same fileName
export const ScaffoldMedMedToGenerate: ScaffoldTemplate[] = [
  ...generatedScaffolds,
  ...explicitScaffoldSizes,
  ...explicitScaffolds,
]
