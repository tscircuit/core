import { expect, test } from "bun:test"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("cables reject incompatible, ambiguous, missing, and self-connected endpoints", async () => {
  for (const [from, to, standard, destinationStandard, pinCount, message] of [
    [
      ".J1",
      ".J2",
      undefined,
      "jst_ph",
      4,
      "incompatible connector standards or pin counts",
    ],
    [".J1", ".J2", "usb_c", "jst_ph", 6, "conflicts with its endpoints"],
    [
      ".J1",
      ".J2",
      undefined,
      "jst_sh",
      6,
      "incompatible connector standards or pin counts",
    ],
    [".J1", ".J1", undefined, "jst_ph", 6, "two different endpoints"],
    [".missing", ".J2", undefined, "jst_ph", 6, "matched 0 components"],
    ["connector", ".J2", undefined, "jst_ph", 6, "matched 2 components"],
  ] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <board width={50} height={25} routingDisabled>
          <connector
            name="J1"
            standard="jst_ph"
            pinCount={6}
            pcbX={-15}
            footprint="jst6_ph"
          />
          <connector
            name="J2"
            standard={destinationStandard}
            pinCount={pinCount}
            pcbX={15}
            footprint={`jst${pinCount}_${destinationStandard === "jst_sh" ? "sh" : "ph"}`}
          />
        </board>
        <assembly.cable
          name="HARNESS"
          from={from}
          to={to}
          standard={standard}
        />
      </assembly.device>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(message)
    expect(circuit.db.cad_cable.list()).toHaveLength(0)
  }
  for (const wireConnection of ["none", "stubs"] as const) {
    const { circuit } = getTestFixture()
    circuit.add(
      <assembly.device>
        <board width={30} height={20} routingDisabled>
          <connector
            name="J1"
            standard="jst_ph"
            pinCount={6}
            footprint="jst6_ph"
          />
        </board>
        <assembly.motor
          name="MOTOR"
          standard="nema17"
          wireConnection={wireConnection}
        />
        <assembly.cable name="HARNESS" from="MOTOR.wireside" to=".J1" />
      </assembly.device>,
    )
    await expect(circuit.renderUntilSettled()).rejects.toThrow(
      "JST PH or SH wireConnection",
    )
  }
})
