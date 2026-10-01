import { expect, mock, test } from "bun:test"
import { Fragment } from "react"
import { createBgaFanoutAlgorithm } from "tests/fixtures/create-bga-fanout-algorithm"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Keep the custom-solver contract independent of the AM62L bundle benchmark.
// The callback produces final copper and does not provide a transformed SRJ.
test("a fanout preset invokes the custom BGA solver and accepts final traces", async () => {
  const { circuit } = getTestFixture()
  const algorithmFn = mock(createBgaFanoutAlgorithm)
  circuit.add(
    <board
      width="20mm"
      height="8mm"
      layers={4}
      autorouter={{ preset: "fanout", algorithmFn }}
      minTraceWidth="0.08128mm"
      defaultTraceWidth="0.08128mm"
      minTraceToPadEdgeClearance="0.05mm"
      minViaEdgeToPadEdgeClearance="0.08128mm"
      minViaHoleDiameter="0.15mm"
      minViaPadDiameter="0.24mm"
      minViaHoleEdgeToViaHoleEdgeClearance="0.1016mm"
    >
      <chip
        name="U1"
        pcbX={-4}
        footprint={
          <footprint>
            {Array.from({ length: 16 }, (_, padIndex) => (
              <Fragment key={padIndex}>
                <smtpad
                  portHints={[`pin${padIndex + 1}`]}
                  pcbX={(padIndex % 4) * 0.8 - 1.2}
                  pcbY={Math.floor(padIndex / 4) * 0.8 - 1.2}
                  shape="circle"
                  radius="0.175mm"
                />
              </Fragment>
            ))}
          </footprint>
        }
      />
      <chip
        name="J1"
        pcbX={5}
        layer="bottom"
        footprint={
          <footprint>
            <smtpad portHints={["pin1"]} shape="circle" radius="0.175mm" />
          </footprint>
        }
      />
      <trace name="DATA" from=".U1 > .pin6" to=".J1 > .pin1" />
      <pcbnotetext
        text="Custom BGA callback: top pad -> dogbone via -> bottom pad"
        pcbY={3.2}
        fontSize="0.35mm"
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(algorithmFn).toHaveBeenCalledTimes(1)
  expect(circuit.db.pcb_autorouting_error.list()).toEqual([])
  expect(circuit.db.pcb_trace_error.list()).toEqual([])
  expect(circuit.db.pcb_trace.list()).toHaveLength(1)
  expect(circuit.db.pcb_via.list()).toHaveLength(1)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
