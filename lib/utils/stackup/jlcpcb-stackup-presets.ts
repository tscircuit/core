import type { PcbStackupLayer } from "circuit-json"

// JLCPCB JLC04161H-3313, nominal 1.6 mm board. Physical layers run top
// to bottom, with thicknesses in mm. No soldermask or plating is specified.
// Source: https://raw.githubusercontent.com/tscircuit/am3352-sbc/837245bceb6ac898fd5451507d6b2b8024095fe7/design/fabrication-stackup.json
export const jlcpcbStackupPresets = {
  "JLC04161H-3313": {
    layers: [
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
        material_name: "NP-155F",
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
    ],
  },
} satisfies Record<string, { layers: PcbStackupLayer[] }>
