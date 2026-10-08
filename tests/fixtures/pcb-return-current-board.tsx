import type { PcbReturnCurrentExcitationProps } from "@tscircuit/props"
import type { ReactNode } from "react"

export const returnCurrentExcitationProps: PcbReturnCurrentExcitationProps = {
  source: ".U1 > .OUT",
  load: ".U2 > .IN",
  ground: "net.GND",
  current: "5mA",
  returnSource: ".U2 > .GND",
  returnSink: ".U1 > .GND",
  sourceImpedance: "25ohm",
  loadImpedance: "100ohm",
}

/** Physical source/load and independent ground pads, all generated from TSX. */
export function ReturnCurrentConnections({
  layer = "top",
  rotation = 0,
  groundPortType = "smtpad",
  straightSignal = true,
}: {
  layer?: "top" | "bottom"
  rotation?: number
  groundPortType?: "smtpad" | "platedhole"
  straightSignal?: boolean
}) {
  return (
    <>
      <net name="GND" />
      {[-2, 2].map((x, index) => (
        <chip
          key={index}
          name={`U${index + 1}`}
          pcbX={x}
          layer={layer}
          pcbRotation={rotation}
          pinLabels={{ pin1: index === 0 ? "OUT" : "IN", pin2: "GND" }}
          footprint={
            <footprint>
              <smtpad
                portHints={["pin1"]}
                width={0.8}
                height={0.8}
                shape="rect"
              />
              {groundPortType === "smtpad" ? (
                <smtpad
                  portHints={["pin2"]}
                  pcbY={1.5}
                  width={0.8}
                  height={0.8}
                  shape="rect"
                />
              ) : (
                <platedhole
                  portHints={["pin2"]}
                  pcbY={1.5}
                  holeDiameter={0.3}
                  outerDiameter={0.8}
                  shape="circle"
                />
              )}
            </footprint>
          }
        />
      ))}
      <trace
        name="SIGNAL"
        from=".U1 > .OUT"
        to=".U2 > .IN"
        thickness={0.18}
        pcbStraightLine={straightSignal}
      />
      <trace from=".U1 > .GND" to="net.GND" />
      <trace from=".U2 > .GND" to="net.GND" />
    </>
  )
}

export function ReturnCurrentBoard({
  children = (
    <pcbreturncurrentsimulation name="Explicit GND returns">
      <pcbreturncurrentexcitation {...returnCurrentExcitationProps} />
    </pcbreturncurrentsimulation>
  ),
  ...connections
}: Parameters<typeof ReturnCurrentConnections>[0] & { children?: ReactNode }) {
  return (
    <board width={8} height={6} layers={2} thickness={0.8} schematicDisabled>
      <ReturnCurrentConnections {...connections} />
      {children}
    </board>
  )
}
