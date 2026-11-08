import { ESP32_S3_WROOM_1_N16 } from "./esp32-s3-wroom-1-n16-import"

/** Deliberately small test circuit: 10k load across MCU rails and 10k IO4 pull-up.
 * The nets are an illustrative isolated routing fixture, not a phone power circuit. */
export const FullMcuRoutedFixture = () => (
  <board width={60} height={50} layers={2}>
    <ESP32_S3_WROOM_1_N16
      name="U1"
      schX={0}
      schY={0}
      connections={{ pin2: "net.V3V3", pin41: "net.GND", pin4: "net.IO4" }}
    />
    <resistor
      name="R_LOAD"
      schX={-4}
      schY={1.5}
      resistance="10k"
      footprint="0603"
      pcbX={18}
      pcbY={-10}
      connections={{ pin1: "net.GND", pin2: "net.V3V3" }}
    />
    <resistor
      name="R_PULL"
      schX={-4}
      schY={-1.5}
      resistance="10k"
      footprint="0603"
      pcbX={18}
      pcbY={10}
      connections={{ pin1: "net.IO4", pin2: "net.V3V3" }}
    />
  </board>
)
