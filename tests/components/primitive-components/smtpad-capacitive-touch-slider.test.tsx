import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

/**
 * Capacitive touch sliders use polygon smtpads covered with solder mask.
 * The solder mask acts as a dielectric between the finger and copper pad,
 * enabling capacitive sensing without bare copper exposure.
 *
 * This test verifies:
 * 1. All 5 pcb_smtpad elements have is_covered_with_solder_mask: true
 * 2. All pads retain shape: "polygon" and points array in circuit-json
 * 3. PCB snapshot renders correctly with solder mask layer visible
 *
 * Related: https://github.com/tscircuit/tscircuit/issues/786
 */
test("capacitive touch slider: polygon smtpads with coveredWithSolderMask snapshot", async () => {
  const { circuit } = getTestFixture()

  // Five slider pads — progressively taller toward the center (short→tall→short)
  // Each pad is defined as a rectangle-approximated polygon
  const pads = [
    { name: "PAD1", pcbX: -8, w: 2.5, h: 6 },
    { name: "PAD2", pcbX: -4, w: 2.5, h: 8 },
    { name: "PAD3", pcbX: 0, w: 2.5, h: 10 },
    { name: "PAD4", pcbX: 4, w: 2.5, h: 8 },
    { name: "PAD5", pcbX: 8, w: 2.5, h: 6 },
  ]

  circuit.add(
    <board width="30mm" height="20mm">
      {pads.map(({ name, pcbX, w, h }) => (
        <smtpad
          key={name}
          name={name}
          shape="polygon"
          points={[
            { x: -w / 2, y: h / 2 },
            { x: w / 2, y: h / 2 },
            { x: w / 2, y: -h / 2 },
            { x: -w / 2, y: -h / 2 },
          ]}
          pcbX={`${pcbX}mm`}
          pcbY="0mm"
          layer="top"
          coveredWithSolderMask
          portHints={[name.toLowerCase()]}
        />
      ))}
    </board>,
  )

  circuit.render()

  const smtpads = circuit.db.pcb_smtpad.list()
  expect(smtpads).toHaveLength(5)

  for (const pad of smtpads) {
    expect(pad.shape).toBe("polygon")
    expect(pad.is_covered_with_solder_mask).toBe(true)
    expect((pad as any).points).toBeDefined()
    expect((pad as any).points).toHaveLength(4)
  }

  // No solder paste should be generated for covered pads
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(0)

  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
