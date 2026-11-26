import {join} from 'node:path'
import {writeFileSync} from 'node:fs'
const router = await import(join(process.cwd(),'node_modules/@tscircuit/capacity-autorouter/dist/index.js'))
const Type = router.AutoroutingPipelineSolver9_PreloadedTraceGraph
if(!Type)throw Error('Missing exact native autorouter export')
const step=Type.prototype.step
Type.prototype.step=function(...args:unknown[]){
 const result=step.apply(this,args)
 if((this.originalSrj?.connections?.length??999)>3)return result
 if(this.originalSrj?.connections?.length===1&&!this.__nativeResetSaved){writeFileSync('../private-native-reset.json',JSON.stringify(this.originalSrj));this.__nativeResetSaved=true}
 const joint=this.pipeline9JointDrcRepairSolver
 const hd=this.highDensityRouteSolver
 const key=JSON.stringify({phase:this.currentPipelineStepIndex,solved:this.solved,failed:this.failed,jointSolved:joint?.solved,jointFailed:joint?.failed})
 if(key!==this.__nativeFinalDiagnostic){
  this.__nativeFinalDiagnostic=key
  const stats=Object.fromEntries(Object.entries(joint?.stats??{}).filter(([name,value])=>typeof value==='number'||typeof value==='boolean'))
  console.log('FINAL_AR_STATE='+JSON.stringify({...JSON.parse(key),stage:this.pipelineDef[this.currentPipelineStepIndex]?.solverName,active:this.activeSubSolver?.constructor?.name,hdStats:Object.fromEntries(Object.entries(hd?.stats??{}).filter(([name,value])=>typeof value==='number'||typeof value==='boolean')),stats}))
 }
 return result
}
