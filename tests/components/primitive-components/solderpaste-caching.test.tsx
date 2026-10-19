import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cached subcircuits retain independent paste geometry and component ownership", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board
      width={24}
      height={14}
      pcbX={100}
      pcbY={-70}
      routingDisabled
      schematicDisabled
    >
      <subcircuit name="CACHED" _subcircuitCachingEnabled pcbX={2} pcbY={1}>
        <chip
          name="U1"
          layer="bottom"
          pcbRotation={37}
          footprint={
            <footprint>
              <smtpad
                shape="circle"
                radius={1}
                pcbX={2}
                pcbY={1}
                layer="top"
                portHints={["1"]}
                solderPasteMargin={-1}
              />
              <solderpaste
                shape="rect"
                width={1.2}
                height={0.6}
                pcbX={2}
                pcbY={1}
              />
            </footprint>
          }
        />
        <solderpaste shape="circle" radius={0.7} pcbX={5} layer="top" />
      </subcircuit>
      <pcbnotetext
        text="Cached paste: bottom footprint / top circle"
        pcbY={-5}
        fontSize={0.65}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const apertures = circuit.db.pcb_solder_paste.list()
  expect(apertures).toHaveLength(2)
  const pad = circuit.db.pcb_smtpad.list()[0]!
  if (pad.shape !== "circle") throw new Error("Expected circular pad")
  const rectangle = apertures.find((paste) => paste.shape === "rotated_rect")!
  expect(rectangle).toMatchObject({
    x: pad.x,
    y: pad.y,
    width: 1.2,
    height: 0.6,
    layer: "bottom",
    pcb_component_id: pad.pcb_component_id,
  })
  expect(rectangle.subcircuit_id).toBe(pad.subcircuit_id)
  expect(rectangle.pcb_group_id).toBe(
    circuit.db.pcb_component.get(pad.pcb_component_id!)!.pcb_group_id,
  )
  if (rectangle.shape !== "rotated_rect")
    throw new Error("Expected rotated aperture")
  expect(rectangle.ccw_rotation).toBeCloseTo(37, 7)
  expect(apertures.find((paste) => paste.shape === "circle")).toMatchObject({
    x: 107,
    y: -69,
    radius: 0.7,
    layer: "top",
  })
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: true,
  })
})
