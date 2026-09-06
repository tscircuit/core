import type { CrystalProps } from "@tscircuit/props"

// JLCPCB C20625731, reused from the separate RP2350 board import.
export const ABM8_272_T3 = (
  props: Omit<CrystalProps, "frequency" | "loadCapacitance" | "pinVariant">,
) => (
  <crystal
    frequency="12MHz"
    loadCapacitance="10pF"
    pinVariant="four_pin"
    maxTraceLength="10mm"
    supplierPartNumbers={{ jlcpcb: ["C20625731"] }}
    manufacturerPartNumber="ABM8-272-T3"
    footprint={
      <footprint>
        <smtpad
          portHints={["pin1"]}
          pcbX={-1.100074}
          pcbY={-0.850011}
          width={1.3999972}
          height={1.1999976}
          shape="rect"
        />
        <smtpad
          portHints={["pin2"]}
          pcbX={1.100074}
          pcbY={-0.850011}
          width={1.3999972}
          height={1.1999976}
          shape="rect"
        />
        <smtpad
          portHints={["pin3"]}
          pcbX={1.100074}
          pcbY={0.850011}
          width={1.3999972}
          height={1.1999976}
          shape="rect"
        />
        <smtpad
          portHints={["pin4"]}
          pcbX={-1.100074}
          pcbY={0.850011}
          width={1.3999972}
          height={1.1999976}
          shape="rect"
        />
        <silkscreenrect width={4.0571928} height={3.3572196} />
        <courtyardrect width={4.1} height={3.4} />
      </footprint>
    }
    {...props}
  />
)
