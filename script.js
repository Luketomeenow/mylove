// Memory Lane Map interactions
// Tablet-first single page. Static and Netlify-friendly.

/* globals gsap, confetti */

const state = {
  currentIndex: null,
  songStarted: false,
  unlockedIndex: 0,
  solved: {},
};

const audio = document.getElementById('bg-audio');
audio.volume = 0.6;
const FALLBACK_SONG = 'https://suno.com/s/47b1uujhxK2eWLyY';

// Robust audio source handling for local file preview and Netlify
try {
  const isFileProtocol = location.protocol === 'file:';
  if (isFileProtocol) {
    // Avoid CORS errors when opening the HTML file directly
    audio.preload = 'none';
    audio.src = FALLBACK_SONG;
  } else {
    // On web servers (e.g., Netlify), probe the local MP3; fallback if missing
    fetch(audio.src, { method: 'HEAD' })
      .then((r) => { if (!r.ok) audio.src = FALLBACK_SONG; })
      .catch(() => { audio.src = FALLBACK_SONG; });
  }
} catch (_) {
  audio.src = FALLBACK_SONG;
}

const scenes = [
  {
    key: 'cabog',
    title: 'Cabog-Cabog — Our First Sunset',
    text: "We climbed a little mountain and the sky said, 'okay, main character.'",
    image: 'assets/images/scene1_cabog_cabog.jpg',
    interaction: function(){ return gridPuzzleInteraction('assets/images/scene1_cabog_cabog.jpg', 3, 3, () => unlockNext(state.currentIndex != null ? state.currentIndex : 0)); },
    gate: { prompt: 'Where was our first date?', answers: ['cabog', 'cabog cabog', 'cabog-cabog'] },
  },
  {
    key: 'school',
    title: 'Pickups and Soft Goodbyes',
    text: 'Luke waiting outside school, pretending to be suave while Maxine carries elegance and a giant water bottle.',
    image: 'assets/images/scene2_school.jpg',
    interaction: function(){ return holdToUnlockInteraction('Hold to ride home', 1500, () => unlockNext(1)); },
    gate: { prompt: 'What is your pet name?', answers: ['dalmi'] },
  },
  {
    key: 'joke-mistake',
    title: 'The Unsolicited Thank You',
    text: 'That time Luke says “thank you” to a random stranger who did NOTHING. We still laugh about it. Maxine: always right, obviously.',
    image: 'assets/images/scene5_us.jpg',
    interaction: choiceInteraction({
      question: 'Who is always right?',
      options: ['Luke', 'Maxine', 'The random person'],
      correct: 'Maxine',
      success: 'Correct. As always. 👑',
      onSuccess: () => unlockNext(2),
    }),
    gate: { prompt: 'What word do we always say?', answers: ['putangina'] },
  },
  {
    key: 'tala1',
    title: 'Tala — Our Escape',
    text: 'Where clouds get jealous and we remember we’re a team.',
    image: 'assets/images/scene3_tala.jpg',
    interaction: function(){ return holdToUnlockInteraction('Hold to breathe (2s)', 2000, () => unlockNext(3)); },
    gate: { prompt: 'Our escape place name?', answers: ['tala'] },
  },
  {
    key: 'tala2',
    title: 'Tala — The Sequel',
    text: 'Cinematic horizons and “putangina” whispered like poetry.',
    image: 'assets/images/scene4_tala_2.jpg',
    interaction: function(){
      return choiceInteraction({
        question: 'Who is the main character?',
        options: ['Luke', 'Maxine', 'Both'],
        correct: 'Maxine',
        success: 'Correct. Stars agree. ✨',
        onSuccess: () => unlockNext(4),
      })();
    },
    gate: { prompt: 'Who is the main character?', answers: ['maxine', 'me', 'ako'] },
  },
  {
    key: 'mc-syndrome',
    title: 'Main Character Energy',
    text: 'Maxine: “I’m the lead.” Luke: “Yes, your honor.” The universe: “Approved.”',
    image: 'assets/images/maincharacter.jpg',
    interaction: sliderInteraction({
      label: 'Main character level',
      unit: '%',
      start: 80,
      onSet: (val) => (val >= 100 ? 'Now that’s cinema 🎬' : 'Needs more sparkle ✨'),
      onDone: () => unlockNext(5),
    }),
    gate: { prompt: 'Favorite cafe?', answers: ['hanan'] },
  },
  {
    key: 'cafe',
    title: 'Hanan — Favorite Cafe',
    text: 'Where corny jokes get a free refill and kisses are the loyalty points.',
    image: 'assets/images/scene7_cafe_hanan.jpg',
    interaction: tapCounterInteraction({ label:'Sip ☕ (3x)', count:3, done:'Refilled!', onDone: () => unlockNext(6) }),
    gate: { prompt: 'Maxine’s fave food (two words):', answers: ['fish na gata', 'gata'] },
  },
  {
    key: 'dentist',
    title: 'Couple’s Dentist Arc',
    text: 'Yes, we love going to the dentist. Healthy teeth, healthy smooches. Also: armpit-sniff intermissions. 💐',
    image: 'assets/images/scene5_us.jpg',
    interaction: tapCounterInteraction({
      label: 'Tap to brush (5x)',
      count: 5,
      done: 'Minty fresh! 💋',
      onDone: () => unlockNext(7),
    }),
    gate: { prompt: 'We love going to the…', answers: ['dentist', 'dentists'] },
  },
  {
    key: 'lux',
    title: 'Luxury Restaurants',
    text: 'She orders with queenly grace. Luke pretends the steak pronunciation was on purpose.',
    image: 'assets/images/scene6_restaurant.jpg',
    interaction: function(){
      return choiceInteraction({
        question: 'Favorite place for coffee?',
        options: ['Hanan', 'Tala', 'Cabog-Cabog'],
        correct: 'Hanan',
        success: 'Treat me to pastries, please. 🥐',
        onSuccess: () => unlockNext(8),
      })();
    },
    gate: { prompt: 'Favorite place for coffee?', answers: ['hanan'] },
  },
  {
    key: 'finale',
    title: 'Whatever Happens, Together',
    text: 'Maxine, my Darling, as long as we stay together, we can conquer everything. I love you. — Luke',
    image: 'assets/images/scene1_cabog_cabog.jpg',
    interaction: finaleInteraction,
  },
];

// Labels on the SVG map
const labelsGroup = document.getElementById('labels');
const nodes = Array.prototype.slice.call(document.querySelectorAll('.node'));
nodes.forEach((node, i) => {
  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.classList.add('label');
  label.setAttribute('x', String(+node.getAttribute('cx') + 10));
  label.setAttribute('y', String(+node.getAttribute('cy') - 14));
  label.textContent = `${i + 1}`;
  labelsGroup.appendChild(label);

  // Larger, transparent touch target for mobile reliability
  try {
    const r = parseInt(node.getAttribute('r'), 10) || 16;
    const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hit.setAttribute('cx', node.getAttribute('cx'));
    hit.setAttribute('cy', node.getAttribute('cy'));
    hit.setAttribute('r', String(r + 18));
    hit.setAttribute('class', 'hit');
    hit.style.fill = 'transparent';
    hit.style.pointerEvents = 'all';
    hit.addEventListener('click', () => onNodeClick(i));
    node.after(hit);
  } catch(_){}
  node.addEventListener('click', () => onNodeClick(i));
});

// Failsafe: delegate clicks anywhere on the SVG to the nearest node
(function(){
  const svg = document.getElementById('timeline');
  if(!svg) return;
  function svgPoint(evt){
    const pt = svg.createSVGPoint();
    const e = evt.touches && evt.touches[0] ? evt.touches[0] : evt;
    pt.x = e.clientX; pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if(!ctm) return { x: 0, y: 0 };
    const inv = ctm.inverse();
    const sp = pt.matrixTransform(inv);
    return { x: sp.x, y: sp.y };
  }
  function nearestIndex(p){
    let best = 0, bestD = Infinity;
    nodes.forEach((n, i) => {
      const cx = +n.getAttribute('cx');
      const cy = +n.getAttribute('cy');
      const dx = cx - p.x; const dy = cy - p.y; const d = dx*dx + dy*dy;
      if(d < bestD){ bestD = d; best = i; }
    });
    return best;
  }
  const handler = (evt) => {
    if(!document.body.classList.contains('app-ready')) return;
    const target = evt.target;
    if(target && target.classList && (target.classList.contains('node') || target.classList.contains('hit'))){
      // If a node/hit was actually tapped, let its own handler run
      return;
    }
    const p = svgPoint(evt);
    onNodeClick(nearestIndex(p));
  };
  svg.addEventListener('click', handler, true);
  svg.addEventListener('touchend', handler, { passive: true, capture: true });
})();

// Preloader to App reveal
function initApp(){
  const pre = document.getElementById('preloader');
  const app = document.getElementById('app');
  if(!pre || !app) return;
  // Fake loading: wait between 5-10 seconds
  const delayMs = 5000 + Math.floor(Math.random()*5000);
  setTimeout(() => {
    pre.classList.add('hidden');
    app.classList.remove('hidden');
    document.body.classList.add('app-ready');
    const path = document.querySelector('#timeline #path');
    if(path){
      try{
        const len = path.getTotalLength();
        path.style.strokeDasharray = String(len);
        path.style.strokeDashoffset = String(len);
        if (window.gsap) {
          gsap.to(path, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.out' });
        } else {
          path.style.transition = 'stroke-dashoffset 1.2s ease';
          requestAnimationFrame(() => (path.style.strokeDashoffset = '0'));
        }
      }catch(_){ /* some browsers may not support getTotalLength */ }
    }
    if (window.gsap) {
      gsap.from('.node', { stagger: 0.06, duration: 0.7, scale: 0, ease: 'back.out(1.7)' });
    }
    renderLocks();
    // Try auto-play (user gesture may be required on some devices); show welcome overlay briefly
    audio.play().catch(() => {/* ignore */});
    showWelcome();
  }, delayMs);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp, { once: true });
} else {
  // DOM already ready
  initApp();
}

// Allow skipping the fake loading
document.addEventListener('click', function(e){
  if(e.target && e.target.id === 'skipLoad'){
    const pre = document.getElementById('preloader');
    const app = document.getElementById('app');
    if(pre && app){
      pre.classList.add('hidden');
      app.classList.remove('hidden');
      document.body.classList.add('app-ready');
      tryAutoPlay();
      showWelcome();
    }
  }
}, { passive:true });

// Modal controls
const modal = document.getElementById('modal');
const modalClose = document.querySelector('.modal-close');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const interactionRoot = document.getElementById('interaction');
const nextBtn = document.getElementById('nextScene');

modalClose.addEventListener('click', closeModal);
document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
nextBtn.addEventListener('click', () => navigate(1));

function onNodeClick(index){
  if(index > state.unlockedIndex){
    openGate(index);
    return;
  }
  openScene(index);
}

function openScene(index){
  state.currentIndex = index;
  const scene = scenes[index];
  document.querySelectorAll('.node').forEach(n => n.classList.toggle('active', +n.dataset.index === index));
  modalTitle.textContent = scene.title;
  modalText.textContent = scene.text;
  modalImage.src = scene.image;
  interactionRoot.innerHTML = '';
  if(typeof scene.interaction === 'function'){
    const el = scene.interaction();
    if(el) interactionRoot.appendChild(el);
  }
  modal.classList.remove('hidden');
  if (window.gsap && gsap.fromTo) {
    gsap.fromTo('.modal-card', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' });
  }
  updateNextButton();
  addSmartActions(scene);
}

function navigate(step){
  var baseIndex = (state.currentIndex != null ? state.currentIndex : 0);
  const next = Math.min(Math.max(0, baseIndex + step), scenes.length - 1);
  if(next > state.unlockedIndex){ toast('Solve to continue'); return; }
  openScene(next);
}

function closeModal(){
  modal.classList.add('hidden');
}

function unlockNext(index){
  state.solved[index] = true;
  state.unlockedIndex = Math.max(state.unlockedIndex, index + 1);
  renderLocks();
  updateNextButton();
  burst();
  showNudge();
}

function updateNextButton(){
  const baseIndex = (state.currentIndex != null ? state.currentIndex : 0);
  const canGoNext = baseIndex + 1 <= state.unlockedIndex;
  const btn = document.getElementById('nextScene');
  if(btn){
    btn.disabled = !canGoNext;
    btn.textContent = canGoNext ? 'Next' : 'Solve to continue';
  }
}

// Interactions
function choiceInteraction({ question, options, correct, success, onSuccess }){
  function render(){
    const wrap = document.createElement('div');
    const q = document.createElement('div');
    q.textContent = question;
    wrap.appendChild(q);
    const list = document.createElement('div');
    list.style.display = 'grid';
    list.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
    list.style.gap = '6px';
    options.forEach(opt => {
      const b = document.createElement('button');
      b.className = 'btn';
      b.textContent = opt;
      b.addEventListener('click', () => {
        if(opt === correct){
          toast(success);
          burst();
          if (typeof onSuccess === 'function') { onSuccess(); }
        } else {
          toast('Try again 😂');
        }
      });
      list.appendChild(b);
    });
    wrap.appendChild(list);
    return wrap;
  }
  return render;
}

function sliderInteraction({ label, unit, start = 0, onSet, onDone }){
  return function render(){
    const wrap = document.createElement('div');
    const l = document.createElement('div');
    const out = document.createElement('strong');
    l.textContent = label + ': ';
    out.textContent = `${start}${unit}`;
    l.appendChild(out);
    const input = document.createElement('input');
    input.type = 'range'; input.min = '0'; input.max = '120'; input.value = String(start);
    input.style.width = '100%'; input.addEventListener('input', () => { out.textContent = `${input.value}${unit}`; });
    input.addEventListener('change', () => { toast((typeof onSet === 'function' ? onSet(+input.value) : 'Set')); });
    const done = document.createElement('button'); done.className='btn'; done.textContent='Lock it in'; done.addEventListener('click', ()=>{ if(typeof onDone==='function') onDone(); });
    wrap.append(l, input, done);
    return wrap;
  };
}

function tapCounterInteraction({ label, count = 5, done = 'Done!', onDone }){
  return function render(){
    let remaining = count;
    const wrap = document.createElement('div');
    const b = document.createElement('button');
    b.className = 'btn';
    b.textContent = `${label}`;
    b.addEventListener('click', () => {
      remaining -= 1;
      if(remaining <= 0){
        b.disabled = true; b.textContent = done; burst();
        if(typeof onDone==='function') onDone();
      } else {
        b.textContent = `${label} (${remaining}x left)`;
      }
    });
    wrap.appendChild(b);
    return wrap;
  };
}

function finaleInteraction(){
  const wrap = document.createElement('div');
  const note = document.createElement('p');
  note.innerHTML = 'P.S. fish na gata tonight? Or street food run? You choose… then you still choose. I love your attitude, Darling. ❤';
  wrap.appendChild(note);
  const b = document.createElement('button');
  b.className = 'btn';
  b.textContent = 'Celebrate';
  b.addEventListener('click', () => celebrate());
  wrap.appendChild(b);
  // Compose button (AI)
  const ai = document.createElement('button');
  ai.className = 'btn btn-ghost';
  ai.textContent = 'Compose our letter (AI)';
  ai.addEventListener('click', composeLetter);
  wrap.appendChild(ai);
  return wrap;
}

function renderLocks(){
  nodes.forEach((node, i) => {
    node.classList.toggle('locked', i > state.unlockedIndex);
  });
}

function openGate(index){
  const gate = scenes[index].gate;
  const wrap = document.createElement('div');
  const h = document.createElement('h3'); h.textContent = 'Unlock this memory';
  const p = document.createElement('p'); p.textContent = (gate && gate.prompt) || 'Answer to unlock';
  const input = document.createElement('input'); input.placeholder = 'Type answer'; input.className='gate-input'; input.style.width='100%'; input.style.padding='10px'; input.autocapitalize='off'; input.autocomplete='off';
  const submit = document.createElement('button'); submit.className='btn'; submit.textContent='Unlock';
  const help = document.createElement('div'); help.style.color = '#bdb7ae'; help.style.fontSize='12px'; help.style.marginTop='6px'; help.textContent='Hint: lowercase is fine';
  submit.addEventListener('click', () => {
    const val = (input.value || '').trim().toLowerCase();
    const ok = (gate && gate.answers ? gate.answers : []).some(a => val === a.toLowerCase());
    if(ok){
      state.unlockedIndex = Math.max(state.unlockedIndex, index);
      renderLocks();
      toast('Unlocked!');
      openScene(index);
    } else {
      toast('Almost! Try again.');
    }
  });
  wrap.append(h,p,input,submit,help);
  modalTitle.textContent = '🔒 Locked';
  modalText.textContent = '';
  interactionRoot.innerHTML = '';
  modalImage.src = 'assets/images/scene1_cabog_cabog.jpg';
  interactionRoot.appendChild(wrap);
  modal.classList.remove('hidden');
}

// Jigsaw-like slice puzzle (single-row swap)
function slicePuzzleInteraction(imageUrl, columns, onSolved){
  const numCols = Math.max(2, columns || 3);
  let order = Array.from({ length: numCols }, (_, i) => i);
  // Shuffle order
  for(let i=order.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [order[i],order[j]]=[order[j],order[i]]; }
  const correct = Array.from({ length: numCols }, (_, i) => i).join(',');

  const wrap = document.createElement('div');
  const grid = document.createElement('div');
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = `repeat(${numCols}, 1fr)`;
  grid.style.gap = '6px';
  grid.style.userSelect = 'none';
  wrap.appendChild(grid);

  let first = null;

  function render(){
    grid.innerHTML = '';
    order.forEach((sliceIndex, position) => {
      const tile = document.createElement('button');
      tile.style.position = 'relative';
      tile.style.paddingTop = '66%';
      tile.style.border = '1px solid #3a342b';
      tile.style.borderRadius = '10px';
      tile.style.overflow = 'hidden';
      tile.style.background = `url(${imageUrl})`;
      tile.style.backgroundSize = `${numCols*100}% 100%`;
      tile.style.backgroundPosition = `${(-sliceIndex*100)}% 0%`;
      tile.addEventListener('click', () => onClick(position, tile));
      grid.appendChild(tile);
    });
  }

  function onClick(position, el){
    if(first === null){ first = position; el.style.outline = '2px solid #e7cba9'; return; }
    if(first === position){ el.style.outline = 'none'; first = null; return; }
    const temp = order[first]; order[first] = order[position]; order[position] = temp; first = null; render();
    if(order.join(',') === correct){ toast('Perfect match!'); if(typeof onSolved === 'function') onSolved(); }
  }

  const hint = document.createElement('div');
  hint.style.color = '#bdb7ae';
  hint.style.fontSize = '12px';
  hint.style.marginTop = '6px';
  hint.textContent = 'Swap pieces to fix the photo.';
  wrap.appendChild(hint);

  render();
  return wrap;
}

// 3x3 grid shuffle puzzle (tap to move into empty slot)
function gridPuzzleInteraction(imageUrl, rows, cols, onSolved){
  const r = Math.max(2, rows || 3), c = Math.max(2, cols || 3);
  const total = r * c;
  const emptyTileId = total - 1; // last tile id is the empty slot
  let board = Array.from({ length: total }, (_, i) => i); // board[position] = tileId

  function neighbors(pos){
    const x = pos % c, y = Math.floor(pos / c);
    const list = [];
    if (x > 0) list.push(pos - 1);
    if (x < c - 1) list.push(pos + 1);
    if (y > 0) list.push(pos - c);
    if (y < r - 1) list.push(pos + c);
    return list;
  }

  // Shuffle by performing random valid moves from the solved state
  let emptyPos = board.indexOf(emptyTileId);
  for (let i = 0; i < 200; i++) {
    const ns = neighbors(emptyPos);
    const nextPos = ns[Math.floor(Math.random() * ns.length)];
    // swap tile at nextPos with empty at emptyPos
    [board[emptyPos], board[nextPos]] = [board[nextPos], board[emptyPos]];
    emptyPos = nextPos;
  }
  // Ensure not already solved
  if (board.every((t, i) => t === i)) {
    const ns = neighbors(emptyPos);
    const nextPos = ns[0];
    [board[emptyPos], board[nextPos]] = [board[nextPos], board[emptyPos]];
    emptyPos = nextPos;
  }

  const wrap=document.createElement('div');
  const grid=document.createElement('div');
  grid.style.display='grid'; grid.style.gridTemplateColumns=`repeat(${c}, 1fr)`; grid.style.gap='6px';
  wrap.appendChild(grid);

  function render(){
    grid.innerHTML='';
    for(let i=0;i<total;i++){
      const tileIndex = board[i];
      const tile=document.createElement('button');
      tile.style.position='relative'; tile.style.paddingTop='100%'; tile.style.border='1px solid #3a342b'; tile.style.borderRadius='10px'; tile.style.overflow='hidden';
      if(tileIndex!==emptyTileId){
        const tx=tileIndex%c, ty=Math.floor(tileIndex/c);
        tile.style.background=`url(${imageUrl})`;
        tile.style.backgroundSize=`${c*100}% ${r*100}%`;
        tile.style.backgroundPosition=`${(-tx*100)}% ${(-ty*100)}%`;
      } else {
        tile.style.background='#111';
      }
      tile.addEventListener('click', ()=>move(i));
      grid.appendChild(tile);
    }
  }

  function move(pos){
    const ei = board.indexOf(emptyTileId);
    const allowed = neighbors(ei).includes(pos);
    if(!allowed) return;
    [board[pos], board[ei]]=[board[ei], board[pos]];
    render();
    if(isSolved()){ toast('Nice!'); if(typeof onSolved==='function') onSolved(); }
  }

  function isSolved(){
    for(let i=0;i<total;i++){ if(board[i]!==i) return false; }
    return true;
  }

  const hint=document.createElement('div'); hint.style.color='#bdb7ae'; hint.style.fontSize='12px'; hint.style.marginTop='6px'; hint.textContent='Slide tiles into the empty spot to complete the photo.'; wrap.appendChild(hint);
  render();
  return wrap;
}

// Hold to unlock interaction (press and hold button)
function holdToUnlockInteraction(label, ms, onDone){
  const wrap=document.createElement('div');
  const btn=document.createElement('button'); btn.className='btn'; btn.textContent=label;
  const bar=document.createElement('div'); bar.style.height='6px'; bar.style.background='#2a291f'; bar.style.border='1px solid #3a3328'; bar.style.borderRadius='999px'; bar.style.marginTop='8px';
  const fill=document.createElement('div'); fill.style.height='100%'; fill.style.width='0%'; fill.style.background='#e7cba9'; fill.style.borderRadius='999px'; bar.appendChild(fill);
  wrap.append(btn,bar);
  let t; let start;
  function down(){ start=Date.now(); t=setInterval(()=>{ const p=Math.min(1,(Date.now()-start)/ms); fill.style.width=(p*100)+'%'; if(p>=1){ clearInterval(t); btn.disabled=true; toast('Ready!'); if(typeof onDone==='function') onDone(); } }, 16); }
  function up(){ clearInterval(t); fill.style.width='0%'; }
  btn.addEventListener('mousedown', down); btn.addEventListener('touchstart', down);
  ['mouseup','mouseleave','touchend','touchcancel'].forEach(ev=>btn.addEventListener(ev, up));
  return wrap;
}

// Smart hint + actions
async function requestHint(sceneKey, context){
  try{
    const base = (location.protocol === 'file:') ? 'http://localhost:8888' : '';
    const res = await fetch(base + '/.netlify/functions/hint', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ sceneKey, context }) });
    const data = await res.json();
    toast(data.hint || 'Think of your place.');
  }catch(_){ toast('Think of your place.'); }
}

function addSmartActions(scene){
  const bar = document.createElement('div');
  bar.style.display = 'flex'; bar.style.gap = '8px'; bar.style.marginTop = '8px';
  const hintBtn = document.createElement('button'); hintBtn.className='btn btn-ghost'; hintBtn.textContent='Whisper a hint';
  hintBtn.addEventListener('click', () => requestHint(scene.key, scene.title));
  bar.appendChild(hintBtn);
  interactionRoot.appendChild(bar);
}

async function composeLetter(){
  const tone = 'spicy-cute-wholesome';
  const memories = [
    'Cabog-Cabog first date', 'Tala escapes', 'Hanan cafe', 'fish na gata', 'random thank-you joke', 'she is always right'
  ];
  try{
    // Try same-origin first (works on Netlify)
    const tryPaths = [];
    if(location.protocol === 'http:' || location.protocol === 'https:'){
      tryPaths.push('/.netlify/functions/compose');
    }
    // Then try local Netlify dev
    tryPaths.push('http://localhost:8888/.netlify/functions/compose');

    let text = null;
    for(const url of tryPaths){
      try{
        const res = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ tone, memories }) });
        if(res.ok){ const data = await res.json(); text = data.letter || null; if(text) break; }
      }catch(e){ /* try next */ }
    }

    if(!text){
      // Offline fallback composer (no API)
      text = localCompose(tone, memories);
      toast('Offline compose used');
    }

    const p = document.createElement('p');
    p.textContent = text;
    p.style.whiteSpace='pre-wrap';
    interactionRoot.appendChild(p);
    burst();
  }catch(_){ toast('Compose failed.'); }
}

function localCompose(tone, memories){
  const lines = [
    'Maxine,',
    `From ${memories[0]} to ${memories[1]}, you make everything feel cinematic.`,
    `You laugh at my corny jokes and still steal my heart at ${memories[2]}.`,
    `You say I choose… then you choose, and somehow that is my favorite plot twist.`,
    `I’ll say “thank you” to the wrong stranger again if it makes you smile.`,
    'Whatever happens, we face it together. Always yours, Luke.'
  ];
  return lines.join(' ');
}

function showWelcome(){
  const el = document.getElementById('welcome');
  if(!el) return;
  el.classList.remove('hidden');
  // Do not block clicks under the welcome card
  el.style.pointerEvents = 'none';
  setTimeout(() => {
    if (window.gsap) {
      gsap.to('#welcome', { opacity: 0, duration: 0.4, onComplete: () => el.classList.add('hidden') });
    } else {
      el.classList.add('hidden');
    }
  }, 1400);
}

// Toast helper
let toastTimeout;
function toast(message){
  let el = document.getElementById('toast');
  if(!el){
    el = document.createElement('div');
    el.id = 'toast';
    Object.assign(el.style, {
      position:'fixed', left:'50%', bottom:'22px', transform:'translateX(-50%)',
      padding:'10px 14px', background:'#222', color:'#fff', border:'1px solid #3a3a3a', borderRadius:'12px', zIndex:60
    });
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.style.opacity = '0';
  el.style.display = 'block';
  gsap.to(el, { opacity: 1, duration: 0.2 });
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { gsap.to(el, { opacity: 0, duration: 0.3, onComplete: () => (el.style.display = 'none') }); }, 1400);
}

// Rotating messages and popup nudge
const nudges = [
  'That’s my main character. 😘',
  'Certified Dalmi moment. 💖',
  'You choose… then you still choose. I love it.',
  'Kiss tax applied. 💋',
  'Putangina, we’re cute.',
  'I love your attitude, Darling',
  'Next stop: snacks. Or armpit sniffing. Your call.',
  'Plot twist: you were right again. 👑',
  'Youu my love, is the best',
];
let nudgeIndex = 0;
function showNudge(){
  const msg = nudges[nudgeIndex % nudges.length];
  nudgeIndex += 1;
  let el = document.getElementById('nudge');
  if(!el){
    el = document.createElement('div');
    el.id = 'nudge';
    el.className = 'nudge';
    el.innerHTML = '<div class="nudge-card"><div class="nudge-msg"></div><div class="nudge-actions"><button id="nudgeClose" class="btn">Okay ❤</button></div></div>';
    document.body.appendChild(el);
    el.addEventListener('click', (e)=>{ if(e.target.id==='nudge' || e.target.id==='nudgeClose'){ el.remove(); }});
  }
  el.querySelector('.nudge-msg').textContent = msg;
}

function burst(){
  confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
}

function celebrate(){
  confetti({ particleCount: 200, spread: 120, startVelocity: 36, origin: { y: 0.6 } });
  setTimeout(() => confetti({ particleCount: 120, spread: 100, origin: { x: 0.2, y: 0.6 } }), 200);
  setTimeout(() => confetti({ particleCount: 120, spread: 100, origin: { x: 0.8, y: 0.6 } }), 300);
}

// Audio controls
document.getElementById('audioToggle').addEventListener('click', async () => {
  if(!state.songStarted){
    try{ await audio.play(); state.songStarted = true; }catch(e){ /* autoplay might block */ }
  } else {
    if(audio.paused){ await audio.play(); } else { audio.pause(); }
  }
  document.getElementById('audioToggle').textContent = audio.paused ? 'Play song' : 'Pause song';
});

document.getElementById('sparkle').addEventListener('click', burst);

// Robust auto-play helper: retries on first interaction
function tryAutoPlay(){
  const tryPlay = () => { if(audio.paused) audio.play().catch(()=>{}); };
  tryPlay();
  ['pointerdown','touchstart','click'].forEach(ev => {
    window.addEventListener(ev, function once(){ tryPlay(); window.removeEventListener(ev, once, true); }, true);
  });
}


