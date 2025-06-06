import { circuit, CircuitBuilder } from "@tscircuit/schematic-match-adapt/lib/builder";
import type { CircuitLayoutJson, Side, PortReference } from "@tscircuit/schematic-match-adapt";

export function circuitBuilderFromLayoutJson(layout: CircuitLayoutJson): CircuitBuilder {
  const C = circuit({ name: "template" });
  for (const box of layout.boxes) {
    const totalPins = box.leftPinCount + box.rightPinCount + box.topPinCount + box.bottomPinCount;
    const isPassive = totalPins === 2;
    const chip = isPassive ? C.passive(box.boxId) : C.chip(box.boxId);
    if (box.leftPinCount) chip.leftpins(box.leftPinCount);
    if (box.rightPinCount) chip.rightpins(box.rightPinCount);
    if (box.topPinCount) chip.toppins(box.topPinCount);
    if (box.bottomPinCount) chip.bottompins(box.bottomPinCount);
    chip.at(box.centerX - chip.getWidth() / 2, box.centerY - chip.getHeight() / 2);
    chip.pinPositionsAreSet = true;
    for (const pin of box.pins) {
      const pb = chip.pin(pin.pinNumber);
      pb.x = pin.x;
      pb.y = pin.y;
    }
  }

  const labelRefMap: Record<string, PortReference> = {};
  for (const path of layout.paths) {
    const fromRef = path.from as PortReference;
    const toRef = path.to as PortReference;
    if ("netLabelId" in path.to) {
      labelRefMap[path.to.netLabelId] = fromRef;
    }
    if ("netLabelId" in path.from) {
      labelRefMap[path.from.netLabelId] = toRef;
    }
  }

  for (const nl of layout.netLabels) {
    C.addNetLabel({
      netId: nl.netId,
      x: nl.x,
      y: nl.y,
      anchorSide: nl.anchorPosition as Side,
      fromRef: labelRefMap[nl.netLabelId]!,
    });
  }

  let pathCounter = 1;
  for (const path of layout.paths) {
    const start = path.points[0]!;
    const end = path.points[path.points.length - 1]!;
    C.lines.push({
      start: { x: start.x, y: start.y, ref: path.from as PortReference },
      end: { x: end.x, y: end.y, ref: path.to as PortReference },
      pathId: `PATH${pathCounter++}`,
    });
  }

  return C;
}
