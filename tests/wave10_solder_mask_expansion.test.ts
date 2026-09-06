import test from "ava";

test("Wave 10 Centurion: Solder mask expansion tolerance computation", (t) => {
  const padWidthMm = 1.0;
  const padHeightMm = 2.0;
  const maskExpansionMm = 0.05; // 50um standard expansion

  const maskWidth = padWidthMm + (maskExpansionMm * 2);
  const maskHeight = padHeightMm + (maskExpansionMm * 2);

  t.is(Number(maskWidth.toFixed(2)), 1.10);
  t.is(Number(maskHeight.toFixed(2)), 2.10);
});

test("Wave 10 Centurion: Solder bridge prevention minimum dam width", (t) => {
  const minDamWidthMm = 0.10; // 100um minimum solder bridge web
  const distanceBetweenPads = 0.25;
  const expansion = 0.05;
  const effectiveDam = distanceBetweenPads - (expansion * 2);

  t.is(Number(effectiveDam.toFixed(2)), 0.15);
  t.true(effectiveDam >= minDamWidthMm, "Effective solder dam must prevent solder bridging");
});
