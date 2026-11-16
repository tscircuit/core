export const SequentialMaintainedRouterNet = () => (
  <board width="10mm" height="10mm" autorouter="sequential_trace">
    <net name="COM" />
    <resistor name="R1" resistance="10k" pcbX={-3} footprint="0402" />
    <resistor name="R2" resistance="10k" pcbX={3} footprint="0402" />
    <resistor name="R3" resistance="10k" pcbX={3} pcbY={2} footprint="0402" />
    <resistor name="R4" resistance="10k" pcbX={-3} pcbY={2} footprint="0402" />
    <trace from=".R1 > pin.1" to="net.COM" />
    <trace from=".R2 > pin.2" to="net.COM" />
    <trace from=".R3 > pin.1" to="net.COM" />
    <trace from=".R4 > pin.1" to="net.COM" />
  </board>
)
