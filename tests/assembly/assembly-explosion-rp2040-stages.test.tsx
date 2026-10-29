import { expect, test } from "bun:test"
import { getAssemblyExplosionFrames } from "circuit-json-to-gltf"
import { getCircuitJsonAssemblyExplosion } from "lib"
import { expectAssemblySnapshot } from "./fixtures/expect-assembly-snapshot"
import { loadRp2040ExplosionFixture } from "./fixtures/rp2040-explosion/load-fixture"

test("the real RP2040 assembly renders assembled and every serialized explosion stage", async () => {
  const json = await loadRp2040ExplosionFixture()
  const original = structuredClone(json)
  const frames = getAssemblyExplosionFrames(json)
  expect(frames.map((frame) => frame.name)).toEqual([
    "Assembled",
    "RP2040_NEMA17.remove-bolts",
    "RP2040_NEMA17.lift-cover",
    "RP2040_NEMA17.separate-motor",
    "RP2040_NEMA17.separate-spacers",
    "RP2040_NEMA17.park-bolts",
  ])
  const instructions = [
    [
      "0. Assembled",
      "<Rp2040MotorAssembly\n  board={<Rp2040MotorController />} />",
      "Original routed four-layer PCB, NEMA17, spacers, cover and four M3x35 bolts.",
    ],
    [
      "1. Remove all four bolts",
      'targetRefs="bolt1,bolt2,bolt3,bolt4"\noffZ={65}',
      "All four bolts lift 65 mm; the cover and PCB stay in place.",
    ],
    [
      "2. Lift the cover",
      'targetRef="cover" offZ={24}',
      "The vented PETG cover and its posts lift together; bolts retain their displacement.",
    ],
    [
      "3. Separate the motor",
      'targetRef="motor" offZ={-24}',
      "The NEMA17 moves downward; the controller PCB stays fixed.",
    ],
    [
      "4. Separate the spacers",
      'targetRefs={["spacer1", "spacer2",\n  "spacer3", "spacer4"]}\noffZ={-12}',
      "Four hollow spacers move down another 12 mm, exposing the stack.",
    ],
    [
      "5. Park the entire bolt stage",
      'targetRef="remove-bolts" offX={24}',
      "All parts targeted by remove-bolts move sideways together, retaining the 65 mm lift.",
    ],
  ]
  for (const frame of frames.slice(1))
    expect(frame.circuitJson).toEqual(
      getCircuitJsonAssemblyExplosion(json, frame.explosion).circuitJson,
    )
  await expectAssemblySnapshot(import.meta.path, {
    title:
      "Real RP2040 / NEMA17: each stage rendered directly from the serialized program",
    columns: 2,
    font: "alphabet",
    panels: frames.map((frame, i) => ({
      title: instructions[i]![0]!,
      code: instructions[i]![1]!,
      annotation: instructions[i]![2]!,
      // Feed the original assembled instructions to the exporter in every panel.
      circuit: json,
      renderOptions: {
        camPos: [-155, 115, 190],
        poppygl: { lookAt: [-10, 7, 0] },
        gltf: { explosion: frame.explosion },
      },
    })),
  })
  expect(json).toEqual(original)
}, 120_000)
