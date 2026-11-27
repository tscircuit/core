import { readFileSync } from "node:fs"
import { gunzipSync } from "node:zlib"
import type { SimplifiedPcbTrace } from "lib/utils/autorouting/SimpleRouteJson"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"

const fixedTraces: SimplifiedPcbTrace[] = JSON.parse(
  gunzipSync(
    readFileSync(
      require.resolve(
        "@tscircuit/core-ddr-benchmark/circuits/icepi-sbc-before-sd-d3.json.gz",
      ),
    ),
  ).toString(),
)

export const restoreIcePiFixedCopper = createBasicAutorouter(
  async () => fixedTraces,
)
