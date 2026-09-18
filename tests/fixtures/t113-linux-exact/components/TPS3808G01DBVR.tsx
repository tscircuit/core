// Exact JLCPCB-linked EasyEDA footprint C19653, imported 2026-09-11.
// Datasheet pin labels verified against work/tps3808dbv-pins.json and t113-power-plan.md.
// Supplier geometry/orientation is preserved; it is not manufacturer qualification.
// No manual copper routes/vias and no network CAD models are included.
import type { ChipProps } from "@tscircuit/props"

export const TPS3808G01DBVR_PIN_LABELS = {
  pin1: ["RESET_N", "RESET"],
  pin2: ["GND"],
  pin3: ["MR_N", "MR"],
  pin4: ["CT"],
  pin5: ["SENSE"],
  pin6: ["VDD"],
} as const

export const TPS3808G01DBVR_PIN_ATTRIBUTES = {
  VDD: {
    requiresPower: true,
  },
  GND: {
    requiresGround: true,
  },
  RESET_N: {
    canUseOpenDrain: true,
    isUsingOpenDrain: true,
    needsExternalPullup: true,
  },
} as const

type PlacementProps = Omit<
  ChipProps<typeof TPS3808G01DBVR_PIN_LABELS>,
  | "pinLabels"
  | "pinAttributes"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
>

export const TPS3808G01DBVR = (props: PlacementProps) => (
  <chip
    {...props}
    pinLabels={TPS3808G01DBVR_PIN_LABELS}
    pinAttributes={TPS3808G01DBVR_PIN_ATTRIBUTES}
    manufacturerPartNumber="TPS3808G01DBVR"
    supplierPartNumbers={{ jlcpcb: ["C19653"] }}
    footprint={
      <footprint>
        <smtpad
          portHints={["pin3"]}
          pcbX="1.35001mm"
          pcbY="0.94996mm"
          width="1.0999978mm"
          height="0.5999988mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX="1.35001mm"
          pcbY="-0mm"
          width="1.0999978mm"
          height="0.5999988mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin1"]}
          pcbX="1.35001mm"
          pcbY="-0.94996mm"
          width="1.0999978mm"
          height="0.5999988mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin6"]}
          pcbX="-1.35001mm"
          pcbY="-0.94996mm"
          width="1.0999978mm"
          height="0.5999988mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin5"]}
          pcbX="-1.35001mm"
          pcbY="-0mm"
          width="1.0999978mm"
          height="0.5999988mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin4"]}
          pcbX="-1.35001mm"
          pcbY="0.94996mm"
          width="1.0999978mm"
          height="0.5999988mm"
          shape="rect"
        />
        <silkscreenpath
          route={[
            { x: -0.899998200000141, y: 1.5499080000000731 },
            { x: 0.9000236000000541, y: 1.5499080000000731 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: -0.899998200000141, y: -1.5501111999999466 },
            { x: 0.9000236000000541, y: -1.5501111999999466 },
          ]}
        />
        <silkscreencircle pcbX="1.397mm" pcbY="-1.651mm" radius="0.127mm" />
        <silkscreentext
          text="{NAME}"
          pcbX="0.012446mm"
          pcbY="2.562354mm"
          anchorAlignment="center"
          fontSize="1mm"
        />
        <courtyardoutline
          outline={[
            { x: -2.1425540000000183, y: 1.8123540000000276 },
            { x: 2.167445999999927, y: 1.8123540000000276 },
            { x: 2.167445999999927, y: -2.015045999999984 },
            { x: -2.1425540000000183, y: -2.015045999999984 },
            { x: -2.1425540000000183, y: 1.8123540000000276 },
          ]}
        />
      </footprint>
    }
  />
)
