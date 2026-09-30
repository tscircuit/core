import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { EnclosureApertureDrcFixture } from "tests/fixtures/enclosure-aperture-drc-fixture"

test("plain enclosures and disabled assembly DRC schedule no model loading", async () => {
  for (const mode of [
    "no_assembly",
    "pcb_disabled",
    "platform_disabled",
  ] as const) {
    const { circuit } = getTestFixture({
      platform:
        mode === "platform_disabled"
          ? { drcChecksDisabled: true }
          : mode === "pcb_disabled"
            ? { pcbDisabled: true }
            : undefined,
    })
    const effects: string[] = []
    circuit.on("asyncEffect:start", (event) => effects.push(event.effectName))
    circuit.add(
      <EnclosureApertureDrcFixture
        inAssembly={mode !== "no_assembly"}
        objUrl="https://example.invalid/must-not-fetch.obj"
      />,
    )
    await circuit.renderUntilSettled()
    expect(effects).not.toContain("enclosure:aperture-drc")
    expect(
      circuit.db.cad_enclosure_aperture_intersection_warning.list(),
    ).toHaveLength(0)
    expect(circuit.db.source_runtime_error.list()).toHaveLength(0)
  }
})
