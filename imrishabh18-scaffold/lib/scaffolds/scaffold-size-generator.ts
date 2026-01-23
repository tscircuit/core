import type { ScaffoldProps } from "../src/ScaffoldCalculator"
import type { MoleculeSizeString } from "@tsci/imrishabh18.molecule"

type ScaffoldTemplate = {
  fileName: string
} & Partial<Omit<ScaffoldProps, "children">>

/**
 * Generate scaffold templates from a list of dimensions
 * Creates all combinations where width <= height (no duplicates like 64x32 when 32x64 exists)
 * @param scaffoldType - The scaffold type (e.g., "LrgLrg", "LrgMed", "MedMed")
 * @param dimensions - Array of dimension values to use
 * @param maxAspectRatio - Optional maximum aspect ratio (height/width). Default: no limit. Example: 4 means 32x128 is ok, but 32x160 is not.
 * @param allowedAspectRatios - Optional array of allowed aspect ratios. Example: [1, 2, 4] allows only 1:1, 2:1, and 4:1 ratios.
 *
 * @example
 * // Generate only specific aspect ratios (1:1, 2:1, 4:1)
 * const scaffolds = generateAllCombinations("LrgLrg", [32, 64, 96, 128], undefined, [1, 2, 4]);
 * // Generates: 32x32, 32x64, 32x128, 64x64, 64x128, 96x96, 128x128
 * // Skips: 32x96 (3:1), 64x96 (1.5:1), etc.
 */
export function generateAllCombinations(
  scaffoldType: string,
  dimensions: number[],
  maxAspectRatio?: number,
  allowedAspectRatios?: number[],
): ScaffoldTemplate[] {
  const sizes: ScaffoldTemplate[] = []

  for (let i = 0; i < dimensions.length; i++) {
    for (let j = i; j < dimensions.length; j++) {
      const width = dimensions[i]
      const height = dimensions[j]
      const aspectRatio = height / width

      // Skip if aspect ratio exceeds maximum
      if (maxAspectRatio && aspectRatio > maxAspectRatio) {
        continue
      }

      // Skip if not in allowed aspect ratios list
      if (allowedAspectRatios && !allowedAspectRatios.includes(aspectRatio)) {
        continue
      }

      sizes.push({
        fileName: `Scaffold_${scaffoldType}_${width}x${height}`,
        size: `${width}x${height}` as MoleculeSizeString,
      })
    }
  }

  return sizes
}

/**
 * Generate only square scaffold templates
 * @param scaffoldType - The scaffold type (e.g., "LrgLrg", "LrgMed", "MedMed")
 * @param dimensions - Array of dimension values to use
 */
export function generateSquaresOnly(
  scaffoldType: string,
  dimensions: number[],
): ScaffoldTemplate[] {
  return dimensions.map((dim) => ({
    fileName: `Scaffold_${scaffoldType}_${dim}x${dim}`,
    size: `${dim}x${dim}` as MoleculeSizeString,
  }))
}

/**
 * Generate scaffold templates from explicit size strings
 * Use this for one-off sizes that aren't covered by programmatic generation
 *
 * @param scaffoldType - The scaffold type (e.g., "LrgLrg", "LrgMed", "MedMed")
 * @param sizes - Array of size strings (e.g., ["64x64", "128x128", "576x576"])
 *
 * @example
 * // Add specific sizes not in your main range
 * const explicitScaffolds = generateCustomSizes("LrgLrg", ["576x576", "320x480"]);
 *
 * @example
 * // Combine with programmatic generation
 * const generatedScaffolds = generateAllCombinations("LrgLrg", [32, 64, 96], 4);
 * const explicitScaffolds = generateCustomSizes("LrgLrg", ["576x576"]);
 * const allScaffolds = [...generatedScaffolds, ...explicitScaffolds];
 */
export function generateCustomSizes(
  scaffoldType: string,
  sizes: string[],
): ScaffoldTemplate[] {
  return sizes.map((size) => ({
    fileName: `Scaffold_${scaffoldType}_${size}`,
    size: size as MoleculeSizeString,
  }))
}

/**
 * Generate dimensions with a specific increment
 */
export function generateDimensionRange(
  min: number,
  max: number,
  increment: number,
): number[] {
  const dimensions: number[] = []
  for (let i = min; i <= max; i += increment) {
    dimensions.push(i)
  }
  return dimensions
}

// Example usage:
// For LrgLrg:
// const DIMENSIONS = [64, 96, 128, 192, 224, 256, 320, 384, 448, 512, 576];
// export const ScaffoldLrgLrgToGenerate = generateAllCombinations("LrgLrg", DIMENSIONS);

// For LrgMed:
// const DIMENSIONS = [32, 64, 128];
// export const ScaffoldLrgMedToGenerate = generateAllCombinations("LrgMed", DIMENSIONS);

// For MedMed:
// const DIMENSIONS = [16, 32, 64];
// export const ScaffoldMedMedToGenerate = generateAllCombinations("MedMed", DIMENSIONS);

// Or with a range:
// const DIMENSIONS = generateDimensionRange(32, 576, 32);
// export const ScaffoldLrgLrgToGenerate = generateAllCombinations("LrgLrg", DIMENSIONS);
