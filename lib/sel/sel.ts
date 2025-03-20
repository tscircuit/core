import type { ChipProps } from "@tscircuit/props"
import type {
  CommonPinNames,
  Nums16,
  Nums40,
  PinNumbers100,
  TransistorPinNames,
} from "./sel-utility-types"

type NonPolarizedSel = Record<
  `R${Nums40}`,
  {
    pin1: string
    pin2: string
    pos: string
    neg: string
  }
>

type SwSel = Record<
  `SW${Nums40}`,
  {
    pin1: string
    pin2: string
    pos: string
    neg: string
    side1: string
    side2: string
  }
>

type PolarizedSel = Record<
  | `C${Nums40}`
  | `L${Nums40}`
  | `LED${Nums40}`
  | `D${Nums40}`
  | `Y${Nums40}`
  | `B${Nums16}`,
  {
    pin1: string
    pin2: string
    anode: string
    cathode: string
    pos: string
    neg: string
  }
>

type CommonNetNames = "VCC" | "GND" | "VDD" | "PWR" | "V5" | "V3_3"

type TransistorSel = Record<`Q${Nums40}`, Record<TransistorPinNames, string>>

type JumperSel = Record<
  `J${Nums40}`,
  Record<PinNumbers100 | CommonPinNames, string>
>

type ChipSel = Record<`U${Nums40}`, Record<CommonPinNames, string>>

type NetSel = Record<"net", Record<CommonNetNames, string>>

type ConnectionSel = Record<`CN${Nums40}`, Record<CommonPinNames, string>>

type SubcircuitSel = Record<
  "subcircuit",
  Record<`S${Nums40}`, SelWithoutSubcircuit>
>

type SelWithoutSubcircuit = NonPolarizedSel &
  PolarizedSel &
  TransistorSel &
  JumperSel &
  ChipSel &
  SwSel &
  NetSel &
  ConnectionSel

type SelAsStringFn = (refdes: string) => Record<CommonPinNames, string>

type SelAsChipFn = <T extends ChipProps<any>>(
  chipDef: T,
) => Record<keyof T["pinLabels"], string>

export type Sel = SubcircuitSel &
  SelWithoutSubcircuit &
  SelAsStringFn &
  SelAsChipFn

export const sel: Sel = new Proxy(
  {},
  {
    get: (_, prop1: string) => {
      return new Proxy(
        {},
        {
          get: (_, prop2: string) => {
            if (prop1 === "net") {
              return `net.${prop2}`
            }
            if (prop1 === "subcircuit") {
              return new Proxy(
                {},
                {
                  get: (_, prop3: string) => {
                    return new Proxy(
                      {},
                      {
                        get: (_, prop4: string) => {
                          return `subcircuit.${prop2} > .${prop3} > .${prop4}`
                        },
                      },
                    )
                  },
                },
              )
            }
            return `.${prop1} > .${prop2}`
          },
        },
      )
    },
  },
) as any
