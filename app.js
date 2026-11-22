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
const EMPTY={habits:[],goals:[],books:[],study:[],fin:[],journal:[],fit:[],travel:[],dreams:[],days:{},mood:{},ctr:[],tt:{},cfg:{app:'My Life',emoji:'🌸',name:'',pal:'rose',mode:'auto'}};
function applyCfg(){if(!S.cfg)S.cfg={...EMPTY.cfg};const c=S.cfg,r=document.documentElement;r.dataset.pal=c.pal||'rose';if(c.mode==='light'||c.mode==='dark')r.dataset.theme=c.mode;else delete r.dataset.theme;document.title=(c.app||'My Life')+' ✿'}
let S=JSON.parse(JSON.stringify(EMPTY)),cur='home',dbDoc=null,timer=null,LS='lifedash_v1';


const SEC=[['home','🌸','Мой день','Планы на сегодня'],['habits','🌿','Habit Tracker','Маленькие шаги каждый день'],['goals','🎯','Goals','Цели и прогресс'],['books','📖','Reading Tracker','Книги и чтение'],['study','🎓','Study Tracker','Учёба и часы фокуса'],['fin','💰','Finance Tracker','Доходы и расходы'],['journal','🕊️','My Journal','Мысли и настроение'],['fit','🧘','Fitness Tracker','Тренировки'],['travel','✈️','Travel Wishlist','Места, куда хочется'],['dreams','✨','Dream Board','Доска мечтаний'],['ctr','🎨','Color Trackers','Закрашивай клетки'],['stats','📊','Insights','Графики и статистика'],['set','⚙️','Settings','Персонализация']];
const F={ // поля форм
habits:[['name','Новая привычка…']],goals:[['t','Моя цель…']],books:[['t','Название книги'],['a','Автор'],['pages','Страниц','number']],
study:[['subj','Предмет / тема'],['min','Минут','number'],['date','','date']],
fin:[['t','За что / откуда'],['amt','Сумма','number'],['type','','select',[['exp','Расход'],['inc','Доход']]],['date','','date']],
journal:[['mood','','select',['😊','😌','😐','😔','😤']],['text','О чём думаешь сегодня?','area']],
fit:[['type','Тип (йога, бег…)'],['min','Минут','number'],['date','','date']],travel:[['place','Куда мечтаешь поехать?']],ctr:[['name','Трекер: вода, сбережения, шаги…'],['n','Клеток','number'],['c','','select',[['#f4b6c2','Розовый'],['#f6d9a8','Персиковый'],['#b9d1b0','Шалфей'],['#cfc3ea','Лаванда'],['#bcd4e8','Голубой']]]],dreams:[['text','Мечта, образ, цитата…']]};
const ADD={habits:v=>({name:v.name,days:{}}),goals:v=>({t:v.t,p:0,done:false}),books:v=>({t:v.t,a:v.a,pages:+v.pages||0,read:0,st:'want'}),
study:v=>({subj:v.subj,min:+v.min||0,date:v.date||TODAY}),fin:v=>({t:v.t,amt:+v.amt||0,type:v.type,date:v.date||TODAY}),
journal:v=>({mood:v.mood,text:v.text,date:TODAY}),fit:v=>({type:v.type,min:+v.min||0,date:v.date||TODAY}),travel:v=>({place:v.place,done:false}),ctr:v=>({name:v.name,n:Math.min(366,Math.max(1,+v.n||30)),c:v.c,f:[]}),dreams:v=>({text:v.text,c:S.dreams.length%6})};
const KEY={habits:'name',goals:'t',books:'t',study:'subj',fin:'t',journal:'text',fit:'type',travel:'place',dreams:'text',ctr:'name'};
const COL=['#f6d5da','#f3e3cf','#fbeee0','#ead9d3','#f1ccd3','#e9dfd0'];
const sum=(a,f)=>a.reduce((s,x)=>s+(+f(x)||0),0);
const del=(s,id)=>`<button class="x" data-del="${s}:${id}" title="Удалить">×</button>`;
const bar=p=>`<div class="bar"><i style="width:${Math.min(100,p)}%"></i></div>`;
const empty=t=>`<div class="empty">${t}</div>`;

function form(s){return `<div class="add" data-sec="${s}">`+F[s].map(([k,ph,t,o])=>{
 if(t==='select')return `<select data-f="${k}">${o.map(x=>Array.isArray(x)?`<option value="${x[0]}">${x[1]}</option>`:`<option>${x}</option>`).join('')}</select>`;
 if(t==='area')return `<textarea data-f="${k}" placeholder="${ph}"></textarea>`;
 return `<input class="${t==='number'?'':'grow'}" data-f="${k}" type="${t||'text'}" placeholder="${ph}" ${t==='date'?'value="'+TODAY+'"':''} ${t==='number'?'style="width:110px"':''}>`}).join('')+`<button class="btn" data-add="${s}">+ Добавить</button></div>`}

let pd=TODAY;
const QUOTES=['Маленькие шаги каждый день ведут к большим переменам.','Сегодня я делаю то, что приближает меня к мечте.','Спокойствие — тоже продуктивность.','Я выбираю прогресс, а не идеальность.','Хороший день начинается с доброго отношения к себе.','Всё, что мне нужно, уже во мне.','Делай по чуть-чуть, но каждый день.','Я заслуживаю отдыха и красивой жизни.','Одна задача за раз — и день удался.','Сегодня будет мой самый лучший день.'];
const NEWDAY=()=>({sched:Array.from({length:15},()=>({t:'',x:''})),tasks:[0,1,2].map(()=>({x:'',d:false})),notes:'',quote:''});
const shiftD=n=>{const d=new Date(pd+'T00:00');d.setDate(d.getDate()+n);return ds(d)};
function planner(){const d=S.days[pd]||NEWDAY();
 const pretty=new Date(pd+'T00:00').toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'});
 return `<div class="pl"><div class="pl-head"><div><h3 class="pl-title">Самый лучший день</h3><div class="sub">${pretty}</div></div>
 <div class="row"><button class="d" data-pd="-1">‹</button><input type="date" data-pdate value="${pd}"><button class="d" data-pd="1">›</button><button class="pbtn" data-pd="0">Сегодня</button></div></div>
 <div class="pl-grid"><div class="pl-col"><h4>Расписание</h4><div class="card pl-sched">${d.sched.map((r,i)=>`<div class="srow"><input class="tm" data-pl="sched:${i}:t" value="${esc(r.t)}" placeholder="00:00"><input data-pl="sched:${i}:x" value="${esc(r.x)}"></div>`).join('')}</div>
 <h4>Цитата дня</h4><div class="card"><textarea data-pl="quote" placeholder="Твоя цитата или мысль на сегодня…">${esc(d.quote)}</textarea><button class="pbtn" data-quote>✨ Подсказать цитату</button></div></div>
 <div class="pl-col"><h4>Главные задачи</h4><div class="card">${d.tasks.map((t,i)=>`<div class="trow"><input type="checkbox" class="circ" data-pl="tasks:${i}:d" ${t.d?'checked':''}><input data-pl="tasks:${i}:x" value="${esc(t.x)}" placeholder="Задача ${i+1}"></div>`).join('')}</div>
 <h4>Заметки</h4><div class="card"><textarea class="notes" data-pl="notes" placeholder="Мысли, идеи, всё важное…">${esc(d.notes)}</textarea></div></div></div></div>`}
const TT={
habits:['Делаем привычку каждый день','<path d="M20 4C10 4 4 9 4 15a5 5 0 0 0 5 5c6 0 11-6 11-16z"/><path d="M4 20c3-6 7-9 12-11"/>'],
goals:['Шаг к цели каждый день','<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>'],
books:['Читаем книги каждый день','<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'],
study:['Учимся каждый день','<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>'],
fin:['Откладываем каждый день','<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5C9.5 8.4 10.6 8 12 8s2.5.6 2.5 1.7-1 1.6-2.5 2-2.5.9-2.5 2.1S10.6 16 12 16s2.5-.4 2.5-1.5"/>'],
journal:['Пишем в дневник каждый день','<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><path d="M16 8L2 22M17.5 15H9"/>'],
fit:['Двигаемся каждый день','<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'],
travel:['Копим на путешествие','<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>'],
dreams:['Шаг к мечте каждый день','<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>']};
const mon=()=>{const x=new Date();x.setDate(x.getDate()-(x.getDay()+6)%7);return ds(x)};
function tt(sec){const c=TT[sec];if(!c)return '';const t=S.tt[sec]||{s:mon(),f:[]},st=new Date(t.s+'T00:00');
 const cells=Array.from({length:49},(_,i)=>{const d=new Date(st);d.setDate(d.getDate()+i);return `<button class="ti ${t.f.includes(i)?'on':''} ${ds(d)===TODAY?'td':''}" data-tt="${sec}:${i}" title="${ds(d)}"><svg viewBox="0 0 24 24">${c[1]}</svg></button>`}).join('');
 return `<div class="card ttc"><div class="row"><b class="grow ttt">${c[0]}</b><span class="tag">${t.f.length}/49</span><button class="pbtn" data-ttr="${sec}">Начать заново</button></div>
 <div class="tth">${['пн','вт','ср','чт','пт','сб','вс'].map(h=>`<span>${h}</span>`).join('')}</div><div class="ttg">${cells}</div>
 <div class="sub" style="text-align:center;margin-top:12px">Сделала сегодня? Смело отмечай этот день! ✨</div></div>`}
let my=new Date().getFullYear(),mb=0;
const ML=[['Прекрасно','#f4b6c2'],['Хорошо','#f6d9a8'],['Нормально','#cfdcc0'],['Грустно','#bcd4e8'],['Тяжело','#d9b8a6']];
const R={
home(){return planner()+'<div class="pl"><h4>Сводка</h4></div>'+R.overview()},
overview(){const h=S.habits.filter(x=>x.days[TODAY]).length;
 const bal=sum(S.fin,x=>x.type==='inc'?x.amt:-x.amt);
 const st=[[`${h}/${S.habits.length}`,'привычек сегодня'],[S.goals.filter(g=>!g.done).length,'целей в работе'],[S.books.filter(b=>b.st==='reading').length,'книг читаю'],
 [sum(S.study.filter(x=>WK.has(x.date)),x=>x.min)+' мин','учёбы за неделю'],[bal,'баланс'],[S.fit.filter(x=>WK.has(x.date)).length,'тренировок за неделю'],[S.travel.filter(x=>!x.done).length,'мест в вишлисте'],[S.dreams.length,'мечт на доске']];
 return `<div class="grid">${st.map(([a,b])=>`<div class="stat"><b>${a}</b><span>${b}</span></div>`).join('')}</div>`},
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
ctr(){const MN=['Я','Ф','М','А','М','И','И','А','С','О','Н','Д'],dim=m=>new Date(my,m+1,0).getDate(),k=(m,d)=>my+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
 let g='<div></div>'+MN.map(x=>`<b class="mh">${x}</b>`).join('');
 for(let d=1;d<=31;d++){g+=`<b class="mh">${d}</b>`;for(let m=0;m<12;m++){if(d>dim(m)){g+='<i></i>';continue}const v=S.mood[k(m,d)];g+=`<button class="mc" data-mc="${k(m,d)}" ${v!==undefined?`style="background:${ML[v][1]};border-color:${ML[v][1]}"`:''}></button>`}}
 const cnt=ML.map((_,i)=>Object.entries(S.mood).filter(([a,b])=>a.startsWith(my+'-')&&b===i).length);
 return `<div class="card"><div class="row"><b class="grow">🌈 Настроение года</b><button class="d" data-my="-1">‹</button><b>${my}</b><button class="d" data-my="1">›</button></div>
 <div class="row" style="margin:10px 0">${ML.map((m,i)=>`<button class="pbtn ${mb===i?'sel':''}" data-mb="${i}" style="background:${m[1]}">${m[0]} · ${cnt[i]}</button>`).join('')}</div>
 <div class="sub" style="margin-bottom:8px">Выбери цвет настроения и закрашивай клетки дней. Нажми на клетку того же цвета, чтобы очистить.</div>
 <div class="ywrap"><div class="ygrid">${g}</div></div></div>`+form('ctr')+(S.ctr.map(c=>{const n=c.f.length;return `<div class="card"><div class="row"><b class="grow">${esc(c.name)}</b><span class="tag">${n}/${c.n}</span><button class="pbtn" data-rst="${c.id}">Сбросить</button>${del('ctr',c.id)}</div><div class="row" style="margin-top:8px">${bar(n/c.n*100)}</div><div class="cells" style="margin-top:12px">${Array.from({length:c.n},(_,i)=>`<button class="cl ${c.f.includes(i)?'on':''}" data-cc="${c.id}:${i}" ${c.f.includes(i)?`style="background:${c.c};border-color:${c.c}"`:''}>${i+1}</button>`).join('')}</div></div>`}).join('')||empty('Создай свой трекер: вода, сбережения, шаги, прочитанные страницы…'))},
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
 $('#nav').innerHTML='<h1><img class="logo" src="logo.svg" alt=""> '+esc(S.cfg.app)+'</h1>'+SEC.map(x=>`<button class="${x[0]===cur?'on':''}" data-nav="${x[0]}">${x[1]} <span>${x[2]}</span></button>`).join('');
 $('#ttl').innerHTML='<img class="logo mlogo" src="logo.svg" alt=""> '+s[1]+' '+s[2];$('#sub').textContent=cur==='home'&&S.cfg.name?'Привет, '+S.cfg.name+'! Вот твой день ✿':s[3];$('#view').innerHTML=tt(cur)+R[cur]()}

function save(){try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
 clearTimeout(timer);timer=setTimeout(async()=>{if(!dbDoc){return}
  try{await dbDoc.set({json:JSON.stringify(S)});setSync('☁️ Сохранено')}catch(e){setSync('⚠️ Не удалось сохранить в облако')}},700)}
const setSync=t=>$('#sync').textContent=t;

document.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
 if(t.dataset.tt){const[s,i]=t.dataset.tt.split(':'),o=S.tt[s]||(S.tt[s]={s:mon(),f:[]}),k=+i,p=o.f.indexOf(k);if(p<0)o.f.push(k);else o.f.splice(p,1);save();render()}
 else if(t.dataset.ttr){if(confirm('Начать трекер заново?')){S.tt[t.dataset.ttr]={s:mon(),f:[]};save();render()}}
 else if(t.dataset.mc){const k=t.dataset.mc;if(S.mood[k]===mb)delete S.mood[k];else S.mood[k]=mb;save();render()}
 else if(t.dataset.mb!==undefined){mb=+t.dataset.mb;render()}
 else if(t.dataset.my){my+=+t.dataset.my;render()}
 else if(t.dataset.cc){const[id,i]=t.dataset.cc.split(':'),c=S.ctr.find(x=>x.id===id),k=+i,p=c.f.indexOf(k);if(p<0)c.f.push(k);else c.f.splice(p,1);save();render()}
 else if(t.dataset.rst){const c=S.ctr.find(x=>x.id===t.dataset.rst);if(c&&confirm('Очистить все клетки?')){c.f=[];save();render()}}
 else if(t.dataset.pd!==undefined){const v=+t.dataset.pd;pd=v===0?TODAY:shiftD(v);render()}
 else if(t.dataset.quote!==undefined){const d=S.days[pd]||(S.days[pd]=NEWDAY());d.quote=QUOTES[Math.floor(Math.random()*QUOTES.length)];save();render()}
 else if(t.dataset.pal){S.cfg.pal=t.dataset.pal;save();render()}
 else if(t.dataset.nav){cur=t.dataset.nav;render();scrollTo(0,0)}
 else if(t.dataset.add){const box=t.closest('.add'),s=t.dataset.add,v={};box.querySelectorAll('[data-f]').forEach(i=>v[i.dataset.f]=i.value.trim());
  if(!v[KEY[s]])return;S[s].unshift({id:uid(),...ADD[s](v)});save();render()}
 else if(t.dataset.del){const[s,id]=t.dataset.del.split(':');S[s]=S[s].filter(x=>x.id!==id);save();render()}
 else if(t.dataset.tog){const[id,d]=t.dataset.tog.split(':'),h=S.habits.find(x=>x.id===id);h.days[d]?delete h.days[d]:h.days[d]=1;save();render()}});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.pdate){pd=el.value||TODAY;render();return}if(el.dataset.cfg){S.cfg[el.dataset.cfg]=el.value;save();render();return}if(!el.dataset.set)return;const[s,id,p]=el.dataset.set.split(':'),o=S[s].find(x=>x.id===id);
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

document.addEventListener('input',e=>{const el=e.target,p=el.dataset.pl;if(!p)return;const d=S.days[pd]||(S.days[pd]=NEWDAY()),a=p.split(':');
 if(a[0]==='sched')d.sched[+a[1]][a[2]]=el.value;else if(a[0]==='tasks')d.tasks[+a[1]][a[2]]=a[2]==='d'?el.checked:el.value;else d[a[0]]=el.value;save()});
