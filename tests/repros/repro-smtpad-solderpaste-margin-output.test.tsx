import { beforeAll, expect, test } from "bun:test"
import type { SmtPadProps } from "@tscircuit/props"
import { Fragment } from "react"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

const { circuit } = getTestFixture()
const margins = [-0.1, 0, 0.1]
const shapes: SmtPadProps[] = [
  { shape: "circle", radius: 0.5 },
  { shape: "rect", width: 2, height: 1 },
  { shape: "rotated_rect", width: 2, height: 1, ccwRotation: 30 },
  { shape: "pill", width: 2, height: 1, radius: 0.5 },
  { shape: "rotated_pill", width: 2, height: 1, radius: 0.5, ccwRotation: 30 },
  {
    shape: "polygon",
    points: [
      { x: -1, y: -0.5 },
      { x: 1, y: -0.5 },
      { x: 1, y: 0.5 },
      { x: -1, y: 0.5 },
    ],
  },
]

beforeAll(async () => {
  circuit.add(
    <board width={60} height={24} schematicDisabled routingDisabled>
      {margins.flatMap((margin, row) =>
        shapes.map((props, column) => (
          <Fragment key={`${margin}-${props.shape}`}>
            <smtpad
              {...props}
              pcbX={column * 8 - 18}
              pcbY={6 - row * 6}
              portHints={[]}
              solderPasteMargin={margin}
            />
          </Fragment>
        )),
      )}
      {shapes.map((props, column) => (
        <Fragment key={props.shape}>
          <pcbnotetext
            text={props.shape}
            pcbX={column * 8 - 18}
            pcbY={9}
            fontSize={0.8}
          />
        </Fragment>
      ))}
      {margins.map((margin, row) => (
        <Fragment key={margin}>
          <pcbnotetext
            text={`${margin} mm`}
            pcbX={-26}
            pcbY={6 - row * 6}
            fontSize={0.9}
          />
        </Fragment>
      ))}
      <pcbnotetext
        text="Paste geometry follows margin; pad solderpaste_margin is missing"
        pcbY={-10}
        fontSize={0.9}
      />
    </board>,
  )
  await circuit.renderUntilSettled()
  const pads = circuit.db.pcb_smtpad.list()
  expect(pads).toHaveLength(18)
  expect(circuit.db.pcb_solder_paste.list()).toHaveLength(18)
  for (const [index, pad] of pads.entries()) {
    const margin = margins[Math.floor(index / shapes.length)]!
    const paste = circuit.db.pcb_solder_paste.getWhere({
      pcb_smtpad_id: pad.pcb_smtpad_id,
    })!
    expect(paste.shape).toBe(shapes[index % shapes.length]!.shape)
    if (paste.shape === "circle") {
      expect(paste.radius).toBeCloseTo(0.5 + margin)
    } else if (paste.shape === "polygon") {
      const xs = paste.points.map((point) => point.x)
      const ys = paste.points.map((point) => point.y)
      expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(2 + 2 * margin)
      expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(1 + 2 * margin)
    } else {
      expect(paste.width).toBeCloseTo(2 + 2 * margin)
      expect(paste.height).toBeCloseTo(1 + 2 * margin)
    }
  }
  await expect(circuit).toMatchPcbSnapshot(import.meta.path, {
    width: 1200,
    height: 600,
    showSolderPaste: true,
  })
})

test.failing(
  "all six SMT pad shapes retain explicit solderpaste_margin metadata",
  () => {
    expect(
      circuit.db.pcb_smtpad.list().map((pad) => pad.solderpaste_margin),
    ).toEqual(margins.flatMap((margin) => shapes.map(() => margin)))
  },
)
