import { beforeAll, expect, test } from "bun:test"
import { any_circuit_element } from "circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import usbFootprint from "./assets/usb1046/footprint.circuit.json"

const input = any_circuit_element.array().parse(usbFootprint)
const { circuit } = getTestFixture()

beforeAll(async () => {
  circuit.add(
    <board width={30} height={30} schematicDisabled>
      <subcircuit name="USB" circuitJson={input} />
      <pcbnotetext
        text="USB1046: preserve the imported top stencil; no bottom paste"
        pcbY={13}
        fontSize={0.45}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.db.pcb_smtpad.list()).toHaveLength(4)
  expect(circuit.db.pcb_plated_hole.list()).toHaveLength(2)
  expect(
    circuit
      .getCircuitJson()
      .filter((element) => element.type.endsWith("error")),
  ).toEqual([])
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    showSolderPaste: false,
    showFabricationNotes: false,
  })
  const stencil = circuit
    .getCircuitJson()
    .filter((element) =>
      [
        "pcb_board",
        "pcb_solder_paste",
        "pcb_silkscreen_path",
        "pcb_silkscreen_text",
        "pcb_note_text",
      ].includes(element.type),
    )
  await expect(stencil).toMatchPcbSnapshot(
    import.meta.path.replace(".test.tsx", "-stencil.test.tsx"),
    { showSolderPaste: true, showFabricationNotes: false },
  )
})

test.failing(
  "USB1046 preserves the converter's six top paste apertures without bottom duplicates",
  () => {
    const paste = circuit.db.pcb_solder_paste.list()
    expect(paste).toHaveLength(6)
    expect(
      paste.filter((aperture) => aperture.layer === "bottom"),
    ).toHaveLength(0)
    for (const aperture of input.filter(
      (element) => element.type === "pcb_solder_paste",
    )) {
      expect(aperture.shape).toBe("pill")
      if (aperture.shape !== "pill")
        throw new Error("Expected rounded stencil openings")
      expect(paste).toContainEqual(
        expect.objectContaining({
          shape: "pill",
          x: aperture.x,
          y: aperture.y,
          width: aperture.width,
          height: aperture.height,
          radius: aperture.radius,
          layer: "top",
        }),
      )
    }
  },
)
