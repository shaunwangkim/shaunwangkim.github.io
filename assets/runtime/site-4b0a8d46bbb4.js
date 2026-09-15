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
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) document.querySelectorAll('.nav-links a').forEach(a => a.classList.toggle('active', a.hash === '#' + entry.target.id));
  }), {threshold: .55});
  document.querySelectorAll('.panel').forEach(panel => {
    observer.observe(panel);
    const slides = [...panel.querySelectorAll('.bg-slide')];
    let current = 0, visible = false, paused = reduceMotion||saveData||touchScreen, timer,fadeTimer;
    if(touchScreen&&slides.length>1&&!panel.querySelector('[data-slide-next]')){
      const controls=document.createElement('div');controls.className='slide-controls';
      controls.innerHTML=`<button data-slide-prev aria-label="${ui('Previous image','上一张图片')}">←</button><span class="slide-count">1 / ${slides.length}</span><button data-slide-next aria-label="${ui('Next image','下一张图片')}">→</button><button data-slide-pause></button>`;
      panel.querySelector('.panel-copy')?.append(controls);
    }
    const show = next => {
      current = (next + slides.length) % slides.length;
      clearTimeout(fadeTimer);
      slides.forEach((slide, i) => {
        slide.classList.toggle('leaving',slide.classList.contains('current')&&i!==current);
        slide.classList.toggle('current', i === current);
        const media=slide.matches('img,video')?slide:slide.querySelector('img,video');
        if (i === current && media?.dataset.src) {loadSlide(media);}
      });
      fadeTimer=setTimeout(()=>slides.forEach(slide=>slide.classList.remove('leaving')),reduceMotion?0:1250);
      const count = panel.querySelector('.slide-count');
      if (count) count.textContent = `${current + 1} / ${slides.length}`;
      const nextFrame=slides[(current+1)%slides.length],nextSlide=nextFrame?.matches('img')?nextFrame:nextFrame?.querySelector('img');
      if(!saveData&&!touchScreen&&nextSlide?.tagName==='IMG'&&nextSlide.dataset.src){loadSlide(nextSlide);}
    };
    const schedule = () => {
      clearInterval(timer);
      if (visible && !paused && !document.hidden && slides.length > 1)
        timer = setInterval(() => show(current + 1), Math.max(3, Number(panel.dataset.interval) || 6) * 1000);
    };
    panel.querySelector('[data-slide-prev]')?.addEventListener('click', () => {show(current - 1); schedule();});
    panel.querySelector('[data-slide-next]')?.addEventListener('click', () => {show(current + 1); schedule();});
    const pause = panel.querySelector('[data-slide-pause]');
    const pauseLabel = () => {if (pause) {pause.textContent = paused ? ui('Play','播放') : ui('Pause','暂停'); pause.setAttribute('aria-pressed', String(paused));pause.title=paused?'开始图片轮播':'自动轮播中';}};
    pause?.addEventListener('click', () => {paused = !paused; pauseLabel(); schedule();}); pauseLabel();
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;panel.classList.toggle('slides-offscreen',!visible); if(visible&&slides.length>1)show(current); schedule();
      panel.querySelectorAll('video[data-background]').forEach(v => {
        if (visible && !reduceMotion && !paused) {if(v.dataset.src){v.src=v.dataset.src;delete v.dataset.src;}v.play().catch(()=>{});} else v.pause();
      });
    }, {threshold: .1}).observe(panel);
    document.addEventListener('visibilitychange',()=>{schedule();panel.querySelectorAll('video[data-background]').forEach(v=>{if(document.hidden)v.pause();else if(visible&&!reduceMotion&&!paused)v.play().catch(()=>{});});});
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
