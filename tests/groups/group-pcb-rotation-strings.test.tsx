import { expect, test } from "bun:test"
import type { PcbSmtPad } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const getGroupPadSummary = (
  pads: PcbSmtPad[],
): Array<{
  shape: PcbSmtPad["shape"]
  rotation?: number
}> =>
  pads
    .map((pad) =>
      pad.shape === "rotated_rect"
        ? {
            shape: pad.shape,
            rotation: (pad as any).ccw_rotation,
          }
        : { shape: pad.shape },
    )
    .sort((a, b) => (a.rotation ?? 0) - (b.rotation ?? 0))

test("group pcbRotation accepts degree strings for arbitrary angles", () => {
  const { circuit } = getTestFixture()

  circuit.add(
    <board width="60mm" height="20mm">
      <group name="G0" pcbRotation="0deg" pcbX={-18}>
        <resistor name="R0A" resistance="1k" footprint="0402" pcbX={-1} />
        <resistor name="R0B" resistance="1k" footprint="0402" pcbX={1} />
      </group>

      <group name="G45" pcbRotation="45deg">
        <resistor name="R45A" resistance="1k" footprint="0402" pcbX={-1} />
        <resistor name="R45B" resistance="1k" footprint="0402" pcbX={1} />
      </group>

      <group name="G90" pcbRotation="90deg" pcbX={18}>
        <resistor name="R90A" resistance="1k" footprint="0402" pcbX={-1} />
        <resistor name="R90B" resistance="1k" footprint="0402" pcbX={1} />
      </group>
    </board>,
  )

  circuit.render()

  const pcbGroups = circuit.db.pcb_group.list()
  const pads = circuit.db.pcb_smtpad.list()

  const groupsByName = Object.fromEntries(
    pcbGroups
      .filter((group) => group.name)
      .map((group) => [group.name!, group.pcb_group_id]),
  ) as Record<string, string>

  const groupedPads = Object.fromEntries(
    Object.entries(groupsByName).map(([name, pcb_group_id]) => [
      name,
      pads.filter((pad) => pad.pcb_group_id === pcb_group_id),
    ]),
  ) as Record<string, PcbSmtPad[]>

  const groupSummaries = Object.fromEntries(
    Object.entries(groupedPads).map(([name, groupPads]) => [
      name,
      getGroupPadSummary(groupPads),
    ]),
  )

  console.log(
    Object.fromEntries(
      Object.entries(groupSummaries).map(([name, summary]) => [
        name,
        summary.map((pad) => ({
          shape: pad.shape,
          rotation:
            pad.rotation !== undefined
              ? Number(pad.rotation.toFixed(3))
              : undefined,
        })),
      ]),
    ),
  )

  const g0Pads = groupSummaries.G0 ?? []
  const g90Pads = groupSummaries.G90 ?? []
  const rotatedPads = groupSummaries.G45 ?? []

  expect(g0Pads.length).toBeGreaterThan(0)
  expect(g0Pads.every((pad) => pad.shape === "rect")).toBe(true)
  expect(g90Pads.length).toBeGreaterThan(0)
  expect(g90Pads.every((pad) => pad.shape === "rect")).toBe(true)
  expect(rotatedPads.length).toBeGreaterThan(0)
  for (const pad of rotatedPads) {
    expect(pad.shape).toBe("rotated_rect")
    expect(typeof pad.rotation).toBe("number")
    expect(
      Math.min(
        Math.abs((pad.rotation ?? 0) - 45),
        Math.abs((pad.rotation ?? 0) - 315),
      ),
    ).toBeLessThan(0.01)
  }

  expect(circuit.getCircuitJson()).toMatchPcbSnapshot(import.meta.path)
})
