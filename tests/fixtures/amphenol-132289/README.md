# Amphenol 132289 edge-mount SMA

This is a real mixed-side component footprint from the [KiCad footprint library](https://github.com/KiCad/kicad-footprints/blob/7ebfa6b23cc292a56f751b7b5f4a0e12eeef69dd/Connector_Coaxial.pretty/SMA_Amphenol_132289_EdgeMount.kicad_mod), pinned at commit `7ebfa6b23cc292a56f751b7b5f4a0e12eeef69dd`. The manufacturer reference is [Amphenol 132289](https://www.amphenolrf.com/132289.html).

The supplied `.kicad_mod` is unmodified. It defines three SMT pads on `F.Cu` (signal pin 1 and two ground pin 2 pads), and two more ground pin 2 pads on `B.Cu`. The front and back ground pads occupy the same XY positions. Their rectangular copper measures 5.08 × 1.5 mm, centered at Y = ±4.25 mm; the signal pad is centered at Y = 0.

The fixture converts the legacy KiCad 5 module to Circuit JSON and loads it through core's normal `kicad:` footprint-library path. Only the legacy module root and zero-valued 3D-model `at` token are normalized for the converter. Pad geometry, numbering, and copper layers are imported unchanged.

The regression renders the SMA on both component layers alongside ordinary 0402 resistor controls. Separate, explicitly titled top/bottom copper views expose the coincident ground pads. It checks the same output with subcircuit caching enabled, including copper, ports, paste, and pad geometry.

The KiCad source is licensed under CC-BY-SA 4.0 with the KiCad Libraries Exception; see [LICENSE.md](LICENSE.md).
