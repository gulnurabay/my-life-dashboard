import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signInWithPopup,GoogleAuthProvider,sendPasswordResetEmail,signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getFirestore,doc,getDoc,setDoc} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {firebaseConfig} from "./firebase-config.js";

const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9);
const ds=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const TODAY=ds(new Date());
const week=()=>[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d});
const WK=new Set(week().map(ds));
const EMPTY={habits:[],goals:[],books:[],study:[],fin:[],journal:[],fit:[],travel:[],dreams:[],cfg:{app:'My Life',emoji:'🌸',name:'',pal:'rose',mode:'auto'}};
function applyCfg(){if(!S.cfg)S.cfg={...EMPTY.cfg};const c=S.cfg,r=document.documentElement;r.dataset.pal=c.pal||'rose';if(c.mode==='light'||c.mode==='dark')r.dataset.theme=c.mode;else delete r.dataset.theme;document.title=(c.app||'My Life')+' ✿'}
let S=JSON.parse(JSON.stringify(EMPTY)),cur='home',dbDoc=null,timer=null,LS='lifedash_v1';


const SEC=[['home','🌸','Home','Твой день на одном экране'],['habits','🌿','Habit Tracker','Маленькие шаги каждый день'],['goals','🎯','Goals','Цели и прогресс'],['books','📖','Reading Tracker','Книги и чтение'],['study','🎓','Study Tracker','Учёба и часы фокуса'],['fin','💰','Finance Tracker','Доходы и расходы'],['journal','🕊️','My Journal','Мысли и настроение'],['fit','🧘','Fitness Tracker','Тренировки'],['travel','✈️','Travel Wishlist','Места, куда хочется'],['dreams','✨','Dream Board','Доска мечтаний'],['stats','📊','Insights','Графики и статистика'],['set','⚙️','Settings','Персонализация']];
const F={ // поля форм
habits:[['name','Новая привычка…']],goals:[['t','Моя цель…']],books:[['t','Название книги'],['a','Автор'],['pages','Страниц','number']],
study:[['subj','Предмет / тема'],['min','Минут','number'],['date','','date']],
fin:[['t','За что / откуда'],['amt','Сумма','number'],['type','','select',[['exp','Расход'],['inc','Доход']]],['date','','date']],
journal:[['mood','','select',['😊','😌','😐','😔','😤']],['text','О чём думаешь сегодня?','area']],
fit:[['type','Тип (йога, бег…)'],['min','Минут','number'],['date','','date']],travel:[['place','Куда мечтаешь поехать?']],dreams:[['text','Мечта, образ, цитата…']]};
const ADD={habits:v=>({name:v.name,days:{}}),goals:v=>({t:v.t,p:0,done:false}),books:v=>({t:v.t,a:v.a,pages:+v.pages||0,read:0,st:'want'}),
study:v=>({subj:v.subj,min:+v.min||0,date:v.date||TODAY}),fin:v=>({t:v.t,amt:+v.amt||0,type:v.type,date:v.date||TODAY}),
journal:v=>({mood:v.mood,text:v.text,date:TODAY}),fit:v=>({type:v.type,min:+v.min||0,date:v.date||TODAY}),travel:v=>({place:v.place,done:false}),dreams:v=>({text:v.text,c:S.dreams.length%6})};
const KEY={habits:'name',goals:'t',books:'t',study:'subj',fin:'t',journal:'text',fit:'type',travel:'place',dreams:'text'};
const COL=['#f6d5da','#f3e3cf','#fbeee0','#ead9d3','#f1ccd3','#e9dfd0'];
const sum=(a,f)=>a.reduce((s,x)=>s+(+f(x)||0),0);
const del=(s,id)=>`<button class="x" data-del="${s}:${id}" title="Удалить">×</button>`;
const bar=p=>`<div class="bar"><i style="width:${Math.min(100,p)}%"></i></div>`;
const empty=t=>`<div class="empty">${t}</div>`;

function form(s){return `<div class="add" data-sec="${s}">`+F[s].map(([k,ph,t,o])=>{
 if(t==='select')return `<select data-f="${k}">${o.map(x=>Array.isArray(x)?`<option value="${x[0]}">${x[1]}</option>`:`<option>${x}</option>`).join('')}</select>`;
 if(t==='area')return `<textarea data-f="${k}" placeholder="${ph}"></textarea>`;
 return `<input class="${t==='number'?'':'grow'}" data-f="${k}" type="${t||'text'}" placeholder="${ph}" ${t==='date'?'value="'+TODAY+'"':''} ${t==='number'?'style="width:110px"':''}>`}).join('')+`<button class="btn" data-add="${s}">+ Добавить</button></div>`}

const R={
home(){const h=S.habits.filter(x=>x.days[TODAY]).length;
 const bal=sum(S.fin,x=>x.type==='inc'?x.amt:-x.amt);
 const st=[[`${h}/${S.habits.length}`,'привычек сегодня'],[S.goals.filter(g=>!g.done).length,'целей в работе'],[S.books.filter(b=>b.st==='reading').length,'книг читаю'],
 [sum(S.study.filter(x=>WK.has(x.date)),x=>x.min)+' мин','учёбы за неделю'],[bal,'баланс'],[S.fit.filter(x=>WK.has(x.date)).length,'тренировок за неделю'],[S.travel.filter(x=>!x.done).length,'мест в вишлисте'],[S.dreams.length,'мечт на доске']];
 return `<div class="grid">${st.map(([a,b])=>`<div class="stat"><b>${a}</b><span>${b}</span></div>`).join('')}</div>
 <div class="card">Выбери раздел слева и добавь первую запись. Всё сохраняется в облаке и доступно с любого устройства, где ты вошла в свой аккаунт. 🌷</div>`},
habits(){const w=week();return form('habits')+(S.habits.map(h=>{let n=0;for(let d=new Date();h.days[ds(d)];d.setDate(d.getDate()-1))n++;
 return `<div class="card row"><div class="grow"><b>${esc(h.name)}</b><div class="sub">🔥 серия: ${n}</div></div><div class="days">${w.map(d=>`<button class="d ${h.days[ds(d)]?'on':''} ${ds(d)===TODAY?'t':''}" data-tog="${h.id}:${ds(d)}">${['В','П','В','С','Ч','П','С'][d.getDay()===0?0:d.getDay()]}</button>`).join('')}</div>${del('habits',h.id)}</div>`}).join('')||empty('Добавь первую привычку'))},
goals(){return form('goals')+(S.goals.map(g=>`<div class="card row"><input type="checkbox" data-set="goals:${g.id}:done" ${g.done?'checked':''}><span class="grow ${g.done?'done':''}">${esc(g.t)}</span><input type="range" min="0" max="100" step="5" value="${g.p}" data-set="goals:${g.id}:p"><span class="tag">${g.p}%</span>${del('goals',g.id)}</div>`).join('')||empty('Какая твоя главная цель?'))},
books(){const L={want:'Хочу прочитать',reading:'Читаю',done:'Прочитано'};return form('books')+(S.books.map(b=>`<div class="card"><div class="row"><div class="grow"><b>${esc(b.t)}</b> <span class="sub">${esc(b.a)}</span></div><select data-set="books:${b.id}:st">${Object.entries(L).map(([k,v])=>`<option value="${k}" ${b.st===k?'selected':''}>${v}</option>`).join('')}</select>${del('books',b.id)}</div>${b.pages?`<div class="row" style="margin-top:8px"><input type="range" class="grow" min="0" max="${b.pages}" value="${b.read}" data-set="books:${b.id}:read"><span class="tag">${b.read}/${b.pages} стр.</span></div>`:''}</div>`).join('')||empty('Твоя книжная полка пуста'))},
study(){const w=S.study.filter(x=>WK.has(x.date)),by={};w.forEach(x=>by[x.subj]=(by[x.subj]||0)+x.min);const mx=Math.max(1,...Object.values(by));
 return `<div class="grid"><div class="stat"><b>${sum(w,x=>x.min)}</b><span>минут за 7 дней</span></div></div>`+form('study')+(Object.keys(by).length?`<div class="card"><b>По предметам (неделя)</b>${Object.entries(by).map(([k,v])=>`<div class="row" style="margin-top:8px"><span style="width:110px">${esc(k)}</span>${bar(v/mx*100)}<span class="tag">${v} мин</span></div>`).join('')}</div>`:'')+
 S.study.map(x=>`<div class="card row"><b class="grow">${esc(x.subj)}</b><span class="tag">${x.min} мин</span><span class="sub">${x.date}</span>${del('study',x.id)}</div>`).join('')},
fin(){const i=sum(S.fin.filter(x=>x.type==='inc'),x=>x.amt),e=sum(S.fin.filter(x=>x.type==='exp'),x=>x.amt);
 return `<div class="grid"><div class="stat"><b class="pos">${i}</b><span>доходы</span></div><div class="stat"><b>${e}</b><span>расходы</span></div><div class="stat"><b>${i-e}</b><span>баланс</span></div></div>`+form('fin')+
 (S.fin.map(x=>`<div class="card row"><span class="grow">${esc(x.t)}</span><span class="${x.type==='inc'?'pos':'neg'}">${x.type==='inc'?'+':'−'}${x.amt}</span><span class="sub">${x.date}</span>${del('fin',x.id)}</div>`).join('')||empty('Пока нет операций'))},
journal(){return form('journal')+(S.journal.map(j=>`<div class="card"><div class="row"><span style="font-size:22px">${esc(j.mood)}</span><b class="grow">${j.date}</b>${del('journal',j.id)}</div><p style="white-space:pre-wrap;margin:8px 0 0">${esc(j.text)}</p></div>`).join('')||empty('Первая запись ждёт тебя'))},
fit(){const w=S.fit.filter(x=>WK.has(x.date));return `<div class="grid"><div class="stat"><b>${w.length}</b><span>тренировок за неделю</span></div><div class="stat"><b>${sum(w,x=>x.min)}</b><span>минут</span></div></div>`+form('fit')+
 S.fit.map(x=>`<div class="card row"><b class="grow">${esc(x.type)}</b><span class="tag">${x.min} мин</span><span class="sub">${x.date}</span>${del('fit',x.id)}</div>`).join('')},
travel(){return form('travel')+(S.travel.map(t=>`<div class="card row"><input type="checkbox" data-set="travel:${t.id}:done" ${t.done?'checked':''}><span class="grow ${t.done?'done':''}">📍 ${esc(t.place)}</span>${t.done?'<span class="tag">была!</span>':''}${del('travel',t.id)}</div>`).join('')||empty('Куда мечтаешь отправиться?'))},
dreams(){return form('dreams')+(S.dreams.length?`<div class="dream">${S.dreams.map(d=>`<div class="card" style="background:${COL[d.c%6]}">${esc(d.text)}${del('dreams',d.id)}</div>`).join('')}</div>`:empty('Собери свою доску мечтаний'))},
stats(){const dn=['вс','пн','вт','ср','чт','пт','сб'],dy=n=>[...Array(n)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-n+1+i);return d});
 const col=a=>{const m=Math.max(1,...a.map(x=>x.v));return `<div class="chart">${a.map(x=>`<div class="c"><u>${x.v||''}</u><i style="height:${Math.round(x.v/m*80)}px"></i><small>${x.l}</small></div>`).join('')}</div>`};
 const per=(arr,f)=>dy(7).map(d=>({l:dn[d.getDay()],v:sum(arr.filter(x=>x.date===ds(d)),f)}));
 const n=S.habits.length,heat=dy(84).map(d=>{const p=n?S.habits.filter(h=>h.days[ds(d)]).length/n*100:0;return `<b title="${ds(d)}" style="background:color-mix(in srgb,var(--rose-d) ${Math.round(p)}%,var(--beige))"></b>`}).join('');
 const hb=S.habits.map(h=>{const p=Math.round(dy(7).filter(d=>h.days[ds(d)]).length/7*100);return `<div class="row" style="margin-top:8px"><span style="width:120px">${esc(h.name)}</span>${bar(p)}<span class="tag">${p}%</span></div>`}).join('');
 const g=S.goals,gp=g.length?Math.round(sum(g,x=>x.done?100:x.p)/g.length):0;
 return `<div class="grid"><div class="stat"><b>${gp}%</b><span>средний прогресс целей</span></div><div class="stat"><b>${S.books.filter(b=>b.st==='done').length}</b><span>книг прочитано</span></div><div class="stat"><b>${sum(S.study,x=>x.min)}</b><span>минут учёбы всего</span></div><div class="stat"><b>${S.fit.length}</b><span>тренировок всего</span></div></div>
 <div class="card"><b>🌿 Привычки: 12 недель</b><div class="heat" style="margin-top:10px">${heat}</div><div class="sub" style="margin:6px 0">Чем насыщеннее клетка, тем больше привычек выполнено в тот день. Ниже: выполнение за 7 дней.</div>${hb}</div>
 <div class="card"><b>🎓 Учёба, минут за 7 дней</b>${col(per(S.study,x=>x.min))}</div>
 <div class="card"><b>🧘 Фитнес, минут за 7 дней</b>${col(per(S.fit,x=>x.min))}</div>
 <div class="card"><b>💰 Расходы за 7 дней</b>${col(per(S.fin.filter(x=>x.type==='exp'),x=>x.amt))}</div>`},
set(){const c=S.cfg,P=[['rose','#c98391'],['sage','#7f9c79'],['lavender','#9a86c4'],['cocoa','#a67c5b'],['peach','#e09a7a']];
 return `<div class="card"><b>Название и имя</b><div class="row" style="margin-top:10px"><input data-cfg="emoji" value="${esc(c.emoji)}" maxlength="2" style="width:64px"><input class="grow" data-cfg="app" value="${esc(c.app)}" placeholder="Название дашборда"><input class="grow" data-cfg="name" value="${esc(c.name)}" placeholder="Твоё имя"></div></div>
 <div class="card"><b>Акцентный цвет</b><div class="row" style="margin-top:10px">${P.map(([k,v])=>`<button class="pal ${c.pal===k?'on':''}" data-pal="${k}" style="background:${v}" title="${k}"></button>`).join('')}</div></div>
 <div class="card"><b>Тема</b><div style="margin-top:10px"><select data-cfg="mode">${[['auto','Как на устройстве'],['light','Светлая'],['dark','Тёмная']].map(([k,v])=>`<option value="${k}" ${c.mode===k?'selected':''}>${v}</option>`).join('')}</select></div></div>
 <div class="card sub">Настройки сохраняются в облаке вместе с остальными данными.</div>`}};

function render(){applyCfg();const s=SEC.find(x=>x[0]===cur);
 $('#nav').innerHTML='<h1>'+esc(S.cfg.emoji)+' '+esc(S.cfg.app)+'</h1>'+SEC.map(x=>`<button class="${x[0]===cur?'on':''}" data-nav="${x[0]}">${x[1]} <span>${x[2]}</span></button>`).join('');
 $('#ttl').textContent=s[1]+' '+s[2];$('#sub').textContent=cur==='home'&&S.cfg.name?'Привет, '+S.cfg.name+'! Вот твой день ✿':s[3];$('#view').innerHTML=R[cur]()}

function save(){try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
 clearTimeout(timer);timer=setTimeout(async()=>{if(!dbDoc){return}
  try{await dbDoc.set({json:JSON.stringify(S)});setSync('☁️ Сохранено')}catch(e){setSync('⚠️ Не удалось сохранить в облако')}},700)}
const setSync=t=>$('#sync').textContent=t;

document.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
 if(t.dataset.pal){S.cfg.pal=t.dataset.pal;save();render()}
 else if(t.dataset.nav){cur=t.dataset.nav;render();scrollTo(0,0)}
 else if(t.dataset.add){const box=t.closest('.add'),s=t.dataset.add,v={};box.querySelectorAll('[data-f]').forEach(i=>v[i.dataset.f]=i.value.trim());
  if(!v[KEY[s]])return;S[s].unshift({id:uid(),...ADD[s](v)});save();render()}
 else if(t.dataset.del){const[s,id]=t.dataset.del.split(':');S[s]=S[s].filter(x=>x.id!==id);save();render()}
 else if(t.dataset.tog){const[id,d]=t.dataset.tog.split(':'),h=S.habits.find(x=>x.id===id);h.days[d]?delete h.days[d]:h.days[d]=1;save();render()}});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.cfg){S.cfg[el.dataset.cfg]=el.value;save();render();return}if(!el.dataset.set)return;const[s,id,p]=el.dataset.set.split(':'),o=S[s].find(x=>x.id===id);
 o[p]=el.type==='checkbox'?el.checked:el.type==='range'?+el.value:el.value;save();render()});

render();

// ===== Вход и облако (Firebase) =====
const auth=getAuth(initializeApp(firebaseConfig)),fdb=getFirestore(auth.app),ae=$('#aerr');
const msg=e=>({'auth/invalid-credential':'Неверная почта или пароль','auth/email-already-in-use':'Эта почта уже зарегистрирована','auth/weak-password':'Пароль слишком короткий (минимум 6 символов)','auth/invalid-email':'Проверь адрес почты','auth/missing-password':'Введи пароль','auth/popup-closed-by-user':'Окно входа закрыто','auth/unauthorized-domain':'Добавь адрес сайта в Firebase → Authentication → Authorized domains'}[e.code]||'Не получилось: '+(e.code||e.message));
const cred=()=>[$('#em').value.trim(),$('#pw').value];
const go=async fn=>{ae.textContent='';try{await fn()}catch(e){ae.textContent=msg(e)}};
$('#bin').onclick=()=>go(()=>signInWithEmailAndPassword(auth,...cred()));
$('#bup').onclick=()=>go(()=>createUserWithEmailAndPassword(auth,...cred()));
$('#bgo').onclick=()=>go(()=>signInWithPopup(auth,new GoogleAuthProvider()));
$('#bfg').onclick=()=>go(async()=>{await sendPasswordResetEmail(auth,$('#em').value.trim());ae.textContent='Письмо для сброса пароля отправлено ✉️'});
$('#pw').addEventListener('keydown',e=>{if(e.key==='Enter')$('#bin').click()});
document.addEventListener('click',e=>{if(e.target.closest('[data-out]'))signOut(auth)});
onAuthStateChanged(auth,async u=>{
 $('#auth').hidden=!!u;$('#app').hidden=!u;clearTimeout(timer);S=JSON.parse(JSON.stringify(EMPTY));
 if(!u){dbDoc=null;$('#pw').value='';return}
 LS='lifedash_'+u.uid;try{const l=localStorage.getItem(LS);if(l)S={...S,...JSON.parse(l)}}catch(e){}
 render();setSync('⏳ Загружаю…');
 const ref=doc(fdb,'users',u.uid);
 try{const s=await getDoc(ref);
  if(s.exists()){S={...EMPTY,...JSON.parse(s.data().json)};try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}
  else await setDoc(ref,{json:JSON.stringify(S)});
  dbDoc={set:d=>setDoc(ref,d)};render();setSync('☁️ Синхронизировано')}
 catch(e){setSync('⚠️ Нет связи с облаком')}});
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
