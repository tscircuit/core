# USB-C RP2354B e-paper board

This is the real controller from [rushabhcodes/usb-c-e-paper-display](https://github.com/rushabhcodes/usb-c-e-paper-display/tree/1a7ebab07f146cbdf84a5593a178c2428a96cffa), pinned at `1a7ebab07f146cbdf84a5593a178c2428a96cffa`.

`source/` contains the unchanged PCB entrypoint, controller, authored routing, mechanical PCB datums, reference labels and all 28 imported footprints. `upstream.json` records the original SHA256 of each file; the test verifies them. The upstream MIT license is in `source/LICENSE`. Biome excludes this vendored directory so its original files remain byte-for-byte reproducible.

Two explicit test adapters replace inventory and CAD lookups: `product/supplier-stock.ts` and `product/supplier-solid-model.ts`. They do not modify placement, footprints, nets, vias or traces. The test disables schematic and automatic routing phases to isolate port initialization and avoid unrelated routing metadata issues. It imports no generated copper or Circuit JSON and makes no supplier requests.

The unmodified board fails before PCB rendering: `DISPLAY_INTERCONNECT` cannot find `DISPLAY_BUSY`, because its two `inner2` endpoints were never created. Its 84 through-vias have 168 source ports instead of 336. The fix restores those ports and all seven display-bus source traces. The diagnostic SVG projects the real via positions into board space and colors each marker by its emitted `inner2` source-port availability; markers are annotations, not copper.
