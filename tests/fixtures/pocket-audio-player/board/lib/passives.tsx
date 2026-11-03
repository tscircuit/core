import type { CommonLayoutProps } from "@tscircuit/props"

type PassivePlacement = CommonLayoutProps & {
  schSectionName?: string
  name: string
  from: string
  to: string
}

const resistorParts: Record<string, string> = {
  "0": "RC0603JR-070RL",
  "22": "RC0603FR-0722RL",
  "33": "RC0603FR-0733RL",
  "100": "RC0603FR-07100RL",
  "1k": "RC0603FR-071KL",
  "2.2k": "RC0603FR-072K2L",
  "4.7k": "RC0603FR-074K7L",
  "5.1k": "RC0603FR-075K1L",
  "10k": "RC0603FR-0710KL",
  "22k": "RC0603FR-0722KL",
  "47k": "RC0603FR-0747KL",
  "100k": "RC0603FR-07100KL",
  "470k": "RC0603FR-07470KL",
  "560k": "RC0603FR-07560KL",
  "900k": "RC0603FR-07900KL",
  "73.2k": "RC0603FR-0773K2L",
  "2.94k": "RC0603FR-072K94L",
  "3.57k": "RC0603FR-073K57L",
  "43.2k": "RC0603FR-0743K2L",
  "300k": "RC0603FR-07300KL",
}

export function R({
  resistance,
  from,
  to,
  ...placement
}: PassivePlacement & { resistance: string }) {
  return (
    <resistor
      schMarginX="2mm"
      schMarginY="2mm"
      schRotation={-90}
      {...placement}
      resistance={resistance}
      footprint="0603"
      manufacturerPartNumber={resistorParts[resistance]}
      connections={{ pin1: `net.${from}`, pin2: `net.${to}` }}
    />
  )
}

const capacitorParts: Record<string, string> = {
  "100nF": "GRM188R71C104KA01D",
  "1uF": "GRM188R61A105KA61D",
  "2.2uF": "GRM188R61A225KE15D",
  "10uF": "GRM188R61A106KE69D",
  "22uF": "GRM21BR61A226ME44L",
}

export function C({
  capacitance,
  from,
  to = "GND",
  ...placement
}: Omit<PassivePlacement, "to"> & { capacitance: string; to?: string }) {
  return (
    <capacitor
      schOrientation="vertical"
      schMarginX="2mm"
      schMarginY="2mm"
      {...placement}
      capacitance={capacitance}
      footprint={capacitance === "22uF" ? "0805" : "0603"}
      manufacturerPartNumber={capacitorParts[capacitance]}
      connections={{ pin1: `net.${from}`, pin2: `net.${to}` }}
    />
  )
}
