import { Fragment } from "react"

export default function KeepoutWarningOnlyCopperPourExample() {
  return (
    <board width={56} height={32} routingDisabled schematicDisabled>
      <pcbnotetext
        text="COPPER POUR: warningOnly"
        pcbY={14}
        fontSize={1}
        color="white"
      />
      {[-13, 13].map((x) => (
        <Fragment key={x}>
          <pcbnotetext
            text={`<keepout shape="rect"\n  width={6} height={6}\n  warningOnly={${x < 0}} />`}
            pcbX={x - 10}
            pcbY={11}
            anchorAlignment="top_left"
            fontSize={0.85}
            color="#ffd166"
          />
          <keepout
            shape="rect"
            width={6}
            height={6}
            pcbX={x}
            pcbY={-1}
            warningOnly={x < 0}
          />
          <copperpour
            name={x < 0 ? "ADVISORY" : "ENFORCING"}
            connectsTo="net.GND"
            layer="top"
            outline={[
              { x: x - 10, y: -6 },
              { x: x + 10, y: -6 },
              { x: x + 10, y: 4 },
              { x: x - 10, y: 4 },
            ]}
          />
          <pcbnotetext
            text={x < 0 ? "COPPER FILLS THE KEEPOUT" : "KEEPOUT CUTS A HOLE"}
            pcbX={x}
            pcbY={-8}
            fontSize={0.85}
            color={x < 0 ? "#ffd166" : "#8ac8ff"}
          />
        </Fragment>
      ))}
      <pcbnotetext
        text={
          '<copperpour connectsTo="net.GND" layer="top"\n  outline={[/* rectangle shown above */]} />'
        }
        pcbX={-20}
        pcbY={-11}
        anchorAlignment="top_left"
        fontSize={0.8}
      />
    </board>
  )
}
