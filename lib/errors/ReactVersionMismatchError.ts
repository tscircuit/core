import { version as reactVersion } from "react"

export class ReactVersionMismatchError extends Error {
  constructor(otherVersion: string) {
    super(
      `Multiple versions of React detected. @tscircuit/core is using React ${reactVersion} but a React ${otherVersion} element was provided. Ensure only one React version is installed.`,
    )
    this.name = "ReactVersionMismatchError"
  }
}
