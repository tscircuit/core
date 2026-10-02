# ICS-43434 / C5656610 import fixture

`C5656610.tsx` is the unmodified output of `convertRawEasyToTsx` in
`easyeda@0.0.368`, fetched on 2026-10-03 with `fetchEasyEDAComponent("C5656610",
{ includeModelMetadata: false })`. All source footprint geometry and pin
labels are preserved; formatting follows this repository.

EasyEDA symbol UUID: `bb5ae0d2bf12487ea3dcd0a34e5b28ca`.
LCSC-owned footprint UUID: `9a1bd085c9154f9fa0392ad1d3d15d6d`.
Four polygon copper shapes share pin 3 / GND.

The source's 0.3999992 mm acoustic hole is a separate supplier library
discrepancy: TDK recommends at least 0.50 mm. This fixture reproduces core's
missing PCB connection and does not qualify the footprint for fabrication.

- [Supplier part](https://jlcpcb.com/partdetail/C5656610)
- [TDK DS-000069 v1.2, page 17](https://product.tdk.com/system/files/dam/doc/product/sw_piezo/mic/mems-mic/data_sheet/ds-000069-ics-43434-v1.2.pdf)
