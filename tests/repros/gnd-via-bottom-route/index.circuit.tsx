export default () => (
  <board width={6} height={5} layers={4} autorouterVersion="beta_pipeline7">
    <net name="GND" />
    {/* Keep the reduced example's via-to-via route on bottom. */}
    <keepout
      shape="rect"
      width={6}
      height={0.3}
      layers={["top", "inner1", "inner2"]}
    />
    <capacitor
      name="C15"
      capacitance="100nF"
      footprint="cap0402"
      pcbX={0.21}
      pcbY={0.8}
      pcbRotation={180}
      pinAttributes={{ pin1: { doNotConnect: true } }}
    />
    <capacitor
      name="C25"
      capacitance="100nF"
      footprint="cap0402"
      pcbX={0.21}
      pcbY={-0.8}
      pcbRotation={180}
      pinAttributes={{ pin1: { doNotConnect: true } }}
    />
    <via
      name="GND_C15"
      pcbX={-1}
      pcbY={0.8}
      fromLayer="top"
      toLayer="bottom"
      outerDiameter={0.45}
      holeDiameter={0.3}
      connectsTo="net.GND"
    />
    <via
      name="GND_C25"
      pcbX={-1}
      pcbY={-0.8}
      fromLayer="top"
      toLayer="bottom"
      outerDiameter={0.45}
      holeDiameter={0.3}
      connectsTo="net.GND"
    />
    <trace from="C15.pin2" to="GND_C15.top" pcbStraightLine />
    <trace from="C25.pin2" to="GND_C25.top" pcbStraightLine />
    <pcbnotetext
      pcbY={2}
      fontSize={0.22}
      text="Top GND returns joined through vias on bottom"
    />
    <pcbnotetext
      pcbY={-2}
      fontSize={0.22}
      text="Expected: one GND group, no shorts"
    />
  </board>
)
