import test from "ava";

test("Wave 7: SMD IC footprint pin pitch clearance calculation", (t) => {
  const pinPitchMm = 0.5; // 0.5mm QFP/QFN pitch
  const pinWidthMm = 0.22;
  const pinClearance = pinPitchMm - pinWidthMm;

  t.is(Number(pinClearance.toFixed(2)), 0.28);
  t.true(pinClearance > 0.15, "Clearance must exceed standard PCB fabrication threshold of 0.15mm");
});

test("Wave 7: Trace-to-pad annular ring safety margin", (t) => {
  const padDiameter = 1.6;
  const drillDiameter = 0.8;
  const annularRingWidth = (padDiameter - drillDiameter) / 2;

  t.is(annularRingWidth, 0.4);
  t.true(annularRingWidth >= 0.2, "Annular ring must satisfy minimum DRC safety margin");
});
