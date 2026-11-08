import { catalogue } from './data'
import type { Grocery, Section } from './types'

export type VoiceChange = { action: 'add'|'remove'|'change'|'complete'; name: string; quantity?: number; unit?: string; section?: Section }
const numbers: Record<string,number> = { a:1, an:1, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10 }
const units = ['packs','pack','cartons','carton','tins','tin','bags','bag','bottles','bottle','loaves','loaf']

function productName(raw:string) {
  return raw.trim().replace(/^(add|and)\s+/,'').replace(/[.,]$/,'').replace(/^(?:a|an|one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:packs?|cartons?|tins?|bags?|bottles?|loaves?)\s+of\s+/,'').trim()
}

export function parseVoiceCommand(transcript: string): VoiceChange[] {
  const text = transcript.toLowerCase().trim()
  if (!text) return []
  const remove = text.match(/^remove\s+(.+)$/)
  if (remove) return [{action:'remove',name:productName(remove[1])}]
  const change = text.match(/^change\s+(.+?)\s+to\s+(\w+)(?:\s+(\w+))?$/)
  if (change) return [{action:'change',name:productName(change[1]),quantity:numbers[change[2]] || Number(change[2]) || 1,unit:change[3]}]
  const complete = text.match(/^mark\s+(.+?)\s+as\s+(?:already\s+)?bought$/)
  if (complete) return [{action:'complete',name:productName(complete[1])}]
  return text.replace(/^add\s+/,'').split(/,|\s+and\s+/).map(part => {
    const words=part.trim().split(/\s+/)
    const quantity=numbers[words[0]] || Number(words[0]) || 1
    const unitIndex=units.includes(words[1]) ? 1 : -1
    const name=productName(part)
    const match=catalogue.find(c=>c.name.toLowerCase()===name)
    return {action:'add' as const,name:match?.name || name,quantity,unit:unitIndex===1?words[1]:undefined,section:match?.section}
  }).filter(change=>change.name)
}

export function applyVoiceChanges(items:Grocery[], changes:VoiceChange[], uid:()=>string):Grocery[] {
  let next=[...items]
  for(const change of changes){
    const index=next.findIndex(i=>!i.deletedAt&&i.name.toLowerCase()===change.name.toLowerCase())
    const changedAt=new Date().toISOString()
    if(change.action==='remove' && index>=0) next[index]={...next[index],deletedAt:changedAt,revision:(next[index].revision||0)+1,updatedAt:changedAt}
    else if(change.action==='complete' && index>=0) next[index]={...next[index],done:true,revision:(next[index].revision||0)+1,updatedAt:changedAt}
    else if(change.action==='change' && index>=0) next[index]={...next[index],quantity:change.quantity||1,unit:change.unit||next[index].unit,revision:(next[index].revision||0)+1,updatedAt:changedAt}
    else if(change.action==='add') {
      if(index>=0) next[index]={...next[index],quantity:next[index].quantity+(change.quantity||1),revision:(next[index].revision||0)+1,updatedAt:changedAt}
      else { const id=uid(); next.push({id,syncId:id,name:change.name,section:change.section||'Unknown',quantity:change.quantity||1,unit:change.unit||'',done:false,revision:0,createdAt:changedAt,updatedAt:changedAt,deletedAt:null}) }
    }
  }
  return next
}
