import type { AutorouterConfig } from "@tscircuit/props"

export function getPresetAutoroutingConfig(
  autorouterConfig: AutorouterConfig | undefined,
): AutorouterConfig {
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

  switch (normalizedPreset) {
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
    default:
      return {
        local: true,
        groupMode: "subcircuit",
      }
  }
}
