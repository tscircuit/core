import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { captureRunEvidence } from "tests/fixtures/capture-run-evidence"

test.failing("saved paths reject an origin selector matching two PCB ports", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={12} height={6} schematicDisabled routeRemaining={false}>
      {[0, 4].map((x, index) => (
        <chip
          key={index}
          name={index ? "B" : "A"}
          pcbX={x}
          pinLabels={{ pin1: "SIGNAL" }}
          footprint={
            <footprint>
              <smtpad shape="rect" width={0.8} height={0.8} portHints={["1"]} />
            </footprint>
          }
        />
      ))}
      <trace from="A.1" to="B.1" />
      <autoroutingphase
        pcbTracePaths={[
          {
            connection: "A.1, B.1",
            route: [
              { route_type: "wire", x: 0, y: 0, layer: "top", width: 0.2 },
              { route_type: "wire", x: 4, y: 0, layer: "top", width: 0.2 },
            ],
          },
        ]}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.selectAll("A.1, B.1")).toHaveLength(2)
  const errors = circuit.db.pcb_autorouting_error.list()
  await captureRunEvidence(
    circuit.getCircuitJson(),
    `Two origin matches: ${circuit.db.pcb_trace.list().length} copper paths, ${errors.length} errors. Expected 0 paths / 1 error.`,
  )
  expect(errors.map((error) => error.message).join("\n")).toContain(
    "must select exactly one PCB port",
  )
  expect(circuit.db.pcb_trace.list()).toHaveLength(0)
})
