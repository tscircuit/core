import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("an async render's primitives are in place before copper pours and design rule checks", async () => {
  const { circuit } = getTestFixture()
  let padsAtDrc = -1
  circuit.on("renderable:renderLifecycle:PcbDesignRuleChecks:start", () => {
    if (padsAtDrc === -1)
      padsAtDrc = circuit.db.pcb_smtpad
        .list()
        .filter((p) => p.shape === "circle").length
  })
  circuit.add(
    <board width="16mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-4} pcbY={0} />
      <resistor name="R2" resistance="1k" footprint="0402" pcbX={4} pcbY={0} />
      <trace from=".R1 > .pin2" to=".R2 > .pin1" />
      <chip
        name="U1"
        pcbX={0}
        pcbY={3}
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
              render={async () => {
                await new Promise((resolve) => setTimeout(resolve, 20))
                return (
                  <smtpad
                    shape="circle"
                    radius={0.3}
                    portHints={["1"]}
                    pcbX={1}
                    pcbY={0}
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
  expect(padsAtDrc).toBe(1)
})
