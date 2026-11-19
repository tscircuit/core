import {readFileSync,writeFileSync,mkdirSync} from "node:fs"
import path from "node:path"
import {createHash} from "node:crypto"
const id=process.env.CIRCUIT!
mkdirSync("export/metrics",{recursive:true})
mkdirSync("export/svgs",{recursive:true})
for(const label of ["base","head"]) {
 const root=path.resolve("results",label)
 const result=JSON.parse(readFileSync(root+"/results.json","utf8"))
 const row=result.cases[0]
 const circuit=JSON.parse(readFileSync(root+"/"+id+"/circuit.json","utf8"))
 const svg=await import(Bun.resolveSync("circuit-to-svg",path.resolve(label)))
 const physical=Object.entries(row.assessment?.findings??{}).filter(([key])=>!["missing_traces","disconnected_ports"].includes(key)).reduce((sum,[,count])=>sum+Number(count),0)
 const metrics={label,circuit:id,coreCommit:result.coreCommit,dependencies:result.dependencies,seconds:row.wallMs/1000,peakRssMb:row.peakRssMb,status:row.status,assessment:row.assessment,physicalFindings:physical,phases:row.progress?.phases,errors:row.progress?.errors,copperSha256:createHash("sha256").update(JSON.stringify(circuit.filter((p:any)=>p.type==="pcb_trace"||p.type==="pcb_via"))).digest("hex")}
 writeFileSync("export/metrics/"+id+"-"+label+".json",JSON.stringify(metrics,null,2))
 writeFileSync("export/svgs/"+id+"-"+label+".svg",await svg.convertCircuitJsonToPcbSvg(circuit,{backgroundColor:"white",width:1400,height:1000,includeVersion:false,renderSolderMask:false,shouldDrawRatsNest:false}))
 console.log("CANONICAL_DDR="+JSON.stringify({...metrics,assessment:row.assessment&&{connectedNets:row.assessment.connectedNets,requestedNets:row.assessment.requestedNets,findings:row.assessment.findings,vias:row.assessment.vias,geometryErrors:row.assessment.geometryErrors}}))
}
