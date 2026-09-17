import type { CapacitorProps, ResistorProps } from "@tscircuit/props"

export const Yageo6k04Ohm0603 = (
  props: Omit<
    ResistorProps,
    | "resistance"
    | "footprint"
    | "supplierPartNumbers"
    | "manufacturerPartNumber"
  >,
) => (
  <resistor
    {...props}
    resistance="6.04kohm"
    manufacturerPartNumber="AC0603FR-076K04L"
    supplierPartNumbers={{ jlcpcb: ["C228021"] }}
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX="-0.753364mm"
          pcbY="0mm"
          width="0.8064754mm"
          height="0.8640064mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX="0.753364mm"
          pcbY="0mm"
          width="0.8064754mm"
          height="0.8640064mm"
          shape="rect"
        />
        <courtyardoutline
          outline={[
            { x: -1.647, y: 0.9104 },
            { x: 1.6216, y: 0.9104 },
            { x: 1.6216, y: -0.9104 },
            { x: -1.647, y: -0.9104 },
            { x: -1.647, y: 0.9104 },
          ]}
        />
      </footprint>
    }
  />
)

export const Yageo2n2F0402 = (
  props: Omit<
    CapacitorProps,
    | "capacitance"
    | "footprint"
    | "supplierPartNumbers"
    | "manufacturerPartNumber"
  >,
) => (
  <capacitor
    {...props}
    capacitance="2.2nF"
    manufacturerPartNumber="CC0402JRX7R9BB222"
    supplierPartNumbers={{ jlcpcb: ["C513667"] }}
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX="-0.420116mm"
          pcbY="0mm"
          width="0.499999mm"
          height="0.540004mm"
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX="0.420116mm"
          pcbY="0mm"
          width="0.499999mm"
          height="0.540004mm"
          shape="rect"
        />
        <courtyardoutline
          outline={[
            { x: -1.1136, y: 0.758 },
            { x: 1.139, y: 0.758 },
            { x: 1.139, y: -0.7326 },
            { x: -1.1136, y: -0.7326 },
            { x: -1.1136, y: 0.758 },
          ]}
        />
      </footprint>
    }
  />
)
