import { expect, test } from "bun:test"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { assembly } from "lib"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("schematic-only rendering skips physical cable endpoint resolution", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <assembly.device>
      <board width={30} height={20}>
        <connector
          name="J1"
          standard="jst_ph"
          pinCount={6}
          footprint="jst6_ph"
        />
      </board>
      <assembly.motor name="MOTOR" standard="nema17" wireConnection="none" />
      <assembly.cable name="HARNESS" from="MOTOR.wireside" to=".J1" />
    </assembly.device>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.cad_cable.list()).toHaveLength(0)
  expect(circuit.db.cad_component.list()).toHaveLength(0)
  await expectAssemblySnapshot(import.meta.path, {
    title: "PCB disabled / schematic remains / physical cable skipped",
    font: "alphabet",
    panels: [
      {
        title: "A schematic-only build does not require physical connectors",
        code: `circuit.pcbDisabled = true
<assembly.device>
  <board>
    <connector name="J1"
      standard="jst_ph" pinCount={6}
      footprint="jst6_ph" />
  </board>
  <assembly.motor name="MOTOR"
    standard="nema17"
    wireConnection="none" />
  <assembly.cable name="HARNESS"
    from="MOTOR.wireside" to=".J1" />
</assembly.device>`,
        annotation:
          "The connector schematic renders; no CAD cable or motor mesh is emitted.",
        circuit,
        view: "schematic",
      },
    ],
  })
})
