import { isBlobUrl } from "./isBlobUrl"
import { isHttpUrl } from "./isHttpUrl"
import { isStaticAssetPath } from "./isStaticAssetPath"
import { parseLibraryFootprintRef } from "./parseLibraryFootprintRef"

export const isFootprinterString = (footprint: unknown): footprint is string =>
  typeof footprint === "string" &&
  !parseLibraryFootprintRef(footprint) &&
  !isHttpUrl(footprint) &&
  !isBlobUrl(footprint) &&
  !isStaticAssetPath(footprint)
