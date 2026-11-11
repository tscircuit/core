export default () => (
  <board width="40mm" height="28mm" autorouter="auto-local">
    <pinheader
      name="J1"
      pinCount={2}
      pitch="2.54mm"
      footprint="pinrow2"
      pinLabels={["V5", "GND"]}
      pcbX={-16}
      pcbY={0}
      schX={-7}
      schY={2}
    />
    <resistor
      name="R1"
      resistance="1k"
      footprint="0805"
      pcbX={-10}
      pcbY={7}
      schX={-4}
      schY={3}
    />
    <led
      name="D1"
      color="green"
      footprint="0805"
      pcbX={-5}
      pcbY={7}
      schX={-1}
      schY={3}
    />
    <capacitor
      name="C1"
      capacitance="100nF"
      footprint="0805"
      pcbX={-10}
      pcbY={-4}
      schX={-4}
      schY={0}
    />
    <pushbutton
      name="SW1"
      footprint="pushbutton"
      pcbX={0}
      pcbY={-5}
      schX={0}
      schY={0}
    />
    <resistor
      name="R2"
      resistance="4.7k"
      footprint="0805"
      pcbX={5}
      pcbY={3}
      schX={3}
      schY={0}
    />
    <resistor
      name="R3"
      resistance="100k"
      footprint="0805"
      pcbX={8}
      pcbY={-6}
      schX={3}
      schY={-3}
    />
    <transistor
      name="Q1"
      type="npn"
      footprint="sot23"
      pcbX={9}
      pcbY={-1}
      schX={6}
      schY={0}
    />
    <pinheader
      name="J2"
      pinCount={2}
      pitch="2.54mm"
      footprint="pinrow2"
      pinLabels={["V5", "OUT"]}
      pcbX={16}
      pcbY={0}
      schX={8}
      schY={3}
    />
    <trace from=".J1 > .pin1" to="net.V5" />
    <trace from=".J1 > .pin2" to="net.GND" />
    <trace from=".R1 > .pin1" to="net.V5" />
    <trace from=".R1 > .pin2" to=".D1 > .anode" />
    <trace from=".D1 > .cathode" to="net.GND" />
    <trace from=".C1 > .pin1" to="net.V5" />
    <trace from=".C1 > .pin2" to="net.GND" />
    <trace from=".SW1 > .pin1" to="net.V5" />
    <trace from=".SW1 > .pin2" to=".R2 > .pin1" />
    <trace from=".R2 > .pin2" to=".Q1 > .base" />
    <trace from=".R3 > .pin1" to=".Q1 > .base" />
    <trace from=".R3 > .pin2" to="net.GND" />
    <trace from=".Q1 > .emitter" to="net.GND" />
    <trace from=".Q1 > .collector" to=".J2 > .pin2" />
    <trace from=".J2 > .pin1" to="net.V5" />
    <hole name="H1" diameter="2.5mm" pcbX={-16} pcbY={10} />
    <hole name="H2" diameter="2.5mm" pcbX={16} pcbY={10} />
    <silkscreentext text="BENCH STATUS / REV A" fontSize={1} pcbY={11} />
    <silkscreentext text="PRESS TO ENABLE" fontSize={0.8} pcbY={-11} />
    <group name="SupplyLegend" pcbX={-16} pcbY={-7} pcbRotation={90}>
      <coppertext text="5V" fontSize={1} />
      <silkscreentext text="5V" fontSize={1} pcbY={2} />
    </group>
  </board>
)
