import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("motor cable inference follows JST family and selected pin count", async () => {
  for (const [family, pinCount] of [
    ["ph", 2],
    ["ph", 16],
    ["sh", 2],
    ["sh", 15],
  ] as const) {
    for (const angle of [0, 90, 180, 270]) {
      const { circuit } = getTestFixture()
      const standard = family === "ph" ? "jst_ph" : "jst_sh"
      circuit.add(
        <assembly.device>
          <board width={50} height={30} routingDisabled>
            <connector
              name="J1"
              standard={standard}
              pinCount={pinCount}
              footprint={`jst${pinCount}_${family}`}
            />
          </board>
          <assembly.motor
            name="MOTOR"
            {...(angle === 0
              ? {
                  standard: "nema17" as const,
                  wireConnection: `jst${pinCount}_${family}`,
                }
              : {
                  model: `nema17_wireangle${angle}deg_jst${pinCount}_${family}`,
                })}
          />
          <assembly.cable name="HARNESS" from="MOTOR.wireside" to=".J1" />
        </assembly.device>,
      )
      await circuit.renderUntilSettled()
      const cable = circuit.db.cad_cable.list()[0]!
      expect(cable.cableprinter_string).toBe(`${standard}_pins${pinCount}`)
      const motorSource = circuit.db.source_component
        .list()
        .find((c) => c.name === "MOTOR")!
      const motor = circuit.db.cad_component
        .list()
        .find((c) => c.source_component_id === motorSource.source_component_id)!
      const pin1 = cable.from_connector_pin1_position!
      expect(pin1).toBeDefined()
      const halfSpan = ((pinCount - 1) * (family === "ph" ? 2 : 1)) / 2
      const matingX = family === "ph" ? 27.15 : 25.4
      // Renderer-local pin 1 is at (matingX, -halfSpan, -35.5) mm.
      // Cardinal cases pin the emitted world's rotation of that physical contact.
      const [x, y] =
        angle === 0
          ? [matingX, -halfSpan]
          : angle === 90
            ? [halfSpan, matingX]
            : angle === 180
              ? [-matingX, halfSpan]
              : [-halfSpan, -matingX]
      expect(pin1.x - motor.position.x).toBeCloseTo(x, 4)
      expect(pin1.y - motor.position.y).toBeCloseTo(y, 4)
      expect(pin1.z - motor.position.z).toBeCloseTo(-35.5, 4)
    }
  }
})
