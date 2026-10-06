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
          standard="nema17"
          wireConnection={`jst${pinCount}_${family}`}
        />
        <assembly.cable name="HARNESS" from="MOTOR.wireside" to=".J1" />
      </assembly.device>,
    )
    await circuit.renderUntilSettled()
    expect(circuit.db.cad_cable.list()[0]!.cableprinter_string).toBe(
      `${standard}_pins${pinCount}`,
    )
  }
})
