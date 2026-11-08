import { test } from "bun:test"
import { join, basename } from "node:path"
import { getTestFixture } from "tests/fixtures/get-test-fixture"

// Vendor files are not redistributed. Set this to the directory containing the
// real TI sn74lvc1g04.ibs and sn65hvd72.ibs files to test [Pin]/[Diff_pin] checks.
export const ibisModelDirectory = process.env.SI_IBIS_MODEL_DIR
export const siTest = ibisModelDirectory ? test : test.skip

export function getSiTestFixture(
  options: Parameters<typeof getTestFixture>[0] = {},
) {
  return getTestFixture({
    ...options,
    platform: ibisModelDirectory
      ? {
          ...options.platform,
          platformFetch: Object.assign(
            async (url: RequestInfo | URL) =>
              new Response(
                await Bun.file(
                  join(ibisModelDirectory, basename(String(url))),
                ).text(),
              ),
            { preconnect() {} },
          ),
        }
      : options.platform,
  })
}
