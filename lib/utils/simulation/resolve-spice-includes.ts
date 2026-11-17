import type { PlatformConfig } from "@tscircuit/props"
import { Include, Subckt, parseSpiceNetlist, type SpiceCard } from "spicets"
import { resolveStaticFileImport } from "../resolveStaticFileImport"

const getSpiceIncludes = (cards: SpiceCard[]): Include[] => {
  const includes: Include[] = []
  for (const card of cards) {
    if (card instanceof Include) includes.push(card)
    if (card instanceof Subckt) includes.push(...getSpiceIncludes(card.cards))
  }
  return includes
}

/** Inline project assets before passing a model to a simulator's virtual filesystem. */
export async function resolveSpiceIncludes({
  source,
  platform,
  sourcePath = "./",
  includeChain = [],
}: {
  source: string
  platform?: PlatformConfig
  sourcePath?: string
  includeChain?: string[]
}): Promise<string> {
  const projectBaseUrl = new URL("https://spice-project.invalid/")
  let expandedSource = source
  for (const include of getSpiceIncludes(parseSpiceNetlist(source).cards)) {
    const includeUrl = new URL(
      include.path,
      new URL(sourcePath, projectBaseUrl),
    )
    const includePath =
      includeUrl.origin === projectBaseUrl.origin
        ? `.${decodeURIComponent(includeUrl.pathname)}`
        : includeUrl.href
    if (includeChain.includes(includePath)) {
      throw new Error(`Circular SPICE include: "${includePath}".`)
    }
    const assetUrl = await resolveStaticFileImport(includePath, platform)
    const response = await fetch(assetUrl).catch(() => {
      throw new Error(`Could not load SPICE include "${includePath}".`)
    })
    if (!response.ok) {
      throw new Error(
        `Could not load SPICE include "${includePath}" (HTTP ${response.status}).`,
      )
    }
    const includedSource = await resolveSpiceIncludes({
      source: await response.text(),
      platform,
      sourcePath: includePath,
      includeChain: [...includeChain, includePath],
    })
    expandedSource = expandedSource.replace(
      include.originalSource ?? include.toSource(),
      () => includedSource,
    )
  }
  return expandedSource
}
