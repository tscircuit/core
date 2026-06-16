export type Point = { x: number; y: number }

export type Polygon = Point[]

export type Bitmap = {
  width: number
  height: number
  rgbaPixels: Uint8Array
}

export type Rgba = {
  r: number
  g: number
  b: number
  a: number
}

export type Edge = {
  start: Point
  end: Point
}

export type PolygonNode = {
  polygon: Polygon
  children: PolygonNode[]
}

export type ImageFormat = "svg" | "png"

export type BunImageInstance = {
  png: (options?: {
    compressionLevel?: number
    palette?: boolean
    colors?: number
    dither?: boolean
  }) => BunImageInstance
  bytes: () => Promise<Uint8Array>
}

export type BunImageCtor = new (
  input: ArrayBuffer | Uint8Array | Blob | string,
) => BunImageInstance

export type BunRuntime = {
  Image: BunImageCtor
}

export type GraphicTargetSize = {
  width: number
  height: number
}

export type ImportedGraphicSource = {
  contentType?: string
  sourceName?: string
}

export type SilkscreenGraphicConversionInput = ImportedGraphicSource &
  GraphicTargetSize & {
    importedImageBytes: ArrayBufferLike
  }
