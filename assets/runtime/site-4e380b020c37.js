(() => {
  function loadSlide(img){
    if(img.dataset.sizes){img.sizes=img.dataset.sizes;delete img.dataset.sizes;}
    if(img.dataset.srcset){img.srcset=img.dataset.srcset;delete img.dataset.srcset;}
    img.src=img.dataset.src;delete img.dataset.src;
  }
  const chinese=document.documentElement.lang==='zh-CN';
  const ui=(en,zh)=>chinese?zh:en;
  document.querySelector('[data-language-switch]')?.addEventListener('click',event=>{
    const link=event.currentTarget;
    link.hash='';
    if(document.body.dataset.preview==='true')return;
    // An old URL hash or intersection highlight can point to a different section.
    const panels=[...document.querySelectorAll('main>.panel')];
    const panel=panels.find(p=>p.getBoundingClientRect().bottom>innerHeight*.3);
    try{sessionStorage.setItem('portfolio-language-position',JSON.stringify({path:new URL(link.href).pathname,y:scrollY,id:panel?.id,top:panel?.getBoundingClientRect().top,time:Date.now()}));}catch{}
  });
  if(document.body.dataset.preview!=='true'){
    try{
      const saved=JSON.parse(sessionStorage.getItem('portfolio-language-position')||'null');
      if(saved?.path===location.pathname){
        sessionStorage.removeItem('portfolio-language-position');
        if(Date.now()-saved.time<30000){
          const restore=()=>{const panel=saved.id&&document.getElementById(saved.id);scrollTo({top:panel?scrollY+panel.getBoundingClientRect().top-saved.top:saved.y,behavior:'instant'});};
          restore();window.addEventListener('load',restore,{once:true});
        }
      }
    }catch{}
  }
  // Fit the element itself to the full image, so edge masks never land in letterboxing.
  const imageFrames = document.querySelectorAll('.bg-slide:not(video),.detail-image-frame,.album-image-frame');
  const pendingFrames=new Set();let fitRequest=0;
  const measureImage = frame => {
    const img = frame.querySelector('img');
    const frameWidth=frame.clientWidth,frameHeight=frame.clientHeight;
    if (!img?.naturalWidth || !frameWidth || !frameHeight) return;
    const ratio = img.naturalWidth / img.naturalHeight;
    const width = Math.min(frameWidth, frameHeight * ratio);
    return {img,width:`${width/frameWidth}`,height:`${width/ratio/frameHeight}`};
  };
  const fitImage=frame=>{
    pendingFrames.add(frame);if(fitRequest)return;
    fitRequest=requestAnimationFrame(()=>{
      fitRequest=0;const measurements=[...pendingFrames].map(measureImage).filter(Boolean);pendingFrames.clear();
      for(const {img,width,height}of measurements){
        if(img.style.getPropertyValue('--fit-width')!==width)img.style.setProperty('--fit-width',width);
        if(img.style.getPropertyValue('--fit-height')!==height)img.style.setProperty('--fit-height',height);
      }
    });
  };
  const imageFrameObserver = new ResizeObserver(entries => entries.forEach(({target}) => fitImage(target)));
  imageFrames.forEach(frame => {
    frame.querySelector('img')?.addEventListener('load', () => fitImage(frame));
    imageFrameObserver.observe(frame);
    fitImage(frame);
  });
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touchScreen=matchMedia('(pointer: coarse)').matches;
  const saveData=!!navigator.connection?.saveData;
    document.querySelectorAll('.dial-timeline').forEach(dial=>{
    const dates=[...dial.querySelectorAll('.dial-date')],panels=[...dial.querySelectorAll('.dial-content')];let current=0;
    const select=(i,focus=false)=>{current=Math.max(0,Math.min(dates.length-1,i));dates.forEach((d,n)=>{d.setAttribute('aria-selected',String(n===current));d.tabIndex=n===current?0:-1;panels[n].hidden=n!==current;});dial.style.setProperty('--angle',dates[current].dataset.angle+'deg');if(focus)dates[current].focus({preventScroll:true});};
    dates.forEach((d,i)=>{d.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')select(i);});d.addEventListener('focus',()=>select(i));d.addEventListener('click',()=>select(i));d.addEventListener('keydown',e=>{if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();select(e.key==='Home'?0:e.key==='End'?dates.length-1:i+(['ArrowDown','ArrowRight'].includes(e.key)?1:-1),true);}});});
    dial.querySelector('[data-dial-prev]').onclick=()=>select(current-1,true);
    dial.querySelector('[data-dial-next]').onclick=()=>select(current+1,true);
    const fromHash=()=>{const n=dates.findIndex(d=>'#record-'+d.dataset.recordIndex===location.hash);select(n<0?0:n);};fromHash();window.addEventListener('hashchange',fromHash);
  });
  
  
  const menu = document.querySelector('.menu-toggle');
  menu?.addEventListener('click', () => {
    const open = document.querySelector('.nav-links').classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
  });
  document.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.remove('open'); menu?.setAttribute('aria-expanded', 'false');
  }));
  document.addEventListener('click',event=>{
    const a=event.target.closest('a');if(!a||a.target||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const url=new URL(a.href),here=new URL(document.baseURI);
    const samePage=document.body.dataset.preview==='true'
      ? document.querySelector('main>.panel')&&url.pathname===`/site/index${chinese?'.zh':''}.html`
      : url.origin===location.origin&&url.pathname===location.pathname;
    if(!samePage||url.origin!==here.origin||!url.hash)return;
    const target=document.getElementById(decodeURIComponent(url.hash.slice(1)));if(!target)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(document.body.dataset.preview!=='true')history.replaceState(null,'',url.hash);
    target.scrollIntoView({behavior:'instant',block:'start'});
  });
  
  
  
  
  if (document.body.dataset.preview === 'true') document.addEventListener('click', e => {
    const origin=new URL(document.baseURI).origin;
    const a=e.target.closest('a'); if (!a || a.target==='_blank' || a.origin!==origin) return;
    const target=new URL(a.href);
    if(target.pathname.startsWith('/site/') && target.pathname.endsWith('.html')) {
      e.preventDefault(); parent.postMessage({type:'portfolio-preview-page',page:target.pathname.slice(6),hash:target.hash,preserveScroll:!!a.matches('[data-language-switch]')},origin);
    }
  });
})();
