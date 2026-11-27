import { Fragment } from "react"

// Hand-authored pad escapes. Native tscircuit routes the bus on inner2 between
// the full-stack vias; these are layout coordinates, not router output.
export const displayLinks = [
  {name:"BUSY",net:"EPD_BUSY",a:[-13.4,-2.7],b:[40.8,19.8],to:".J2 > .pin9"},
  {name:"DC",net:"EPD_DC",a:[-15.8,-3.5],b:[39.7,19.8],to:".J2 > .pin11"},
  {name:"CS",net:"EPD_CS",a:[-15,-2.7],b:[39.15,18.95],to:".J2 > .pin12"},
  {name:"RST",net:"EPD_RST",a:[-13.8,-3.5],b:[40.25,18.95],to:".J2 > .pin10"},
  {name:"EN",net:"EPD_EN",a:[-11.9,-3.5],b:[43.6,1.8],to:".U4 > .pin3"},
  {name:"SCK",net:"EPD_SCK",a:[-15,-12.2],b:[38.6,19.8],from:".R14 > .pin2",to:".J2 > .pin13"},
  {name:"MOSI",net:"EPD_MOSI",a:[-11,-12.2],b:[38.05,18.95],from:".R15 > .pin2",to:".J2 > .pin14"},
] as const

const localLinks = [
  {name:"PANEL_SENSE",net:"EPD_RESE",from:".J2 > .pin3",to:".R11 > .pin1",a:[43.6498,19.6],b:[44.6,13.3],layer:"bottom",width:0.15,
    path:[[43.6498,14.2502]]},
  {name:"PANEL_VSL",net:"EPD_VSL",from:".J2 > .pin22",to:".C30 > .pin1",a:[34.149946,19.6],b:[28.49258,11],layer:"bottom",width:0.2,
    path:[[28.49258,13.942634]]},
] as const

export const displayLaneNames = displayLinks.map(link=>`DISPLAY_${link.name}`)
export const extraAuthoredPathNames = [
  ...displayLinks.flatMap(link=>[`${link.name}_RETURN`,...("from" in link?[`${link.name}_ESCAPE`]:[])]),
  ...localLinks.flatMap(link=>[`${link.name}_FROM`,`${link.name}_LINK`,`${link.name}_TO`]),
]

export function DisplayRouting() {
  return <>
    <bus name="DISPLAY_INTERCONNECT" connections={displayLaneNames} routingPhaseIndex={1}
      pcbTraceWidth="0.15mm" pcbTraceSpacing="0.4mm" pcbAllowedLayers={["inner2"]} />
    {displayLinks.map(link=><Fragment key={link.name}>
      <via name={`${link.name}_FROM_VIA`} pcbX={link.a[0]} pcbY={link.a[1]} layers={["top","inner1","inner2","bottom"]}
        holeDiameter="0.3mm" outerDiameter="0.55mm" connectsTo={`net.${link.net}`} />
      <via name={`${link.name}_TO_VIA`} pcbX={link.b[0]} pcbY={link.b[1]} layers={["top","inner1","inner2","bottom"]}
        holeDiameter="0.3mm" outerDiameter="0.55mm" connectsTo={`net.${link.net}`} />
      {"from" in link&&<trace name={`${link.name}_ESCAPE`} routingPhaseIndex={1} from={link.from} to={`.${link.name}_FROM_VIA > .top`}
        thickness="0.15mm" pcbPathRelativeTo={`.${link.name}_FROM_VIA > .top`} pcbPath={[{x:0,y:0}]} />}
      <trace name={`DISPLAY_${link.name}`} routingPhaseIndex={1} from={`.${link.name}_FROM_VIA > .inner2`} to={`.${link.name}_TO_VIA > .inner2`} thickness="0.15mm" />
      <trace name={`${link.name}_RETURN`} routingPhaseIndex={1} from={`.${link.name}_TO_VIA > .top`} to={link.to}
        thickness="0.15mm" pcbPathRelativeTo={`.${link.name}_TO_VIA > .top`} pcbPath={[{x:0,y:0}]} />
    </Fragment>)}
    {localLinks.map(link=><Fragment key={link.name}>
      <via name={`${link.name}_FROM_VIA`} pcbX={link.a[0]} pcbY={link.a[1]} layers={["top","inner1","inner2","bottom"]}
        holeDiameter="0.3mm" outerDiameter="0.55mm" connectsTo={`net.${link.net}`} />
      <via name={`${link.name}_TO_VIA`} pcbX={link.b[0]} pcbY={link.b[1]} layers={["top","inner1","inner2","bottom"]}
        holeDiameter="0.3mm" outerDiameter="0.55mm" connectsTo={`net.${link.net}`} />
      <trace name={`${link.name}_FROM`} routingPhaseIndex={1} from={link.from} to={`.${link.name}_FROM_VIA > .top`} thickness={link.width}
        pcbPathRelativeTo={`.${link.name}_FROM_VIA > .top`} pcbPath={[{x:0,y:0}]} />
      <trace name={`${link.name}_LINK`} routingPhaseIndex={1} from={`.${link.name}_FROM_VIA > .${link.layer}`} to={`.${link.name}_TO_VIA > .${link.layer}`} thickness={link.width}
        pcbPathRelativeTo={`.${link.name}_FROM_VIA > .${link.layer}`} pcbPath={link.path.map(([x,y])=>({x:x-link.a[0],y:y-link.a[1]}))} />
      <trace name={`${link.name}_TO`} routingPhaseIndex={1} from={`.${link.name}_TO_VIA > .top`} to={link.to} thickness={link.width}
        pcbPathRelativeTo={`.${link.name}_TO_VIA > .top`} pcbPath={[{x:0,y:0}]} />
    </Fragment>)}
  </>
}
