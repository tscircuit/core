import React from "react"
import { pinFor } from "./stm32mp157"
import { routingPhase } from "./RoutingPhases"

// ST AN5122 section 6.2 defines two independent byte groups, each containing
// eight DQ signals, its mask, and its differential strobe. Match each group
// within 1 mm (ST permits 1.016 mm to its strobe). Let native routing allocate
// signals across the available signal layers instead of forcing a whole byte
// onto one layer. The differential-pair constraint keeps each strobe together.
// https://www.st.com/resource/en/application_note/an5122-stm32mp1-series-ddrmemory-routing-guidelines-stmicroelectronics.pdf
// Package/via delays, impedance, and the clock-to-strobe relationship still
// require validation when the rest of the DDR interface is routed.
export function DdrRouting() {
  return (
    <>
      {([0] as const).map((byte) => {
        const data = [
          ...Array.from({ length: 8 }, (_, bit) => `DDR_DQ${byte * 8 + bit}`),
          `DDR_DQM${byte}`,
        ]
        const layer = byte === 0 ? "inner3" : "bottom"
        return (
          <React.Fragment key={byte}>
            <bus
              name={`DDR_BYTE${byte}`}
              routingPhaseIndex={
                byte === 0 ? routingPhase.ddrByte0 : routingPhase.ddrByte1
              }
              connections={[
                // These pins already connect to U71 through named nets.
                // Constrain those connections instead of declaring them twice.
                ...data.map((net) => `U70.${pinFor(net)}`),
              ]}
              maxLengthSkew={1}
              pcbTraceWidth={0.15}
              targetImpedance={55}
              targetImpedanceMin={45}
              targetImpedanceMax={65}
              pcbAllowedLayers={["inner3"]}
              preferredLayer={layer}
              maxLength={120}
            />
          </React.Fragment>
        )
      })}
    </>
  )
}
