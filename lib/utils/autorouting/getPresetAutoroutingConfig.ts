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

  const preset =
    typeof autorouterConfig === "object"
      ? autorouterConfig.preset
      : autorouterConfig

  const providedConfig =
    typeof autorouterConfig === "object" ? autorouterConfig : {}

  const normalizedPreset =
    typeof preset === "string" ? preset.replace(/_/g, "-") : preset

  const platformAutorouter =
    normalizedPreset && typeof normalizedPreset === "string"
      ? platformConfig?.autorouterMap?.[normalizedPreset]
      : undefined

  if (platformAutorouter) {
    return {
      local: true,
      groupMode: "subcircuit",
      algorithmFn: async (simpleRouteJson) =>
        platformAutorouter.createAutorouter(simpleRouteJson),
    }
  }

  switch (normalizedPreset) {
    case "default":
    case "auto":
    case "auto-local":
      return {
        local: true,
        groupMode: "subcircuit",
      }
    case "sequential-trace":
      return {
        local: true,
        groupMode: "sequential-trace",
      }
    case "subcircuit":
      return {
        local: true,
        groupMode: "subcircuit",
      }
    case "beta-pipeline9":
      return {
        local: true,
        groupMode: "subcircuit",
        autorouterVersion: "beta_pipeline9",
      }
    case "single-layer-fanout":
      return {
        local: true,
        groupMode: "subcircuit",
        preset: "single_layer_fanout",
      }
    case "fanout":
      return {
        local: true,
        groupMode: "subcircuit",
        preset: "fanout",
      }
    case "auto-cloud": {
      const {
        preset: _preset,
        local: _local,
        groupMode: _groupMode,
        ...rest
      } = providedConfig
      return {
        local: false,
        groupMode: "subcircuit",
        ...defaults,
        ...rest,
      }
    }
    case "laser-prefab": {
      const {
        preset: _preset,
        local: _local,
        groupMode: _groupMode,
        ...rest
      } = providedConfig
      return {
        local: true,
        groupMode: "subcircuit",
        preset: "laser_prefab",
        ...rest,
      }
    }
    case "auto-jumper": {
      const {
        preset: _preset,
        local: _local,
        groupMode: _groupMode,
        ...rest
      } = providedConfig
      return {
        local: true,
        groupMode: "subcircuit",
        preset: "auto_jumper",
        ...rest,
      }
    }
    default:
      return {
        local: true,
        groupMode: "subcircuit",
      }
  }
}
