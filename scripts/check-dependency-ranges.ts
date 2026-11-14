import { readdir } from "node:fs/promises"
import { join } from "node:path"
import core from "../package.json"
import { dependencyRangeExceptions } from "./dependency-range-exceptions"

type PackageManifest = {
  name: string
  version: string
  dependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

export async function findDependencyRangeConflicts(
  rootModules: string,
  preferredRanges: Readonly<Record<string, string>>,
) {
  const preferredVersions = new Map<string, string>()
  for (const name of Object.keys(preferredRanges)) {
    const file = Bun.file(join(rootModules, name, "package.json"))
    if (await file.exists()) {
      const manifest: PackageManifest = await file.json()
      preferredVersions.set(name, manifest.version)
    }
  }
  if (preferredVersions.size === 0) {
    throw new Error("Install Core's dependencies before checking their ranges.")
  }

  const conflicts = new Map<string, string>()

  // CI uses a hoisted Bun install. Inspect root and nested manifests, including
  // the original declarations that a Core override can mask during installation.
  async function scanNodeModules(directory: string) {
    const entries = await readdir(directory, { withFileTypes: true }).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") return []
        throw error
      },
    )

    for (const entry of entries) {
      if (entry.name.startsWith(".") || !entry.isDirectory()) continue
      const path = join(directory, entry.name)
      if (entry.name.startsWith("@")) {
        await scanNodeModules(path)
        continue
      }

      const file = Bun.file(join(path, "package.json"))
      if (!(await file.exists())) continue
      const manifest: PackageManifest = await file.json()

      for (const [name, range] of Object.entries({
        ...manifest.dependencies,
        ...manifest.optionalDependencies,
      })) {
        const version = preferredVersions.get(name)
        if (!version) continue

        // Bun's semver matcher accepts tags and URLs as unconstrained ranges.
        // A different tag, URL, or alias can resolve to a different artifact.
        const spec = range.trim()
        const isSemverRange =
          spec === "" || /^(?:[\d~^<>=*]|[xX](?:\.|$)|v\d)/.test(spec)
        if (
          isSemverRange
            ? Bun.semver.satisfies(version, spec)
            : spec === preferredRanges[name]
        ) {
          continue
        }

        const key = `${manifest.name} > ${name}@${range}`
        conflicts.set(
          key,
          `${manifest.name}@${manifest.version} requests ${name}@${range}, but Core installs ${name}@${version} from ${preferredRanges[name]}.`,
        )
      }

      await scanNodeModules(join(path, "node_modules"))
    }
  }

  await scanNodeModules(rootModules)
  return conflicts
}

if (import.meta.main) {
  // Use Core's development version for wildcard peers. Include development
  // packages because tscircuit also uses Core's manifest to sync CLI converters.
  const preferredRanges = {
    ...core.peerDependencies,
    ...core.devDependencies,
    ...core.dependencies,
  }
  const conflicts = await findDependencyRangeConflicts(
    join(import.meta.dirname, "../node_modules"),
    preferredRanges,
  )
  const unexpected = [...conflicts.keys()]
    .filter((key) => !dependencyRangeExceptions.has(key))
    .sort()

  if (unexpected.length > 0) {
    for (const key of unexpected) {
      console.error(`${conflicts.get(key)} [${key}]`)
    }
    console.error(
      'Align the child dependency range, or use a "*" peer with a compatible dev dependency for a shared tscircuit package.',
    )
    process.exitCode = 1
  } else {
    console.log(`No new dependency range conflicts (${conflicts.size} known).`)
  }
}
