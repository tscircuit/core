import type {
  AutorouterConfig,
  AutorouterProp,
  PlatformConfig,
} from "@tscircuit/props"
import type { AutorouterVersion } from "./autorouter-version"

export type NormalizedAutorouterConfig = AutorouterConfig & {
  capacityDepth?: number
  targetMinCapacity?: number
  autorouterVersion?: AutorouterVersion
}

export type LegacyAutorouterPreset = "sequential_trace" | "auto_cloud"

const normalizeAutorouterName = (value?: string) => value?.replace(/-/g, "_")

export function getLegacyAutorouterPreset(
  autorouterConfig: AutorouterProp | undefined,
): LegacyAutorouterPreset | null {
  if (!autorouterConfig) return null

  if (typeof autorouterConfig === "string") {
    const normalizedAutorouterName = normalizeAutorouterName(autorouterConfig)
    return normalizedAutorouterName === "sequential_trace" ||
      normalizedAutorouterName === "auto_cloud"
      ? normalizedAutorouterName
      : null
  }

  const normalizedPreset = normalizeAutorouterName(autorouterConfig.preset)
  if (
    normalizedPreset === "sequential_trace" ||
    normalizedPreset === "auto_cloud"
  ) {
    return normalizedPreset
  }

  return normalizeAutorouterName(autorouterConfig.groupMode) ===
    "sequential_trace"
    ? "sequential_trace"
    : null
}

export function getPresetAutoroutingConfig(
  autorouterConfig: AutorouterProp | undefined,
  platformConfig?: PlatformConfig,
): NormalizedAutorouterConfig {
  const defaults = {
    serverUrl: "https://registry-api.tscircuit.com",
    serverMode: "job" as const,
    serverCacheEnabled: true,
  }

  if (typeof autorouterConfig === "object" && !autorouterConfig.preset) {
    return {
      local: !(
        autorouterConfig.serverUrl ||
        autorouterConfig.serverMode ||
        autorouterConfig.serverCacheEnabled
      ),
      ...defaults,
      ...autorouterConfig,
    }
  }

  const { preset, ...options } =
    typeof autorouterConfig === "object"
      ? autorouterConfig
      : { preset: autorouterConfig }
  const localConfig = {
    ...options,
    local: true,
    groupMode: "subcircuit" as const,
  }

  const normalizedPreset =
    typeof preset === "string" ? preset.replace(/_/g, "-") : preset

  const platformAutorouter =
    normalizedPreset && typeof normalizedPreset === "string"
      ? platformConfig?.autorouterMap?.[normalizedPreset]
      : undefined

  if (platformAutorouter) {
    return {
      ...localConfig,
      algorithmFn: async (simpleRouteJson) =>
        platformAutorouter.createAutorouter(simpleRouteJson),
    }
  }

  switch (normalizedPreset) {
    case "sequential-trace":
      return { ...localConfig, groupMode: "sequential-trace" }
    case "beta-pipeline9":
      return { ...localConfig, autorouterVersion: "beta_pipeline9" }
    case "single-layer-fanout":
      return { ...localConfig, preset: "single_layer_fanout" }
    case "single-layer-routing":
    case "bus-lanes":
      return { ...localConfig, preset: "bus_lanes" }
    case "dogbone":
    case "fanout":
    case "simplify":
      return { ...localConfig, preset: normalizedPreset }
    case "auto-cloud":
      return { ...defaults, ...localConfig, local: false }
    case "laser-prefab":
      return { ...localConfig, preset: "laser_prefab" }
    case "auto-jumper":
      return { ...localConfig, preset: "auto_jumper" }
    default:
      return localConfig
  }
}
