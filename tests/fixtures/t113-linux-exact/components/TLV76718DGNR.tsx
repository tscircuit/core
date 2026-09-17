// Exact JLCPCB-linked EasyEDA footprint C3744783, imported 2026-09-11.
// Datasheet pin labels verified against work/tlv76718dgn-pins.json and t113-power-plan.md.
// Supplier geometry/orientation is preserved; it is not manufacturer qualification.
// No manual copper routes/vias and no network CAD models are included.
// Supplier pin2 was unnamed; the verified fixed-output DGN map restores SNS.
// NC/GND suffix labels are normalized without changing their pin numbers.
import type { ChipProps } from "@tscircuit/props"

export const TLV76718DGNR_PIN_LABELS = {
  pin1: ["OUT"],
  pin2: ["SNS"],
  pin3: ["NC1"],
  pin4: ["GND1"],
  pin5: ["EN"],
  pin6: ["GND2"],
  pin7: ["NC2"],
  pin8: ["IN"],
  pin9: ["EP_GND"],
} as const

export const TLV76718DGNR_PIN_ATTRIBUTES = {
  IN: {
    requiresPower: true,
  },
  OUT: {
    providesPower: true,
    providesVoltage: "1.8V",
  },
  SNS: {
    mustBeConnected: true,
  },
  EN: {
    mustBeConnected: true,
  },
  GND1: {
    requiresGround: true,
  },
  GND2: {
    requiresGround: true,
  },
  EP_GND: {
    requiresGround: true,
  },
  NC1: {
    doNotConnect: true,
  },
  NC2: {
    doNotConnect: true,
  },
} as const

type PlacementProps = Omit<
  ChipProps<typeof TLV76718DGNR_PIN_LABELS>,
  | "pinLabels"
  | "pinAttributes"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
>

export const TLV76718DGNR = (props: PlacementProps) => (
  <chip
    {...props}
    pinLabels={TLV76718DGNR_PIN_LABELS}
    pinAttributes={TLV76718DGNR_PIN_ATTRIBUTES}
    manufacturerPartNumber="TLV76718DGNR"
    supplierPartNumbers={{ jlcpcb: ["C3744783"] }}
    footprint={
      <footprint>
        <smtpad
          portHints={["pin9"]}
          pcbX="0mm"
          pcbY="0mm"
          width="2.0500086mm"
          height="1.745996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin8"]}
          pcbX="-0.975106mm"
          pcbY="2.06502mm"
          width="0.3640074mm"
          height="1.4299946mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin7"]}
          pcbX="-0.32512mm"
          pcbY="2.06502mm"
          width="0.3640074mm"
          height="1.4299946mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin6"]}
          pcbX="0.32512mm"
          pcbY="2.06502mm"
          width="0.3640074mm"
          height="1.4299946mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin5"]}
          pcbX="0.975106mm"
          pcbY="2.06502mm"
          width="0.3640074mm"
          height="1.4299946mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin4"]}
          pcbX="0.975106mm"
          pcbY="-2.06502mm"
          width="0.3640074mm"
          height="1.4299946mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin3"]}
          pcbX="0.32512mm"
          pcbY="-2.06502mm"
          width="0.3640074mm"
          height="1.4299946mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX="-0.32512mm"
          pcbY="-2.06502mm"
          width="0.3640074mm"
          height="1.4299946mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin1"]}
          pcbX="-0.975106mm"
          pcbY="-2.06502mm"
          width="0.3640074mm"
          height="1.4299946mm"
          shape="rect"
        />
        <silkscreenpath
          route={[
            { x: -1.5239999999998872, y: -0.5079999999999245 },
            { x: -1.5239999999998872, y: -1.524000000000001 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: -1.5239999999998872, y: -0.5079999999999245 },
            { x: -1.5239999999998872, y: 0.5080000000000382 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: -1.5239999999998872, y: 1.524000000000001 },
            { x: -1.5239999999998872, y: 0.5080000000000382 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: -1.3372338000001491, y: -1.524000000000001 },
            { x: -1.5239999999998872, y: -1.524000000000001 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: 1.3372338000001491, y: 1.524000000000001 },
            { x: 1.5239999999998872, y: 1.524000000000001 },
            { x: 1.5239999999998872, y: -1.524000000000001 },
            { x: 1.3372338000001491, y: -1.524000000000001 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: -1.5239999999998872, y: 1.524000000000001 },
            { x: -1.3372338000001491, y: 1.524000000000001 },
          ]}
        />
        <silkscreencircle
          pcbX="-1.91262mm"
          pcbY="-2.06502mm"
          radius="0.119888mm"
        />
        <silkscreencircle
          pcbX="-1.286256mm"
          pcbY="-0.755396mm"
          radius="0.068834mm"
        />
        <silkscreentext
          text="{NAME}"
          pcbX="-0.254mm"
          pcbY="3.7686mm"
          anchorAlignment="center"
          fontSize="1mm"
        />
        <courtyardoutline
          outline={[
            { x: -2.2819999999999254, y: 3.018599999999992 },
            { x: 1.7739999999998872, y: 3.018599999999992 },
            { x: 1.7739999999998872, y: -3.298000000000002 },
            { x: -2.2819999999999254, y: -3.298000000000002 },
            { x: -2.2819999999999254, y: 3.018599999999992 },
          ]}
        />
      </footprint>
    }
  />
)
