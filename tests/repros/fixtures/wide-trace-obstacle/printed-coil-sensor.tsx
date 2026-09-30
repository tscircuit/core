// Reduced from the metal-touch panel's printed inductive sensor.
// Footprint-local points in mm, +X right, +Y up (right-handed PCB frame).
const coilRoute = [
  { x: -5, y: -6 },
  { x: -5, y: -5 },
  { x: 5, y: -5 },
  { x: 5, y: 5 },
  { x: -5, y: 5 },
  { x: -5, y: -4 },
  { x: 4, y: -4 },
  { x: 4, y: 4 },
  { x: -4, y: 4 },
  { x: -4, y: -3 },
  { x: 3, y: -3 },
  { x: 3, y: 3 },
  { x: -3, y: 3 },
  { x: -3, y: -2 },
]
export const PrintedCoilSensor = () => (
  <board width={26} height={20} layers={2} autorouter="auto_local">
    <inductor
      name="L1"
      inductance="1uH"
      doNotPlace
      pcbX={2}
      footprint={
        <footprint>
          <platedhole
            portHints={["pin1"]}
            pcbX={-5}
            pcbY={-6}
            holeDiameter={0.3}
            outerDiameter={0.8}
            shape="circle"
          />
          <platedhole
            portHints={["pin2"]}
            pcbX={-3}
            pcbY={-2}
            holeDiameter={0.3}
            outerDiameter={0.8}
            shape="circle"
          />
          <pcbtrace
            route={coilRoute.map((point) => ({
              ...point,
              route_type: "wire" as const,
              width: 0.5,
              layer: "top" as const,
            }))}
          />
        </footprint>
      }
    />
    <capacitor
      name="C1"
      capacitance="1nF"
      footprint="0603"
      layer="bottom"
      pcbX={-7}
      pcbY={1}
    />
    <pinheader name="J1" pinCount={2} pitch="2.54mm" pcbX={-7} pcbY={-4} />
    <trace from="L1.pin1" to="C1.pin1" />
    <trace from="L1.pin2" to="C1.pin2" />
    <trace from="J1.pin1" to="C1.pin1" />
    <trace from="J1.pin2" to="C1.pin2" />
    <pcbnotetext
      text="PRINTED COIL SENSOR / copper width 0.5 mm"
      pcbY={8}
      fontSize={0.6}
    />
    <pcbnotetext
      text="Red copper outside green outlines is omitted"
      pcbY={-9}
      fontSize={0.5}
    />
  </board>
)
