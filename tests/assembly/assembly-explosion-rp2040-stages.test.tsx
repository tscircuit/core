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
    "RP2040_NEMA17.lift-cover",
    "RP2040_NEMA17.remove-bolts",
    "RP2040_NEMA17.separate-motor",
    "RP2040_NEMA17.separate-spacers",
  ])
  // Show the actual fixture TSX, reflowed to fit the image's code column.
  const source = await Bun.file(
    new URL("./fixtures/rp2040-explosion/assembly.source.tsx", import.meta.url),
  ).text()
  const stageBlocks = source.match(
    /^ {6}<assembly\.explosion\.stage\b[\s\S]*?<\/assembly\.explosion\.stage>/gm,
  )!
  const stageCode = (name: string) =>
    stageBlocks
      .find((block) => block.includes(`name="${name}"`))!
      .replace(/^ {6}/gm, "")
      .replace(
        /<assembly\.explosion\.stage\s+([^>]+)>/g,
        (_, attributes: string) =>
          `<assembly.explosion.stage\n${attributes
            .trim()
            .split(/\s+/)
            .map((attribute) => `  ${attribute}`)
            .join("\n")}\n>`,
      )
      .replace(
        /^( *)<assembly\.explosion\.move (targetRef="[^"]+") (offZ=\{[^}]+\}) \/>/gm,
        (_, indent: string, target: string, offset: string) =>
          `${indent}<assembly.explosion.move\n${indent}  ${target}\n${indent}  ${offset}\n${indent}/>`,
      )
      .replace(
        /^( *)targetRefs=\{\[([^\]]+)\]\}/gm,
        (_, indent: string, targets: string) =>
          `${indent}targetRefs={[\n${targets
            .split(", ")
            .map((target) => `${indent}  ${target},`)
            .join("\n")}\n${indent}]}`,
      )
  const instructions = [
    [
      "0. Assembled",
      "<Rp2040MotorAssembly\n  board={<Board />}\n/>",
      "Original routed four-layer PCB, NEMA17, spacers, cover and four M3x35 bolts.",
    ],
    [
      "1. Lift the cover with its bolts",
      stageCode("lift-cover"),
      "The cover and all members of remove-bolts lift 24 mm together. The PCB stays fixed.",
    ],
    [
      "2. Remove bolts - halfway",
      `{/* Playback at 50% */}\n${stageCode("remove-bolts")}`,
      "The bolts rise another 20.5 mm; the already-lifted cover stays in place.",
    ],
    [
      "3. Remove bolts - complete",
      stageCode("remove-bolts"),
      "The bolts finish 41 mm above their lifted pose: 65 mm total, directly above the cover.",
    ],
    [
      "4. Separate the motor",
      stageCode("separate-motor"),
      "The NEMA17 moves down 24 mm; the controller PCB stays fixed.",
    ],
    [
      "5. Separate the spacers",
      stageCode("separate-spacers"),
      "Four hollow spacers move down 12 mm, exposing the complete stack.",
    ],
  ]
  for (const frame of frames.slice(1))
    expect(frame.circuitJson).toEqual(
      getCircuitJsonAssemblyExplosion(json, frame.explosion).circuitJson,
    )
  const poses = [
    frames[0]!.explosion,
    frames[1]!.explosion,
    { ...frames[2]!.explosion, stageProgress: 0.5 },
    frames[2]!.explosion,
    frames[3]!.explosion,
    frames[4]!.explosion,
  ]
  await expectAssemblySnapshot(import.meta.path, {
    title:
      "RP2040 / NEMA17: lift the cover with its bolts, then separate the parts",
    columns: 2,
    font: "legacy",
    panels: poses.map((explosion, i) => ({
      title: instructions[i]![0]!,
      code: instructions[i]![1]!,
      annotation: instructions[i]![2]!,
      // Feed the original assembled instructions to the exporter in every panel.
      circuit: json,
      renderOptions: {
        camPos: [-155, 115, 190],
        poppygl: { lookAt: [-10, 7, 0] },
        gltf: { explosion },
      },
    })),
  })
  expect(json).toEqual(original)
}, 120_000)
