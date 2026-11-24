'use strict';
(() => {
  const API = 'https://diere-member-schedule-feed-20261125.workspace-012369.chatgpt.site/api/schedule';
  const CACHE_KEY = 'diere-public-schedule-v1';
  const $ = id => document.getElementById(id);
  const root = $('team-schedule');
  const dayNames = ['일','월','화','수','목','금','토'];
  const studioNotes = new Map([...document.querySelectorAll('.studio-card')].map(card=>[card.querySelector('h3').textContent,card.querySelector('.studio-entry')?.outerHTML || '']));
  const koreaDate = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const weekday = date => new Date(date+'T00:00:00Z').getUTCDay();
  const dateLabel = date => `${Number(date.slice(5,7))}월 ${Number(date.slice(8))}일 (${dayNames[weekday(date)]})`;
  const state = {payload:null,team:'all',season:'all',month:koreaDate().slice(0,7),view:matchMedia('(max-width: 600px)').matches?'list':'calendar',busy:false,signature:'',lastDate:koreaDate(),selectedDate:null};
  let lastSuccess = '';

  function validPayload(p) {
    return p && p.data && Array.isArray(p.data.teams) && Array.isArray(p.data.events) && Array.isArray(p.data.studios) &&
      p.data.teams.every(t=>typeof t.id==='string' && typeof t.name==='string') &&
      p.data.events.every(e=>typeof e.id==='string' && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && p.data.teams.some(t=>t.id===e.teamId) && ['scheduled','cancelled'].includes(e.status)) &&
      p.data.studios.every(s=>typeof s.name==='string' && typeof s.address==='string' && Array.isArray(s.assignments));
  }
  function teamName(id) {return state.payload.data.teams.find(t=>t.id===id)?.name || id;}
  function teamClass(id) {return ['rijae','hyunjun','rijae-men'].includes(id)?id:'other';}
  function studioFor(e) {
    // Current weekday assignments come from the source, not this guide's HTML.
    // Historical locations are not inferred from current assignments.
    if(e.date<'2026-11-17') return null;
    return state.payload.data.studios.find(s=>s.assignments.some(a=>a.teamId===e.teamId && a.weekday===weekday(e.date)));
  }
  function filtered() {
    if(!state.payload) return [];
    return state.payload.data.events.filter(e=>(state.team==='all'||e.teamId===state.team)&&(state.season==='all'||String(e.season)===state.season)).sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99')||a.teamId.localeCompare(b.teamId));
  }
  function eventCard(e) {
    const studio = studioFor(e);
    const cancelled = e.status==='cancelled';
    return `<article class="event-card ${teamClass(e.teamId)} ${cancelled?'is-cancelled':''}">
      <div class="event-heading"><span class="team-tag ${teamClass(e.teamId)}">${escape(teamName(e.teamId))}</span><span class="event-status">${cancelled?'취소':escape(e.time||'시간 미정')}</span></div>
      <h4>시즌 ${escape(e.season)} · ${escape(e.session)}회차</h4>
      <dl class="event-info"><div><dt>의상</dt><dd>${escape(e.outfit||'미정')}</dd></div>${e.concept?`<div><dt>콘셉트</dt><dd>${escape(e.concept)}</dd></div>`:''}<div><dt>장소</dt><dd>${escape(studio?.name||'원본 일정표에서 확인')}${studio?`<span>${escape(studio.address)}</span>`:''}${studio?.details?.length?`<span>${escape(studio.details.join(' · '))}</span>`:''}</dd></div></dl>
      ${e.note?`<p class="event-note">${escape(e.note)}</p>`:''}
      ${studio&&!cancelled?`<a class="event-map" href="https://map.naver.com/p/search/${encodeURIComponent(studio.address)}" target="_blank" rel="noopener noreferrer">네이버 지도 보기</a>`:''}
    </article>`;
  }
  function syncFilters() {
    const data = state.payload.data;
    if(!data.teams.some(t=>t.id===state.team)) state.team='all';
    const teams = [{id:'all',name:'전체 팀'},...data.teams];
    $('schedule-teams').innerHTML = teams.map(t=>`<button type="button" data-team="${escape(t.id)}" aria-pressed="${state.team===t.id}">${escape(t.name)}</button>`).join('');
    const seasons = [...new Set(data.events.map(e=>Number(e.season)))].sort((a,b)=>a-b);
    if(!seasons.includes(Number(state.season))) state.season='all';
    $('schedule-season').innerHTML='<option value="all">전체 시즌</option>'+seasons.map(n=>`<option value="${n}">시즌 ${n}</option>`).join('');
    $('schedule-season').value=state.season;
  }
  function renderNext(events) {
    const e = events.find(e=>e.date>=koreaDate()&&e.status!=='cancelled');
    const next = $('schedule-next'); next.hidden=!e;
    if(e) next.innerHTML=`<div><p class="label">${e.date===koreaDate()?'오늘 방송':'다가오는 방송'}</p><strong>${dateLabel(e.date)}</strong><p>${escape(teamName(e.teamId))} · 시즌 ${escape(e.season)} · ${escape(e.session)}회차</p></div><button type="button" class="button primary" data-open-date="${e.date}">일정 확인</button>`;
  }
  function render() {
    const [year,month] = state.month.split('-').map(Number);
    $('schedule-month').textContent=`${year}년 ${month}월`;
    root.querySelectorAll('[data-calendar-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.calendarView===state.view)));
    if(!state.payload) return;
    const events=filtered(); const monthEvents=events.filter(e=>e.date.startsWith(state.month));
    $('schedule-count').textContent=`${state.team==='all'?'전체 팀':teamName(state.team)} · ${monthEvents.length}개 일정${monthEvents.some(e=>e.status==='cancelled')?' (취소 포함)':''}`;
    renderNext(events);
    const notice = $('schedule-notice'); notice.textContent=state.payload.data.notice||''; notice.hidden=!notice.textContent;
    const content=$('schedule-content'); content.setAttribute('aria-busy','false');
    if(state.view==='list') {
      const dates=[...new Set(monthEvents.map(e=>e.date))];
      const dayCard=date=>`<section class="agenda-day ${date===koreaDate()?'is-today':''}"><h4 class="agenda-date"><time datetime="${date}">${dateLabel(date)}</time>${date===koreaDate()?'<span>오늘</span>':''}${date<koreaDate()?'<small>지난 일정</small>':''}</h4><div class="agenda-events">${monthEvents.filter(e=>e.date===date).map(eventCard).join('')}</div></section>`;
      const past=state.month===koreaDate().slice(0,7)?dates.filter(date=>date<koreaDate()):[];
      const visible=dates.filter(date=>!past.includes(date));
      content.innerHTML=dates.length?`${visible.length?`<div class="agenda-list">${visible.map(dayCard).join('')}</div>`:'<p class="schedule-empty">이번 달의 남은 일정이 없습니다.</p>'}${past.length?`<details class="past-schedules"><summary>이번 달 지난 일정 ${monthEvents.filter(e=>e.date<koreaDate()).length}개 보기</summary><div class="agenda-list">${past.map(dayCard).join('')}</div></details>`:''}`:'<p class="schedule-empty">선택한 팀·시즌의 이번 달 일정이 없습니다.<br>다른 달이나 전체 팀을 선택해주세요.</p>';
    } else {
      const offset=new Date(Date.UTC(year,month-1,1)).getUTCDay();
      const days=new Date(Date.UTC(year,month,0)).getUTCDate();
      const cells=Array.from({length:offset},()=>'<div class="calendar-blank" aria-hidden="true"></div>');
      for(let day=1;day<=days;day++) {
        const date=`${state.month}-${String(day).padStart(2,'0')}`;
        const items=monthEvents.filter(e=>e.date===date);
        const label=`${dateLabel(date)}, ${items.length}개 일정`;
        const inner=`<span class="calendar-date">${day}${date===koreaDate()?'<small>오늘</small>':''}</span>${items.map(e=>`<span class="calendar-event ${teamClass(e.teamId)} ${e.status==='cancelled'?'is-cancelled':''}"><b>${escape(teamName(e.teamId).replace('디에르 ',''))}</b><span>${e.status==='cancelled'?'취소':`${escape(e.season)}시즌 · ${escape(e.session)}회`}</span></span>`).join('')}`;
        cells.push(items.length?`<button type="button" class="calendar-day ${date===koreaDate()?'is-today':''}" data-open-date="${date}" aria-label="${label}">${inner}</button>`:`<div class="calendar-day ${date===koreaDate()?'is-today':''}">${inner}</div>`);
      }
      content.innerHTML=`<div class="calendar-weekdays" aria-hidden="true">${dayNames.map(d=>`<span>${d}</span>`).join('')}</div><div class="calendar-grid" aria-label="${year}년 ${month}월 일정">${cells.join('')}</div><p class="schedule-footnote">일정이 있는 날짜를 누르면 의상과 장소를 볼 수 있습니다.</p>`;
    }
    if($('schedule-dialog').open && state.selectedDate) renderDialog();
    renderStudios();
  }
  function renderStudios() {
    window.diereScheduleLoaded=true;
    const today=koreaDate();
    const dateEl=$('today-date'); dateEl.dateTime=today;
    dateEl.textContent=`${today.slice(0,4)}년 ${dateLabel(today)}`;
    const active=state.payload.data.events.filter(e=>e.date===today&&e.status!=='cancelled');
    $('today-studio').textContent=active.length?active.map(e=>`${teamName(e.teamId)} · ${studioFor(e)?.name||'장소 확인 필요'}`).join(' / '):'오늘 등록된 방송 일정이 없습니다. 다음 방송 일정을 확인해주세요.';
    document.querySelector('.studio-grid').innerHTML=state.payload.data.studios.map(studio=>{
      const isToday=active.some(e=>studioFor(e)===studio);
      const days=[...new Set(studio.assignments.map(a=>dayNames[a.weekday]))].join(' · ');
      return `<article class="studio-card ${isToday?'is-today':''}"><div class="studio-card-top"><p class="studio-days">${days}요일</p>${isToday?'<span class="today-badge">오늘 장소</span>':''}</div><h3>${escape(studio.name)}</h3><p class="studio-address">${escape(studio.address)}${studio.details?.length?`<br><strong>${escape(studio.details.join(' · '))}</strong>`:''}</p><dl class="studio-teams">${studio.assignments.map(a=>`<div><dt>${dayNames[a.weekday]}요일</dt><dd>${escape(teamName(a.teamId))}</dd></div>`).join('')}</dl><div class="studio-actions"><a class="button outline" href="https://map.naver.com/p/search/${encodeURIComponent(studio.address)}" target="_blank" rel="noopener noreferrer">네이버 지도</a><button type="button" class="button outline" data-live-address="${escape(studio.address)}">주소 복사</button></div></article>`;
    }).join('');
    document.querySelectorAll('.studio-card').forEach(card=>{const note=studioNotes.get(card.querySelector('h3').textContent);if(note)card.querySelector('.studio-actions').insertAdjacentHTML('beforebegin',note);});
    document.querySelector('#studios > .studio-footnote').textContent='원본 일정표의 요일별 장소 안내입니다. 날짜별 방송 여부는 아래 일정을 확인해주세요.';
  }
  function renderDialog() {
    $('schedule-dialog-title').textContent=dateLabel(state.selectedDate)+' 일정';
    const events=filtered().filter(e=>e.date===state.selectedDate);
    $('schedule-dialog-content').innerHTML=events.length?events.map(eventCard).join(''):'<p class="schedule-empty">이 날짜의 일정이 변경되거나 삭제되었습니다.</p>';
  }
  function openDate(date) {state.selectedDate=date;renderDialog();if(!$('schedule-dialog').open)$('schedule-dialog').showModal();}
  function setStatus(message, failed=false) {$('schedule-sync').textContent=message;$('schedule-sync').classList.toggle('sync-error',failed);}
  const timeLabel = iso => new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(iso));
  async function refresh(manual=false) {
    if(state.busy || (!manual && document.hidden)) return;
    state.busy=true;$('schedule-refresh').disabled=true;
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),18000);
    if(manual)setStatus('최신 일정을 확인하고 있습니다.');
    try {
      const response=await fetch(API,{cache:'no-store',credentials:'omit',signal:controller.signal});
      if(!response.ok)throw Error('Schedule unavailable');
      const payload=await response.json();if(!validPayload(payload))throw Error('Invalid schedule');
      lastSuccess=new Date().toISOString();
      const signature=JSON.stringify(payload.data);
      const day=koreaDate();
      if(signature!==state.signature||day!==state.lastDate) {
        const focus=document.activeElement;
        const focusedTeam=focus?.dataset?.team;
        state.payload=payload;state.signature=signature;state.lastDate=day;
        syncFilters();render();
        if(focusedTeam) [...$('schedule-teams').children].find(b=>b.dataset.team===focusedTeam)?.focus({preventScroll:true});
      }
      setStatus(`자동 연동 중 · ${timeLabel(lastSuccess)} 확인`);
      try{localStorage.setItem(CACHE_KEY,JSON.stringify({payload,checkedAt:lastSuccess}));}catch{}
    } catch {
      setStatus(lastSuccess?`연결 재시도 중 · ${timeLabel(lastSuccess)}에 확인한 일정입니다.`:'일정을 연결하지 못했습니다. 새로고침하거나 원본 일정표를 확인해주세요.',true);
      if(!state.payload){$('schedule-content').setAttribute('aria-busy','false');$('schedule-content').innerHTML='<p class="schedule-empty">일정을 불러오지 못했습니다.<br>상단의 새로고침 또는 원본 일정표를 이용해주세요.</p>';}
    } finally {clearTimeout(timeout);state.busy=false;$('schedule-refresh').disabled=false;}
  }
  root.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.team){state.team=button.dataset.team;syncFilters();render();[...$('schedule-teams').children].find(b=>b.dataset.team===state.team)?.focus({preventScroll:true});}
    if(button.dataset.calendarView){state.view=button.dataset.calendarView;render();}
    if(button.dataset.openDate)openDate(button.dataset.openDate);
  });
  $('schedule-season').addEventListener('change',e=>{state.season=e.target.value;render();});
  function moveMonth(delta){const [year,month]=state.month.split('-').map(Number);state.month=new Date(Date.UTC(year,month-1+delta,1)).toISOString().slice(0,7);render();}
  $('schedule-prev').addEventListener('click',()=>moveMonth(-1));
  $('schedule-next-month').addEventListener('click',()=>moveMonth(1));
  $('schedule-today').addEventListener('click',()=>{state.month=koreaDate().slice(0,7);render();});
  $('schedule-refresh').addEventListener('click',()=>refresh(true));
  document.querySelector('.studio-grid').addEventListener('click',async event=>{
    const button=event.target.closest('[data-live-address]');if(!button)return;
    try {await navigator.clipboard.writeText(button.dataset.liveAddress);announce('스튜디오 주소가 복사되었습니다.');}
    catch {const d=$('copy-dialog');d.querySelector('h2').textContent='스튜디오 주소를 복사해주세요';d.querySelector('p').textContent='아래 주소를 길게 누르거나 선택해 복사해주세요.';$('copy-fallback').value=button.dataset.liveAddress;d.showModal();$('copy-fallback').focus();$('copy-fallback').select();}
  });
  try {
    const cached=JSON.parse(localStorage.getItem(CACHE_KEY));
    if(validPayload(cached?.payload)&&Number.isFinite(Date.parse(cached.checkedAt))){state.payload=cached.payload;state.signature=JSON.stringify(cached.payload.data);lastSuccess=cached.checkedAt;syncFilters();render();setStatus(`${timeLabel(lastSuccess)}에 저장한 일정 · 최신 내용 확인 중`,true);}
  }catch{}
  render();refresh();
  setInterval(()=>refresh(),30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  window.addEventListener('focus',()=>refresh());window.addEventListener('online',()=>refresh());
  window.addEventListener('offline',()=>setStatus(lastSuccess?`오프라인 · ${timeLabel(lastSuccess)}에 확인한 일정입니다.`:'오프라인입니다. 연결 후 다시 시도해주세요.',true));
})();
