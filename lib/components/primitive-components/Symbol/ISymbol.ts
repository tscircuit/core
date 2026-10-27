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
   * Maps pre-resize schematic world points to resized and rotated world points
   * (mm, +X right, +Y up, right-handed). Includes translation, so directions
   * must use only its linear part. Computed lazily when first requested.
   */
  userCoordinateToResizedSymbolTransformMat?: Matrix

  /**
   * The computed bounds of the symbol's schematic primitives before any
   * resizing is applied.
   */
  schematicSymbolBoundsInSymbolLocalCoordinateSpace?: SchematicSymbolBounds

  /**
   * Get the bounds of the symbol's schematic primitives.
   * This triggers computation if not already done.
   */
  getSchematicSymbolBounds(): SchematicSymbolBounds | null

  /**
   * Get the point transform for resizing symbol contents and applying the
   * parent component's schRotation, in the world frame described above.
   * Returns null if neither resizing nor rotation is needed.
   */
  getUserCoordinateToResizedSymbolTransform(): Matrix | null

  /**
   * Check if this symbol has explicit width/height that requires resizing.
   */
  hasExplicitSize(): boolean
}
