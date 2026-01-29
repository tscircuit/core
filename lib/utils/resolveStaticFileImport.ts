import type { PlatformConfig } from "@tscircuit/props"
import Debug from "debug"
import { constructAssetUrl } from "./constructAssetUrl"

const resolveStaticFileImportDebug = Debug(
  "tscircuit:core:resolveStaticFileImport",
)

export async function resolveStaticFileImport(
  path: string,
  platform?: PlatformConfig,
): Promise<string> {
  if (!path) return path

  // Normalize ./ paths to / paths for consistent handling
  const normalizedPath = path.startsWith("./") ? path.slice(1) : path

  const resolver = platform?.resolveProjectStaticFileImportUrl
  if (resolver && (path.startsWith("/") || path.startsWith("./"))) {
    try {
      const resolved = await resolver(normalizedPath)
      if (resolved) return resolved
    } catch (error) {
      resolveStaticFileImportDebug(
        "failed to resolve static file via platform resolver",
        error,
      )
    }
  }

  return constructAssetUrl(normalizedPath, platform?.projectBaseUrl)
}
