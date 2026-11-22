import packageJson from "@tscircuit/capacity-autorouter/package.json" with {
  type: "json",
}

const autorouterVersion = packageJson.version ?? "unknown"

export class AutorouterError extends Error {
  readonly failureStage?: "path_planning"

  constructor(message: string, options?: { failureStage?: "path_planning" }) {
    super(`${message} (capacity-autorouter@${autorouterVersion})`)
    this.name = "AutorouterError"
    this.failureStage = options?.failureStage
  }
}
