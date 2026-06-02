// ═══════════════════════════════════════════
// CRUMPLE TEXTURE
// ═══════════════════════════════════════════
const crumpleImg = new Image();
let crumpleReady = false;

crumpleImg.onload = () => {
  crumpleReady = true;
  const status = document.getElementById('texture-status');
  status.textContent = 'texture loaded ✓';
  setTimeout(() => status.style.opacity = '0', 1500);
};
crumpleImg.onerror = () => {
  const status = document.getElementById('texture-status');
  status.textContent = 'Texture.jpg not found';
  status.style.color = 'rgba(212,90,30,0.5)';
  setTimeout(() => status.style.opacity = '0', 4000);
};
crumpleImg.src = 'Texture.jpg';

// ═══════════════════════════════════════════
// DRAWING
// ═══════════════════════════════════════════
const drawCanvas  = document.getElementById('drawing-canvas');
const drawCtx     = drawCanvas.getContext('2d');
const linesCanvas = document.getElementById('drawing-canvas-lines');
const linesCtx    = linesCanvas.getContext('2d');
let isDrawing = false, lastX = 0, lastY = 0, hasDrawing = false;
let currentDrawingData = null;

function drawLines() {
  linesCtx.clearRect(0,0,240,240);
  linesCtx.strokeStyle = '#c8d4e8'; linesCtx.lineWidth = 0.8;
  for (let y = 28; y < 240; y += 20) { linesCtx.beginPath(); linesCtx.moveTo(8,y); linesCtx.lineTo(232,y); linesCtx.stroke(); }
  linesCtx.strokeStyle = '#e8a0a0'; linesCtx.lineWidth = 1;
  linesCtx.beginPath(); linesCtx.moveTo(32,0); linesCtx.lineTo(32,240); linesCtx.stroke();
}
drawLines();

let activeColor = '#1a1a2e', activeSize = 1.5, activeMode = 'draw';
let pendingText = '', textPlacing = false;

function applyTool() {
  drawCtx.strokeStyle = activeColor;
  drawCtx.lineWidth   = activeSize;
  drawCtx.lineCap     = 'round';
  drawCtx.lineJoin    = 'round';
}
applyTool();

document.querySelectorAll('.color-swatch').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    el.classList.add('active'); activeColor = el.dataset.color; applyTool();
  });
});
document.querySelectorAll('.size-btn').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.size-btn').forEach(s => s.classList.remove('active'));
    el.classList.add('active'); activeSize = parseFloat(el.dataset.size); applyTool();
  });
});
document.querySelectorAll('.mode-btn').forEach(el => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(m => m.classList.remove('active'));
    el.classList.add('active'); activeMode = el.dataset.mode;
    document.getElementById('text-input-row').style.display = activeMode === 'text' ? 'flex' : 'none';
    drawCanvas.style.cursor = activeMode === 'text' ? 'text' : 'crosshair';
    textPlacing = false;
  });
});
document.getElementById('text-place-btn').addEventListener('click', () => {
  const val = document.getElementById('text-input').value.trim();
  if (!val) { showToast('type something first!'); return; }
  pendingText = val; textPlacing = true;
  drawCanvas.style.cursor = 'crosshair';
  showToast('click on the paper to place text');
});
document.getElementById('text-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('text-place-btn').click();
});
function stampText(x, y) {
  if (!pendingText) return;
  const fontSize = Math.max(12, activeSize * 5);
  drawCtx.font = `${fontSize}px 'Special Elite', cursive`;
  drawCtx.fillStyle = activeColor;
  drawCtx.fillText(pendingText, x, y);
  hasDrawing = true; pendingText = ''; textPlacing = false;
  drawCanvas.style.cursor = 'text';
  document.getElementById('text-input').value = '';
}
function getDrawPos(e) {
  const rect = drawCanvas.getBoundingClientRect();
  const sx = drawCanvas.width/rect.width, sy = drawCanvas.height/rect.height;
  if (e.touches) return { x:(e.touches[0].clientX-rect.left)*sx, y:(e.touches[0].clientY-rect.top)*sy };
  return { x:(e.clientX-rect.left)*sx, y:(e.clientY-rect.top)*sy };
}
drawCanvas.addEventListener('mousedown', e => {
  if (gameState==='throwing') return;
  const p = getDrawPos(e);
  if (activeMode === 'text' && textPlacing) { stampText(p.x, p.y); return; }
  if (activeMode === 'draw') { isDrawing=true; lastX=p.x; lastY=p.y; }
});
drawCanvas.addEventListener('mousemove', e => {
  if (!isDrawing || activeMode !== 'draw') return;
  const p=getDrawPos(e); drawCtx.beginPath(); drawCtx.moveTo(lastX,lastY); drawCtx.lineTo(p.x,p.y); drawCtx.stroke(); lastX=p.x; lastY=p.y; hasDrawing=true;
});
drawCanvas.addEventListener('mouseup', () => isDrawing=false);
drawCanvas.addEventListener('mouseleave', () => isDrawing=false);
drawCanvas.addEventListener('touchstart', e => {
  e.preventDefault(); if (gameState==='throwing') return;
  const p=getDrawPos(e);
  if (activeMode === 'text' && textPlacing) { stampText(p.x, p.y); return; }
  if (activeMode === 'draw') { isDrawing=true; lastX=p.x; lastY=p.y; }
}, {passive:false});
drawCanvas.addEventListener('touchmove', e => {
  e.preventDefault(); if (!isDrawing || activeMode !== 'draw') return;
  const p=getDrawPos(e); drawCtx.beginPath(); drawCtx.moveTo(lastX,lastY); drawCtx.lineTo(p.x,p.y); drawCtx.stroke(); lastX=p.x; lastY=p.y; hasDrawing=true;
}, {passive:false});
drawCanvas.addEventListener('touchend', () => isDrawing=false);
document.getElementById('clear-btn').addEventListener('click', () => { drawCtx.clearRect(0,0,240,240); hasDrawing=false; });

// ═══════════════════════════════════════════
// THREE.JS SETUP
// ═══════════════════════════════════════════
const container = document.getElementById('three-container');
const renderer  = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setClearColor(0x1a1a1a);
container.appendChild(renderer.domElement);

const scene3d = new THREE.Scene();
scene3d.fog = new THREE.Fog(0x1a1a1a, 18, 38);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
camera.position.set(0, 4, 9);
camera.lookAt(0, 1.0, -3);

function resizeRenderer() {
  const w = container.offsetWidth, h = container.offsetHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
resizeRenderer();
window.addEventListener('resize', resizeRenderer);

// LIGHTS
scene3d.add(new THREE.AmbientLight(0x222222, 1.2));
const spotLight = new THREE.SpotLight(0xffe0aa, 2.5, 20, Math.PI/8, 0.4, 1.5);
spotLight.position.set(0, 10, -6); spotLight.target.position.set(0, 0, -6); spotLight.castShadow = true;
scene3d.add(spotLight); scene3d.add(spotLight.target);
const fillLight = new THREE.DirectionalLight(0x4466aa, 0.4); fillLight.position.set(0, 5, 8); scene3d.add(fillLight);
const deskLight = new THREE.PointLight(0xffcc77, 0.6, 8); deskLight.position.set(-2, 3, 1); scene3d.add(deskLight);
const overheadLight = new THREE.DirectionalLight(0xfff5e0, 0.35); overheadLight.position.set(0, 8, 4); scene3d.add(overheadLight);
[[-10,2.5,-10],[10,2.5,-10],[-10,2.5,6],[10,2.5,6]].forEach(([x,y,z]) => {
  const cl = new THREE.PointLight(0xff9944, 0.5, 12); cl.position.set(x,y,z); scene3d.add(cl);
});

// FLOOR
const floor = new THREE.Mesh(new THREE.PlaneGeometry(40,40), new THREE.MeshStandardMaterial({color:0x2a2a2a,roughness:0.95}));
floor.rotation.x = -Math.PI/2; floor.receiveShadow = true; scene3d.add(floor);
const gridHelper = new THREE.GridHelper(40,20,0x444444,0x333333); gridHelper.position.y = 0.002; scene3d.add(gridHelper);

// WALLS
const wallMat = new THREE.MeshStandardMaterial({color:0x222222,roughness:1});
const wall = new THREE.Mesh(new THREE.PlaneGeometry(40,14), wallMat); wall.position.set(0,7,-14); wall.receiveShadow=true; scene3d.add(wall);
const leftWall  = new THREE.Mesh(new THREE.PlaneGeometry(28,14), wallMat); leftWall.position.set(-11,7,-2);  leftWall.rotation.y  =  Math.PI/2; scene3d.add(leftWall);
const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(28,14), wallMat); rightWall.position.set(11,7,-2); rightWall.rotation.y = -Math.PI/2; scene3d.add(rightWall);

// ── PINNED NOTES ON BACK WALL ──
const pinnedNotes = [];
const PIN_POSITIONS = [
  { x: -4.2, y: 4.2 }, { x: -1.4, y: 4.6 },
  { x:  1.6, y: 4.0 }, { x:  4.4, y: 4.4 },
];

function makePinnedNote(dataURL, slot) {
  if (pinnedNotes[slot]) { scene3d.remove(pinnedNotes[slot]); pinnedNotes[slot] = null; }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onerror = (e) => console.error('Pinned note image failed to load', e);
  img.onload = () => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ede8dc'; ctx.fillRect(0,0,256,256);
    try {
      ctx.drawImage(img, 0, 0, 256, 256);
      if (crumpleReady) {
        ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.55;
        ctx.drawImage(crumpleImg, 0, 0, 256, 256);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      }
    } catch(e) { console.warn('Canvas tainted:', e); }
    ctx.strokeStyle = '#c8d4e8'; ctx.lineWidth = 0.5;
    for (let y = 28; y < 256; y += 22) { ctx.beginPath(); ctx.moveTo(8,y); ctx.lineTo(248,y); ctx.stroke(); }
    const tex = new THREE.CanvasTexture(c);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, transparent: true, opacity: 0 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), mat);
    const p = PIN_POSITIONS[slot];
    mesh.position.set(p.x + (Math.random()-0.5)*0.3, p.y + (Math.random()-0.5)*0.2, -13.8);
    mesh.rotation.z = (Math.random()-0.5)*0.18;
    scene3d.add(mesh); pinnedNotes[slot] = mesh;
    let op = 0;
    const iv = setInterval(() => { op = Math.min(op+0.04, 0.88); mesh.material.opacity = op; if (op>=0.88) clearInterval(iv); }, 16);
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.055,8,8), new THREE.MeshStandardMaterial({color:0xcc3322,roughness:0.4,metalness:0.5}));
    pin.position.set(p.x+(Math.random()-0.5)*0.3, p.y+(Math.random()-0.5)*0.2+0.78, -13.74);
    scene3d.add(pin); mesh.userData.pin = pin;
  };
  img.src = dataURL;
}

async function refreshPinnedNotes() {
  let notes = [];
  if (window._fbLoadNotes) notes = await window._fbLoadNotes();
  if (!notes.length) notes = JSON.parse(localStorage.getItem('notebin_notes')||'[]');
  notes.slice(0,4).forEach((n,i) => makePinnedNote(n.data, i));
  for (let i = notes.slice(0,4).length; i < 4; i++) {
    if (pinnedNotes[i]) { scene3d.remove(pinnedNotes[i]); pinnedNotes[i] = null; }
  }
}
const MAX_NOTES = 15;
setTimeout(refreshPinnedNotes, 1500);

// ── WIND STREAKS ──
const STREAK_COUNT = 10, STREAK_SEGS = 12;
const streaks = [];
let gustTimer = 0, gustInterval = 3500 + Math.random()*2000;
for (let i = 0; i < STREAK_COUNT; i++) {
  const pts = Array.from({length:STREAK_SEGS}, () => new THREE.Vector3());
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineBasicMaterial({color:0xddeeff,transparent:true,opacity:0,depthWrite:false});
  const line = new THREE.Line(geo, mat); line.visible = false; scene3d.add(line);
  streaks.push({ line, active:false, progress:0, speed:0, sx:0,sy:0,sz:0, nx:0,nz:0, swoopAmp:0, swoopFreq:0, len:0, totalDist:0 });
}
function launchGust() {
  const wx=windX*1800, wz=windZ*1800, mag=Math.hypot(wx,wz)||1;
  const nx=wx/mag, nz=wz/mag, px=-nz, pz=nx;
  streaks.forEach(s => {
    const cross=(Math.random()-0.5)*9;
    s.sx=-nx*8+px*cross+(Math.random()-0.5)*0.5; s.sy=3.5+Math.random()*3.0; s.sz=-nz*8+pz*cross+(Math.random()-0.5)*0.5-2;
    s.nx=nx; s.nz=nz; s.swoopAmp=0.3+Math.random()*0.55; s.swoopFreq=0.5+Math.random()*0.6;
    s.len=1.2+Math.random()*1.4; s.speed=3.5+Math.random()*3.0; s.totalDist=20;
    s.progress=-(Math.random()*0.6); s.active=true; s.line.visible=true; s.line.material.opacity=0;
  });
}
function updateStreaks(dt) {
  if (ballOnFire) { streaks.forEach(s => { s.active=false; s.line.visible=false; }); return; }
  gustTimer += dt*1000;
  if (gustTimer > gustInterval) { gustTimer=0; gustInterval=3500+Math.random()*2500; launchGust(); }
  streaks.forEach(s => {
    if (!s.active) return;
    s.progress += dt*s.speed;
    const t = s.progress/s.totalDist;
    let op;
    if (t<0) op=0; else if (t<0.08) op=(t/0.08)*0.55; else if (t<0.78) op=0.55; else op=(1-(t-0.78)/0.22)*0.55;
    s.line.material.opacity = Math.max(0, op);
    if (s.progress < 0) return;
    const positions = [];
    for (let j=0; j<STREAK_SEGS; j++) {
      const frac=j/(STREAK_SEGS-1), dist=s.progress-s.len+frac*s.len;
      if (dist<0) { positions.push(new THREE.Vector3(s.sx,s.sy,s.sz)); continue; }
      const swoop=Math.sin(dist*s.swoopFreq)*s.swoopAmp, wobble=Math.sin(dist*s.swoopFreq*1.7+1.2)*s.swoopAmp*0.3;
      positions.push(new THREE.Vector3(s.sx+s.nx*dist+(-s.nz)*wobble, s.sy+swoop, s.sz+s.nz*dist+(s.nx)*wobble));
    }
    s.line.geometry.setFromPoints(positions);
    if (t>=1) { s.active=false; s.line.visible=false; s.line.material.opacity=0; }
  });
}

// ── TRASH CAN ──
const binGroup = new THREE.Group(); binGroup.position.set(0,0,-6);
const canMat = new THREE.MeshStandardMaterial({color:0x3a3a3a,roughness:0.7,metalness:0.3});
const can = new THREE.Mesh(new THREE.CylinderGeometry(0.52,0.42,1.1,16), canMat);
can.position.y=0.55; can.castShadow=true; can.receiveShadow=true; binGroup.add(can);
const rimMat = new THREE.MeshStandardMaterial({color:0x555555,metalness:0.5,roughness:0.4});
const rim = new THREE.Mesh(new THREE.TorusGeometry(0.52,0.04,8,32), rimMat);
rim.position.y=1.1; rim.rotation.x=Math.PI/2; binGroup.add(rim);
for (let i=0; i<3; i++) {
  const ridge = new THREE.Mesh(new THREE.TorusGeometry(0.44+i*0.025,0.02,6,32), rimMat);
  ridge.position.y=0.25+i*0.3; ridge.rotation.x=Math.PI/2; binGroup.add(ridge);
}
const glow = new THREE.Mesh(new THREE.CircleGeometry(0.8,32), new THREE.MeshBasicMaterial({color:0xffe0aa,transparent:true,opacity:0.06}));
glow.rotation.x=-Math.PI/2; glow.position.y=0.01; binGroup.add(glow);
scene3d.add(binGroup);

// ── BALL TEXTURE ──
function createBallTexture() {
  const c = document.createElement('canvas'); c.width=512; c.height=512;
  const ctx = c.getContext('2d');
  ctx.fillStyle='#ede8dc'; ctx.fillRect(0,0,512,512);
  ctx.drawImage(drawCanvas, 32,32,448,448);
  ctx.globalAlpha=0.06; ctx.strokeStyle='#2a1a00';
  for (let i=0;i<24;i++) {
    const x1=Math.random()*512, y1=Math.random()*512;
    ctx.lineWidth=0.6+Math.random()*1.2;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x1+(Math.random()-0.5)*200, y1+(Math.random()-0.5)*200); ctx.stroke();
  }
  ctx.globalAlpha=1.0;
  if (crumpleReady) {
    ctx.globalCompositeOperation='multiply'; ctx.globalAlpha=0.82;
    ctx.drawImage(crumpleImg,0,0,512,512);
    ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1.0;
    ctx.globalCompositeOperation='multiply'; ctx.globalAlpha=0.18;
    const ao=ctx.createRadialGradient(256,256,80,256,256,256);
    ao.addColorStop(0,'rgba(255,255,255,1)'); ao.addColorStop(1,'rgba(100,80,60,1)');
    ctx.fillStyle=ao; ctx.fillRect(0,0,512,512);
    ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1.0;
  }
  return new THREE.CanvasTexture(c);
}

let ballMesh = null;
const BALL_ORIGIN = new THREE.Vector3(0,0.19,1.0);
function spawnBall() {
  if (ballMesh) { scene3d.remove(ballMesh); ballMesh=null; }
  const geo = new THREE.SphereGeometry(0.18,28,28);
  const pos = geo.attributes.position;
  for (let i=0;i<pos.count;i++) {
    pos.setX(i, pos.getX(i)+(Math.random()-0.5)*0.022);
    pos.setY(i, pos.getY(i)+(Math.random()-0.5)*0.022);
    pos.setZ(i, pos.getZ(i)+(Math.random()-0.5)*0.022);
  }
  geo.computeVertexNormals();
  ballMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({map:createBallTexture(),roughness:0.88,bumpScale:0.004}));
  ballMesh.castShadow=true; ballMesh.position.copy(BALL_ORIGIN); scene3d.add(ballMesh);
}

// ═══════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════
let gameState='idle', shotsLeft=2, ballVel=new THREE.Vector3(), ballInFlight=false;
let windX=0, windZ=0;
const WIND_Z_HEADWIND_MAX=0.0032;
function randomiseFan() {
  const speed=0.3+Math.random()*0.6;
  windX=(Math.random()-0.5)*speed*0.0055;
  const rawZ=(Math.random()-0.5)*speed*0.0068;
  windZ=rawZ>0?Math.min(rawZ,WIND_Z_HEADWIND_MAX):rawZ;
  const hArrow=windX>0.0004?'→':windX<-0.0004?'←':'·';
  const zArrow=windZ<-0.0004?'↑':windZ>0.0004?'↓':'·';
  document.getElementById('wind-arrow').textContent=`${hArrow} ${zArrow}`;
  document.getElementById('wind-speed-fill').style.width=(speed*100)+'%';
  gustTimer=gustInterval-800;
}
randomiseFan();

// ── ORBIT CAMERA ──
const CAM_BASE={r:8.5,theta:0,phi:Math.PI*0.42};
let camOrbit={...CAM_BASE}, orbitActive=false, orbitReturning=false, orbitLast={x:0,y:0};
const ORBIT_THETA_MAX=0.38, ORBIT_PHI_MIN=Math.PI*0.22, ORBIT_PHI_MAX=CAM_BASE.phi;
function applyCameraOrbit() {
  const sinPhi=Math.sin(camOrbit.phi), cosPhi=Math.cos(camOrbit.phi);
  camera.position.set(camOrbit.r*sinPhi*Math.sin(camOrbit.theta), camOrbit.r*cosPhi+1.0, camOrbit.r*sinPhi*Math.cos(camOrbit.theta));
  camera.lookAt(0,1.0,-3);
}
applyCameraOrbit();

// ── BALL HIT TEST ──
function getBallScreenPos() {
  if (!ballMesh) return null;
  const v=ballMesh.position.clone().project(camera), rect=container.getBoundingClientRect();
  return { x:(v.x*0.5+0.5)*rect.width, y:(-v.y*0.5+0.5)*rect.height };
}
function isCursorOnBall(clientX, clientY) {
  const sp=getBallScreenPos(); if (!sp) return false;
  const rect=container.getBoundingClientRect();
  return Math.hypot(clientX-rect.left-sp.x, clientY-rect.top-sp.y)<36;
}

// ── THROW ──
let throwMode=false, swipeActive=false;
let swipeStart={x:0,y:0}, swipeCurrent={x:0,y:0};
const arrowCanvas=document.createElement('canvas');
arrowCanvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
container.appendChild(arrowCanvas);
const arrowCtx=arrowCanvas.getContext('2d');
function resizeArrow() { arrowCanvas.width=container.offsetWidth; arrowCanvas.height=container.offsetHeight; }
resizeArrow();
window.addEventListener('resize', resizeArrow);
window.addEventListener('orientationchange', () => setTimeout(resizeArrow, 300));

function drawAimArrow() {
  arrowCtx.clearRect(0,0,arrowCanvas.width,arrowCanvas.height);
  if (!throwMode) return;
  const dx=swipeCurrent.x-swipeStart.x, dy=swipeCurrent.y-swipeStart.y, len=Math.hypot(dx,dy);
  if (len<6) return; // removed dy<0 check — let any direction show arrow on touch
  const cx=swipeStart.x, cy=swipeStart.y, maxLen=110, drawLen=Math.min(len,maxLen), power=Math.min(len/maxLen,1);
  arrowCtx.beginPath(); arrowCtx.moveTo(cx,cy); arrowCtx.lineTo(cx+(dx/len)*drawLen,cy+(dy/len)*drawLen);
  arrowCtx.strokeStyle=`rgba(212,90,30,${0.3+power*0.4})`; arrowCtx.lineWidth=3; arrowCtx.setLineDash([5,5]); arrowCtx.stroke(); arrowCtx.setLineDash([]);
  const tx=cx-(dx/len)*drawLen*0.7, ty=cy-(dy/len)*drawLen*0.7, angle=Math.atan2(-dy,-dx);
  arrowCtx.beginPath(); arrowCtx.moveTo(tx,ty);
  arrowCtx.lineTo(tx-Math.cos(angle-0.4)*14,ty-Math.sin(angle-0.4)*14);
  arrowCtx.lineTo(tx-Math.cos(angle+0.4)*14,ty-Math.sin(angle+0.4)*14);
  arrowCtx.closePath(); arrowCtx.fillStyle=`rgba(212,90,30,${0.5+power*0.5})`; arrowCtx.fill();
  arrowCtx.beginPath(); arrowCtx.arc(cx,cy,18,0,Math.PI*2*power);
  arrowCtx.strokeStyle='rgba(212,90,30,0.8)'; arrowCtx.lineWidth=3; arrowCtx.stroke();
}

container.addEventListener('mousedown', e => {
  if (e.button===2||gameState!=='idle'||!ballMesh) return;
  if (isCursorOnBall(e.clientX,e.clientY)) {
    throwMode=true; swipeActive=true;
    const rect=container.getBoundingClientRect();
    swipeStart={x:e.clientX-rect.left,y:e.clientY-rect.top}; swipeCurrent={...swipeStart};
    container.style.cursor='grabbing'; document.getElementById('throw-hint').style.opacity='0';
  } else { orbitActive=true; orbitLast={x:e.clientX,y:e.clientY}; container.style.cursor='move'; }
});
container.addEventListener('mousemove', e => {
  if (throwMode) {
    const rect=container.getBoundingClientRect();
    swipeCurrent={x:e.clientX-rect.left,y:e.clientY-rect.top}; drawAimArrow(); return;
  }
  if (orbitActive) {
    const dx=e.clientX-orbitLast.x, dy=e.clientY-orbitLast.y;
    camOrbit.theta=Math.max(-ORBIT_THETA_MAX,Math.min(ORBIT_THETA_MAX,camOrbit.theta-dx*0.007));
    camOrbit.phi=Math.max(ORBIT_PHI_MIN,Math.min(ORBIT_PHI_MAX,camOrbit.phi+dy*0.007));
    orbitLast={x:e.clientX,y:e.clientY}; applyCameraOrbit(); return;
  }
  if (gameState==='idle'&&ballMesh) container.style.cursor=isCursorOnBall(e.clientX,e.clientY)?'grab':'default';
});
container.addEventListener('mouseup', e => {
  if (throwMode) { throwMode=false; swipeActive=false; arrowCtx.clearRect(0,0,arrowCanvas.width,arrowCanvas.height); container.style.cursor='default'; throwFromSwipe(); return; }
  if (orbitActive) { orbitActive=false; orbitReturning=true; container.style.cursor='default'; }
});
container.addEventListener('mouseleave', () => {
  if (throwMode) { throwMode=false; swipeActive=false; arrowCtx.clearRect(0,0,arrowCanvas.width,arrowCanvas.height); throwFromSwipe(); }
  orbitActive=false; orbitReturning=true; container.style.cursor='default';
});

let touchThrow=false, touchOrbit=false, touchOrbitLast={x:0,y:0};
container.addEventListener('touchstart', e => {
  e.preventDefault(); if (gameState!=='idle'||!ballMesh) return;
  const t=e.changedTouches[0], rect=container.getBoundingClientRect();
  if (isCursorOnBall(t.clientX,t.clientY)) {
    touchThrow=true; swipeActive=true;
    swipeStart={x:t.clientX-rect.left,y:t.clientY-rect.top}; swipeCurrent={...swipeStart};
    document.getElementById('throw-hint').style.opacity='0';
  } else { touchOrbit=true; touchOrbitLast={x:t.clientX,y:t.clientY}; }
},{passive:false});
container.addEventListener('touchmove', e => {
  e.preventDefault(); const t=e.changedTouches[0], rect=container.getBoundingClientRect();
  if (touchThrow) { swipeCurrent={x:t.clientX-rect.left,y:t.clientY-rect.top}; drawAimArrow(); }
  else if (touchOrbit) {
    const dx=t.clientX-touchOrbitLast.x, dy=t.clientY-touchOrbitLast.y;
    camOrbit.theta=Math.max(-ORBIT_THETA_MAX,Math.min(ORBIT_THETA_MAX,camOrbit.theta-dx*0.007));
    camOrbit.phi=Math.max(ORBIT_PHI_MIN,Math.min(ORBIT_PHI_MAX,camOrbit.phi+dy*0.007));
    touchOrbitLast={x:t.clientX,y:t.clientY}; applyCameraOrbit();
  }
},{passive:false});
container.addEventListener('touchend', () => {
  if (touchThrow) { touchThrow=false; swipeActive=false; arrowCtx.clearRect(0,0,arrowCanvas.width,arrowCanvas.height); throwFromSwipe(); }
  touchOrbit=false; if (!touchThrow) orbitReturning=true;
});

function throwFromSwipe() {
  if (!ballMesh) return;
  const dx=swipeCurrent.x-swipeStart.x, dy=swipeCurrent.y-swipeStart.y, len=Math.hypot(dx,dy);
  if (len<10) { gameState='idle'; document.getElementById('throw-hint').style.opacity='1'; return; }
  const power=Math.min(len/110,1), normX=-dx/len, normY=-dy/len;
  ballVel.set(normX*power*0.22, Math.abs(normY)*power*0.14+power*0.15, -power*0.34);
  ballInFlight=true; gameState='throwing'; shotsLeft--; updateShotDots(); playSound('whoosh');
}

// ═══════════════════════════════════════════
// PHYSICS
// ═══════════════════════════════════════════
const GRAVITY=-0.007, BIN_X=0, BIN_Z=-6, RIM_Y=1.10, RIM_OUTER=0.54, RIM_INNER=0.44, CAN_BOTTOM=0.10, BALL_R=0.18, REBOUND_DAMP=0.38;
const BIN_POS=new THREE.Vector3(BIN_X,0.6,BIN_Z);
let ballInsideCan=false;

function updatePhysics() {
  if (!ballInFlight||!ballMesh) return;
  ballVel.x+=windX; ballVel.y+=GRAVITY; ballVel.z+=windZ;
  ballMesh.position.add(ballVel);
  ballMesh.rotation.x+=ballVel.z*0.8; ballMesh.rotation.z-=ballVel.x*0.8;
  const bx=ballMesh.position.x, by=ballMesh.position.y, bz=ballMesh.position.z;
  const dx=bx-BIN_X, dz=bz-BIN_Z, radialDist=Math.hypot(dx,dz);

  // Body collision
  const heightRatio=Math.max(0,Math.min(1,by/1.10));
  const canRadiusAtY=0.42+(0.52-0.42)*heightRatio;
  if (!ballInsideCan&&by>0&&by<RIM_Y&&radialDist<canRadiusAtY+BALL_R&&radialDist>canRadiusAtY-BALL_R*0.2&&bz<=BIN_Z+0.7&&bz>=BIN_Z-0.7) {
    const angle=Math.atan2(dz,dx);
    ballMesh.position.x=BIN_X+Math.cos(angle)*(canRadiusAtY+BALL_R); ballMesh.position.z=BIN_Z+Math.sin(angle)*(canRadiusAtY+BALL_R);
    const vRadial=ballVel.x*Math.cos(angle)+ballVel.z*Math.sin(angle);
    if (vRadial<0) { ballVel.x-=2*vRadial*Math.cos(angle); ballVel.z-=2*vRadial*Math.sin(angle); }
    ballVel.x*=REBOUND_DAMP; ballVel.z*=REBOUND_DAMP; ballVel.y*=REBOUND_DAMP; return;
  }

  // Rim collision
  const nearRimY=by<=RIM_Y+BALL_R*1.4&&by>=RIM_Y-BALL_R*0.6;
  const nearRimRing=radialDist>=RIM_INNER-BALL_R*0.3&&radialDist<=RIM_OUTER+BALL_R*0.3;
  const aboveCan=bz<=BIN_Z+0.65&&bz>=BIN_Z-1.1;
  if (nearRimY&&nearRimRing&&aboveCan&&ballVel.y<0) {
    const hitInner=radialDist<RIM_INNER+(RIM_OUTER-RIM_INNER)*0.70;
    if (hitInner) { ballMesh.position.set(BIN_X,RIM_Y-BALL_R,BIN_Z); ballVel.set(0,-0.06,0); ballInsideCan=true; }
    else { ballMesh.position.y=RIM_Y+BALL_R+0.02; ballVel.y=Math.abs(ballVel.y)*REBOUND_DAMP; const angle=Math.atan2(dz,dx); ballVel.x=Math.cos(angle)*0.07; ballVel.z=Math.sin(angle)*0.07; ballInsideCan=false; return; }
  }

  // Inside can
  if (ballInsideCan) {
    if (radialDist>RIM_INNER-BALL_R) {
      const angle=Math.atan2(dz,dx), vRadial=ballVel.x*Math.cos(angle)+ballVel.z*Math.sin(angle);
      if (vRadial>0) { ballVel.x-=(1+REBOUND_DAMP)*vRadial*Math.cos(angle); ballVel.z-=(1+REBOUND_DAMP)*vRadial*Math.sin(angle); ballVel.x*=REBOUND_DAMP; ballVel.z*=REBOUND_DAMP; }
    }
    if (by<=CAN_BOTTOM+BALL_R) { ballInFlight=false; ballInsideCan=false; onMadeIt(); return; }
  }
  if (by<BALL_R+0.01&&!ballInsideCan) { ballInFlight=false; ballInsideCan=false; onMissed(); return; }
  if (bz<-18||Math.abs(bx)>12) { ballInFlight=false; ballInsideCan=false; onMissed(); return; }
}

// ═══════════════════════════════════════════
// WEB AUDIO
// ═══════════════════════════════════════════
const audioCtx=new (window.AudioContext||window.webkitAudioContext)();
function playSound(type) {
  if (audioCtx.state==='suspended') audioCtx.resume();
  const now=audioCtx.currentTime;
  if (type==='crumple') {
    const buf=audioCtx.createBuffer(1,audioCtx.sampleRate*0.3,audioCtx.sampleRate);
    const data=buf.getChannelData(0); for (let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,1.5);
    const src=audioCtx.createBufferSource(); src.buffer=buf;
    const gain=audioCtx.createGain(); gain.gain.setValueAtTime(0.35,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.3);
    const filter=audioCtx.createBiquadFilter(); filter.type='bandpass'; filter.frequency.value=1800; filter.Q.value=0.8;
    src.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination); src.start(now); src.stop(now+0.3);
  }
  if (type==='whoosh') {
    const buf=audioCtx.createBuffer(1,audioCtx.sampleRate*0.5,audioCtx.sampleRate);
    const data=buf.getChannelData(0); for (let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*Math.sin(i/data.length*Math.PI);
    const src=audioCtx.createBufferSource(); src.buffer=buf;
    const gain=audioCtx.createGain(); gain.gain.setValueAtTime(0.18,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.5);
    const filter=audioCtx.createBiquadFilter(); filter.type='bandpass'; filter.frequency.value=600; filter.frequency.linearRampToValueAtTime(200,now+0.5);
    src.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination); src.start(now); src.stop(now+0.5);
  }
  if (type==='rimhit') {
    const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
    osc.type='square'; osc.frequency.setValueAtTime(320,now); osc.frequency.exponentialRampToValueAtTime(80,now+0.18);
    gain.gain.setValueAtTime(0.3,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.18);
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now+0.2);
  }
  if (type==='swish') {
    [523,659,784].forEach((freq,i) => {
      const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
      osc.type='sine'; osc.frequency.setValueAtTime(freq,now+i*0.06);
      gain.gain.setValueAtTime(0,now+i*0.06); gain.gain.linearRampToValueAtTime(0.18,now+i*0.06+0.04); gain.gain.exponentialRampToValueAtTime(0.001,now+i*0.06+0.5);
      osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now+i*0.06); osc.stop(now+i*0.06+0.55);
    });
    const buf=audioCtx.createBuffer(1,audioCtx.sampleRate*0.2,audioCtx.sampleRate);
    const data=buf.getChannelData(0); for (let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*(1-i/data.length)*0.3;
    const src=audioCtx.createBufferSource(); src.buffer=buf;
    const g=audioCtx.createGain(); g.gain.setValueAtTime(0.12,now);
    const f=audioCtx.createBiquadFilter(); f.type='highpass'; f.frequency.value=2000;
    src.connect(f); f.connect(g); g.connect(audioCtx.destination); src.start(now); src.stop(now+0.2);
  }
  if (type==='bounce') {
    const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
    osc.type='sine'; osc.frequency.setValueAtTime(180,now); osc.frequency.exponentialRampToValueAtTime(60,now+0.12);
    gain.gain.setValueAtTime(0.22,now); gain.gain.exponentialRampToValueAtTime(0.001,now+0.12);
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now+0.15);
  }
  if (type==='fire') {
    const buf=audioCtx.createBuffer(1,audioCtx.sampleRate*1.4,audioCtx.sampleRate);
    const data=buf.getChannelData(0);
    for (let i=0;i<data.length;i++) { const t=i/audioCtx.sampleRate; data[i]=(Math.random()*2-1)*Math.pow(Math.sin(t/1.4*Math.PI),0.6)*0.28; }
    const src=audioCtx.createBufferSource(); src.buffer=buf;
    const gain=audioCtx.createGain(); gain.gain.setValueAtTime(0.28,now); gain.gain.exponentialRampToValueAtTime(0.001,now+1.4);
    const filter=audioCtx.createBiquadFilter(); filter.type='lowpass'; filter.frequency.value=900;
    src.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination); src.start(now); src.stop(now+1.4);
  }
}

// ═══════════════════════════════════════════
// FIRE + BOUNCE
// ═══════════════════════════════════════════
let ballBouncing=false, ballOnFire=false, fireParticles=[], fireStartTime=0;
const FIRE_DURATION=1600;
let deadBallMesh=null, deadBouncing=false, deadBallVel=new THREE.Vector3();

const PARTICLE_COUNT=80;
const particleGeo=new THREE.BufferGeometry();
const particlePositions=new Float32Array(PARTICLE_COUNT*3), particleColors=new Float32Array(PARTICLE_COUNT*3);
particleGeo.setAttribute('position',new THREE.BufferAttribute(particlePositions,3));
particleGeo.setAttribute('color',new THREE.BufferAttribute(particleColors,3));
const particleMat=new THREE.PointsMaterial({size:0.13,vertexColors:true,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending});
const particleSystem=new THREE.Points(particleGeo,particleMat); particleSystem.visible=false; scene3d.add(particleSystem);

function initFireParticles(origins) {
  fireParticles=[];
  const perOrigin=Math.floor(PARTICLE_COUNT/origins.length);
  origins.forEach(origin => {
    for (let i=0;i<perOrigin;i++) fireParticles.push({
      x:origin.x+(Math.random()-0.5)*0.12, y:origin.y+Math.random()*0.1, z:origin.z+(Math.random()-0.5)*0.12,
      vx:(Math.random()-0.5)*0.018, vy:0.022+Math.random()*0.032, vz:(Math.random()-0.5)*0.018,
      life:Math.random(), maxLife:0.55+Math.random()*0.45, originX:origin.x, originZ:origin.z,
    });
  });
  particleSystem.visible=true;
}

function updateFireParticles(dt) {
  const elapsed=(performance.now()-fireStartTime)/FIRE_DURATION;
  const pos=particleGeo.attributes.position.array, col=particleGeo.attributes.color.array;
  for (let i=0;i<PARTICLE_COUNT;i++) {
    const p=fireParticles[i];
    if (!p) { pos[i*3]=0; pos[i*3+1]=-10; pos[i*3+2]=0; continue; }
    p.life+=dt*(1.1+Math.random()*0.4);
    if (p.life>p.maxLife&&elapsed<0.72) { p.x=p.originX+(Math.random()-0.5)*0.14; p.y=FLOOR_Y+Math.random()*0.08; p.z=p.originZ+(Math.random()-0.5)*0.14; p.vx=(Math.random()-0.5)*0.018; p.vy=0.020+Math.random()*0.030; p.vz=(Math.random()-0.5)*0.018; p.life=0; p.maxLife=0.5+Math.random()*0.4; }
    p.x+=p.vx; p.y+=p.vy; p.z+=p.vz; p.vy*=0.97;
    pos[i*3]=p.x; pos[i*3+1]=p.y; pos[i*3+2]=p.z;
    const t=p.life/p.maxLife, fade=1-elapsed*1.1;
    if (t<0.3) { col[i*3]=1.0*fade; col[i*3+1]=0.9*fade; col[i*3+2]=0.3*fade; }
    else if (t<0.65) { col[i*3]=1.0*fade; col[i*3+1]=(0.4-t*0.3)*fade; col[i*3+2]=0; }
    else { col[i*3]=(1-t)*0.6*fade; col[i*3+1]=0; col[i*3+2]=0; }
  }
  particleGeo.attributes.position.needsUpdate=true; particleGeo.attributes.color.needsUpdate=true;
  particleMat.opacity=Math.max(0,1-elapsed*1.15);
}

function shrinkBallToAsh(mesh) {
  if (!mesh) return;
  const iv=setInterval(() => {
    if (!mesh.parent) { clearInterval(iv); return; }
    const s=mesh.scale.x;
    if (s>0.02) { mesh.scale.setScalar(s*0.93); if (mesh.material) { if (!mesh.material.color) mesh.material.color=new THREE.Color(1,1,1); mesh.material.color.lerp(new THREE.Color(0.15,0.12,0.10),0.08); } } else clearInterval(iv);
  },16);
}

function startBothFire() {
  ballOnFire=true; fireStartTime=performance.now();
  const origins=[];
  if (ballMesh) origins.push(ballMesh.position.clone());
  if (deadBallMesh) origins.push(deadBallMesh.position.clone());
  initFireParticles(origins.length?origins:[new THREE.Vector3(0,FLOOR_Y,0)]);
  playSound('fire');
  if (ballMesh) shrinkBallToAsh(ballMesh);
  if (deadBallMesh) shrinkBallToAsh(deadBallMesh);
  setTimeout(() => {
    ballOnFire=false; ballBouncing=false; deadBouncing=false; particleSystem.visible=false;
    if (ballMesh) { scene3d.remove(ballMesh); ballMesh=null; }
    if (deadBallMesh) { scene3d.remove(deadBallMesh); deadBallMesh=null; }
    resetRound();
  }, FIRE_DURATION+400);
}

const FLOOR_Y=BALL_R+0.01, BOUNCE_DAMP=0.38, BOUNCE_MIN=0.015;
let prevFrameTime=performance.now();

function updateBounce(dt) {
  if (ballBouncing&&ballMesh) {
    ballVel.y+=GRAVITY; ballVel.x*=0.985; ballVel.z*=0.985;
    ballMesh.position.add(ballVel); ballMesh.rotation.x+=ballVel.z*0.5; ballMesh.rotation.z-=ballVel.x*0.5;
    if (ballMesh.position.y<=FLOOR_Y) {
      ballMesh.position.y=FLOOR_Y;
      if (Math.abs(ballVel.y)<BOUNCE_MIN) { ballVel.set(0,0,0); ballBouncing=false; startBothFire(); }
      else { ballVel.y=Math.abs(ballVel.y)*BOUNCE_DAMP; ballVel.x*=BOUNCE_DAMP; ballVel.z*=BOUNCE_DAMP; playSound('bounce'); }
    }
  }
  if (deadBouncing&&deadBallMesh) {
    deadBallVel.y+=GRAVITY; deadBallVel.x*=0.985; deadBallVel.z*=0.985;
    deadBallMesh.position.add(deadBallVel); deadBallMesh.rotation.x+=deadBallVel.z*0.5; deadBallMesh.rotation.z-=deadBallVel.x*0.5;
    if (deadBallMesh.position.y<=FLOOR_Y) {
      deadBallMesh.position.y=FLOOR_Y;
      if (Math.abs(deadBallVel.y)<BOUNCE_MIN) { deadBallVel.set(0,0,0); deadBouncing=false; }
      else { deadBallVel.y=Math.abs(deadBallVel.y)*BOUNCE_DAMP; deadBallVel.x*=BOUNCE_DAMP; deadBallVel.z*=BOUNCE_DAMP; playSound('bounce'); }
    }
  }
}

// ═══════════════════════════════════════════
// HIT / MISS
// ═══════════════════════════════════════════
function onMadeIt() { playSound('swish'); showCelebration(); saveNote(); setTimeout(() => { if (ballMesh) { scene3d.remove(ballMesh); ballMesh=null; } resetRound(); }, 2800); }
function onMissed() {
  if (shotsLeft>0) {
    playSound('rimhit'); showToast('missed — one shot left!');
    deadBallMesh=ballMesh; deadBallVel.copy(ballVel); deadBouncing=true; ballMesh=null; ballInFlight=false;
    setTimeout(() => { gameState='idle'; randomiseFan(); spawnBall(); document.getElementById('throw-hint').style.opacity='1'; showToast('one shot left — make it count!'); }, 900);
  } else { showToast('💀 lost forever'); burnPaper(); ballBouncing=true; }
}
function burnPaper() {
  const p=document.getElementById('paper-container');
  p.style.transition='opacity 0.4s, transform 0.4s, filter 0.5s'; p.style.filter='brightness(2.5) sepia(1) saturate(4) hue-rotate(-10deg)';
  setTimeout(() => { p.style.opacity='0'; p.style.transform='scale(0.85) translateY(8px)'; },300);
  setTimeout(() => { p.style.transition=''; p.style.filter=''; p.style.opacity='1'; p.style.transform=''; },2000);
}

// ── THROW BUTTON ──
document.getElementById('throw-btn').addEventListener('click', () => {
  if (gameState!=='idle') return;
  if (deadBallMesh) { showToast('second ball is ready — just throw it!'); return; }
  if (!hasDrawing) { showToast('draw something first!'); return; }
  playSound('crumple'); currentDrawingData=drawCanvas.toDataURL();
  const p=document.getElementById('paper-container');
  p.style.transition='transform 0.5s cubic-bezier(.4,0,.2,1), filter 0.5s'; p.style.transform='scale(0.1) rotate(20deg)'; p.style.filter='brightness(0.8)';
  setTimeout(() => { p.style.transform=''; p.style.filter=''; p.style.transition=''; spawnBall(); gameState='idle'; document.getElementById('throw-hint').style.opacity='1'; showToast('drag the ball and throw!'); },530);
});

// ── RESET ──
function resetRound() {
  drawCtx.clearRect(0,0,240,240); hasDrawing=false; currentDrawingData=null;
  shotsLeft=2; ballInFlight=false; ballInsideCan=false; ballBouncing=false; deadBouncing=false; ballOnFire=false;
  if (deadBallMesh) { scene3d.remove(deadBallMesh); deadBallMesh=null; }
  gameState='idle'; randomiseFan(); updateShotDots();
  document.getElementById('throw-hint').style.opacity='1';
}
function updateShotDots() {
  document.getElementById('dot-1').classList.toggle('used',shotsLeft<2);
  document.getElementById('dot-2').classList.toggle('used',shotsLeft<1);
}

// ═══════════════════════════════════════════
// SAVE / GALLERY
// ═══════════════════════════════════════════
async function saveNote() {
  if (!currentDrawingData) return;
  if (window._fbSaveNote) await window._fbSaveNote(currentDrawingData);
  const saved=JSON.parse(localStorage.getItem('notebin_notes')||'[]');
  saved.unshift({data:currentDrawingData,ts:Date.now()});
  if (saved.length>MAX_NOTES) saved.splice(MAX_NOTES);
  localStorage.setItem('notebin_notes',JSON.stringify(saved));
  refreshPinnedNotes();
}
async function loadGallery() {
  const grid=document.getElementById('gallery-grid'), empty=document.getElementById('gallery-empty');
  grid.innerHTML='<div style="color:rgba(255,255,255,0.2);font-size:0.8rem;padding:20px;">loading...</div>';
  let notes=[];
  if (window._fbLoadNotes) notes=await window._fbLoadNotes();
  if (!notes.length) notes=JSON.parse(localStorage.getItem('notebin_notes')||'[]');
  grid.innerHTML='';
  if (!notes.length) { empty.style.display='block'; return; }
  empty.style.display='none';
  notes.forEach(n => {
    const div=document.createElement('div'); div.className='gallery-note';
    const c=document.createElement('canvas'); c.width=240; c.height=240;
    div.appendChild(c); grid.appendChild(div);
    const ctx=c.getContext('2d'), img=new Image();
    img.onload=() => {
      ctx.fillStyle='#ede8dc'; ctx.fillRect(0,0,240,240); ctx.drawImage(img,0,0,240,240);
      if (crumpleReady) { ctx.globalCompositeOperation='multiply'; ctx.globalAlpha=0.78; ctx.drawImage(crumpleImg,0,0,240,240); ctx.globalCompositeOperation='source-over'; ctx.globalAlpha=1.0; }
    };
    img.src=n.data;
  });
}
document.getElementById('open-gallery-btn').addEventListener('click', () => { loadGallery(); document.getElementById('gallery-overlay').classList.add('open'); });
document.getElementById('gallery-close').addEventListener('click', () => document.getElementById('gallery-overlay').classList.remove('open'));

// ═══════════════════════════════════════════
// CELEBRATION
// ═══════════════════════════════════════════
function showCelebration() {
  const container=document.getElementById('three-container'), rect=container.getBoundingClientRect();
  const el=document.createElement('div');
  el.innerHTML=`
    <div style="font-family:'Special Elite',cursive;font-size:1.05rem;color:#f5f0e8;letter-spacing:0.05em;margin-bottom:4px;">
      your note made it to the <span style="color:#d45a1e">history books</span> 🎉
    </div>
    <div style="font-size:0.62rem;color:rgba(255,255,255,0.3);letter-spacing:0.12em;text-transform:uppercase;">
      pinned on the wall forever · maybe
    </div>`;
  el.style.cssText=`position:fixed;top:${rect.top+rect.height*0.38}px;left:${rect.left+rect.width*0.5}px;transform:translate(-50%,-50%);background:rgba(10,8,6,0.85);border:1px solid rgba(212,90,30,0.4);border-radius:8px;padding:14px 28px;text-align:center;backdrop-filter:blur(10px);box-shadow:0 0 30px rgba(212,90,30,0.18);pointer-events:none;z-index:9999;opacity:0;transition:opacity 0.3s;`;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity='1'; });
  setTimeout(() => { el.style.opacity='0'; setTimeout(()=>el.remove(),350); },2600);
}

// ── INFO OVERLAY ──
document.getElementById('info-btn').addEventListener('click', () => document.getElementById('info-overlay').classList.add('open'));
document.getElementById('info-close').addEventListener('click', () => document.getElementById('info-overlay').classList.remove('open'));
document.getElementById('info-overlay').addEventListener('click', e => { if (e.target===document.getElementById('info-overlay')) document.getElementById('info-overlay').classList.remove('open'); });

// ── TOAST ──
let toastTimer;
function showToast(msg) {
  const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2400);
}

// ═══════════════════════════════════════════
// RENDER LOOP
// ═══════════════════════════════════════════
function animate() {
  requestAnimationFrame(animate);
  const now=performance.now(), dt=Math.min((now-prevFrameTime)/1000,0.05);
  prevFrameTime=now;
  updateStreaks(dt);
  if (orbitReturning&&!orbitActive) {
    camOrbit.theta+=(CAM_BASE.theta-camOrbit.theta)*0.08; camOrbit.phi+=(CAM_BASE.phi-camOrbit.phi)*0.08;
    applyCameraOrbit();
    if (Math.abs(camOrbit.theta-CAM_BASE.theta)<0.001&&Math.abs(camOrbit.phi-CAM_BASE.phi)<0.001) { camOrbit.theta=CAM_BASE.theta; camOrbit.phi=CAM_BASE.phi; orbitReturning=false; applyCameraOrbit(); }
  }
  updatePhysics(); updateBounce(dt);
  if (ballOnFire||deadBouncing) updateFireParticles(dt);
  renderer.render(scene3d,camera);
}
// Mobile desk toggle
const deskToggleBtn = document.getElementById('desk-toggle');
const deskEl = document.getElementById('desk');
deskToggleBtn.addEventListener('click', () => {
  deskEl.classList.toggle('hidden');
  // Resize arrow canvas after desk slides in/out - layout shifts
  setTimeout(resizeArrow, 350);
});
// On mobile start with desk hidden
if (window.innerWidth <= 600) deskEl.classList.add('hidden');

animate();