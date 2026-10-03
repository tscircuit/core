import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("column-major BGA balls retain their pin identity and voltage requirements", async () => {
  const { circuit } = getTestFixture()
  circuit.add(
    <board width={7} height={5}>
      <chip
        name="U1"
        footprint="bga5_grid3x2_p0.8_pad0.4_missing(A1)_blorigin_pinnumbering(columnmajor)"
        pinLabels={{
          pin1: ["B1"],
          pin2: ["A2"],
          pin3: ["B2"],
          pin4: ["A3"],
          pin5: ["B3"],
        }}
        pinAttributes={{
          B1: { requiresGround: true },
          A2: { requiresPower: true, requiresVoltage: "1.8V" },
          B2: { isInput: true },
          A3: { isOutput: true },
          B3: { isGpio: true, isBidirectional: true },
        }}
      />
      <pcbnotetext
        pcbX={0}
        pcbY={1.8}
        text="Column-major; A1 absent; A2 requires 1.8V"
        fontSize={0.25}
      />
      <pcbnotetext pcbX={-0.8} pcbY={-0.8} text="1 B1 GND" fontSize={0.15} />
      <pcbnotetext pcbX={0} pcbY={1.3} text="2 A2 1.8V" fontSize={0.15} />
      <pcbnotetext pcbX={0} pcbY={-0.8} text="3 B2 IN" fontSize={0.15} />
      <pcbnotetext pcbX={0.8} pcbY={1.3} text="4 A3 OUT" fontSize={0.15} />
      <pcbnotetext pcbX={0.8} pcbY={-0.8} text="5 B3 GPIO" fontSize={0.15} />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.source_port.list()).toHaveLength(5)
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(5)
  // Footprint-local positions in mm: +X right, +Y top. U1 is untranslated
  // and unrotated on the top layer, so these are also board-space points.
  for (const [pin, ball, x, y] of [
    [1, "B1", -0.8, -0.4],
    [2, "A2", 0, 0.4],
    [3, "B2", 0, -0.4],
    [4, "A3", 0.8, 0.4],
    [5, "B3", 0.8, -0.4],
  ] as const) {
    const sourcePort = circuit.db.source_port
      .list()
      .find((port) => port.pin_number === pin)!
    expect(sourcePort.port_hints).toContain(ball)
    expect(sourcePort.requires_ground).toBe(pin === 1 ? true : undefined)
    expect(sourcePort.requires_power).toBe(pin === 2 ? true : undefined)
    expect(sourcePort.requires_voltage).toBe(pin === 2 ? 1.8 : undefined)
    const pcbPort = circuit.db.pcb_port
      .list()
      .find((port) => port.source_port_id === sourcePort.source_port_id)!
    const pad = circuit.db.pcb_smtpad
      .list()
      .find((pad) => pad.pcb_port_id === pcbPort.pcb_port_id)!
    if (pad.shape !== "circle") throw new Error("Expected circular BGA pads")
    expect(pad.port_hints).toEqual([String(pin), ball])
    expect(pad.x).toBeCloseTo(x)
    expect(pad.y).toBeCloseTo(y)
  }
  expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
