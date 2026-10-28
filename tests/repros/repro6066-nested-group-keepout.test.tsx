import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("packing moves nested and footprint keepouts without moving board keepouts", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width="40mm" height="24mm" pcbPack pcbPackGap="3mm" routingDisabled>
      <pcbnotetext
        text="NESTED KEEPOUTS FOLLOW PARTS; BOARD KEEPOUT STAYS FIXED"
        pcbY={10}
        fontSize={0.5}
      />
      <keepout shape="circle" radius="0.4mm" pcbX={15} pcbY={-9} />
      {["A", "B"].map((suffix, index) => (
        <group key={suffix} name={`OUTER_${suffix}`}>
          <group name={`INNER_${suffix}`}>
            <resistor name={`R${index + 1}`} resistance="1k" footprint="1206" />
            <keepout shape="rect" width="6mm" height="3mm" />
            <chip
              name={`U${index + 1}`}
              pcbX={5}
              footprint={
                <footprint>
                  <smtpad shape="rect" width={1} height={1} portHints={["1"]} />
                  <keepout shape="circle" radius="0.7mm" />
                </footprint>
              }
            />
          </group>
        </group>
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()

  const keepouts = circuit.db.pcb_keepout.list()
  expect(keepouts).toHaveLength(5)
  const boardKeepout = keepouts.find(
    (candidate) => candidate.shape === "circle" && candidate.radius === 0.4,
  )!
  if (boardKeepout.shape !== "circle")
    throw new Error("Expected a circular board keepout")
  expect(boardKeepout.center.x).toBeCloseTo(15, 5)
  expect(boardKeepout.center.y).toBeCloseTo(-9, 5)

  let movedGroups = 0
  for (const [index, suffix] of ["A", "B"].entries()) {
    const innerGroup = circuit.db.pcb_group.getWhere({
      name: `INNER_${suffix}`,
    })!
    const resistorSource = circuit.db.source_component.getWhere({
      name: `R${index + 1}`,
    })!
    const resistor = circuit.db.pcb_component.getWhere({
      source_component_id: resistorSource.source_component_id,
    })!
    const groupKeepout = keepouts.find(
      (candidate) =>
        candidate.pcb_group_id === innerGroup.pcb_group_id &&
        !candidate.pcb_component_id,
    )!
    if (groupKeepout.shape !== "rect")
      throw new Error("Expected a rectangular group keepout")
    expect(groupKeepout.center.x).toBeCloseTo(resistor.center.x, 5)
    expect(groupKeepout.center.y).toBeCloseTo(resistor.center.y, 5)

    const chipSource = circuit.db.source_component.getWhere({
      name: `U${index + 1}`,
    })!
    const chip = circuit.db.pcb_component.getWhere({
      source_component_id: chipSource.source_component_id,
    })!
    const footprintKeepout = keepouts.find(
      (candidate) => candidate.pcb_component_id === chip.pcb_component_id,
    )!
    if (footprintKeepout.shape !== "circle")
      throw new Error("Expected a circular footprint keepout")
    expect(footprintKeepout.pcb_group_id).toBe(innerGroup.pcb_group_id)
    expect(footprintKeepout.center.x).toBeCloseTo(chip.center.x, 5)
    expect(footprintKeepout.center.y).toBeCloseTo(chip.center.y, 5)
    if (Math.hypot(resistor.center.x, resistor.center.y) > 0.1) movedGroups++
  }
  expect(movedGroups).toBeGreaterThan(0)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
