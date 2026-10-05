import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cached subcircuits retain standalone apertures of every shape", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={20} height={10} routingDisabled schematicDisabled>
      <subcircuit name="WINDOWS" _subcircuitCachingEnabled pcbX={2} pcbY={1}>
        <pcbsoldermaskopening
          shape="rect"
          width={2}
          height={1}
          pcbX={-4}
          layer="top"
          pcbRotation={30}
        />
        <pcbsoldermaskopening shape="circle" radius={1} layer="top" />
        <pcbsoldermaskopening
          shape="polygon"
          points={[
            { x: 3, y: -1 },
            { x: 5, y: -1 },
            { x: 4, y: 1 },
          ]}
          layer="top"
        />
      </subcircuit>
      <pcbnotetext
        text="Cached: rectangle / circle / polygon"
        pcbY={-3}
        fontSize={0.55}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_soldermask_opening.list()).toHaveLength(3)
  const circle = circuit.db.pcb_soldermask_opening
    .list()
    .find((opening) => opening.shape === "circle")!
  expect(circle).toMatchObject({ x: 2, y: 1 })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })
})
