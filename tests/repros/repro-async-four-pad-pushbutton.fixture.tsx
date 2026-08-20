import { readFileSync } from "node:fs"
import { KicadFootprintToCircuitJsonConverter } from "kicad-to-circuit-json"

const pushbuttonFootprintPath = new URL(
  "./assets/SW_SPST_PTS810.kicad_mod",
  import.meta.url,
)

const converter = new KicadFootprintToCircuitJsonConverter()
converter.addFile(
  "SW_SPST_PTS810.kicad_mod",
  readFileSync(pushbuttonFootprintPath, "utf8"),
)
converter.runUntilFinished()

const pushbuttonFootprintCircuitJson = converter.getOutput()

export const loadKicadPushbuttonFootprint = async () => ({
  footprintCircuitJson: pushbuttonFootprintCircuitJson,
})

export const AsyncFourPadPushbuttonCircuit = () => (
  <board width="20mm" height="12mm">
    <resistor
      name="R1"
      resistance="10k"
      footprint="0603"
      pcbX={-5}
      pcbY={2}
      connections={{ pin1: "net.VCC", pin2: "net.SIGNAL" }}
    />
    <pushbutton
      name="SW1"
      footprint="kicad:Button_Switch_SMD/SW_SPST_PTS810"
      connections={{ pin1: "net.SIGNAL", pin2: "net.GND" }}
    />
    <resistor
      name="R2"
      resistance="10k"
      footprint="0603"
      pcbX={5}
      pcbY={-2}
      connections={{ pin1: "net.VCC", pin2: "net.GND" }}
    />
  </board>
)
