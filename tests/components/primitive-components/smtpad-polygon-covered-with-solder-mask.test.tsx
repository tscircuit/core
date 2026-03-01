import { test, expect } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("polygon smtpads with coveredWithSolderMask render correctly", async () => {
  const { circuit } = getTestFixture()

  // Five-pad capacitive touch slider layout: short → tall → short
  const pads = [
    { name: "PAD1", pcbX: -8, width: 2.5, height: 6 },
    { name: "PAD2", pcbX: -4, width: 2.5, height: 8 },
    { name: "PAD3", pcbX: 0, width: 2.5, height: 10 },
    { name: "PAD4", pcbX: 4, width: 2.5, height: 8 },
    { name: "PAD5", pcbX: 8, width: 2.5, height: 6 },
  ]

  circuit.add(
    <board width="30mm" height="20mm">
      {pads.map(({ name, pcbX, width, height }, i) => (
        <smtpad
          key={name}
          name={name}
          shape="polygon"
          points={[
            { x: -width / 2, y: -height / 2 },
            { x: width / 2, y: -height / 2 },
            { x: width / 2, y: height / 2 },
            { x: -width / 2, y: height / 2 },
          ]}
          pcbX={`${pcbX}mm`}
          pcbY="0mm"
          layer="top"
          coveredWithSolderMask={true}
          portHints={[name.toLowerCase()]}
        />
      ))}
    </board>,
  )

  circuit.render()

  const circuitJson = circuit.getCircuitJson()

  // Verify each smtpad has is_covered_with_solder_mask: true
  const smtpads = circuitJson.filter((e: any) => e.type === "pcb_smtpad")
  expect(smtpads).toHaveLength(5)
  for (const pad of smtpads) {
    expect((pad as any).is_covered_with_solder_mask).toBe(true)
  }

  // Verify polygon shape is preserved
  for (const pad of smtpads) {
    expect((pad as any).shape).toBe("polygon")
    expect((pad as any).points).toBeDefined()
    expect((pad as any).points.length).toBe(4)
  }

  expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderMask: true,
  })
})
