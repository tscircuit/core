import { inductance } from "circuit-json"
import published from "./published-electrical-signature.json"

// Preserve the published support circuit and add only these eight GPIO nets.
// These are RGE package pin numbers, not labels invented for the fixture.
export default {
  // The published JSON uses SI strings. Core emits inductance in henries.
  components: published.components.map((component) =>
    component.inductance === undefined
      ? component
      : { ...component, inductance: inductance.parse(component.inductance) },
  ),
  nets: {
    ...published.nets,
    DIO8: ["U1.3"],
    DIO11: ["U1.4"],
    DIO12: ["U1.5"],
    DIO13: ["U1.6"],
    DIO20_A11: ["U1.9"],
    DIO21_A10: ["U1.10"],
    DIO24_A7: ["U1.12"],
    DIO6_A1: ["U1.19"],
  },
}
