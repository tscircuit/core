// Exact JLCPCB-linked EasyEDA footprint C370881, imported 2026-09-11.
// Datasheet pin labels verified against work/ry1303-current-pins.json and t113-power-plan.md.
// Supplier geometry/orientation is preserved; it is not manufacturer qualification.
// No manual copper routes/vias and no network CAD models are included.
// Current C370881 library and current RYCHIP datasheet BOTH specify pin16 NC.
// Do not substitute the older V1.9 pin16=VCC map. The board EP land is1.8999962mm.
import type { ChipProps } from "@tscircuit/props"

export const RY1303_PIN_LABELS = {
  pin1: ["GND3"],
  pin2: ["FB3"],
  pin3: ["FB2"],
  pin4: ["GND2A"],
  pin5: ["GND2B"],
  pin6: ["SW2"],
  pin7: ["VIN2"],
  pin8: ["EN2"],
  pin9: ["EN1"],
  pin10: ["VIN1"],
  pin11: ["SW1"],
  pin12: ["GND1A"],
  pin13: ["GND1B"],
  pin14: ["FB1"],
  pin15: ["AGNDA"],
  pin16: ["NC"],
  pin17: ["AGNDB"],
  pin18: ["EN3"],
  pin19: ["VIN3"],
  pin20: ["SW3"],
  pin21: ["EP_GND"],
} as const

export const RY1303_PIN_ATTRIBUTES = {
  GND3: {
    requiresGround: true,
  },
  GND2A: {
    requiresGround: true,
  },
  GND2B: {
    requiresGround: true,
  },
  GND1A: {
    requiresGround: true,
  },
  GND1B: {
    requiresGround: true,
  },
  AGNDA: {
    requiresGround: true,
  },
  AGNDB: {
    requiresGround: true,
  },
  EP_GND: {
    requiresGround: true,
  },
  VIN1: {
    requiresPower: true,
  },
  VIN2: {
    requiresPower: true,
  },
  VIN3: {
    requiresPower: true,
  },
  SW1: {
    providesPower: true,
  },
  SW2: {
    providesPower: true,
  },
  SW3: {
    providesPower: true,
  },
  NC: {
    doNotConnect: true,
  },
} as const

type PlacementProps = Omit<
  ChipProps<typeof RY1303_PIN_LABELS>,
  | "pinLabels"
  | "pinAttributes"
  | "footprint"
  | "manufacturerPartNumber"
  | "supplierPartNumbers"
>

export const RY1303 = (props: PlacementProps) => (
  <chip
    {...props}
    pinLabels={RY1303_PIN_LABELS}
    pinAttributes={RY1303_PIN_ATTRIBUTES}
    manufacturerPartNumber="RY1303"
    supplierPartNumbers={{ jlcpcb: ["C370881"] }}
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX="-0.800227mm"
          pcbY="-1.549781mm"
          width="0.1999996mm"
          height="0.6649974mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX="-0.400177mm"
          pcbY="-1.550035mm"
          width="0.1999996mm"
          height="0.6649974mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin3"]}
          pcbX="-0.000127mm"
          pcbY="-1.550035mm"
          width="0.1999996mm"
          height="0.6649974mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin4"]}
          pcbX="0.399923mm"
          pcbY="-1.550035mm"
          width="0.1999996mm"
          height="0.6649974mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin5"]}
          pcbX="0.799973mm"
          pcbY="-1.550035mm"
          width="0.1999996mm"
          height="0.6649974mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin6"]}
          pcbX="1.550035mm"
          pcbY="-0.799973mm"
          width="0.6649974mm"
          height="0.1999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin7"]}
          pcbX="1.550035mm"
          pcbY="-0.399923mm"
          width="0.6649974mm"
          height="0.1999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin8"]}
          pcbX="1.550035mm"
          pcbY="0.000127mm"
          width="0.6649974mm"
          height="0.1999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin9"]}
          pcbX="1.550035mm"
          pcbY="0.400177mm"
          width="0.6649974mm"
          height="0.1999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin10"]}
          pcbX="1.549781mm"
          pcbY="0.800227mm"
          width="0.6649974mm"
          height="0.1999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin11"]}
          pcbX="0.799973mm"
          pcbY="1.550035mm"
          width="0.1999996mm"
          height="0.6649974mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin12"]}
          pcbX="0.399923mm"
          pcbY="1.550035mm"
          width="0.1999996mm"
          height="0.6649974mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin13"]}
          pcbX="-0.000127mm"
          pcbY="1.550035mm"
          width="0.1999996mm"
          height="0.6649974mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin14"]}
          pcbX="-0.400177mm"
          pcbY="1.550035mm"
          width="0.1999996mm"
          height="0.6649974mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin15"]}
          pcbX="-0.800227mm"
          pcbY="1.550035mm"
          width="0.1999996mm"
          height="0.6649974mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin16"]}
          pcbX="-1.550035mm"
          pcbY="0.800227mm"
          width="0.6649974mm"
          height="0.1999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin17"]}
          pcbX="-1.550035mm"
          pcbY="0.400177mm"
          width="0.6649974mm"
          height="0.1999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin18"]}
          pcbX="-1.550035mm"
          pcbY="0.000127mm"
          width="0.6649974mm"
          height="0.1999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin19"]}
          pcbX="-1.550035mm"
          pcbY="-0.399923mm"
          width="0.6649974mm"
          height="0.1999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin20"]}
          pcbX="-1.550035mm"
          pcbY="-0.799973mm"
          width="0.6649974mm"
          height="0.1999996mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin21"]}
          pcbX="-0.000127mm"
          pcbY="0.000127mm"
          width="1.8999962mm"
          height="1.8999962mm"
          shape="rect"
        />
        <silkscreenpath
          route={[
            { x: -1.5763240000001133, y: 1.1026394000000437 },
            { x: -1.5763240000001133, y: 1.5763240000001133 },
            { x: -1.1026394000000437, y: 1.5763240000001133 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: 1.576069999999845, y: 1.1026394000000437 },
            { x: 1.576069999999845, y: 1.5763240000001133 },
            { x: 1.1023853999998892, y: 1.5763240000001133 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: -1.5763240000001133, y: -1.1023854000000028 },
            { x: -1.5763240000001133, y: -1.5760699999999588 },
            { x: -1.1026394000000437, y: -1.5760699999999588 },
          ]}
        />
        <silkscreenpath
          route={[
            { x: 1.576069999999845, y: -1.1023854000000028 },
            { x: 1.576069999999845, y: -1.5760699999999588 },
            { x: 1.1023853999998892, y: -1.5760699999999588 },
          ]}
        />
        <silkscreencircle
          pcbX="-0.800227mm"
          pcbY="-2.040001mm"
          radius="0.07493mm"
        />
        <silkscreentext
          text="{NAME}"
          pcbX="-0.000127mm"
          pcbY="2.879727mm"
          anchorAlignment="center"
          fontSize="1mm"
        />
        <courtyardoutline
          outline={[
            { x: -2.1297270000001163, y: 2.1297270000000026 },
            { x: 2.1294729999999618, y: 2.1297270000000026 },
            { x: 2.1294729999999618, y: -2.3580729999998766 },
            { x: -2.1297270000001163, y: -2.3580729999998766 },
            { x: -2.1297270000001163, y: 2.1297270000000026 },
          ]}
        />
      </footprint>
    }
  />
)
