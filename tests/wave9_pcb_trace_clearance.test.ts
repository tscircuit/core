import test from "ava";

test("Wave 9: PCB copper trace minimum safety clearance", (t) => {
  const minClearanceMm = 0.15;
  const calculateEuclideanDist = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  const p1 = { x: 0.0, y: 0.0 };
  const p2 = { x: 0.2, y: 0.0 };
  const p3 = { x: 0.1, y: 0.0 };

  t.true(calculateEuclideanDist(p1.x, p1.y, p2.x, p2.y) >= minClearanceMm);
  t.false(calculateEuclideanDist(p1.x, p1.y, p3.x, p3.y) >= minClearanceMm);
});

test("Wave 9: IC package pin pitch spacing invariants", (t) => {
  const standardPitchMm = 0.5;
  const pinCount = 8;
  const totalSpan = (pinCount - 1) * standardPitchMm;

  t.is(totalSpan, 3.5);
});
