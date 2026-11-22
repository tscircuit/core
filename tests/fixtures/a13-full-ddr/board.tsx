import type { ReactElement } from "react"
import { NativeDdrBoard } from "./native-ddr-board"
import { readFileSync } from "node:fs"

const source = JSON.parse(
  readFileSync(new URL("./source.json", import.meta.url), "utf8"),
)

/** Unchanged native A13 geometry and routing groups from core-ddr-benchmark. */
export const A13FullDdrBoard = (): ReactElement => {
  return <NativeDdrBoard source={source} />
}
