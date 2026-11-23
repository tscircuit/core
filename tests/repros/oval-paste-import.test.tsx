import { beforeAll, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { any_circuit_element } from "circuit-json"
import { KicadFootprintToCircuitJsonConverter } from "kicad-to-circuit-json"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const converter = new KicadFootprintToCircuitJsonConverter()
converter.addFile(
  "USB_A_Receptacle_GCT_USB1046.kicad_mod",
  readFileSync(
    new URL(
      "./assets/usb1046/USB_A_Receptacle_GCT_USB1046.kicad_mod",
      import.meta.url,
    ),
    "utf8",
  ),
)
converter.runUntilFinished()
const input = any_circuit_element.array().parse(converter.getOutput())
const { circuit } = getTestFixture({
  platform: {
    footprintLibraryMap: {
      kicad: async () => ({ footprintCircuitJson: input }),
    },
  },
})

beforeAll(async () => {
  expect(
    input.filter((element) => element.type === "pcb_solder_paste"),
  ).toHaveLength(6)
  circuit.add(
    <board width={30} height={30} schematicDisabled>
      <connector
        name="J1"
        layer="bottom"
        pcbX={0}
        pcbY={0}
        footprint="kicad:Connector_USB/USB_A_Receptacle_GCT_USB1046"
        pinLabels={{
          pin1: "VBUS",
          pin2: "DM",
          pin3: "DP",
          pin4: "GND",
          pin5: "SHIELD",
        }}
      />
      <pcbnotetext
        text="USB1046: source stencil follows bottom-mounted J1"
        pcbY={13}
        fontSize={0.45}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  expect(circuit.selectOne(".J1")?._getIsSmt()).toBe(true)
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
  "USB1046 preserves six apertures on bottom-mounted J1 without top duplicates",
  () => {
    const paste = circuit.db.pcb_solder_paste.list()
    expect(paste).toHaveLength(6)
    expect(paste.filter((aperture) => aperture.layer === "top")).toHaveLength(0)
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
          layer: "bottom",
        }),
      )
    }
  },
)
