import type { SourceDatasheet } from "circuit-json"
import type { IsolatedCircuit } from "lib/IsolatedCircuit"

export function addSourceDatasheet(
  db: IsolatedCircuit["db"],
  {
    manufacturer_part_number,
    datasheet_pdf_urls,
    description,
  }: Pick<
    SourceDatasheet,
    "manufacturer_part_number" | "datasheet_pdf_urls" | "description"
  >,
) {
  const existing = db.source_datasheet.getWhere({ manufacturer_part_number })
  if (!existing) {
    db.source_datasheet.insert({
      manufacturer_part_number,
      datasheet_pdf_urls: [...new Set(datasheet_pdf_urls)],
      description,
    })
    return
  }

  db.source_datasheet.update(existing.source_datasheet_id, {
    datasheet_pdf_urls: [
      ...new Set([...existing.datasheet_pdf_urls, ...datasheet_pdf_urls]),
    ],
    description: existing.description ?? description,
  })
}
