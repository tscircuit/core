import { expect, test } from "bun:test"
import { convertCircuitJsonToSchematicSvg } from "circuit-to-svg"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

test("rotation preserves capacitor aliases", async () => {
  const { circuit } = getTestFixture()
  circuit.pcbDisabled = true
  circuit.add(
    <board>
      <schematictext
        text="capacitor rotation preserves source aliases"
        schX={1.5}
        schY={1.4}
        fontSize={0.12}
      />
      {[0, 90, 180, 270].map((rotation, i) => (
        <capacitor
          key={String(rotation)}
          name={`C${i + 1}`}
          capacitance="100nF"
          schX={i}
          schRotation={rotation}
        />
      ))}
    </board>,
  )
  await circuit.renderUntilSettled()
  const ports = circuit.db.source_component
    .list()
    .filter((component) => component.ftype === "simple_capacitor")
    .map((component) =>
      circuit.db.source_port
        .list({ source_component_id: component.source_component_id })
        .map((port) => ({
          pin: port.pin_number,
          name: port.name,
          hints: port.port_hints,
        }))
        .toSorted((a, b) => a.pin! - b.pin!),
    )
  const missing = ports.some(
    (capacitor) =>
      !capacitor[0]!.hints!.includes("pos") ||
      !capacitor[1]!.hints!.includes("neg"),
  )
  const caption = circuit.db.schematic_text.getWhere({
    text: "capacitor rotation preserves source aliases",
  })!
  circuit.db.schematic_text.update(caption.schematic_text_id, {
    text: missing
      ? "FAIL: rotation drops pos / neg aliases"
      : "PASS: all rotations preserve pos / neg aliases",
  })
  if (process.env.BUN_UPDATE_SNAPSHOTS && missing) {
    await Bun.write(
      new URL(
        "./assets/capacitor-rotation-aliases-failure.svg",
        import.meta.url,
      ),
      convertCircuitJsonToSchematicSvg(circuit.db.toArray(), {
        colorOverrides: { schematic: { background: "white" } },
        width: 800,
        height: 400,
      }).replace(/[ \t]+$/gm, ""),
    )
  }
  for (const capacitor of ports) expect(capacitor).toEqual(ports[0]!)
  await expect(circuit).toMatchSchematicSnapshot(import.meta.path, {
    colorOverrides: { schematic: { background: "white" } },
    width: 800,
    height: 400,
  })
})
