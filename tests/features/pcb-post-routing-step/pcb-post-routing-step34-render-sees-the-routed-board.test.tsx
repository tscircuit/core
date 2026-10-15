import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("render reads the routed board and its pads are checked by design rule checks", async () => {
  const { circuit } = getTestFixture()
  let tracesSeen = 0
  circuit.add(
    <board width="16mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <chip
        name="U1"
        pcbX={0}
        pcbY={2}
        footprint={
          <footprint>
            <smtpad
              shape="rect"
              width={0.6}
              height={0.6}
              portHints={["1"]}
              pcbX={0}
              pcbY={0}
              layer="top"
            />
            <pcbpostroutingstep
              render={(ctx) => {
                tracesSeen = ctx
                  .getCircuitJson()
                  .filter((e) => e.type === "pcb_trace").length
                // deliberately reaches down onto the R1-R2 trace at y = 0
                return (
                  <smtpad
                    shape="rect"
                    width={0.6}
                    height={2.6}
                    portHints={["1"]}
                    pcbX={0}
                    pcbY={-1.2}
                    layer="top"
                  />
                )
              }}
            />
          </footprint>
        }
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(tracesSeen).toBeGreaterThan(0)
  const errors = circuit
    .getCircuitJson()
    .filter((e) => e.type.endsWith("_error"))
    .map((e: any) => e.message as string)
  expect(
    errors.some((m) => /U1/.test(m) && /overlap|contact|clearance/i.test(m)),
  ).toBe(true)
})
