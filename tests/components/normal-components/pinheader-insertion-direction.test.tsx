import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("straight header footprints have a vertical insertion direction on either layer", async () => {
  const { circuit } = getTestFixture()
  const footprints = [
    "pinrow2",
    "pinrow6_female_rows2",
    "headermodule4",
    "smdpinheader4",
  ]
  circuit.add(
    <board width={60} height={40} routingDisabled>
      {footprints.flatMap((footprint, index) =>
        (["top", "bottom"] as const).map((layer) => (
          <chip
            key={`${index}_${layer}`}
            name={`J_${index}_${layer}`}
            footprint={footprint}
            layer={layer}
            pcbX={index * 12 - 18}
            pcbY={layer === "top" ? 15 : -15}
            pcbRotation={index * 90}
          />
        )),
      )}
      <connector name="J_CONNECTOR" footprint="pinrow2" pcbX={-20} />
      <pinheader name="J_HEADER" pinCount={2} pcbX={20} />
      <pcbnotetext
        text="Straight headers insert above/below; no edge-facing warnings"
        pcbY={0}
        fontSize={1}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  for (const component of circuit.db.pcb_component.list()) {
    expect(component.insertion_direction).toBe(
      component.layer === "bottom" ? "from_below" : "from_above",
    )
  }
  expect(
    circuit
      .getCircuitJson()
      .filter(
        (el) =>
          el.type === "pcb_connector_not_in_accessible_orientation_warning",
      ),
  ).toHaveLength(0)
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
