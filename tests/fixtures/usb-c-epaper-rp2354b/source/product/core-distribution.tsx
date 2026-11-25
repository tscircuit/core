import { Fragment } from "react"

// Layout-authored core supply tree. Short top stubs feed the local bypass
// capacitors; the bottom trunk avoids signal fanout beneath the QFN perimeter.
// These coordinates are source geometry, not imported autorouter output.
const drops = [
  {name:"CORE_OUT",from:".C36 > .pin1",x:-22.7,y:-11},
  {name:"CORE_DVDD1",from:".C16 > .pin1",x:-15.6,y:-6.3},
  {name:"CORE_DVDD2",from:".C17 > .pin1",x:-7.8,y:3},
  {name:"CORE_DVDD3",from:".C18 > .pin1",x:-16.2,y:6.5},
  {name:"CORE_TEST",from:".TP3 > .pin1",x:-10,y:-22.7},
  {name:"CORE_FEEDBACK",from:".R16 > .pin1",x:-28.3,y:-12.7},
] as const
const trunks = [
  {name:"CORE_TO_DVDD1",from:0,to:1,path:[[-22.7,-6.8],[-21.7,-5.8],[-16.1,-5.8]]},
  {name:"CORE_TO_DVDD3",from:1,to:3,path:[[-16.7,-5.2],[-16.7,6]]},
  {name:"CORE_TO_DVDD2",from:3,to:2,path:[[-11.3,6.5]]},
  {name:"CORE_TO_TEST",from:0,to:4,path:[[-22.7,-13],[-13,-22.7]]},
  {name:"CORE_KELVIN",from:0,to:5,path:[[-24.4,-12.7]]},
] as const

export const coreAuthoredPathNames = [...drops.map(d=>`${d.name}_STUB`),...trunks.map(t=>t.name)]

export function CoreDistribution() {
  return <>
    {drops.map(drop=><Fragment key={drop.name}>
      <via name={`${drop.name}_VIA`} pcbX={drop.x} pcbY={drop.y}
        layers={["top","inner1","inner2","bottom"]} connectsTo="net.VCORE"
        holeDiameter={0.3} outerDiameter={0.55} tented="both_sides" />
      <trace name={`${drop.name}_STUB`} routingPhaseIndex={1} from={drop.from} to={`.${drop.name}_VIA > .top`}
        thickness={0.4} maxLength={2} pcbPathRelativeTo={`.${drop.name}_VIA > .top`} pcbPath={[{x:0,y:0}]} />
    </Fragment>)}
    {trunks.map(link=>{
      const from=drops[link.from],to=drops[link.to]
      return <Fragment key={link.name}><trace name={link.name} routingPhaseIndex={1}
        from={`.${from.name}_VIA > .bottom`} to={`.${to.name}_VIA > .bottom`} thickness={0.4}
        pcbPathRelativeTo={`.${from.name}_VIA > .bottom`}
        pcbPath={link.path.map(([x,y])=>({x:x-from.x,y:y-from.y}))} /></Fragment>
    })}
  </>
}
