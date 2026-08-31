import { fp } from "@tscircuit/footprinter"
import type {
  FootprintInsertionDirection,
  FootprintProp,
} from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { Footprint } from "lib/components/primitive-components/Footprint"
import { createComponentsFromCircuitJson } from "lib/utils/createComponentsFromCircuitJson"

/**
 * Datasheet-derived geometry for the EastRising ER-OLED096-1-3W display.
 * This matches the model specification used by tscircuit/quick-configure.
 */
export const ER_OLED096_1_3W_CONTACT_COUNT = 30

export const ER_OLED096_1_3W_CONNECTOR_FOOTPRINT = `fpc${ER_OLED096_1_3W_CONTACT_COUNT}_p0.5mm_pw0.3mm_pl1.25mm_mpx17.58mm_mpy2.325mm_mpw2mm_mpl3mm_mounttop`

export const ER_OLED096_1_3W_FLEXSCREEN_MODEL = `flexscreen_w26.7mm_h19.26mm_screenthickness1.45mm_bezelinset1mm_bezeldepth0.5mm_activew21.744mm_activeh10.864mm_flex12mm_flexwidth15.5mm_flexthickness0.3mm_conductors${ER_OLED096_1_3W_CONTACT_COUNT}_conductorpitch0.5mm_conductorwidth0.3mm_edgemargin0.35mm_contactlength4mm_stiffenerlength4.5mm_stiffenerthickness0.12mm_sitsflat_cablestarty4.285mm_cablestartz1.1mm_hideconductors_screencolor(#071c18)_bezelcolor(#171a1d)`

export const ER_OLED096_1_3W_SCREEN_WIDTH = "26.7mm"
export const ER_OLED096_1_3W_SCREEN_HEIGHT = "19.26mm"

/**
 * Generate the real footprinter geometry inside a metadata-bearing footprint.
 * Tests that exercise non-cardinal transforms need the connector's explicit
 * local insertion direction in addition to the generated FPC pads.
 */
export const createErOled096ConnectorFootprint = (
  insertionDirection: FootprintInsertionDirection,
): FootprintProp => {
  const footprint = new Footprint({ insertionDirection })
  const circuitJson = fp
    .string(ER_OLED096_1_3W_CONNECTOR_FOOTPRINT)
    .circuitJson() as AnyCircuitElement[]

  footprint.addAll(
    createComponentsFromCircuitJson(
      {
        componentName: "ER_OLED096_1_3W_FPC",
        componentRotation: "0",
        footprinterString: ER_OLED096_1_3W_CONNECTOR_FOOTPRINT,
      },
      circuitJson,
    ),
  )

  // Core accepts a constructed Footprint here even though FootprintProp's
  // public input type does not currently expose PrimitiveComponent instances.
  return footprint as unknown as FootprintProp
}
