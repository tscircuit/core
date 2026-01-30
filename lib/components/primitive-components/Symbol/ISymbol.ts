import type { Matrix } from "transformation-matrix"

export interface SchematicSymbolBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface ISymbol {
  /**
   * The circuit-json schematic_symbol_id for this symbol.
   * Created during SchematicPrimitiveRender phase.
   */
  schematic_symbol_id?: string

  /**
   * The transformation matrix to convert from user coordinates (as specified
   * in the symbol's children) to the final resized symbol coordinates.
   * This is computed lazily when first requested.
   */
  userCoordinateToResizedSymbolTransformMat?: Matrix

  /**
   * The computed bounds of the symbol's schematic primitives before any
   * resizing is applied.
   */
  schematicSymbolBoundsInUserCoordinates?: SchematicSymbolBounds

  /**
   * Get the bounds of the symbol's schematic primitives.
   * This triggers computation if not already done.
   */
  getSchematicSymbolBounds(): SchematicSymbolBounds | null

  /**
   * Get the transformation matrix for resizing symbol contents.
   * Returns null if no resizing is needed (no width/height specified).
   */
  getUserCoordinateToResizedSymbolTransform(): Matrix | null

  /**
   * Check if this symbol has explicit width/height that requires resizing.
   */
  hasExplicitSize(): boolean
}
