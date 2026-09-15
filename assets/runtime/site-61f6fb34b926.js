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
  
    document.querySelectorAll('.life-album').forEach(album=>{
    const track=album.querySelector('.album-track'),slides=[...track.children],pause=album.querySelector('[data-album-pause]');
    let current=0,paused=reduceMotion||touchScreen||saveData,hover=false,visible=false,timer,scrollRequest=0,offsets=[];
    const measureOffsets=()=>{offsets=slides.map(s=>s.offsetLeft);};
    new ResizeObserver(measureOffsets).observe(track);measureOffsets();
    const go=i=>{if(!slides.length)return;current=(i+slides.length)%slides.length;track.scrollTo({left:offsets[current],behavior:reduceMotion?'instant':'smooth'});};
    const schedule=()=>{clearInterval(timer);if(slides.length>1&&visible&&!paused&&!hover&&!document.hidden)timer=setInterval(()=>go(current+1),Math.max(3,Number(album.dataset.interval)||4)*1000);};
    const count=album.querySelector('[data-album-count]');
    const updateCount=()=>{scrollRequest=0;const left=track.scrollLeft;current=offsets.reduce((best,offset,i)=>Math.abs(offset-left)<Math.abs(offsets[best]-left)?i:best,0);const text=(slides.length?current+1:0)+' / '+slides.length;if(count.textContent!==text)count.textContent=text;};
    track.addEventListener('scroll',()=>{if(!scrollRequest)scrollRequest=requestAnimationFrame(updateCount);},{passive:true});updateCount();
    track.addEventListener('pointerdown',()=>{if(touchScreen){paused=true;label();schedule();}},{passive:true});
    album.querySelector('[data-album-prev]').onclick=()=>{go(current-1);schedule();};album.querySelector('[data-album-next]').onclick=()=>{go(current+1);schedule();};
    const label=()=>{pause.textContent=paused?ui('Play','播放'):ui('Pause','暂停');pause.setAttribute('aria-pressed',String(paused));};pause.onclick=()=>{paused=!paused;label();schedule();};label();
    track.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hover=true;schedule();}});track.addEventListener('pointerleave',()=>{hover=false;schedule();});
    track.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();go(current+(e.key==='ArrowRight'?1:-1));schedule();}});
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.1}).observe(album);document.addEventListener('visibilitychange',schedule);
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
