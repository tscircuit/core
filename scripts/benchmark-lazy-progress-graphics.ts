import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
const repository=resolve(Bun.argv[2] ?? ".")
const destination=Bun.argv[3]!
const { getLazyProgressGraphicsFixture }=await import(pathToFileURL(resolve(repository,"tests/fixtures/get-lazy-progress-graphics-fixture.tsx")).href)
const cases=[]
for(const consumeGraphics of [false,true]) {
  const times:number[]=[]
  let row
  for(let trial=0;trial<4;trial++) {
    const start=performance.now()
    const result=await getLazyProgressGraphicsFixture(consumeGraphics)
    const elapsed=performance.now()-start
    if(result.errors.length || result.traces.length!==1) throw new Error("Native progress fixture did not route")
    if(trial)times.push(elapsed)
    row={consumeGraphics,completedTraces:result.traces.length,errors:result.errors,progressEvents:result.progress.length,previewCalls:result.previews.count,peakRssBytes:process.resourceUsage().maxRSS*1024,repeatedGraphicsReadsStable:result.graphicReads.every((r:{sameObject:boolean})=>r.sameObject),routeSha256:createHash("sha256").update(JSON.stringify(result.traces.map((t:{route:unknown})=>t.route))).digest("hex")}
  }
  times.sort((a,b)=>a-b)
  cases.push({...row,medianMs:times[1],trialsMs:times})
}
const report={scope:"Generated native routing progress; same route geometry, one warmup plus three trials",bun:Bun.version,capacityMeshAutorouterSourceSha256:createHash("sha256").update(readFileSync(resolve(repository,"lib/utils/autorouting/CapacityMeshAutorouter.ts"))).digest("hex"),cases}
await Bun.write(destination,JSON.stringify(report,null,2)+"\n")
console.log(JSON.stringify(report))
