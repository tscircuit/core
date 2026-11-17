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
  const netlist = parseSpiceNetlist(source)
  let expandedSource = source
  for (const include of getSpiceIncludes(netlist.cards)) {
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
  // The first subcircuit selects the component model. Includes must not replace it.
  const entryModel = netlist.subckts[0]
  if (entryModel) {
    const expandedNetlist = parseSpiceNetlist(expandedSource)
    if (expandedNetlist.subckts[0]?.name !== entryModel.name) {
      const entrySource = expandedNetlist.findSubckt(
        entryModel.name,
      )?.originalSource
      if (!entrySource) {
        throw new Error(
          `Could not preserve SPICE entry model "${entryModel.name}".`,
        )
      }
      expandedSource = `${entrySource}\n${expandedSource.replace(entrySource, "")}`
    }
  }
  return expandedSource
}
