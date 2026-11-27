import { Fragment } from "react"

type Return = readonly [string,string,number,number,(readonly [number,number])[]?]
// Deliberately placed local pad-to-plane returns. USB shell slots already pass
// through the ground layer. Each other ground pad has a short top-side via stub.
export const additionalGroundReturns: readonly Return[] = [
  ["USB_GND_A",".J1 > .GND1",-43,4.4],
  ["USB_GND_B",".J1 > .GND2",-42.6,-3.2],
  ["ESD_GND",".U2 > .pin2",-39.1,0],
  ["MCU_REG_GND",".U3 > .pin2",-28.35,15],
  ["PANEL_REG_GND",".U4 > .pin2",46.5,3.2],
  ["BOOT_GND",".SW1 > .pin2",-24.4,-19],
  ["RESET_GND",".SW2 > .pin2",-4.4,-19],
  ["PANEL_GND_8",".J2 > .pin8",41.15,22.8],
  ["PANEL_GND_17",".J2 > .pin17",36.65,19.4],
  ["PANEL_SHELL_L",".J2 > .pin25",30,23.55],
  ["PANEL_SHELL_R",".J2 > .pin26",47.9,23.55],
  ["PUMP_DIODE_GND",".D2 > .pin1",34.9,5.2],
  ["C1_RETURN",".C1 > .pin2",-42,11.1],
  ["C2_RETURN",".C2 > .pin2",-39,9.1],
  ["C3_RETURN",".C3 > .pin2",-34,17.1],
  ["C4_RETURN",".C4 > .pin2",-27,17.4],
  ["C5_RETURN",".C5 > .pin2",43.8,-3.9],
  ["C6_RETURN",".C6 > .pin2",45.5,5.6],
  ["C22_RETURN",".C22 > .pin2",42.5,18.7],
  ["C23_RETURN",".C23 > .pin2",37.4,18],
  ["C24_RETURN",".C24 > .pin2",35,19.4],
  ["C25_RETURN",".C25 > .pin2",31.6,19.4],
  ["CC1_RETURN",".R1 > .pin2",-42,-4.85],
  ["CC2_RETURN",".R2 > .pin2",-39.5,-4.85],
  ["PANEL_ENABLE_RETURN",".R9 > .pin2",42.25,-3.9],
  ["BOOST_GATE_RETURN",".R10 > .pin2",47.3,10.05],
  ["BOOST_SENSE_RETURN",".R11 > .pin2",45.9,16.7],
  ["C26_RETURN",".C26 > .pin2",39.5,6.3],
  ["C28_RETURN",".C28 > .pin2",30.1,12.5],
  ["C29_RETURN",".C29 > .pin2",22.9,14.3],
  ["C30_RETURN",".C30 > .pin2",23.9,9.3],
  ["C31_RETURN",".C31 > .pin2",16.9,9.3],
  ["GROUND_PROBE_RETURN",".TP1 > .pin1",-17,-22.7],
]

export function GroundReturns() {
  return <>{additionalGroundReturns.map(([name,from,x,y,path])=><Fragment key={name}>
    <via name={`${name}_VIA`} pcbX={x} pcbY={y} layers={["top","inner1","inner2","bottom"]}
      holeDiameter="0.3mm" outerDiameter="0.55mm" connectsTo="net.GND" />
    <trace name={name} routingPhaseIndex={1} from={from} to={`.${name}_VIA > .top`} thickness="0.15mm"
      pcbPathRelativeTo={`.${name}_VIA > .top`} pcbPath={(path??[[x,y]]).map(([px,py])=>({x:px-x,y:py-y}))} />
  </Fragment>)}</>
}
