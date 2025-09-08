import { WS2812B_2020 } from "../imports/WS2812B_2020"

export const LedCircuit = () => (
  <group>
    <WS2812B_2020
      name="L1"
      connections={{
        VDD: "net.V3V3",
        GND: "net.GND",
        DI: "net.GPIO16",
      }}
    />
  </group>
)
