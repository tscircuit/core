import { expect, test } from "bun:test"
import { getTestFixture } from "tests/fixtures/get-test-fixture"
import { Group_getRoutingPhasePlans } from "lib/components/primitive-components/Group/Group_getRoutingPhasePlans"
import { Board } from "lib/components/normal-components/Board"

import { RV1106G2 } from "./rv1106-imports/RV1106G2"
import { TPS62823DLCR } from "./rv1106-imports/TPS62823DLCR"
import { W25N01GVZEIG } from "./rv1106-imports/W25N01GVZEIG"

// Prototype: fixed 0.9 V ARM/core. Disable firmware voltage scaling.
// Pin connections: Luckfox Pico Pro/Max reference schematic; TI TPS6282x.
const supplies: Record<string, number[]> = {
  VDD09: [10,51,54,55,67,71,82,103,115,116], DDR135: [49,50,56],
  VCC18: [53,70], VCC33: [13,28,43,61,81,88,108],
  RTC33: [19], USB18: [24], CODEC18: [31], ANALOG18: [96], MIPI18: [1], ETH33: [101],
}
const decapPositions = [[-5.8, 2.6], [1.05, -5.8], [3.15, -5.8], [-1.05, -5.8], [5.8, -1.6], [5.8, -0.2], [5.8, 1.2], [3.15, 6.8], [-1.05, 6.8], [1.05, 6.8], [-3.15, -5.8], [5.8, -3.0], [5.8, -4.4], [5.8, -5.8], [5.8, 2.6], [-5.8, 1.2], [-5.8, -1.6], [-5.8, -3.0], [5.8, 4.0], [5.8, 5.4], [5.8, 6.8], [-3.15, 6.8], [-5.8, -0.2], [-5.8, -4.4], [-5.8, -5.8], [-5.8, 4.0], [-5.8, 5.4], [-5.8, 6.8]]
const net = (s: string) => s.startsWith(".") ? s : `net.${s}`
const pin = (n: number) => `.U1 > .pin${n}`
type Passive = { name: string; value: string; x: number; y: number; a: string; b?: string; section?: string; footprint?: string }
function R(p: Passive) {
  return <resistor name={p.name} resistance={p.value} footprint={p.footprint ?? "0402"}
    pcbX={p.x} pcbY={p.y} layer="top" schMarginX={1} schMarginY={0.5} schSectionName={p.section ?? "Core"}
    connections={{ pin1: net(p.a), pin2: net(p.b ?? "GND") }} />
}
function C(p: Passive) {
  return <capacitor name={p.name} capacitance={p.value} maxVoltageRating="10V" footprint={p.footprint ?? "0402"}
    pcbX={p.x} pcbY={p.y} layer="top" schMarginX={1} schMarginY={0.5} schSectionName={p.section ?? "Bypass"}
    connections={{ pin1: net(p.a), pin2: net(p.b ?? "GND") }} />
}
function Buck({ id, x, y, rail, upper, lower, enable, good }: {
  id: number; x: number; y: number; rail: string; upper: string; lower: string; enable: string; good: string
}) {
  const section = `Power${id}`
  return <>
    <TPS62823DLCR name={`U${id}`} pcbX={x} pcbY={y} layer="top" schMarginX={1} schMarginY={0.5} schHeight={0.8} schSectionName={section}
      connections={{ VIN: net("VIN5"), EN: net(enable), PG: net(good), PGND: net("GND"),
        AGND: net("GND"), FB: net(`FB${id}`), SW: net(`SW${id}`) }} />
    <inductor name={`L${id}`} inductance="470nH" maxCurrentRating="4A" footprint={<footprint><smtpad portHints={["pin1"]} pcbX={-0.8} pcbY={0} width={0.8} height={1.6} shape="rect" /><smtpad portHints={["pin2"]} pcbX={0.8} pcbY={0} width={0.8} height={1.6} shape="rect" /><courtyardrect width={2.8} height={2} /></footprint>}
      pcbX={x} pcbY={y+3} layer="top" schMarginX={1} schMarginY={0.5} schSectionName={section}
      connections={{ pin1: net(`SW${id}`), pin2: net(rail) }} />
    <C name={`C${id}IN`} value="4.7uF" footprint="0603" x={x-3.5} y={y+1} a="VIN5" section={section} />
    <C name={`C${id}OUT`} value="22uF" footprint="0805" x={x+3.8} y={y+1} a={rail} section={section} />
    <R name={`R${id}TOP`} value={upper} x={x-1} y={y-2.8} a={rail} b={`FB${id}`} section={section} />
    <R name={`R${id}BOT`} value={lower} x={x+1} y={y-2.8} a={`FB${id}`} section={section} />
  </>
}

export default function MinimalRV1106G2() {
  const caps = [
    ...Object.entries(supplies).flatMap(([rail,pins]) => pins.map(() => [rail,"100nF"])),
    ["VDD09","10uF"],["VDD09","10uF"],["VDD09","1uF"],
    ["DDR135","10uF"],["DDR135","10uF"],["DDR135","1uF"],
    ["VCC18","1uF"],["RTC33","1uF"],["CODEC18","10uF"],
    ["VCC33","10uF"],["CODEC_VCM","4.7uF"],
  ]
  return <board width="50mm" height="50mm" layers={4} schAutoLayoutEnabled
    minTraceWidth="0.1mm" minTraceToPadEdgeClearance="0.1mm" minPadEdgeToPadEdgeClearance="0.1mm"
    minViaHoleDiameter="0.2mm" minViaPadDiameter="0.45mm" minBoardEdgeClearance="0.3mm"
    autorouter={{ preset: "auto_local", traceClearance: 0.1 }}>
    {["Core","Bypass","Boot","Clock","IO","Sequence","Reset","ClockBias","Power3","Power4","Power5","Power6"].map(name => <schematicsection name={name} displayName={name} />)}
    {["VDD09", "DDR135", "VCC18", "VCC33", "RTC33", "USB18", "CODEC18", "ANALOG18", "MIPI18", "ETH33", "GND", "CODEC_VCM", "VIN5", "PG_CORE", "FB3", "SW3", "EN_MEM", "PG_MEM", "FB4", "SW4", "FB5", "SW5", "EN_IO", "PG_IO", "FB6", "SW6", "POR", "RECOVERY"].map(name => <net name={name} routingPhaseIndex={2} />)}
    {["XIN", "XTALOUT", "XOUT"].map(name => <net name={name} routingPhaseIndex={0} />)}
    {["SCK", "CS", "D0", "D1", "D2", "D3"].map(name => <net name={name} routingPhaseIndex={1} />)}
    <RV1106G2 name="U1" schSectionName="Core" pcbX={0} pcbY={1} schHeight={13} schMarginX={1} />
    {Object.entries(supplies).flatMap(([rail,pins]) => pins.map(p => <trace key={String(p)} from={pin(p)} to={net(rail)} />))}
    {[37,57,129].map(p => <trace key={String(p)} from={pin(p)} to={net("GND")} />)}
    {caps.map(([rail,value], i) => <C key={i} name={`CD${i+1}`} value={value} a={rail}
      x={i < 28 ? decapPositions[i][0]*1.55 : -6+(i-28)%5*3} y={i < 28 ? 1+(decapPositions[i][1]-1)*1.55 : 13+Math.floor((i-28)/5)*2} section="Bypass" footprint={value === "10uF" ? "0603" : "0402"} />)}
    {[
      ["VCC33","RTC33","100"],["VCC18","USB18","1"],["VCC18","CODEC18","0"],
      ["VCC18","ANALOG18","0"],["VCC18","MIPI18","1"],["VCC33","ETH33","0"],
    ].map(([a,b,value],i) => <R key={b} name={`RF${i}`} value={value} a={a} b={b} x={-18} y={-3+i*2} />)}
    <R name="RZQ" value="240" a={pin(52)} x={1} y={-7.1} />
    <R name="RETH" value="6.04k" a={pin(102)} x={11.5} y={8} />
    <trace from={pin(30)} to={net("CODEC_VCM")} />
    {/* PG sequencing: core -> DDR and 1.8 V -> 3.3 V -> reset release. */}
    <Buck id={3} x={-17} y={17} rail="VDD09" upper="49.9k" lower="100k" enable="VIN5" good="PG_CORE" />
    <Buck id={4} x={17} y={-17} rail="DDR135" upper="100k" lower="80k" enable="EN_MEM" good="PG_MEM" />
    <Buck id={5} x={-17} y={-17} rail="VCC18" upper="200k" lower="100k" enable="EN_MEM" good="PG_MEM" />
    <Buck id={6} x={17} y={17} rail="VCC33" upper="450k" lower="100k" enable="EN_IO" good="PG_IO" />
    {["PG_CORE","PG_MEM"].map((b,i) => <R key={b} name={`RPG${i}`} value="100k" a="VIN5" b={b} x={-3+i*6} y={20} section="Sequence" />)}
    <C name="CSEQ1" value="220nF" a="EN_MEM" x={-3} y={18} section="Sequence" />
    <C name="CSEQ2" value="220nF" a="EN_IO" x={3} y={18} section="Sequence" />
    <R name="RSEQ1" value="10k" a="PG_CORE" b="EN_MEM" x={-3} y={22} section="Sequence" />
    <R name="RSEQ2" value="10k" a="PG_MEM" b="EN_IO" x={3} y={22} section="Sequence" />
    <R name="RPGRESET" value="10k" a="PG_IO" b="POR" x={14} y={-8} section="Reset" />
    <R name="RPOR" value="100k" a="VCC33" b="POR" x={14} y={-10} section="Reset" />
    <C name="CPOR" value="1uF" a="POR" x={16} y={-10} section="Reset" />
    <trace from={pin(66)} to={net("POR")} />
    <W25N01GVZEIG name="U2" schSectionName="Boot" pcbX={0} pcbY={-15} schHeight={1} schMarginX={1}
      connections={{ pin1: net("CS"), pin2: net("D1"), pin3: net("D2"), pin4: net("GND"),
        pin5: net("D0"), pin6: net("SCK"), pin7: net("D3"), pin8: net("VCC33"), pin9: net("GND") }} />
    {[[41,"D0"],[42,"D1"],[44,"D2"],[39,"D3"],[47,"CS"]].map(([p,n]) =>
      <trace key={String(p)} from={pin(Number(p))} to={net(String(n))} />)}
    <R name="RSCK" value="22" a={pin(48)} b="SCK" x={-1} y={-7.1} section="Boot" />
    {["D2","D3","CS"].map((b,i) => <R key={b} name={`RFLASH${i}`} value="10k" a="VCC33" b={b} x={-7} y={-13-i*2} section="Boot" />)}
    <C name="CFLASH" value="100nF" a="VCC33" x={6.5} y={-15} section="Boot" />
    <crystal name="Y1" schSectionName="Clock" frequency="24MHz" loadCapacitance="12pF" pinVariant="four_pin"
      pcbX={13} pcbY={-3} footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX={-0.8} pcbY={-0.6} width={0.8} height={0.7} shape="rect" />
        <smtpad portHints={["pin2"]} pcbX={0.8} pcbY={-0.6} width={0.8} height={0.7} shape="rect" />
        <smtpad portHints={["pin3"]} pcbX={0.8} pcbY={0.6} width={0.8} height={0.7} shape="rect" />
        <smtpad portHints={["pin4"]} pcbX={-0.8} pcbY={0.6} width={0.8} height={0.7} shape="rect" />
      </footprint>} connections={{ pin1: net("XIN"), pin2: net("GND"), pin3: net("XTALOUT"), pin4: net("GND") }} />
    <trace from={pin(68)} to={net("XIN")} /><trace from={pin(69)} to={net("XOUT")} />
    <R name="RXTAL" value="22" a="XOUT" b="XTALOUT" x={13} y={-1} section="Clock" />
    <R name="RBIAS" value="1M" a="XIN" b="XOUT" x={13} y={-5} section="ClockBias" />
    {["XIN","XTALOUT"].map((a,i) => <C key={a} name={`CX${i}`} value="18pF" a={a} x={16} y={-4+i*2} section="Clock" />)}
    <crystal name="Y2" schSectionName="Clock" frequency="32.768kHz" loadCapacitance="12.5pF" footprint="0805"
      pcbX={-13} pcbY={0} connections={{ pin1: pin(21), pin2: pin(20) }} />
    {[21,20].map((p,i) => <C key={String(p)} name={`CRTC${i}`} value="18pF" a={pin(p)} x={-15} y={-2+i*4} section="Clock" />)}
    <R name="RVBUST" value="10k" a="VIN5" b={pin(25)} x={-18} y={-8} section="IO" />
    <R name="RVBUSB" value="18k" a={pin(25)} x={-18} y={-10} section="IO" />
    <R name="RREC" value="10k" a="VCC18" b="RECOVERY" x={-18} y={-12} section="IO" />
    <trace from={pin(23)} to={net("RECOVERY")} />
    <C name="CREC" value="1nF" a="RECOVERY" x={-15} y={-12} section="IO" />
    {[["5V","VIN5"],["GND","GND"],["DM",pin(26)],["DP",pin(27)],["TX",pin(79)],
      ["RX",pin(80)],["RST","POR"],["BOOT","RECOVERY"],["3V3","VCC33"]].map(([label,target],i) =>
      <testpoint key={label} name={`TP_${label}`} schSectionName="IO" footprintVariant="pad" padDiameter="1.4mm" pcbX={[-23,-23,-23,-23,23,23,23,-23,23][i]} pcbY={[19,16,-2,-5,1,4,-9,-12,19][i]}
        connections={{ pin1: net(target) }} />)}
    {[-2,0,2].flatMap(x => [-1,1,3].map(y =>
      <via name={`THERMAL_${x}_${y}`} pcbX={x} pcbY={y} holeDiameter="0.2mm" outerDiameter="0.45mm"
        fromLayer="top" toLayer="bottom" connectsTo="net.GND" />))}
    <copperpour name="GroundPlane" layer="inner1" connectsTo="net.GND" unbroken clearance="0.15mm" boardEdgeMargin="0.3mm" />
    <autoroutingphase name="remaining" phaseIndex={2} connections={Array.from({length:129}, (_,i) => pin(i+1))} />
    <autoroutingphase name="clocks" phaseIndex={0} connections={["net.XIN","net.XOUT","net.XTALOUT",".U1 > .pin20",".U1 > .pin21",".Y2 > .pin1",".Y2 > .pin2"]} />
    <autoroutingphase name="boot-flash" phaseIndex={1} connections={["net.SCK","net.CS","net.D0","net.D1","net.D2","net.D3",".RSCK > .pin1"]} />
  </board>
}

test("RV1106 exact source board preserves placement and explicit routing phases", async () => {
  const { circuit } = getTestFixture({
    platform: { routingDisabled: true, schematicDisabled: true },
  })
  circuit.add(<MinimalRV1106G2 />)
  await circuit.renderUntilSettled()
  const board = circuit._getBoard()!
  if (!(board instanceof Board)) throw new Error("Expected RV1106 board")
  const phases = Group_getRoutingPhasePlans(board)
  expect(phases.map((phase) => phase.routingPhaseIndex)).toEqual([0, 1, 2, null])
  expect(phases[3]!.nets).toHaveLength(0)
  expect(phases[3]!.traces).toHaveLength(0)
  const circuitJson = circuit.getCircuitJson()
  const pcbBoard = circuitJson.find((element) => element.type === "pcb_board")
  expect(pcbBoard?.width).toBe(50)
  expect(pcbBoard?.height).toBe(50)
  expect(circuitJson.filter((element) => element.type === "source_component")).toHaveLength(108)
  expect(circuitJson.filter((element) => element.type === "pcb_component").every((component) => component.layer === "top")).toBe(true)
  await expect(circuit).toMatchPcbSnapshot(import.meta.path)
})
