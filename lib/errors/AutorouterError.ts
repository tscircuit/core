import packageJson from "@tscircuit/capacity-autorouter/package.json"

const autorouterVersion = packageJson.version ?? "unknown"

export class AutorouterError extends Error {
  constructor(message: string) {
    super(`${message} (capacity-autorouter@${autorouterVersion})`)
    this.name = "AutorouterError"
  }
}
