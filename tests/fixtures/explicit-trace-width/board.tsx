import { STM32F072CBT6 } from "./stm32f072cbt6"
import { GRM155R71H103KA88D } from "./grm155r71h103ka88d"

// Supplier footprints from the USB fidget board. This reduced layout rotates U1
// by 90 degrees; it is a layout variant, not a replay of the complete board.
export const ExplicitTraceWidthBoard = ({ minimumWidth = 0.1 } = {}) => (
  <board
    width={20}
    height={20}
    minTraceWidth={minimumWidth}
    defaultTraceWidth={0.15}
    minTraceToPadEdgeClearance={0.15}
    autorouter="auto_local"
    autorouterVersion="beta_pipeline9"
  >
    <STM32F072CBT6 name="U1" pcbRotation={90} cadModel={undefined} />
    <GRM155R71H103KA88D
      name="C8"
      pcbX={1.26}
      pcbY={-5.85}
      pcbRotation={180}
      schOrientation="vertical"
      cadModel={undefined}
    />
    <trace name="MCU_VSSA_DECAP" from="U1.VSSA" to="C8.pin2" width={0.15} />
  </board>
)
