import { applyToPoint, compose, scale, translate } from "transformation-matrix"
import type { UsbCEpaperViaPortFixture } from "."
import mechanical from "./source/product/mechanical-layout.json"

/**
 * Diagnostic projection of real board-world via centres in millimetres:
 * +X right, +Y up. SVG pixels use +X right and +Y down. Markers indicate
 * emitted source ports; they do not represent additional PCB copper.
 */
export function renderUsbCEpaperViaPorts(fixture: UsbCEpaperViaPortFixture) {
  const transform = compose(translate(450, 360), scale(8, -8))
  const point = (x: number, y: number) => applyToPoint(transform, { x, y })
  const hasInner2 = (via: UsbCEpaperViaPortFixture["viaPorts"][number]) =>
    via.sourcePorts.some((port) => port.name === "inner2")
  const available = fixture.viaPorts.filter(hasInner2).length
  const portCount = fixture.viaPorts.reduce(
    (count, via) => count + via.sourcePorts.length,
    0,
  )
  const resolvedEndpoints = fixture.viaPorts.filter(
    (via) => fixture.displayEndpoints.includes(via.name) && hasInner2(via),
  ).length
  const outline = mechanical.board_outline_mm
    .map(([x, y]) => {
      const position = point(x, y)
      return `${position.x},${position.y}`
    })
    .join(" ")
  const markers = fixture.viaPorts
    .map((via) => {
      const position = point(via.position.x, via.position.y)
      const color = hasInner2(via) ? "#4ade80" : "#fb7185"
      return `<circle cx="${position.x}" cy="${position.y}" r="4" fill="${color}"><title>${Bun.escapeHTML(via.name)}: ${Bun.escapeHTML(via.sourcePorts.map((port) => port.name).join(", "))}</title></circle>`
    })
    .join("")
  const status = fixture.renderError
    ? "BLOCKED before PCB render"
    : "PASS: display bus resolves"
  const color = fixture.renderError ? "#fb7185" : "#4ade80"
  const busy = fixture.viaPorts.find((via) => via.name === "BUSY_FROM_VIA")!
  const busyPosition = point(busy.position.x, busy.position.y)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="690" viewBox="0 0 900 690">
    <rect width="900" height="690" fill="#141414"/>
    <g fill="#f4f4f4" font-family="sans-serif" text-anchor="middle">
      <text x="450" y="32" font-size="22" font-weight="bold">Real RP2354B USB-C e-paper board: via layer ports</text>
      <text x="450" y="64" font-size="19" fill="${color}">${status}</text>
      <text x="450" y="92" font-size="16">84 vias / 4 layers: ${portCount} of 336 source ports; inner2 available on ${available} of 84 vias</text>
      <text x="450" y="116" font-size="16">Display bus: ${resolvedEndpoints} of 14 inner2 endpoints; 76 components / 42 nets / 100 x 60 mm</text>
      <text x="450" y="646" font-size="15">Markers show emitted inner2 source ports at actual via positions; they are not copper.</text>
      <text x="450" y="672" font-size="14">Pinned board source: rushabhcodes/usb-c-e-paper-display @ 1a7ebab; global autorouting disabled.</text>
    </g>
    <polygon points="${outline}" fill="#090909" stroke="#a3a3a3" stroke-width="2"/>
    ${markers}
    <g fill="#d4d4d4" font-family="sans-serif" font-size="15">
      <text x="54" y="374">J1 USB-C</text>
      <text x="298" y="374">U1 RP2354B</text>
      <text x="696" y="166">J2 panel FPC</text>
      <text x="${busyPosition.x - 76}" y="${busyPosition.y + 30}">BUSY_FROM_VIA</text>
    </g>
  </svg>`
}
