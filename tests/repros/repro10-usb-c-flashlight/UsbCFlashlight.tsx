import { usePushButton } from "./PushButton"
import { SmdUsbC, useUsbC } from "./SmdUsbC"

export default ({ pcbX, pcbY }: { pcbX?: number; pcbY?: number }) => {
  const USBC = useUsbC("USBC")
  const Button = usePushButton("SW1")
  return (
    <board width="12mm" height="30mm" pcbX={pcbX} pcbY={pcbY} bomDisabled>
      <SmdUsbC
        name="USBC"
        connections={{
          GND1: "net.GND",
          GND2: "net.GND",
          VBUS1: "net.VBUS",
          VBUS2: "net.VBUS",
        }}
        pcbY={-10}
        schX={-4}
      />
      <led name="LED" color="red" footprint="0603" pcbY={12} schY={2} />
      <Button pcbY={0} pin2=".R1 > .pos" pin3="net.VBUS" schY={-2} />
      <resistor name="R1" footprint="0603" resistance="1k" pcbY={7} />

      <trace from=".R1 > .neg" to=".LED .pos" />
      <trace from=".LED .neg" to="net.GND" />
    </board>
  )
}
