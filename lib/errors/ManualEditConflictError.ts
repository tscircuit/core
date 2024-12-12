interface ComponentWithString {
  getString(): string
}

export class ManualEditConflictError extends Error {
  constructor(component: ComponentWithString) {
    const message = `Component ${component.getString()} has both manual placement and explicit pcbX/pcbY coordinates specified`
    super(message)
    this.name = "ManualEditConflictError"
  }
}
