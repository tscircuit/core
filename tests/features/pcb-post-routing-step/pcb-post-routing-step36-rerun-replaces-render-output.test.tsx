import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("a re-run removes the previous render's primitives before rendering again", async () => {
  const { circuit } = getTestFixture()
  let runs = 0
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
              render={() => {
                runs++
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
  const padsInTreeAfterFirstRun = circuit.selectAll("smtpad").length
  ;(circuit.children[0] as any)._markDirty("PcbTraceRender")
  await circuit.renderUntilSettled()
  expect(runs).toBe(2)
  const circlePads = circuit
    .getCircuitJson()
    .filter((e) => e.type === "pcb_smtpad" && (e as any).shape === "circle")
  expect(circlePads).toHaveLength(1)
  // the tree holds one rendered pad too, not one per run
  expect(circuit.selectAll("smtpad")).toHaveLength(padsInTreeAfterFirstRun)
})
