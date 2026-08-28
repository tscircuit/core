import path from "node:path"
import type { SimpleRouteJson } from "lib/utils/autorouting/SimpleRouteJson"
import { Am62lLpddr4FullBgaBoard } from "tests/fixtures/am62l-lpddr4-full-bga/full-bga-board"
import { createBasicAutorouter } from "tests/fixtures/createBasicAutorouter"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const outputDirectory = process.argv[2]
if (!outputDirectory) {
  throw new Error("Expected an output directory")
}

const inputs: SimpleRouteJson[] = []
const capture = createBasicAutorouter(async (input) => {
  inputs.push(structuredClone(input))
  return []
})
const noChannel = createBasicAutorouter(async () => [])
const { circuit } = getTestFixture()
circuit.add(
  <Am62lLpddr4FullBgaBoard
    fanoutAlgorithmFn={capture}
    channelAlgorithmFn={noChannel}
  />,
)
await circuit.renderUntilSettled()

if (inputs.length !== 2) {
  throw new Error(`Expected two BGA inputs, received ${inputs.length}`)
}
const orderedInputs = inputs.sort(
  (first, second) => first.bounds.minX - second.bounds.minX,
)
await Bun.write(
  path.join(outputDirectory, "u1-soc.strict-bus.srj.json"),
  JSON.stringify(orderedInputs[0], null, 2),
)
await Bun.write(
  path.join(outputDirectory, "u2-ram.strict-bus.srj.json"),
  JSON.stringify(orderedInputs[1], null, 2),
)
