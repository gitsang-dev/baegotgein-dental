/* =========================================================
   배곧건치과의원 — interactions
   ========================================================= */
gsap.registerPlugin(ScrollTrigger);
let reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
if(location.search.includes('static')) reduce = true;

/* ---------- Lenis ---------- */
let lenis;
if(!reduce && window.Lenis){
  lenis = new Lenis({lerp:.12, wheelMultiplier:1.05, syncTouch:true});
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t=>lenis.raf(t*1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const id=a.getAttribute('href');
      if(id.length>1 && document.querySelector(id)){ e.preventDefault(); lenis.scrollTo(id,{offset:-70,duration:1.3}); }
    });
  });
}

/* ---------- nav + callbar ---------- */
(function(){
  const nav=document.getElementById('nav'); const bar=document.querySelector('.callbar');
  ScrollTrigger.create({start:0,end:'max',onUpdate:s=>{
    const y=s.scroll();
    nav.classList.toggle('scrolled', y>20);
    if(bar) bar.classList.toggle('show', y>760);
  }});
})();

/* ---------- HERO slider ---------- */
(function(){
  const slides=[...document.querySelectorAll('.slide')];
  const copiesH=[...document.querySelectorAll('.hero__copy h1')];
  const copiesP=[...document.querySelectorAll('.hero__copy p')];
  const bar=document.getElementById('heroBar');
  const num=document.getElementById('heroNum');
  const prev=document.getElementById('heroPrev'), next=document.getElementById('heroNext'), play=document.getElementById('heroPlay');
  if(!slides.length) return;
  const N=slides.length, DUR=6;
  let cur=0, playing=!reduce, barTween;

  function show(i){
    cur=(i+N)%N;
    slides.forEach((s,x)=>s.classList.toggle('is-active',x===cur));
    copiesH.forEach((h,x)=>h.hidden=(x!==cur));
    copiesP.forEach((p,x)=>p.hidden=(x!==cur));
    num.textContent=String(cur+1).padStart(2,'0');
    // always restore every copy to a visible resting state so a fast/interrupted
    // transition can never leave a headline stuck at opacity 0
    gsap.killTweensOf('.hero__copy h1 > *, .hero__copy p');
    gsap.set('.hero__copy h1 > *, .hero__copy p',{opacity:1,y:0,yPercent:0});
    if(!reduce){
      gsap.from(copiesH[cur].children,{yPercent:60,opacity:0,duration:.8,stagger:.08,ease:'expo.out',overwrite:true});
      gsap.from(copiesP[cur],{y:14,opacity:0,duration:.7,ease:'expo.out',overwrite:true});
    }
    runBar();
  }
  function runBar(){
    if(barTween) barTween.kill();
    gsap.set(bar,{scaleX:0});
    if(playing && !reduce){
      barTween=gsap.to(bar,{scaleX:1,duration:DUR,ease:'none',onComplete:()=>show(cur+1)});
    } else { gsap.set(bar,{scaleX: reduce?1:0}); }
  }
  function setPlay(p){ playing=p; play.classList.toggle('playing',p); runBar(); }

  prev.addEventListener('click',()=>{show(cur-1);});
  next.addEventListener('click',()=>{show(cur+1);});
  play.addEventListener('click',()=>setPlay(!playing));
  show(0);
  if(reduce) setPlay(false);
})();

/* ---------- reveals ---------- */
(function(){
  if(reduce){ document.querySelectorAll('[data-reveal]').forEach(e=>e.classList.add('reveal-in')); return; }
  document.querySelectorAll('[data-reveal]').forEach(el=>{
    ScrollTrigger.create({trigger:el,start:'top 86%',once:true,onEnter:()=>el.classList.add('reveal-in')});
  });
  gsap.utils.toArray('.sec-head').forEach(el=>{
    gsap.from(el.children,{y:26,opacity:0,duration:.9,ease:'expo.out',stagger:.08,scrollTrigger:{trigger:el,start:'top 84%'}});
  });
  gsap.utils.toArray('.pcard').forEach((el,i)=>{
    gsap.from(el,{y:34,opacity:0,duration:.9,ease:'expo.out',delay:i*.1,scrollTrigger:{trigger:'.cards',start:'top 82%'}});
  });
  gsap.utils.toArray('.quick__item').forEach((el,i)=>{
    gsap.from(el,{y:20,opacity:0,duration:.7,ease:'expo.out',delay:i*.08,scrollTrigger:{trigger:'.quick',start:'top 92%'}});
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
        if(on&&!reduce) gsap.fromTo(p.querySelector('.care__text'),{opacity:0,y:16},{opacity:1,y:0,duration:.6,ease:'expo.out'});
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
        if(isLunch) return {state:'lunch',msg:'점심시간 · 오후 2시 진료 재개'};
        return {state:'open',msg:'지금 진료 중 · '+fmt(s[1])+' 마감'};
      }
    }
    for(let i=1;i<=7;i++){const nd=(day+i)%7;if(SCHED[nd])return{state:'closed',msg:'진료 종료 · '+DAYK[nd]+'요일 '+fmt(SCHED[nd][0])+' 오픈'};}
    return {state:'closed',msg:'진료 시간을 확인해 주세요'};
  }
  function paint(){
    const r=compute();
    document.querySelectorAll('#statusPill,#statusPill2').forEach(el=>{
      el.classList.remove('is-open','is-lunch','is-closed');el.classList.add('is-'+r.state);
      const b=el.querySelector('b');if(b)b.textContent=r.msg;
    });
  }
  paint();setInterval(paint,60000);
})();

window.addEventListener('load',()=>ScrollTrigger.refresh());
document.fonts&&document.fonts.ready.then(()=>ScrollTrigger.refresh());
