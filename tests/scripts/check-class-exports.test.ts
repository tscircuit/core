import { expect, test } from "bun:test"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  checkClassExports,
  getClassFileExports,
} from "../../scripts/check-class-exports"

test("class export check detects additional exports without flagging utilities or methods", () => {
  const cases: [string, string[]][] = [
    ["export class Diode { helper() {} }", ["Diode"]],
    ["export default class Diode {}", ["default"]],
    ["export abstract class Base {}", ["Base"]],
    ["class Diode {}; export { Diode }", ["Diode"]],
    ["export class Diode {}; export function helper() {}", ["Diode", "helper"]],
    [
      "export class Diode {}; export const helper = () => {}",
      ["Diode", "helper"],
    ],
    [
      "class Diode {}; const helper = () => {}; export { Diode, helper as resolveDiode }",
      ["Diode", "resolveDiode"],
    ],
    ["export class Diode {}; export type Options = {}", ["Diode", "Options"]],
    [
      "export class Diode {}; export interface Options {}",
      ["Diode", "Options"],
    ],
    [
      "export class Diode {}; export { helper } from './helper'",
      ["Diode", "helper"],
    ],
    ["export class Diode {}; export * from './helper'", ["Diode", "*"]],
    [
      "export class Diode {}; export * as helpers from './helper'",
      ["Diode", "helpers"],
    ],
    ["export class Diode {}; export const a = 1, b = 2", ["Diode", "a", "b"]],
    [
      "export class Diode {}; export const { a, nested: { b } } = source",
      ["Diode", "a", "b"],
    ],
    [
      "export const Diode = class {}; export const helper = 1",
      ["Diode", "helper"],
    ],
    ["export default class {}; export const helper = 1", ["default", "helper"]],
    ["export class Diode {}; export default Diode", ["Diode", "default"]],
    ["export class Diode {} // export const fake = 1", ["Diode"]],
    ["export const a = 1; export function helper() {}", []],
    ["export { Diode } from './Diode'; export { helper } from './helper'", []],
    [
      "export class Diode {}; export function helper(x: string): void; export function helper(x: string) {}",
      ["Diode", "helper"],
    ],
  ]
  for (const [source, names] of cases) {
    expect(
      getClassFileExports("fixture.ts", source).map(({ name }) => name),
    ).toEqual(names)
  }

  const root = mkdtempSync(join(tmpdir(), "class-exports-"))
  try {
    mkdirSync(join(root, "lib/nested"), { recursive: true })
    writeFileSync(
      join(root, "lib/nested/Diode.tsx"),
      "export class Diode {}\nexport const helper = () => <div />\n",
    )
    writeFileSync(
      join(root, "lib/utils.ts"),
      "export const a = 1; export const b = 2",
    )
    expect(checkClassExports(root)).toEqual([
      "lib/nested/Diode.tsx:2: Class files must have only one export; found Diode, helper. Move extra exports to a separate module.",
    ])
    writeFileSync(join(root, "lib/nested/Diode.tsx"), "export class Diode {}")
    expect(checkClassExports(root)).toEqual([])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
