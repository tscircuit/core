import type { BoardProps } from "@tscircuit/props"
import type { PcbBoard, PcbStackupLayer } from "circuit-json"

// JLCPCB JLC04161H-3313, nominal 1.6 mm board. Physical layers run top
// to bottom, with thicknesses in mm. No soldermask or plating is specified.
// Source: https://raw.githubusercontent.com/tscircuit/am3352-sbc/837245bceb6ac898fd5451507d6b2b8024095fe7/design/fabrication-stackup.json
const jlcpcbFourLayerStackup: PcbStackupLayer[] = [
  {
    layer_type: "copper",
    layer: "top",
    thickness: 0.035,
    electrical_conductivity_s_per_m: 5.8e7,
  },
  {
    layer_type: "dielectric",
    dielectric_type: "prepreg",
    material_name: "3313 RC57%",
    thickness: 0.0994,
    relative_permittivity: 4.1,
  },
  {
    layer_type: "copper",
    layer: "inner1",
    thickness: 0.0152,
    electrical_conductivity_s_per_m: 5.8e7,
  },
  {
    layer_type: "dielectric",
    dielectric_type: "core",
    material_name: "NP-155F core",
    thickness: 1.265,
    relative_permittivity: 4.42,
  },
  {
    layer_type: "copper",
    layer: "inner2",
    thickness: 0.0152,
    electrical_conductivity_s_per_m: 5.8e7,
  },
  {
    layer_type: "dielectric",
    dielectric_type: "prepreg",
    material_name: "3313 RC57%",
    thickness: 0.0994,
    relative_permittivity: 4.1,
  },
  {
    layer_type: "copper",
    layer: "bottom",
    thickness: 0.035,
    electrical_conductivity_s_per_m: 5.8e7,
  },
]

export function resolveJlcpcbStackupPreset(
  fabricatorPreset: BoardProps["fabricatorPreset"],
  construction: Pick<PcbBoard, "num_layers" | "thickness" | "material">,
) {
  // All supported fabricator presets use the JLCPCB construction.
  if (
    fabricatorPreset &&
    construction.num_layers === 4 &&
    construction.thickness === 1.6 &&
    (construction.material ?? "fr4") === "fr4"
  ) {
    return jlcpcbFourLayerStackup
  }
}
