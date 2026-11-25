import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import {
  NativeDdrBoard,
  type DdrSource,
} from "@tscircuit/core-ddr-benchmark/circuits/native-ddr-board"

export const icePiDdrSource: DdrSource = JSON.parse(
  gunzipSync(
    readFileSync(
      require.resolve("@tscircuit/core-ddr-benchmark/circuits/icepi.json.gz"),
    ),
  ).toString(),
)

export function IcePiDdrBoard() {
  return <NativeDdrBoard source={icePiDdrSource} />
}
