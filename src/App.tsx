import { useEffect, useMemo, useRef, useState } from 'react'
import { Archive, ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, CloudOff, Copy, Heart, MapPin, Mic, Minus, Moon, MoreHorizontal, Plus, RotateCcw, Search, Settings2, ShoppingBasket, Sparkles, Store as StoreIcon, Sun, Trash2, UserPlus, Users, Wifi, WifiOff, X } from 'lucide-react'
import { catalogue, sections, starterItems, stores } from './data'
import type { AppState, AuthSession, Grocery, Section, ShoppingList, Store, SyncState } from './types'
import { loadDurableState, saveDurableState, validateState } from './storage'
import { backendConfigured, requestPasswordReset, restoreSession, signIn, signOut, signUp } from './auth'
import { flushQueue, pendingCount, pullRemote, queueSnapshot } from './sync'
import { applyVoiceChanges, parseVoiceCommand, type VoiceChange } from './voice'
import version from '../version.json'

type Tab = 'lists' | 'stores' | 'plan' | 'household'
type Sheet = 'store' | 'item' | 'correction' | 'listmenu' | 'about' | null
const uid = () => crypto.randomUUID()

const initialState: AppState = {
  lists: [{ id:'weekly', name:'Weekly shop', storeId:'tesco-hackney', items:starterItems, updatedAt:Date.now() }],
  activeListId:'weekly', corrections:{}, favouriteStores:['tesco-hackney','aldi-dalston']
}

function loadState(): AppState {
  try { return validateState(JSON.parse(localStorage.getItem('smartshop-state-v1') || 'null')) || initialState } catch { return initialState }
}

const sectionIcons: Record<Section,string> = { 'Produce':'🥬','Bakery':'🥖','Meat & fish':'🐟','Dairy & eggs':'🥛','Cupboard':'🥫','Drinks':'🫧','Household':'🧻','Frozen':'❄️','Unknown':'?' }

export default function App() {
  const [state,setState] = useState<AppState>(loadState)
  const [tab,setTab] = useState<Tab>('lists')
  const [shopping,setShopping] = useState(false)
  const [sheet,setSheet] = useState<Sheet>(null)
  const [dark,setDark] = useState(() => localStorage.getItem('smartshop-theme') === 'dark')
  const [toast,setToast] = useState<{text:string;undo?:()=>void}|null>(null)
  const [selectedItem,setSelectedItem] = useState<Grocery|null>(null)
  const [query,setQuery] = useState('')
  const [showCompleted,setShowCompleted] = useState(false)
  const [storeQuery,setStoreQuery] = useState('')
  const [planStep,setPlanStep] = useState(0)
  const [planAnswers,setPlanAnswers] = useState<string[]>(['','','',''])
  const [storageReady,setStorageReady] = useState(false)
  const [saved,setSaved] = useState(false)
  const [online,setOnline] = useState(navigator.onLine)
  const [voiceOpen,setVoiceOpen] = useState(false)
  const [session,setSession] = useState<AuthSession|null>(null)
  const [syncState,setSyncState] = useState<SyncState>('local')
  const [authReady,setAuthReady] = useState(false)
  const syncTimer = useRef<number|undefined>(undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadDurableState(initialState).then(value=>{setState(value);setStorageReady(true);setSaved(true)}).catch(()=>{setStorageReady(true);setSaved(false)}) },[])
  useEffect(() => { if(!storageReady)return; setSaved(false); saveDurableState(state).then(()=>setSaved(true)).catch(()=>setSaved(false)) },[state,storageReady])
  useEffect(() => { const update=()=>setOnline(navigator.onLine); addEventListener('online',update);addEventListener('offline',update);return()=>{removeEventListener('online',update);removeEventListener('offline',update)} },[])
  useEffect(() => { document.documentElement.dataset.theme = dark?'dark':'light'; localStorage.setItem('smartshop-theme',dark?'dark':'light') },[dark])
  useEffect(() => { if (!toast) return; const id=setTimeout(()=>setToast(null),4500); return()=>clearTimeout(id) },[toast])
  useEffect(() => { restoreSession().then(value=>{setSession(value);setAuthReady(true)}).catch(()=>setAuthReady(true)) },[])

  const activeList = state.lists.find(l=>l.id===state.activeListId&&!l.deletedAt) || state.lists.find(l=>!l.deletedAt)
  const activeStore = stores.find(s=>s.id===activeList?.storeId) || stores[0]
  const correctedSection = (item:Grocery):Section => state.corrections[activeStore.id]?.[item.name] || item.section
  const sortedItems = useMemo(() => activeList ? activeList.items.filter(item=>!item.deletedAt).sort((a,b)=>activeStore.route.indexOf(correctedSection(a))-activeStore.route.indexOf(correctedSection(b))) : [],[activeList,state.corrections,activeStore])
  const liveItems=activeList?.items.filter(item=>!item.deletedAt)||[]
  const remaining=liveItems.filter(i=>!i.done).length
  const progress=liveItems.length ? Math.round((liveItems.filter(i=>i.done).length/liveItems.length)*100) : 0

  const runSync=async(current=session)=>{
    if(!current)return
    if(!navigator.onLine){setSyncState('offline');return}
    setSyncState('syncing')
    try{
      const pushed=await flushQueue(current)
      if(pushed.conflict){setSyncState('conflict');return}
      const remote=await pullRemote(current,state)
      setState(remote)
      setSyncState(pushed.pending?'attention':'synced')
    }catch{setSyncState('attention')}
  }
  useEffect(()=>{
    if(!storageReady||!session||syncState==='syncing')return
    window.clearTimeout(syncTimer.current)
    syncTimer.current=window.setTimeout(()=>{queueSnapshot(session.user.id,state).then(()=>{setSyncState(navigator.onLine?'pending':'offline');return runSync(session)}).catch(()=>setSyncState('attention'))},500)
    return()=>window.clearTimeout(syncTimer.current)
  // State changes are deliberately queued as durable, idempotent snapshots.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[state,storageReady,session])
  useEffect(()=>{if(!session)return;pendingCount(session.user.id).then(count=>setSyncState(count?(navigator.onLine?'pending':'offline'):'synced'))},[session])

  const updateList=(fn:(l:ShoppingList)=>ShoppingList)=>setState(s=>({...s,lists:s.lists.map(l=>l.id===s.activeListId?{...fn(l),revision:(l.revision||0)+1,updatedAt:Date.now()}:l)}))
  const updateItem=(id:string,patch:Partial<Grocery>)=>updateList(l=>({...l,items:l.items.map(i=>i.id===id?{...i,...patch,revision:(i.revision||0)+1,updatedAt:new Date().toISOString()}:i)}))
  const addItem=(name:string,section?:Section)=>{
    const clean=name.trim(); if(!clean)return
    const match=catalogue.find(c=>c.name.toLowerCase()===clean.toLowerCase())
    const existing=activeList?.items.find(i=>!i.deletedAt&&i.name.toLowerCase()===clean.toLowerCase()&&!i.done)
    if(existing){ updateItem(existing.id,{quantity:existing.quantity+1}); setToast({text:`Added another ${existing.name.toLowerCase()}`}); }
    else { const id=uid(); updateList(l=>({...l,updatedAt:Date.now(),items:[...l.items,{id,syncId:id,name:match?.name||clean,section:section||match?.section||'Unknown',quantity:1,unit:'',done:false,revision:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),deletedAt:null}]})) }
    setQuery(''); setSheet(null); setTimeout(()=>inputRef.current?.focus(),50)
  }
  const toggleDone=(item:Grocery)=>{ updateItem(item.id,{done:!item.done}); setToast({text:item.done?`${item.name} restored`:`${item.name} checked off`,undo:()=>updateItem(item.id,{done:item.done})}) }
  const deleteItem=(item:Grocery)=>{ updateItem(item.id,{deletedAt:new Date().toISOString()}); setSheet(null); setToast({text:`Removed ${item.name}`,undo:()=>updateItem(item.id,{deletedAt:null})}) }
  const setStore=(store:Store)=>{ updateList(l=>({...l,storeId:store.id,updatedAt:Date.now()})); setSheet(null); setToast({text:`List reordered for ${store.branch}`}) }
  const correctItem=(section:Section)=>{ if(!selectedItem)return; setState(s=>({...s,corrections:{...s.corrections,[activeStore.id]:{...(s.corrections[activeStore.id]||{}),[selectedItem.name]:section}}})); setSheet(null); setToast({text:`${selectedItem.name} moved to ${section}`}) }
  const newList=()=>{ const id=uid(); const next={id,syncId:id,name:'New shopping list',storeId:activeStore.id,items:[],updatedAt:Date.now(),revision:0,createdAt:new Date().toISOString(),deletedAt:null}; setState(s=>({...s,lists:[...s.lists,next],activeListId:id})); setTab('lists') }

  if(!activeList) return <div className="empty-app"><ShoppingBasket/><h1>SmartShop</h1><button onClick={newList}>Create your first list</button></div>

  return <div className={shopping?'shopping-root':'app-shell'}>
    {shopping ? <ShoppingMode list={activeList} store={activeStore} items={sortedItems} remaining={remaining} progress={progress} correctedSection={correctedSection} onBack={()=>setShopping(false)} onToggle={toggleDone} onAdd={()=>{setSelectedItem(null);setSheet('item')}} onEdit={i=>{setSelectedItem(i);setSheet('item')}} onCorrect={i=>{setSelectedItem(i);setSheet('correction')}} showCompleted={showCompleted} setShowCompleted={setShowCompleted} /> : <>
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><ShoppingBasket size={21}/></div><span>SmartShop</span></div>
      <nav>{navItems.map(n=><button key={n.id} className={tab===n.id?'active':''} onClick={()=>setTab(n.id)}>{n.icon}<span>{n.label}</span>{n.id==='lists'&&<b>{state.lists.filter(l=>!l.archived&&!l.deletedAt).length}</b>}</button>)}</nav>
      <div className="sidebar-foot"><div className="avatar">SF</div><div><strong>Simeon</strong><span>v{version.applicationVersion} · build {version.buildNumber}</span></div><button aria-label="Open Settings and what's new" onClick={()=>setSheet('about')}><Settings2 size={19}/></button></div>
    </aside>

    <main>
      <header className="topbar">
        <div className="mobile-brand"><div className="brand-mark"><ShoppingBasket size={19}/></div><strong>SmartShop</strong></div>
        <div className="connection" role="status" aria-live="polite">{online?<Wifi size={14}/>:<WifiOff size={14}/>}<span>{!storageReady?'Loading saved lists…':!saved?'Saving changes…':syncState==='syncing'?'Synchronising…':syncState==='synced'?'All changes synchronised':syncState==='pending'?'Waiting to synchronise':syncState==='attention'?'Synchronisation needs attention':syncState==='conflict'?'Conflict requires review':!online?'Offline — saved on this phone':'Saved on this phone'}</span>{(syncState==='attention'||syncState==='conflict')&&<button onClick={()=>runSync()}>Retry</button>}</div>
        <div className="top-actions"><button aria-label="Change colour theme" onClick={()=>setDark(!dark)}>{dark?<Sun/>:<Moon/>}</button><button aria-label="Open Settings and what's new" onClick={()=>setSheet('about')}><Settings2/></button></div>
      </header>
      {tab==='lists'&&<ListsPage state={state} list={activeList} store={activeStore} items={sortedItems} remaining={remaining} progress={progress} correctedSection={correctedSection} query={query} setQuery={setQuery} inputRef={inputRef} addItem={addItem} toggleDone={toggleDone} selectItem={i=>{setSelectedItem(i);setSheet('item')}} chooseStore={()=>setSheet('store')} startShopping={()=>setShopping(true)} newList={newList} setState={setState} openMenu={()=>setSheet('listmenu')} openVoice={()=>setVoiceOpen(true)} />}
      {tab==='stores'&&<StoresPage current={activeStore} favourites={state.favouriteStores} choose={setStore} query={storeQuery} setQuery={setStoreQuery} toggleFavourite={id=>setState(s=>({...s,favouriteStores:s.favouriteStores.includes(id)?s.favouriteStores.filter(x=>x!==id):[...s.favouriteStores,id]}))} />}
      {tab==='plan'&&<PlanPage step={planStep} setStep={setPlanStep} answers={planAnswers} setAnswers={setPlanAnswers} generate={()=>{['Broccoli','Basmati rice','Greek yoghurt','Bin bags'].forEach(x=>addItem(x));setTab('lists');setToast({text:'Plan added 4 items to your list'})}}/>}
      {tab==='household'&&<HouseholdPage />}
    </main>
    <BottomNav tab={tab} setTab={setTab} />
    </>}
    {sheet==='store'&&<StoreSheet active={activeStore} query={storeQuery} setQuery={setStoreQuery} choose={setStore} close={()=>setSheet(null)}/>} 
    {sheet==='item'&&<ItemSheet item={selectedItem} query={query} setQuery={setQuery} addItem={addItem} update={updateItem} remove={deleteItem} close={()=>{setSheet(null);setSelectedItem(null)}}/>}
    {sheet==='correction'&&selectedItem&&<CorrectionSheet item={selectedItem} current={correctedSection(selectedItem)} correct={correctItem} close={()=>setSheet(null)}/>} 
    {sheet==='listmenu'&&<ListMenu list={activeList} close={()=>setSheet(null)} rename={name=>{updateList(l=>({...l,name}));setSheet(null)}} duplicate={()=>{const id=uid();setState(s=>({...s,lists:[...s.lists,{...activeList,id,syncId:crypto.randomUUID(),name:`${activeList.name} copy`,items:activeList.items.filter(i=>!i.deletedAt).map(i=>({...i,id:uid(),syncId:crypto.randomUUID(),done:false,revision:0})),revision:0,updatedAt:Date.now()}],activeListId:id}));setSheet(null)}} archive={()=>{setState(s=>({...s,lists:s.lists.map(l=>l.id===activeList.id?{...l,archived:true}:l),activeListId:s.lists.find(l=>l.id!==activeList.id&&!l.archived&&!l.deletedAt)?.id||s.activeListId}));setSheet(null);setToast({text:'List archived'})}} remove={()=>{setState(s=>({...s,lists:s.lists.map(l=>l.id===activeList.id?{...l,deletedAt:new Date().toISOString(),revision:(l.revision||0)+1}:l),activeListId:s.lists.find(l=>l.id!==activeList.id&&!l.deletedAt)?.id||''}));setSheet(null)}}/>}
    {sheet==='about'&&<WhatsNew close={()=>setSheet(null)} session={session} authReady={authReady} syncState={syncState} onSession={value=>{setSession(value);if(value)runSync(value)}} onSignOut={async()=>{if(session)await signOut(session);setSession(null);setSyncState('local')}}/>} 
    {voiceOpen&&<VoiceSheet items={activeList.items.filter(item=>!item.deletedAt)} close={()=>setVoiceOpen(false)} commit={changes=>{updateList(l=>({...l,updatedAt:Date.now(),items:applyVoiceChanges(l.items,changes,uid)}));setVoiceOpen(false);setToast({text:`Applied ${changes.length} voice change${changes.length===1?'':'s'}`})}}/>}
    {toast&&<div className="toast"><CheckCircle2 size={18}/><span>{toast.text}</span>{toast.undo&&<button onClick={()=>{toast.undo?.();setToast(null)}}>Undo</button>}<button className="toast-x" onClick={()=>setToast(null)}><X size={16}/></button></div>}
  </div>
}

const navItems=[{id:'lists' as Tab,label:'Lists',icon:<ClipboardList/>},{id:'stores' as Tab,label:'Stores',icon:<StoreIcon/>},{id:'plan' as Tab,label:'Plan',icon:<Sparkles/>},{id:'household' as Tab,label:'Household',icon:<Users/>}]

function BottomNav({tab,setTab}:{tab:Tab,setTab:(t:Tab)=>void}){return <nav className="bottom-nav">{navItems.map(n=><button key={n.id} className={tab===n.id?'active':''} onClick={()=>setTab(n.id)}>{n.icon}<span>{n.label}</span></button>)}</nav>}

function WhatsNew({close,session,authReady,syncState,onSession,onSignOut}:{close:()=>void;session:AuthSession|null;authReady:boolean;syncState:SyncState;onSession:(session:AuthSession|null)=>void;onSignOut:()=>Promise<void>}){
  const releaseLabel = version.releaseChannel === 'stable' ? 'Stable release' : `${version.releaseChannel[0].toUpperCase()}${version.releaseChannel.slice(1)} preview`
  return <SheetFrame close={close} title="What's new">
    <div className="version-hero"><div><span>{releaseLabel}</span><h3>SmartShop {version.applicationVersion}</h3><p>Build {version.buildNumber} · Released {new Date(`${version.buildDate}T00:00:00`).toLocaleDateString(undefined,{day:'numeric',month:'long',year:'numeric'})}</p></div><Settings2/></div>
    <div className="release-section"><h4>New in this version</h4><ul>{version.importantAdditions.map(item=><li key={item}>{item}</li>)}</ul></div>
    <div className="release-section"><h4>Important fixes</h4><ul>{version.importantFixes.map(item=><li key={item}>{item}</li>)}</ul></div>
    <div className="release-section limitations"><h4>Known limitations</h4><ul>{version.knownLimitations.map(item=><li key={item}>{item}</li>)}</ul></div>
    <div className="version-meta"><span>Storage format {version.storageSchemaVersion}</span><span>Compatible from format {version.minimumCompatibleDataVersion}</span></div>
    <AccountPanel session={session} ready={authReady} syncState={syncState} onSession={onSession} onSignOut={onSignOut}/>
  </SheetFrame>
}

function AccountPanel({session,ready,syncState,onSession,onSignOut}:{session:AuthSession|null;ready:boolean;syncState:SyncState;onSession:(session:AuthSession|null)=>void;onSignOut:()=>Promise<void>}){
  const [mode,setMode]=useState<'signin'|'signup'|'reset'>('signin')
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [message,setMessage]=useState('')
  const [busy,setBusy]=useState(false)
  const submit=async()=>{setBusy(true);setMessage('');try{
    if(mode==='reset'){await requestPasswordReset(email);setMessage('Password-reset instructions have been requested.');return}
    const next=mode==='signup'?await signUp(email,password):await signIn(email,password)
    if(next){onSession(next);setMessage('Signed in. Existing local lists are being attached to this account.')}else setMessage('Check your email to confirm the account, then sign in. Your local lists remain on this phone.')
  }catch(error){setMessage(error instanceof Error?error.message:'The account request failed.')}finally{setBusy(false)}}
  return <section className="account-panel"><h4>Account and synchronisation</h4>{!backendConfigured?<div className="account-notice"><strong>Account setup required</strong><p>Local lists continue to work. Add the browser-safe Supabase variables described in the setup guide to enable real accounts.</p></div>:!ready?<p>Restoring your session…</p>:session?<><div className="signed-in"><div><strong>{session.user.email}</strong><span>{syncState==='synced'?'All changes synchronised':'Your local lists are preserved while sync completes.'}</span></div><button onClick={onSignOut}>Sign out</button></div></>:<><div className="auth-tabs"><button className={mode==='signin'?'active':''} onClick={()=>setMode('signin')}>Sign in</button><button className={mode==='signup'?'active':''} onClick={()=>setMode('signup')}>Create account</button></div><p className="auth-message">Signing in can attach the lists already saved on this phone to your account; they will remain on the phone too.</p><label>Email<input type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)}/></label>{mode!=='reset'&&<label>Password<input type="password" autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={event=>setPassword(event.target.value)}/></label>}<button className="primary" disabled={busy||!email||(mode!=='reset'&&password.length<6)} onClick={submit}>{busy?'Please wait…':mode==='signup'?'Create account and sync local lists':mode==='reset'?'Request reset':'Sign in and sync local lists'}</button><button className="link-button" onClick={()=>setMode(mode==='reset'?'signin':'reset')}>{mode==='reset'?'Back to sign in':'Forgot password?'}</button></>}{message&&<p role="status" className="auth-message">{message}</p>}</section>
}

type ListsProps={state:AppState;list:ShoppingList;store:Store;items:Grocery[];remaining:number;progress:number;correctedSection:(i:Grocery)=>Section;query:string;setQuery:(q:string)=>void;inputRef:React.RefObject<HTMLInputElement|null>;addItem:(n:string)=>void;toggleDone:(i:Grocery)=>void;selectItem:(i:Grocery)=>void;chooseStore:()=>void;startShopping:()=>void;newList:()=>void;setState:React.Dispatch<React.SetStateAction<AppState>>;openMenu:()=>void;openVoice:()=>void}
function ListsPage(p:ListsProps){
  const [filter,setFilter]=useState('All')
  const suggestions=p.query?catalogue.filter(c=>c.name.toLowerCase().includes(p.query.toLowerCase())).slice(0,5):[]
  const visible=p.items.filter(i=>filter==='All'||(filter==='To buy'&&!i.done)||(filter==='Done'&&i.done)).filter(i=>i.name.toLowerCase().includes(p.query.toLowerCase())||!p.query)
  const grouped=p.store.route.map(section=>({section,items:visible.filter(i=>p.correctedSection(i)===section)})).filter(g=>g.items.length)
  return <div className="page lists-page">
    <div className="page-title-row"><div><span className="eyebrow">My lists</span><h1>{p.list.name}</h1></div><div className="title-actions"><button className="icon-button" onClick={p.openMenu} aria-label="List actions"><MoreHorizontal/></button><button className="primary desktop-create" onClick={p.newList}><Plus/>New list</button></div></div>
    <div className="list-switcher">{p.state.lists.filter(l=>!l.archived&&!l.deletedAt).map(l=><button key={l.id} className={l.id===p.list.id?'active':''} onClick={()=>p.setState(s=>({...s,activeListId:l.id}))}><span>{l.name}</span><b>{l.items.filter(i=>!i.done&&!i.deletedAt).length}</b></button>)}<button className="add-list" onClick={p.newList}><Plus size={17}/></button></div>
    <section className="route-card">
      <button className="store-choice" onClick={p.chooseStore}><div className="store-logo">{p.store.chain[0]}</div><div><small>SHOPPING AT</small><strong>{p.store.branch}</strong><span>{p.store.chain} · {p.store.postcode}</span></div><ChevronRight/></button>
      <div className="route-meta"><span className={`evidence ${p.store.status.toLowerCase()}`}><i/>{p.store.status} layout</span><span>Updated {p.store.confirmed}</span></div>
      <div className="route-ribbon">{p.store.route.slice(0,7).map((s,i)=><div key={s} title={s}><i className={visible.some(x=>p.correctedSection(x)===s)?'has-items':''}>{sectionIcons[s]}</i>{i<p.store.route.length-1&&<span/>}</div>)}</div>
      <div className="route-caption"><strong>Your route is ready</strong><span>{p.store.route.filter(s=>visible.some(i=>p.correctedSection(i)===s)).length} sections · sorted for this branch</span></div>
    </section>
    <div className="quick-add">
      <div className="add-input"><Search/><input ref={p.inputRef} value={p.query} onChange={e=>p.setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')p.addItem(p.query)}} placeholder="Add milk, bananas, bread…"/><button className="voice-button" aria-label="Add items by voice" onClick={p.openVoice}><Mic/></button><button aria-label="Add typed item" disabled={!p.query} onClick={()=>p.addItem(p.query)}><Plus/></button></div>
      {suggestions.length>0&&<div className="suggestions">{suggestions.map(s=><button key={s.name} onClick={()=>p.addItem(s.name)}><span>{sectionIcons[s.section]}</span><div><strong>{s.name}</strong><small>{s.section}</small></div><Plus/></button>)}<button onClick={()=>p.addItem(p.query)}><span className="custom-plus"><Plus/></span><div><strong>Add “{p.query}”</strong><small>Custom item</small></div></button></div>}
    </div>
    <div className="list-tools"><div className="segmented">{['All','To buy','Done'].map(x=><button className={filter===x?'active':''} onClick={()=>setFilter(x)} key={x}>{x}</button>)}</div></div>
    {grouped.length? <div className="groups">{grouped.map(g=><section className="item-group" key={g.section}><header><div><span>{sectionIcons[g.section]}</span><strong>{g.section}</strong></div><small>{g.items.filter(i=>!i.done).length} to get</small></header>{g.items.map(item=><div className={`grocery-row ${item.done?'done':''}`} key={item.id}><button className="check" aria-label={`Mark ${item.name} ${item.done?'not purchased':'purchased'}`} onClick={()=>p.toggleDone(item)}>{item.done&&<Check/>}</button><button className="item-main" onClick={()=>p.selectItem(item)}><strong>{item.name}</strong><span>{item.quantity} {item.unit}{item.note?` · ${item.note}`:''}</span></button>{item.favourite&&<Heart className="fav" fill="currentColor"/>}<button className="row-more" onClick={()=>p.selectItem(item)}><MoreHorizontal/></button></div>)}</section>)}</div>:<div className="empty-state"><div>🧺</div><h2>{p.list.items.length?'Nothing matches':'Your basket is waiting'}</h2><p>{p.list.items.length?'Try another filter or search.':'Add your first item above. We’ll put it in the right place.'}</p></div>}
    <div className="shop-dock"><div className="progress-ring" style={{'--p':`${p.progress*3.6}deg`} as React.CSSProperties}><span>{p.remaining}</span></div><div><strong>{p.remaining===0?'All done!':`${p.remaining} item${p.remaining===1?'':'s'} left`}</strong><span>{p.store.branch}</span></div><button className="primary" onClick={p.startShopping} disabled={!p.list.items.length}><ShoppingBasket/>Start shopping</button></div>
  </div>
}

function StoresPage({current,favourites,choose,query,setQuery,toggleFavourite}:{current:Store;favourites:string[];choose:(s:Store)=>void;query:string;setQuery:(s:string)=>void;toggleFavourite:(id:string)=>void}){
  const filtered=stores.filter(s=>`${s.chain} ${s.branch} ${s.postcode}`.toLowerCase().includes(query.toLowerCase()))
  return <div className="page"><div className="page-title-row"><div><span className="eyebrow">Store finder</span><h1>Choose your route</h1><p>These branches and route orders are estimated demonstration data. They are not community verified and do not indicate product availability.</p></div></div><div className="hero-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search chain, branch or postcode"/></div><div className="store-grid">{filtered.map(s=><article className={`store-card ${s.id===current.id?'selected':''}`} key={s.id}><div className="store-card-top"><div className="store-logo lg">{s.chain[0]}</div><button aria-label={`${favourites.includes(s.id)?'Remove':'Add'} ${s.branch} ${favourites.includes(s.id)?'from':'to'} favourites`} className="heart-btn" onClick={()=>toggleFavourite(s.id)}><Heart fill={favourites.includes(s.id)?'currentColor':'none'}/></button></div><h3>{s.branch}</h3><p>{s.chain} · {s.postcode}</p><div className="store-stats"><span className="evidence example"><i/>Example layout</span><span>Not community verified</span></div><div className="mini-route">{s.route.slice(0,6).map(x=><span key={x}>{sectionIcons[x]}</span>)}</div><button className={s.id===current.id?'selected-button':'outline'} onClick={()=>choose(s)}>{s.id===current.id?<><Check/>Current store</>:<>Use this store<ArrowRight/></>}</button></article>)}</div></div>
}

const planQuestions=[{icon:'🍽️',title:'What are you planning to eat?',copy:'Add meals or ingredients. Keep it loose—we’ll tidy the list.',placeholder:'e.g. pasta night, veggie curry…',chips:['Pasta night','Tacos','Sunday roast']},{icon:'👥',title:'How many are you shopping for?',copy:'We’ll use this to suggest sensible quantities.',placeholder:'e.g. 2 adults, 1 child',chips:['Just me','2 people','Family of 4']},{icon:'🥣',title:'What is running low?',copy:'Think breakfast, staples and everyday essentials.',placeholder:'e.g. coffee, oats, washing liquid…',chips:['Breakfast basics','Fruit & veg','Cleaning']},{icon:'🏠',title:'Anything already at home?',copy:'We won’t suggest things you already have.',placeholder:'e.g. rice, onions, olive oil…',chips:['Rice','Pasta','Cooking oil']}]
function PlanPage({step,setStep,answers,setAnswers,generate}:{step:number;setStep:(n:number)=>void;answers:string[];setAnswers:(a:string[])=>void;generate:()=>void}){const q=planQuestions[step];return <div className="page plan-page"><div className="page-title-row"><div><span className="eyebrow">Guided planning</span><h1>Plan your shop</h1><p>A few simple questions. Skip anything that isn’t useful.</p></div></div><div className="plan-progress">{planQuestions.map((_,i)=><span className={i<=step?'active':''} key={i}/>)}</div><section className="question-card"><div className="question-icon">{q.icon}</div><span className="step-label">Question {step+1} of {planQuestions.length}</span><h2>{q.title}</h2><p>{q.copy}</p><textarea value={answers[step]} onChange={e=>{const a=[...answers];a[step]=e.target.value;setAnswers(a)}} placeholder={q.placeholder}/><div className="answer-chips">{q.chips.map(c=><button key={c} onClick={()=>{const a=[...answers];a[step]=a[step]?`${a[step]}, ${c}`:c;setAnswers(a)}}><Plus/>{c}</button>)}</div><div className="question-actions"><button className="text-button" onClick={()=>step<3?setStep(step+1):generate()}>Skip</button><div>{step>0&&<button className="outline" onClick={()=>setStep(step-1)}><ArrowLeft/>Back</button>}<button className="primary" onClick={()=>step<3?setStep(step+1):generate()}>{step<3?<>Continue<ArrowRight/></>:<><Sparkles/>Make my list</>}</button></div></div></section><div className="preference-strip"><Sparkles/><div><strong>Gets smarter over time</strong><span>SmartShop remembers what your household likes—without adding anything you didn’t choose.</span></div></div></div>}

function HouseholdPage(){return <div className="page"><div className="page-title-row"><div><span className="eyebrow">Preview</span><h1>Household sharing</h1><p>This is a future feature. No household activity or cross-phone synchronisation is active yet.</p></div><button className="primary" disabled title="Accounts are not configured"><UserPlus/>Invite unavailable</button></div><div className="info-card"><CloudOff/><div><strong>Lists are private to this phone</strong><p>Supabase browser credentials are not configured, so account and household controls are disabled rather than simulated.</p></div></div></div>}

function ShoppingMode({list,store,items,remaining,progress,correctedSection,onBack,onToggle,onAdd,onEdit,onCorrect,showCompleted,setShowCompleted}:{list:ShoppingList;store:Store;items:Grocery[];remaining:number;progress:number;correctedSection:(i:Grocery)=>Section;onBack:()=>void;onToggle:(i:Grocery)=>void;onAdd:()=>void;onEdit:(i:Grocery)=>void;onCorrect:(i:Grocery)=>void;showCompleted:boolean;setShowCompleted:(v:boolean)=>void}){
 const active=items.filter(i=>!i.done),done=items.filter(i=>i.done); const grouped=store.route.map(s=>({s,items:active.filter(i=>correctedSection(i)===s)})).filter(g=>g.items.length)
 return <div className="shopping-mode"><header><button aria-label="Leave Shopping Mode" onClick={onBack}><ArrowLeft/></button><div><small>SHOPPING AT</small><strong>{store.branch}</strong></div><button aria-label="Add an item" onClick={onAdd}><Plus/></button></header><div className="shopping-progress"><div><strong>{remaining}</strong><span>items left</span></div><div className="progress-track"><span style={{width:`${progress}%`}}/></div><b>{progress}%</b></div><div className="shopping-content"><div className="route-next"><MapPin/><div><small>NEXT UP</small><strong>{grouped[0]?.s||'All sections complete'}</strong></div><span>{grouped.length} sections left</span></div>{grouped.map((g,idx)=><section className="shopping-section" key={g.s}><header><div><span>{sectionIcons[g.s]}</span><div><small>STOP {idx+1}</small><strong>{g.s}</strong></div></div><b>{g.items.length}</b></header>{g.items.map(i=><div className="shopping-item" key={i.id}><button aria-label={`Complete ${i.name}`} className="big-check" onClick={()=>onToggle(i)}><Check/></button><button className="shopping-item-main" onClick={()=>onEdit(i)}><strong>{i.name}</strong><span>{i.quantity} {i.unit}{i.note?` · ${i.note}`:''}</span><small>Edit item</small></button><button aria-label={`Correct location for ${i.name}`} className="wrong" onClick={()=>onCorrect(i)}><MapPin/></button></div>)}</section>)}{done.length>0&&<section className="completed-block"><button onClick={()=>setShowCompleted(!showCompleted)}><span><CheckCircle2/>Completed · {done.length}</span><ChevronDown className={showCompleted?'flip':''}/></button>{showCompleted&&done.map(i=><div className="completed-item" key={i.id}><button aria-label={`Restore ${i.name}`} onClick={()=>onToggle(i)}><RotateCcw/></button><span>{i.name}</span></div>)}</section>}{remaining===0&&<div className="finish-card"><div>✓</div><h2>Shop complete</h2><p>Everything on {list.name} is in the basket.</p><button className="primary" onClick={onBack}>Finish shopping</button></div>}</div><button className="floating-add" onClick={onAdd}><Plus/>Add item</button></div>
}

function SheetFrame({children,close,title}:{children:React.ReactNode;close:()=>void;title:string}){const titleId=`sheet-${title.toLowerCase().replace(/\W+/g,'-')}`;useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape')close()};addEventListener('keydown',onKey);return()=>removeEventListener('keydown',onKey)},[close]);return <div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)close()}}><section className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId}><div className="sheet-handle"/><header><h2 id={titleId}>{title}</h2><button aria-label="Close" onClick={close}><X/></button></header>{children}</section></div>}
function StoreSheet({active,query,setQuery,choose,close}:{active:Store;query:string;setQuery:(q:string)=>void;choose:(s:Store)=>void;close:()=>void}){const filtered=stores.filter(s=>`${s.chain} ${s.branch} ${s.postcode}`.toLowerCase().includes(query.toLowerCase()));return <SheetFrame close={close} title="Choose a supermarket"><div className="sheet-search"><Search/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Chain, branch or postcode"/></div><div className="sheet-stores">{filtered.map(s=><button key={s.id} onClick={()=>choose(s)}><div className="store-logo">{s.chain[0]}</div><div><strong>{s.branch}</strong><span>{s.chain} · {s.postcode}</span><small className={`evidence ${s.status.toLowerCase()}`}><i/>{s.status} · {s.accuracy}%</small></div>{s.id===active.id?<CheckCircle2 className="chosen"/>:<ChevronRight/>}</button>)}</div><button className="wide-dashed"><Plus/>Add a missing store</button></SheetFrame>}
function ItemSheet({item,query,setQuery,addItem,update,remove,close}:{item:Grocery|null;query:string;setQuery:(q:string)=>void;addItem:(n:string,s?:Section)=>void;update:(id:string,p:Partial<Grocery>)=>void;remove:(i:Grocery)=>void;close:()=>void}){if(!item)return <SheetFrame close={close} title="Add an item"><div className="sheet-search"><Search/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="What do you need?"/></div><div className="popular"><span>Popular this week</span>{catalogue.slice(0,8).map(c=><button onClick={()=>addItem(c.name)} key={c.name}><b>{sectionIcons[c.section]}</b><span>{c.name}</span><Plus/></button>)}</div>{query&&<button className="primary full" onClick={()=>addItem(query)}>Add “{query}”</button>}</SheetFrame>;return <SheetFrame close={close} title="Edit item"><div className="edit-item"><label>Item name<input value={item.name} onChange={e=>update(item.id,{name:e.target.value})}/></label><div className="form-row"><label>Quantity<div className="quantity-stepper"><button onClick={()=>update(item.id,{quantity:Math.max(1,item.quantity-1)})}><Minus/></button><span>{item.quantity}</span><button onClick={()=>update(item.id,{quantity:item.quantity+1})}><Plus/></button></div></label><label>Unit<input value={item.unit} onChange={e=>update(item.id,{unit:e.target.value})} placeholder="pack"/></label></div><label>Note<input value={item.note||''} onChange={e=>update(item.id,{note:e.target.value})} placeholder="Optional note"/></label><label>Usual section<select value={item.section} onChange={e=>update(item.id,{section:e.target.value as Section})}>{sections.map(s=><option key={s}>{s}</option>)}</select></label><button className="favourite-toggle" onClick={()=>update(item.id,{favourite:!item.favourite})}><Heart fill={item.favourite?'currentColor':'none'}/>{item.favourite?'Saved as a favourite':'Save as favourite'}</button><div className="sheet-actions"><button className="danger" onClick={()=>remove(item)}><Trash2/>Remove</button><button className="primary" onClick={close}>Save changes</button></div></div></SheetFrame>}
function CorrectionSheet({item,current,correct,close}:{item:Grocery;current:Section;correct:(s:Section)=>void;close:()=>void}){return <SheetFrame close={close} title="Where did you find it?"><div className="correction-head"><span>{sectionIcons[current]}</span><div><strong>{item.name}</strong><p>Currently shown in {current}</p></div></div><p className="sheet-copy">Choose the correct section. This personal correction is saved on this phone for this example branch.</p><div className="section-options">{sections.filter(s=>s!=='Unknown').map(s=><button className={s===current?'active':''} key={s} onClick={()=>correct(s)}><span>{sectionIcons[s]}</span><strong>{s}</strong>{s===current&&<Check/>}</button>)}</div></SheetFrame>}
type SpeechResultEvent = { results: ArrayLike<{ 0: { transcript:string }, isFinal:boolean }> }
type SpeechRecognitionLike = { continuous:boolean;interimResults:boolean;lang:string;start:()=>void;stop:()=>void;onresult:((event:SpeechResultEvent)=>void)|null;onerror:(()=>void)|null;onend:(()=>void)|null }
type SpeechRecognitionConstructor = new()=>SpeechRecognitionLike
function VoiceSheet({items,close,commit}:{items:Grocery[];close:()=>void;commit:(changes:VoiceChange[])=>void}){
  const [transcript,setTranscript]=useState('')
  const [changes,setChanges]=useState<VoiceChange[]>([])
  const [listening,setListening]=useState(false)
  const [message,setMessage]=useState('Press the microphone, speak, then review every change before applying it.')
  const recognition=useRef<SpeechRecognitionLike|null>(null)
  const SpeechRecognition=(window as typeof window & {SpeechRecognition?:SpeechRecognitionConstructor;webkitSpeechRecognition?:SpeechRecognitionConstructor}).SpeechRecognition || (window as typeof window & {webkitSpeechRecognition?:SpeechRecognitionConstructor}).webkitSpeechRecognition
  const stop=()=>{recognition.current?.stop();setListening(false)}
  const start=()=>{
    if(!SpeechRecognition){setMessage('Speech recognition is unavailable in this browser. Type or edit the transcript below instead.');return}
    const instance=new SpeechRecognition();recognition.current=instance;instance.continuous=false;instance.interimResults=true;instance.lang='en-GB'
    instance.onresult=event=>{const text=Array.from(event.results).map(result=>result[0].transcript).join(' ');setTranscript(text)}
    instance.onerror=()=>{setListening(false);setMessage('Voice recognition could not continue. Check microphone permission or use the keyboard fallback.')}
    instance.onend=()=>{setListening(false);setMessage('Recognition may use an internet service. Review the transcript before applying changes.')}
    try{instance.start();setListening(true);setMessage('Listening… Tap stop whenever you are finished.')}catch{setMessage('The microphone could not start. Use the keyboard fallback below.')}
  }
  const review=()=>{const parsed=parseVoiceCommand(transcript);setChanges(parsed);setMessage(parsed.length?'Review these proposed changes. Nothing has been added yet.':'No clear products were recognised. Edit the transcript and try again.')}
  return <SheetFrame close={()=>{stop();close()}} title="Add by voice"><div className="voice-panel"><p className="voice-status" role="status" aria-live="polite">{message}</p><button className={`voice-trigger ${listening?'listening':''}`} onClick={listening?stop:start}><Mic/>{listening?'Stop listening':'Start listening'}</button><label>Recognised transcript<textarea aria-label="Recognised transcript" value={transcript} onChange={e=>{setTranscript(e.target.value);setChanges([])}} placeholder="Try: Add pasta and two tins of chopped tomatoes"/></label><button className="outline full" disabled={!transcript.trim()} onClick={review}>Review proposed changes</button>{changes.length>0&&<div className="voice-proposals"><strong>Proposed changes</strong>{changes.map((change,index)=><div key={`${change.action}-${change.name}-${index}`}><span>{change.action}</span><b>{change.name}</b><small>{change.quantity?`${change.quantity} ${change.unit||''}`:''}{items.some(i=>i.name.toLowerCase()===change.name.toLowerCase())?' · already on list':''}</small></div>)}<button className="primary full" onClick={()=>commit(changes)}>Apply {changes.length} change{changes.length===1?'':'s'}</button></div>}<p className="privacy-note">SmartShop does not store audio. Browser speech recognition may require internet access; keyboard entry always remains available.</p></div></SheetFrame>
}
function ListMenu({list,close,rename,duplicate,archive,remove}:{list:ShoppingList;close:()=>void;rename:(n:string)=>void;duplicate:()=>void;archive:()=>void;remove:()=>void}){const [name,setName]=useState(list.name);return <SheetFrame close={close} title="List options"><div className="edit-item"><label>List name<div className="name-save"><input value={name} onChange={e=>setName(e.target.value)}/><button onClick={()=>rename(name)}><Check/></button></div></label><div className="menu-list"><button onClick={duplicate}><Copy/><span><strong>Duplicate list</strong><small>Make a reusable copy</small></span><ChevronRight/></button><button onClick={archive}><Archive/><span><strong>Archive list</strong><small>Hide it without deleting</small></span><ChevronRight/></button><button className="danger-row" onClick={remove}><Trash2/><span><strong>Delete list</strong><small>This can’t be undone</small></span><ChevronRight/></button></div></div></SheetFrame>}
