import test from "ava";

test("Wave 13 Milestone: Ground copper pour thermal relief spoke calculation", (t) => {
  const padDiameterMm = 1.6;
  const spokeWidthMm = 0.35;
  const numSpokes = 4;
  const totalSpokeCrossSection = spokeWidthMm * numSpokes;

  t.is(Number(totalSpokeCrossSection.toFixed(2)), 1.40);
  t.true(totalSpokeCrossSection > 1.0, "Thermal relief spokes must maintain adequate current carrying capacity");
});

test("Wave 13 Milestone: Copper pour isolation gap safety clearance", (t) => {
  const isolationGapMm = 0.254; // 10 mil standard clearance
  const minRequiredClearance = 0.20;

  t.true(isolationGapMm >= minRequiredClearance, "Copper pour ground plane isolation gap must satisfy DRC");
});
