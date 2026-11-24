# Library provenance

KiCad footprint and STEP assets were copied from the local KiCad library installation. Original footprint files and STEP headers are retained. `footprints/provenance.json` maps each derived pad JSON to its library identifier; `models/index.json` maps the models used by the circuit.

The KiCad library contributors provide these assets under [CC BY-SA 4.0 with the KiCad electronic-design exception](https://www.kicad.org/libraries/license/). See the [license terms](https://creativecommons.org/licenses/by-sa/4.0/legalcode.en). The exception allows use of library data in electronic designs; library collections retain their own attribution and licensing requirements. The derived JSON and renderer conversion are local modifications.

The CM5 footprint comes from the [Raspberry Pi CM5IO design files](https://pip.raspberrypi.com/categories/1098-design-files), rather than a generic 200-pin connector. The derived footprint is centered and rotated into this carrier's coordinates; physical pad numbers are retained. Raspberry Pi's original project attribution applies.

The TPS25947 RPW0010A composite footprint is manually transcribed from the [TI datasheet mechanical drawing](https://www.ti.com/lit/ds/symlink/tps25947.pdf). It requires a fabrication land-pattern review before release.

These assets are engineering references, not evidence that a final BOM, solder-mask opening or assembly process has been approved.
