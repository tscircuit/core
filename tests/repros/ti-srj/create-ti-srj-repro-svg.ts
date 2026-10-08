import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import { stackSvgsVertically } from "stack-svgs"

type TiSrjDiagnosticStatus = "fail" | "pass"

const escapeXml = (text: string) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")

const createHeaderSvg = ({
  designName,
  title,
}: {
  designName: string
  title: string
}) => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="78" viewBox="0 0 800 78">
  <rect width="800" height="78" fill="#111827" />
  <text x="28" y="31" fill="#f9fafb" font-family="Arial, sans-serif" font-size="22" font-weight="700">${escapeXml(title)}</text>
  <text x="28" y="57" fill="#93c5fd" font-family="Arial, sans-serif" font-size="14" font-weight="700">REAL TI ${escapeXml(designName)} CIRCUIT JSON</text>
</svg>`

const createDiagnosticSvg = ({
  details,
  status,
  statusText,
}: {
  details: string[]
  status: TiSrjDiagnosticStatus
  statusText: string
}) => {
  const statusColor = status === "pass" ? "#15803d" : "#b91c1c"
  const statusBackground = status === "pass" ? "#dcfce7" : "#fee2e2"
  const height = 98 + details.length * 30
  const detailText = details
    .map(
      (detail, detailIndex) =>
        `<text x="36" y="${104 + detailIndex * 30}" fill="#374151" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="14">${escapeXml(detail)}</text>`,
    )
    .join("\n")

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${height}" viewBox="0 0 800 ${height}">
    <rect width="800" height="${height}" fill="#f8fafc" />
    <rect x="24" y="20" width="752" height="54" rx="10" fill="${statusBackground}" stroke="${statusColor}" stroke-width="2" />
    <circle cx="51" cy="47" r="10" fill="${statusColor}" />
    <text x="76" y="54" fill="${statusColor}" font-family="Arial, sans-serif" font-size="18" font-weight="700">${escapeXml(statusText)}</text>
    ${detailText}
  </svg>`
}

export const createTiSrjReproSvg = ({
  circuitJson,
  designName,
  details,
  status,
  statusText,
  title,
  viewport,
  xRayElementIds,
}: {
  circuitJson: AnyCircuitElement[]
  designName: string
  details: string[]
  status: TiSrjDiagnosticStatus
  statusText: string
  title: string
  viewport?: { minX: number; minY: number; maxX: number; maxY: number }
  xRayElementIds?: readonly string[]
}) => {
  const pcbSvg = convertCircuitJsonToPcbSvg(circuitJson, {
    viewport,
    xRayElementIds,
  })

  return stackSvgsVertically(
    [
      createHeaderSvg({ designName, title }),
      pcbSvg,
      createDiagnosticSvg({ details, status, statusText }),
    ],
    {
      gap: 0,
      normalizeSize: false,
      rootAttributes: {
        "data-testid": `ti-${designName.toLowerCase()}-srj-repro`,
      },
    },
  )
}
