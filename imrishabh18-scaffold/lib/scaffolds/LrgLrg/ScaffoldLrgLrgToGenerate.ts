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
// const STANDARD_DIMENSIONS = [64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 480, 512, 544, 576];

// Option 2: Generate all values from 32 to 224 with 32mm increments
// Max aspect ratio of 4 means 32x128 is ok, but 32x160 is not (160/32 = 5 > 4)
const STANDARD_DIMENSIONS = generateDimensionRange(32, 224, 32)

const MAX_ASPECT_RATIO = 4

const generatedScaffolds = generateAllCombinations(
  "LrgLrg",
  STANDARD_DIMENSIONS,
  MAX_ASPECT_RATIO,
)

// Option 3: Multiple size ranges with different aspect ratio rules
// Uncomment this to use multiple ranges instead of Option 2
// const smallScaffolds = generateAllCombinations("LrgLrg", generateDimensionRange(32, 224, 32), 4);
// const largeScaffolds = generateAllCombinations("LrgLrg", generateDimensionRange(256, 576, 32), 2);
// const generatedScaffolds = [
//   ...smallScaffolds,
//   ...largeScaffolds,
// ];

// Option 3b: Filter by specific allowed aspect ratios
// Only generate scaffolds with 1:1, 2:1, and 4:1 ratios (skip 3:1, 1.5:1, etc.)
// const ALLOWED_ASPECT_RATIOS = [1, 2, 4];
// const generatedScaffolds = generateAllCombinations("LrgLrg", generateDimensionRange(32, 224, 32), undefined, ALLOWED_ASPECT_RATIOS);

// Option 4: Add explicit size strings using generateCustomSizes
// Use this to add specific one-off sizes not covered by the programmatic generation
// Example: Add 576x576 when your main range only goes to 224
const explicitScaffoldSizes = generateCustomSizes("LrgLrg", ["576x576"])

// Option 5: Manual explicit scaffold definitions (can include custom properties)
// Use this when you need to add custom properties beyond just size
// Example: { fileName: "Scaffold_LrgLrg_Custom", size: "100x200", customProp: value }
const explicitScaffolds: ScaffoldTemplate[] = []

// Export combined list (generated + explicit)
// Note: Explicit definitions will override generated ones if they have the same fileName
export const ScaffoldLrgLrgToGenerate: ScaffoldTemplate[] = [
  ...generatedScaffolds,
  ...explicitScaffoldSizes,
  ...explicitScaffolds,
]
