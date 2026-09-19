import { Fragment } from "react"

export default function KeepoutPermissionsExample() {
  return (
    <board width={60} height={30} autorouter="default" schematicDisabled>
      <pcbnotetext
        text="INDEPENDENT KEEPOUT PERMISSIONS"
        pcbY={13}
        fontSize={1}
      />
      {[-15, 15].map((x) => (
        <Fragment key={x}>
          <pcbnotetext
            text={`<keepout shape="rect" width={8} height={8}\n  layers={["top", "bottom"]}\n  ${x < 0 ? "allowTraces" : "allowPlacements"} />`}
            pcbX={x - 13}
            pcbY={10}
            anchorAlignment="top_left"
            fontSize={0.65}
          />
          <keepout
            shape="rect"
            width={8}
            height={8}
            pcbX={x}
            layers={["top", "bottom"]}
            allowTraces={x < 0}
            allowPlacements={x > 0}
          />
          {x > 0 && (
            <testpoint name="INSIDE" footprintVariant="pad" pcbX={x} pcbY={2} />
          )}
          <testpoint
            name={`A${x + 15}`}
            footprintVariant="pad"
            pcbX={x - 10}
            pcbY={-2}
          />
          <testpoint
            name={`B${x + 15}`}
            footprintVariant="pad"
            pcbX={x + 10}
            pcbY={-2}
          />
          <trace from={`.A${x + 15} > .pin1`} to={`.B${x + 15} > .pin1`} />
          <copperpour
            name={`POUR${x + 15}`}
            connectsTo="net.GND"
            layer="bottom"
            outline={[
              { x: x - 12, y: -6 },
              { x: x + 12, y: -6 },
              { x: x + 12, y: 5 },
              { x: x - 12, y: 5 },
            ]}
          />
          <pcbnotetext
            text={
              x < 0
                ? "Trace crosses; placement still restricted"
                : "Pad allowed; trace routes around"
            }
            pcbX={x}
            pcbY={-8}
            fontSize={0.65}
          />
        </Fragment>
      ))}
      <pcbnotetext
        text={
          '<copperpour layer="bottom" connectsTo="net.GND" ... />\nBoth pours still leave a keepout hole'
        }
        pcbY={-12}
        fontSize={0.7}
      />
    </board>
  )
}
