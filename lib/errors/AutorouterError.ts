import type { RoutingFailure } from "@tscircuit/capacity-autorouter"
import packageJson from "@tscircuit/capacity-autorouter/package.json" with {
  type: "json",
}

const autorouterVersion = packageJson.version ?? "unknown"

export class AutorouterError extends Error {
  constructor(
    message: string,
    public readonly routingFailure?: RoutingFailure,
  ) {
    super(`${message} (capacity-autorouter@${autorouterVersion})`)
    this.name = "AutorouterError"
  }
}
