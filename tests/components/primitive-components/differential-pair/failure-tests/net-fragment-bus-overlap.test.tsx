import { expect, test } from "bun:test"
import { differentialPairPathPads } from "tests/fixtures/differential-pair-path-pads"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("ordinary bus aliases cannot constrain a canonical two-pad pair hop", () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={10} routingDisabled schematicDisabled>
      <chip
        name="J1"
        pcbX={-5}
        footprint={differentialPairPathPads()}
        connections={{ pin1: "net.P", pin2: "net.N" }}
      />
      <chip
        name="MCU"
        pcbX={5}
        footprint={differentialPairPathPads()}
        connections={{ pin1: "net.P", pin2: "net.N" }}
      />
      <bus name="DATA" connections={[".J1 > .pin1", ".J1 > .pin2"]} />
      <differentialpair
        name="USB"
        positiveConnection="net.P"
        negativeConnection="net.N"
        maxLengthSkew={0.1}
      />
    </board>,
  )
  expect(() => circuit.render()).toThrow(
    'Bus "DATA" overlaps differential pair "USB"',
  )
})
