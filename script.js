(() => {
  const loader = document.getElementById("loader");
  const loaderCanvas = document.getElementById("loaderCanvas");
  const canvas = document.getElementById("skyCanvas");
  const lctx = loaderCanvas.getContext("2d");
  const ctx = canvas.getContext("2d");
  const percent = document.getElementById("loaderPercent");
  const step = document.getElementById("loaderStep");
  const bar = document.getElementById("loaderBar");
  const topTime = document.getElementById("topTime");
  const cardTime = document.getElementById("cardTime");
  const cardDate = document.getElementById("cardDate");
  const orb = document.getElementById("orb");
  const cardLeft = document.getElementById("cardLeft");
  const cardRight = document.getElementById("cardRight");

  lucide.createIcons();

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 700px)").matches;
  const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.35 : 1.8);

  let W = innerWidth, H = innerHeight;
  let pointer = {x: W/2, y:H/2, tx:W/2, ty:H/2};
  let particles = [], clouds = [], shooting = [];

  function size(c, context) {
    c.width = Math.floor(W*dpr);
    c.height = Math.floor(H*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
  }

  function resize() {
    W = innerWidth; H = innerHeight;
    size(canvas,ctx); size(loaderCanvas,lctx);
    makeScene();
  }
  addEventListener("resize", resize, {passive:true});

  function rand(a,b){ return a + Math.random()*(b-a); }

  function makeScene(){
    particles = Array.from({length: mobile ? 75 : 145}, () => ({
      x:Math.random()*W, y:Math.random()*H, r:rand(.35,1.45),
      a:rand(.12,.72), s:rand(.03,.16), phase:Math.random()*Math.PI*2
    }));
    clouds = Array.from({length: mobile ? 8 : 13}, () => ({
      x:rand(-W*.2,W*1.1), y:rand(H*.2,H*.95), rx:rand(80,230), ry:rand(18,65),
      speed:rand(.06,.22), alpha:rand(.025,.085)
    }));
    shooting = [];
  }
  resize();

  function skyGradient(context) {
    const g=context.createLinearGradient(0,0,0,H);
    g.addColorStop(0,"#050611"); g.addColorStop(.48,"#0b0d23"); g.addColorStop(1,"#10102b");
    context.fillStyle=g; context.fillRect(0,0,W,H);
  }

  function drawSky(context, time, loaderMode=false) {
    skyGradient(context);
    const cx = W*(.5 + (pointer.x-W/2)/W*.035);
    const cy = H*(.40 + (pointer.y-H/2)/H*.025);

    const glow=context.createRadialGradient(cx,cy,0,cx,cy,Math.min(W,H)*.55);
    glow.addColorStop(0,"rgba(100,223,223,.10)");
    glow.addColorStop(.3,"rgba(200,198,255,.055)");
    glow.addColorStop(.65,"rgba(247,37,133,.018)");
    glow.addColorStop(1,"transparent");
    context.fillStyle=glow; context.fillRect(0,0,W,H);

    // stars
    for(const p of particles){
      const yy=(p.y + time*p.s*.12) % H;
      const tw=.55 + Math.sin(time*.001 + p.phase)*.45;
      context.beginPath(); context.arc(p.x,yy,p.r,0,Math.PI*2);
      context.fillStyle=`rgba(220,225,255,${p.a*tw})`; context.fill();
    }

    // mist/cloud ellipses
    context.save(); context.filter = mobile ? "blur(18px)" : "blur(30px)";
    for(const c of clouds){
      c.x += c.speed * .06;
      if(c.x-c.rx>W+100)c.x=-c.rx;
      context.beginPath(); context.ellipse(c.x,c.y,c.rx,c.ry,0,0,Math.PI*2);
      const cg=context.createRadialGradient(c.x,c.y,0,c.x,c.y,c.rx);
      cg.addColorStop(0,`rgba(175,190,230,${c.alpha})`);
      cg.addColorStop(1,"transparent");
      context.fillStyle=cg; context.fill();
    }
    context.restore();

    // occasional shooting stars
    if(!loaderMode && Math.random()<.006 && shooting.length<2) {
      shooting.push({x:rand(0,W),y:rand(0,H*.65),vx:rand(7,12),vy:rand(2,5),life:0,max:rand(35,65)});
    }
    for(let i=shooting.length-1;i>=0;i--){
      const s=shooting[i]; s.x+=s.vx;s.y+=s.vy;s.life++;
      const grad=context.createLinearGradient(s.x-s.vx*7,s.y-s.vy*7,s.x,s.y);
      grad.addColorStop(0,"transparent");grad.addColorStop(1,"rgba(220,230,255,.8)");
      context.strokeStyle=grad;context.lineWidth=1;
      context.beginPath();context.moveTo(s.x-s.vx*8,s.y-s.vy*8);context.lineTo(s.x,s.y);context.stroke();
      if(s.life>s.max)shooting.splice(i,1);
    }
  }

  let start=performance.now();
  function loaderLoop(now){
    drawSky(lctx, now, true);
    if(!loader.classList.contains("done")) requestAnimationFrame(loaderLoop);
  }
  requestAnimationFrame(loaderLoop);

  function animate(now){
    pointer.x += (pointer.tx-pointer.x)*.055;
    pointer.y += (pointer.ty-pointer.y)*.055;
    drawSky(ctx,now,false);

    const px=(pointer.x-W/2)/W, py=(pointer.y-H/2)/H;
    if(!reduceMotion){
      orb.style.transform=`translate(calc(-50% + ${px*18}px), calc(-50% + ${py*14}px)) rotateX(${py*-5}deg) rotateY(${px*7}deg)`;
      cardLeft.style.transform=`translate(${px*-18}px,${py*-12}px)`;
      cardRight.style.transform=`translate(${px*15}px,${py*10}px)`;
    }
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  addEventListener("pointermove", e => {
    pointer.tx=e.clientX; pointer.ty=e.clientY;
  }, {passive:true});
  addEventListener("pointerdown", e => {
    pointer.tx=e.clientX; pointer.ty=e.clientY;
  }, {passive:true});

  // Procedural waveform
  const wave=document.getElementById("wave");
  for(let i=0;i<31;i++){
    const b=document.createElement("b");
    b.style.setProperty("--h", `${rand(20,95)}%`);
    b.style.animationDelay=`${-rand(0,1.1)}s`;
    wave.appendChild(b);
  }

  function clock(){
    const now=new Date();
    const time=new Intl.DateTimeFormat([], {hour:"2-digit",minute:"2-digit"}).format(now);
    const date=new Intl.DateTimeFormat([], {weekday:"short",month:"short",day:"numeric"}).format(now);
    topTime.textContent=time;
    cardTime.textContent=time;
    cardDate.textContent=date;
  }
  clock(); setInterval(clock,1000);

  // Cinematic preloader
  const steps=[
    [0,"Gathering Starlight..."],
    [28,"Painting The Clouds..."],
    [57,"Opening The Sky..."],
    [82,"Finding Quiet Moments..."],
    [100,"Welcome, Farhan."]
  ];
  const duration=2800;
  const t0=performance.now();

  function loadProgress(now){
    const raw=Math.min(1,(now-t0)/duration);
    const eased=1-Math.pow(1-raw,3);
    const value=Math.floor(eased*100);
    percent.textContent=value+"%";
    bar.style.width=value+"%";
    let current=steps[0][1];
    for(const item of steps) if(value>=item[0]) current=item[1];
    step.textContent=current;

    if(raw<1) requestAnimationFrame(loadProgress);
    else setTimeout(()=>loader.classList.add("done"),450);
  }
  requestAnimationFrame(loadProgress);

  // Prevent placeholder social links from navigating.
  document.querySelectorAll('[data-unset="true"]').forEach(a=>{
    a.addEventListener("click",e=>{
      e.preventDefault();
      a.animate([{transform:"scale(.94)"},{transform:"scale(1)"}],{duration:260});
    });
  });
})();
