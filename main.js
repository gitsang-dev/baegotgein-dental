/* =========================================================
   배곧건치과의원 — interactions (native scroll, no smooth-scroll lib)
   ========================================================= */
gsap.registerPlugin(ScrollTrigger);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- nav + callbar + scroll progress ---------- */
(function(){
  const nav=document.getElementById('nav'); const bar=document.querySelector('.callbar');
  const prog=document.createElement('div'); prog.className='scrollprog'; document.body.appendChild(prog);
  let ticking=false;
  function onScroll(){
    const y=window.scrollY||document.documentElement.scrollTop;
    const max=document.documentElement.scrollHeight-window.innerHeight;
    nav.classList.toggle('scrolled', y>20);
    if(bar) bar.classList.toggle('show', y>760);
    prog.style.transform='scaleX('+(max>0?y/max:0)+')';
    ticking=false;
  }
  window.addEventListener('scroll',()=>{ if(!ticking){ticking=true;requestAnimationFrame(onScroll);} },{passive:true});
  onScroll();
})();

/* ---------- HERO banner slider ---------- */
(function(){
  const track=document.getElementById('heroTrack');
  if(!track) return;
  const slides=[...track.querySelectorAll('.banner')];
  const dots=[...document.querySelectorAll('#heroDots button')];
  const prev=document.getElementById('heroPrev'), next=document.getElementById('heroNext');
  const N=slides.length; let cur=0, timer=null; const DUR=5000;
  function show(i){
    cur=(i+N)%N;
    slides.forEach((s,x)=>s.classList.toggle('is-active',x===cur));
    dots.forEach((d,x)=>d.classList.toggle('is-active',x===cur));
  }
  function play(){ if(reduce) return; stop(); timer=setInterval(()=>show(cur+1),DUR); }
  function stop(){ if(timer){clearInterval(timer);timer=null;} }
  prev&&prev.addEventListener('click',()=>{show(cur-1);play();});
  next&&next.addEventListener('click',()=>{show(cur+1);play();});
  dots.forEach((d,x)=>d.addEventListener('click',()=>{show(x);play();}));
  const hero=document.querySelector('.hero');
  hero.addEventListener('mouseenter',stop); hero.addEventListener('mouseleave',play);
  show(0); play();
})();

/* ---------- reveals ---------- */
(function(){
  const items=document.querySelectorAll('[data-reveal]');
  if(reduce || !('IntersectionObserver' in window)){ items.forEach(e=>e.classList.add('reveal-in')); return; }
  const io=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('reveal-in'); io.unobserve(e.target); } });
  },{rootMargin:'0px 0px -8% 0px',threshold:0.05});
  items.forEach(el=>io.observe(el));
  gsap.utils.toArray('.sec-head').forEach(el=>{
    gsap.from(el.children,{y:24,opacity:0,duration:.9,ease:'expo.out',stagger:.08,scrollTrigger:{trigger:el,start:'top 86%'}});
  });
  gsap.utils.toArray('.pcard').forEach((el,i)=>{
    gsap.from(el,{y:32,opacity:0,duration:.9,ease:'expo.out',delay:i*.1,scrollTrigger:{trigger:'.cards',start:'top 84%'}});
  });
  gsap.utils.toArray('.quick__item').forEach((el,i)=>{
    gsap.from(el,{y:18,opacity:0,duration:.7,ease:'expo.out',delay:i*.07,scrollTrigger:{trigger:'.quick',start:'top 94%'}});
  });
})();

/* ---------- care tabs ---------- */
(function(){
  const tabs=document.querySelectorAll('#careTabs button');
  const panels=document.querySelectorAll('.care__panel');
  tabs.forEach(btn=>{
    btn.addEventListener('click',()=>{
      const i=btn.dataset.i;
      tabs.forEach(b=>b.classList.toggle('is-active',b===btn));
      panels.forEach(p=>{
        const on=p.dataset.i===i; p.classList.toggle('is-active',on);
        if(on&&!reduce) gsap.fromTo(p.querySelector('.care__text'),{opacity:0,y:16},{opacity:1,y:0,duration:.55,ease:'expo.out'});
      });
    });
  });
})();

/* ---------- FAQ accordion (subpages) ---------- */
(function(){
  document.querySelectorAll('.faq__q').forEach(q=>{
    q.addEventListener('click',()=>{
      const item=q.closest('.faq__item');
      const open=item.classList.contains('is-open');
      item.parentElement.querySelectorAll('.faq__item.is-open').forEach(o=>{if(o!==item)o.classList.remove('is-open');});
      item.classList.toggle('is-open',!open);
    });
  });
})();

/* ---------- footer wordmark parallax ---------- */
if(!reduce){
  gsap.fromTo('.foot__mark span',{xPercent:-4},{xPercent:4,ease:'none',scrollTrigger:{trigger:'.foot',start:'top bottom',end:'bottom bottom',scrub:true}});
}

/* ---------- LIVE 진료 status (KST) ---------- */
(function(){
  const SCHED={1:[570,1200],4:[570,1200],2:[570,1110],5:[570,1110],6:[510,750]};
  const LUNCH=[780,840]; const DAYK=['일','월','화','수','목','금','토'];
  function fmt(m){const h=Math.floor(m/60),mm=m%60;return (h<12?'오전':'오후')+' '+((h%12)||12)+(mm?':'+String(mm).padStart(2,'0'):'시');}
  function now(){const d=new Date();const utc=d.getTime()+d.getTimezoneOffset()*60000;return new Date(utc+9*3600000);}
  function compute(){
    const d=now();const day=d.getDay();const min=d.getHours()*60+d.getMinutes();const s=SCHED[day];
    if(s){
      const isLunch=(day>=1&&day<=5)&&min>=LUNCH[0]&&min<LUNCH[1];
      if(min>=s[0]&&min<s[1]){
        if(isLunch) return {state:'lunch',msg:'점심시간 · 오후 2시 진료 재개',short:'점심시간 (14시 재개)'};
        return {state:'open',msg:'지금 진료 중 · '+fmt(s[1])+' 마감',short:'진료 중 · '+fmt(s[1])+' 마감'};
      }
    }
    for(let i=1;i<=7;i++){const nd=(day+i)%7;if(SCHED[nd])return{state:'closed',msg:'진료 종료 · '+DAYK[nd]+'요일 '+fmt(SCHED[nd][0])+' 오픈',short:DAYK[nd]+'요일 '+fmt(SCHED[nd][0])+' 오픈'};}
    return {state:'closed',msg:'진료 시간을 확인해 주세요',short:'진료시간 확인'};
  }
  function paint(){
    const r=compute();
    document.querySelectorAll('#statusPill2').forEach(el=>{
      el.classList.remove('is-open','is-lunch','is-closed');el.classList.add('is-'+r.state);
      const b=el.querySelector('b');if(b)b.textContent=r.msg;
    });
    const qh=document.getElementById('quickHours'); if(qh) qh.textContent=r.short;
  }
  paint();setInterval(paint,60000);
})();

window.addEventListener('load',()=>ScrollTrigger.refresh());
document.fonts&&document.fonts.ready.then(()=>ScrollTrigger.refresh());
