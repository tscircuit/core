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

  const resolver = platform?.resolveProjectStaticFileImportUrl
  if (resolver && path.startsWith("/")) {
    try {
      const resolved = await resolver(path)
      if (resolved) return resolved
    } catch (error) {
      resolveStaticFileImportDebug(
        "failed to resolve static file via platform resolver",
        error,
      )
    }
  }

  return constructAssetUrl(path, platform?.projectBaseUrl)
}
