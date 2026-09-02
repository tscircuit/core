import { expect, test } from "bun:test"
import { Fragment } from "react"
import { Am62l32 } from "tests/fixtures/am62l-lpddr4-full-bga/am62l32"
import {
  MT53E1G16D1ZW,
  ballMap,
} from "tests/fixtures/am62l-lpddr4-full-bga/mt53e1g16d1zw"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const routedByte0Signals = [
  {
    socSignal: "DDR0_DQ0",
    memorySignal: "DQ0",
    traceName: "DQ0",
    socPin: 94,
  },
  {
    socSignal: "DDR0_DQ2",
    memorySignal: "DQ2",
    traceName: "DQ2",
    socPin: 91,
  },
  {
    socSignal: "DDR0_DQ5",
    memorySignal: "DQ5",
    traceName: "DQ5",
    socPin: 123,
  },
  {
    socSignal: "DDR0_DQ7",
    memorySignal: "DQ7",
    traceName: "DQ7",
    socPin: 122,
  },
] as const

const usedSocPins = new Set<number>(
  routedByte0Signals.map(({ socPin }) => socPin),
)
const socNoConnect = Array.from({ length: 373 }, (_, index) => index + 1)
  .filter((pin) => !usedSocPins.has(pin))
  .map((pin) => `pin${pin}`)
const usedMemorySignals = new Set<string>(
  routedByte0Signals.map(({ memorySignal }) => memorySignal),
)
const memoryNoConnect = ballMap
  .map(({ signal }, index) => ({ signal, selector: `pin${index + 1}` }))
  .filter(({ signal }) => !usedMemorySignals.has(signal))
  .map(({ selector }) => selector)

test("routes an AM62L to LPDDR4 byte-lane subset through the complete core pipeline", async () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board
      width="55mm"
      height="25mm"
      layers={8}
      defaultTraceWidth="0.08128mm"
      minTraceWidth="0.08128mm"
      minTraceToPadEdgeClearance="0.08128mm"
      minViaEdgeToPadEdgeClearance="0.08128mm"
      minPadEdgeToPadEdgeClearance="0.08128mm"
      minViaHoleEdgeToViaHoleEdgeClearance="0.1016mm"
      minViaHoleDiameter="0.15mm"
      minViaPadDiameter="0.24mm"
      pcbStyle={{ viaHoleDiameter: "0.15mm", viaPadDiameter: "0.24mm" }}
      autorouter="beta-pipeline10"
      autorouterEffortLevel="1x"
    >
      <Am62l32
        name="U1"
        pcbX={-13}
        pcbY={0}
        pcbRotation={180}
        noSchematicRepresentation
        noConnect={socNoConnect as any}
      />
      <MT53E1G16D1ZW
        name="U2"
        pcbX={14}
        pcbY={0}
        pcbRotation={90}
        noSchematicRepresentation
        noConnect={memoryNoConnect as any}
      />
      <bus
        name="DDR_BYTE0"
        connections={routedByte0Signals.map(({ traceName }) => traceName)}
        preferredLayers={[
          "inner1",
          "inner2",
          "inner3",
          "inner4",
          "inner5",
          "inner6",
          "bottom",
        ]}
      />
      {routedByte0Signals.map(({ socSignal, memorySignal, traceName }) => (
        <Fragment key={traceName}>
          <trace
            name={traceName}
            from={`U1.${socSignal}`}
            to={`U2.${memorySignal}`}
          />
        </Fragment>
      ))}
      <pcbnotetext
        text="AM62L32 -> MT53E1G16D1ZW: LPDDR4 BYTE 0"
        pcbX={0}
        pcbY={10.5}
        fontSize={0.8}
      />
    </board>,
  )

  await circuit.renderUntilSettled()

  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.source_component.list().map(({ name }) => name)).toEqual([
    "U1",
    "U2",
  ])
  expect(circuit.db.source_trace.list().map(({ name }) => name)).toEqual(
    routedByte0Signals.map(({ traceName }) => traceName),
  )
  expect(circuit.db.pcb_trace.list()).not.toHaveLength(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
}, 600_000)
