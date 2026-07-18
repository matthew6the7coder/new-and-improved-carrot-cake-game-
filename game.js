// ── DOM ──────────────────────────────────────────────────────────────
const gameArea     = document.getElementById('game-area');
const basket       = document.getElementById('basket');
const basketSvg    = document.getElementById('basket-svg');
const scoreVal     = document.getElementById('score-val');
const livesVal     = document.getElementById('lives-val');
const bestVal      = document.getElementById('best-val');
const lvVal        = document.getElementById('lv-val');
const modeBadge    = document.getElementById('mode-badge');
const overlay      = document.getElementById('overlay');
const popup        = document.getElementById('score-popup');
const particlesC   = document.getElementById('particles-container');
const timerBarWrap = document.getElementById('timer-bar-wrap');
const timerBar     = document.getElementById('timer-bar');
const comboDisplay = document.getElementById('combo-display');
const powerupMsg   = document.getElementById('powerup-msg');
const badgeToast   = document.getElementById('badge-toast');
const toastIcon    = document.getElementById('toast-icon');
const toastName    = document.getElementById('toast-name');
const btnPlay      = document.getElementById('btn-play');
const btnBadges    = document.getElementById('btn-badges');
const btnShop      = document.getElementById('btn-shop');
const btnAdmin     = document.getElementById('btn-admin');
const btnCookbook  = document.getElementById('btn-cookbook');
const btnStats     = document.getElementById('btn-stats');

// ── State ─────────────────────────────────────────────────────────────
let basketX=200, score=0, lives=3, level=1;
let running=false, items=[], animId, popupTimeout;
let frameCount=0, spawnTimer=0, spawnInterval=90;
let currentMode='classic';
let timeLeft=60, lastTimestamp=0;
let combo=0, comboTimeout;
let basketWidth=80;
let shrinkTimeout, powerupTimeout, toastTimeout;
let playerName = localStorage.getItem('playerName') || '';
let isMuted = localStorage.getItem('isMuted') === 'true';

const AREA_H=490, BASKET_H=54;
const GROUND_Y = AREA_H - 56 - BASKET_H;
const AREA_W   = () => gameArea.offsetWidth;

let bests   = { classic:0,timeattack:0,zen:0,nightmare:0,blitz:0,precision:0,reversed:0,bigbasket:0,nocombo:0,speed:0,survival:0,golden:0,chaos:0,easter:0 };
let stats   = {
  classic:{played:0,totalScore:0,maxCombo:0},   timeattack:{played:0,totalScore:0,maxCombo:0},
  zen:{played:0,totalScore:0,maxCombo:0},        nightmare:{played:0,totalScore:0,maxCombo:0},
  blitz:{played:0,totalScore:0,maxCombo:0},      precision:{played:0,totalScore:0,maxCombo:0},
  reversed:{played:0,totalScore:0,maxCombo:0},   bigbasket:{played:0,totalScore:0,maxCombo:0},
  nocombo:{played:0,totalScore:0,maxCombo:0},    speed:{played:0,totalScore:0,maxCombo:0},
  survival:{played:0,totalScore:0,maxCombo:0},   golden:{played:0,totalScore:0,maxCombo:0},
  chaos:{played:0,totalScore:0,maxCombo:0},      easter:{played:0,totalScore:0,maxCombo:0},
};
let unlockedBadges = {};
const EASTER_ACTIVE = new Date().getMonth() === 3; // April

// ── Badge Definitions ─────────────────────────────────────────────────────
const BADGES = [
  // ── Classic ──
  { id:'classic_first',   mode:'classic',    icon:'🥕', name:'First Bite',      desc:'Play Classic once',            tier:'bronze', check: ()=> stats.classic.played >= 1 },
  { id:'classic_100',     mode:'classic',    icon:'🎂', name:'Cake Catcher',    desc:'Score 100 in Classic',         tier:'bronze', check: ()=> bests.classic >= 100 },
  { id:'classic_250',     mode:'classic',    icon:'⭐', name:'Star Baker',      desc:'Score 250 in Classic',         tier:'silver', check: ()=> bests.classic >= 250 },
  { id:'classic_500',     mode:'classic',    icon:'🏆', name:'Master Baker',    desc:'Score 500 in Classic',         tier:'gold',   check: ()=> bests.classic >= 500 },
  { id:'classic_lv5',     mode:'classic',    icon:'🔥', name:'Level 5',         desc:'Reach Level 5 in Classic',     tier:'silver', check: ()=> bests.classic >= 400 },
  { id:'classic_combo',   mode:'classic',    icon:'💫', name:'Combo King',      desc:'Get a x5 combo in Classic',    tier:'gold',   check: ()=> stats.classic.maxCombo >= 5 },
  { id:'classic_1000',    mode:'classic',    icon:'👑', name:'Carrot Royalty',  desc:'Score 1000 in Classic',        tier:'legend', check: ()=> bests.classic >= 1000 },
  { id:'classic_played5', mode:'classic',    icon:'🌱', name:'Dedicated Baker', desc:'Play Classic 5 times',         tier:'bronze', check: ()=> stats.classic.played >= 5 },

  // ── Time Attack ──
  { id:'ta_first',        mode:'timeattack', icon:'⏱️', name:'On the Clock',    desc:'Play Time Attack once',        tier:'bronze', check: ()=> stats.timeattack.played >= 1 },
  { id:'ta_100',          mode:'timeattack', icon:'🚀', name:'Speed Snacker',   desc:'Score 100 in Time Attack',     tier:'bronze', check: ()=> bests.timeattack >= 100 },
  { id:'ta_300',          mode:'timeattack', icon:'⚡', name:'Lightning Baker', desc:'Score 300 in Time Attack',     tier:'silver', check: ()=> bests.timeattack >= 300 },
  { id:'ta_500',          mode:'timeattack', icon:'🌪️', name:'Time Destroyer',  desc:'Score 500 in Time Attack',     tier:'gold',   check: ()=> bests.timeattack >= 500 },
  { id:'ta_combo',        mode:'timeattack', icon:'💥', name:'Blitz Combo',     desc:'Get a x5 combo in Time Attack',tier:'silver', check: ()=> stats.timeattack.maxCombo >= 5 },
  { id:'ta_1000',         mode:'timeattack', icon:'🏅', name:'60 Second Hero',  desc:'Score 1000 in Time Attack',    tier:'legend', check: ()=> bests.timeattack >= 1000 },

  // ── Zen ──
  { id:'zen_first',       mode:'zen',        icon:'🌿', name:'Inner Peace',     desc:'Play Zen Mode once',           tier:'bronze', check: ()=> stats.zen.played >= 1 },
  { id:'zen_200',         mode:'zen',        icon:'🌸', name:'Petal Catcher',   desc:'Score 200 in Zen Mode',        tier:'bronze', check: ()=> bests.zen >= 200 },
  { id:'zen_500',         mode:'zen',        icon:'🍃', name:'Zen Master',      desc:'Score 500 in Zen Mode',        tier:'silver', check: ()=> bests.zen >= 500 },
  { id:'zen_1000',        mode:'zen',        icon:'🧘', name:'Enlightened',     desc:'Score 1000 in Zen Mode',       tier:'gold',   check: ()=> bests.zen >= 1000 },
  { id:'zen_combo',       mode:'zen',        icon:'🌊', name:'Flow State',      desc:'Get a x8 combo in Zen Mode',   tier:'silver', check: ()=> stats.zen.maxCombo >= 8 },
  { id:'zen_2000',        mode:'zen',        icon:'✨', name:'Transcendent',    desc:'Score 2000 in Zen Mode',       tier:'legend', check: ()=> bests.zen >= 2000 },

  // ── Nightmare ──
  { id:'nm_first',        mode:'nightmare',  icon:'💀', name:'Brave Soul',      desc:'Play Nightmare once',          tier:'bronze', check: ()=> stats.nightmare.played >= 1 },
  { id:'nm_50',           mode:'nightmare',  icon:'😰', name:'Lucky Escape',    desc:'Score 50 in Nightmare',        tier:'bronze', check: ()=> bests.nightmare >= 50 },
  { id:'nm_150',          mode:'nightmare',  icon:'💪', name:'Dark Baker',      desc:'Score 150 in Nightmare',       tier:'silver', check: ()=> bests.nightmare >= 150 },
  { id:'nm_300',          mode:'nightmare',  icon:'🔥', name:'Inferno Baker',   desc:'Score 300 in Nightmare',       tier:'gold',   check: ()=> bests.nightmare >= 300 },
  { id:'nm_500',          mode:'nightmare',  icon:'👹', name:'Nightmare King',  desc:'Score 500 in Nightmare',       tier:'legend', check: ()=> bests.nightmare >= 500 },

  // ── Blitz ──
  { id:'blitz_first',  mode:'blitz', icon:'⚡', name:'Lightning Fast',   desc:'Play Blitz once',           tier:'bronze', check:()=>stats.blitz.played>=1 },
  { id:'blitz_100',    mode:'blitz', icon:'💥', name:'Blitz Beginner',   desc:'Score 100 in Blitz',        tier:'bronze', check:()=>bests.blitz>=100 },
  { id:'blitz_300',    mode:'blitz', icon:'🔥', name:'Blitz Expert',     desc:'Score 300 in Blitz',        tier:'silver', check:()=>bests.blitz>=300 },
  { id:'blitz_600',    mode:'blitz', icon:'🌩️', name:'Blitz Master',     desc:'Score 600 in Blitz',        tier:'gold',   check:()=>bests.blitz>=600 },
  { id:'blitz_1000',   mode:'blitz', icon:'👑', name:'Blitz God',        desc:'Score 1000 in Blitz',       tier:'legend', check:()=>bests.blitz>=1000 },

  // ── Precision ──
  { id:'prec_first',   mode:'precision', icon:'🎯', name:'Sharp Eye',       desc:'Play Precision once',       tier:'bronze', check:()=>stats.precision.played>=1 },
  { id:'prec_100',     mode:'precision', icon:'🔍', name:'Eagle Eye',        desc:'Score 100 in Precision',    tier:'bronze', check:()=>bests.precision>=100 },
  { id:'prec_250',     mode:'precision', icon:'💎', name:'Diamond Focus',    desc:'Score 250 in Precision',    tier:'silver', check:()=>bests.precision>=250 },
  { id:'prec_500',     mode:'precision', icon:'🏹', name:'Sniper Baker',     desc:'Score 500 in Precision',    tier:'gold',   check:()=>bests.precision>=500 },
  { id:'prec_1000',    mode:'precision', icon:'🌟', name:'Perfect Shot',     desc:'Score 1000 in Precision',   tier:'legend', check:()=>bests.precision>=1000 },

  // ── Reversed ──
  { id:'rev_first',    mode:'reversed', icon:'🔄', name:'Topsy Turvy',      desc:'Play Reversed once',        tier:'bronze', check:()=>stats.reversed.played>=1 },
  { id:'rev_100',      mode:'reversed', icon:'🙃', name:'Upside Down',      desc:'Score 100 in Reversed',     tier:'bronze', check:()=>bests.reversed>=100 },
  { id:'rev_300',      mode:'reversed', icon:'🌀', name:'Mind Bender',      desc:'Score 300 in Reversed',     tier:'silver', check:()=>bests.reversed>=300 },
  { id:'rev_600',      mode:'reversed', icon:'🎭', name:'Reality Flipper',  desc:'Score 600 in Reversed',     tier:'gold',   check:()=>bests.reversed>=600 },
  { id:'rev_legend',   mode:'reversed', icon:'♾️', name:'Chaos Agent',      desc:'Score 1000 in Reversed',    tier:'legend', check:()=>bests.reversed>=1000 },

  // ── Big Basket ──
  { id:'bb_first',     mode:'bigbasket', icon:'🧺', name:'Big Catcher',     desc:'Play Big Basket once',      tier:'bronze', check:()=>stats.bigbasket.played>=1 },
  { id:'bb_200',       mode:'bigbasket', icon:'🛒', name:'Mega Haul',        desc:'Score 200 in Big Basket',   tier:'bronze', check:()=>bests.bigbasket>=200 },
  { id:'bb_500',       mode:'bigbasket', icon:'🏟️', name:'Stadium Catch',   desc:'Score 500 in Big Basket',   tier:'silver', check:()=>bests.bigbasket>=500 },
  { id:'bb_1000',      mode:'bigbasket', icon:'🗃️', name:'Warehouse Baker', desc:'Score 1000 in Big Basket',  tier:'gold',   check:()=>bests.bigbasket>=1000 },
  { id:'bb_2000',      mode:'bigbasket', icon:'🌊', name:'Overflow!',        desc:'Score 2000 in Big Basket',  tier:'legend', check:()=>bests.bigbasket>=2000 },

  // ── No Combo ──
  { id:'nc_first',     mode:'nocombo', icon:'🚫', name:'Solo Act',          desc:'Play No Combo once',        tier:'bronze', check:()=>stats.nocombo.played>=1 },
  { id:'nc_100',       mode:'nocombo', icon:'1️⃣', name:'One by One',        desc:'Score 100 in No Combo',     tier:'bronze', check:()=>bests.nocombo>=100 },
  { id:'nc_300',       mode:'nocombo', icon:'🎲', name:'Pure Skill',        desc:'Score 300 in No Combo',     tier:'silver', check:()=>bests.nocombo>=300 },
  { id:'nc_600',       mode:'nocombo', icon:'💪', name:'No Shortcuts',      desc:'Score 600 in No Combo',     tier:'gold',   check:()=>bests.nocombo>=600 },
  { id:'nc_legend',    mode:'nocombo', icon:'🧠', name:'Raw Talent',        desc:'Score 1000 in No Combo',    tier:'legend', check:()=>bests.nocombo>=1000 },

  // ── Speed Run ──
  { id:'sp_first',     mode:'speed',   icon:'💨', name:'Speed Demon',       desc:'Play Speed Run once',       tier:'bronze', check:()=>stats.speed.played>=1 },
  { id:'sp_100',       mode:'speed',   icon:'🏃', name:'Quick Catch',       desc:'Score 100 in Speed Run',    tier:'bronze', check:()=>bests.speed>=100 },
  { id:'sp_300',       mode:'speed',   icon:'🚄', name:'Bullet Baker',      desc:'Score 300 in Speed Run',    tier:'silver', check:()=>bests.speed>=300 },
  { id:'sp_600',       mode:'speed',   icon:'🛸', name:'Hyperspeed',        desc:'Score 600 in Speed Run',    tier:'gold',   check:()=>bests.speed>=600 },
  { id:'sp_legend',    mode:'speed',   icon:'⚡', name:'Flash Baker',       desc:'Score 1000 in Speed Run',   tier:'legend', check:()=>bests.speed>=1000 },

  // ── Survival ──
  { id:'sur_first',    mode:'survival', icon:'☠️', name:'Still Alive',      desc:'Play Survival once',        tier:'bronze', check:()=>stats.survival.played>=1 },
  { id:'sur_50',       mode:'survival', icon:'😅', name:'Barely Made It',   desc:'Score 50 in Survival',      tier:'bronze', check:()=>bests.survival>=50 },
  { id:'sur_150',      mode:'survival', icon:'🛡️', name:'Tough Cookie',     desc:'Score 150 in Survival',     tier:'silver', check:()=>bests.survival>=150 },
  { id:'sur_300',      mode:'survival', icon:'🦺', name:'Indestructible',   desc:'Score 300 in Survival',     tier:'gold',   check:()=>bests.survival>=300 },
  { id:'sur_legend',   mode:'survival', icon:'💀', name:'Unkillable',       desc:'Score 500 in Survival',     tier:'legend', check:()=>bests.survival>=500 },

  // ── Golden ──
  { id:'gld_first',    mode:'golden',  icon:'🌟', name:'Gold Rush',         desc:'Play Golden Mode once',     tier:'bronze', check:()=>stats.golden.played>=1 },
  { id:'gld_100',      mode:'golden',  icon:'✨', name:'Stargazer',         desc:'Score 100 in Golden',       tier:'bronze', check:()=>bests.golden>=100 },
  { id:'gld_300',      mode:'golden',  icon:'💛', name:'All That Glitters', desc:'Score 300 in Golden',       tier:'silver', check:()=>bests.golden>=300 },
  { id:'gld_600',      mode:'golden',  icon:'🏅', name:'Gold Fever',        desc:'Score 600 in Golden',       tier:'gold',   check:()=>bests.golden>=600 },
  { id:'gld_legend',   mode:'golden',  icon:'👑', name:'Golden God',        desc:'Score 1000 in Golden',      tier:'legend', check:()=>bests.golden>=1000 },

  // ── Chaos ──
  { id:'ch_first',     mode:'chaos',   icon:'🌀', name:'Embrace Chaos',     desc:'Play Chaos once',           tier:'bronze', check:()=>stats.chaos.played>=1 },
  { id:'ch_100',       mode:'chaos',   icon:'🎪', name:'Chaos Clown',       desc:'Score 100 in Chaos',        tier:'bronze', check:()=>bests.chaos>=100 },
  { id:'ch_300',       mode:'chaos',   icon:'🎭', name:'Chaos Maestro',     desc:'Score 300 in Chaos',        tier:'silver', check:()=>bests.chaos>=300 },
  { id:'ch_600',       mode:'chaos',   icon:'🌪️', name:'Chaos Lord',        desc:'Score 600 in Chaos',        tier:'gold',   check:()=>bests.chaos>=600 },
  { id:'ch_legend',    mode:'chaos',   icon:'😈', name:'True Chaos',        desc:'Score 1000 in Chaos',       tier:'legend', check:()=>bests.chaos>=1000 },

  // ── Easter Event ──
  { id:'es_first',     mode:'easter',  icon:'🥚', name:'Easter Baker',      desc:'Play Easter Event',         tier:'bronze', check:()=>stats.easter.played>=1 },
  { id:'es_eggs',      mode:'easter',  icon:'🐣', name:'Egg Hunter',        desc:'Score 100 in Easter',       tier:'bronze', check:()=>bests.easter>=100 },
  { id:'es_bunny',     mode:'easter',  icon:'🐰', name:'Easter Bunny',      desc:'Score 250 in Easter',       tier:'silver', check:()=>bests.easter>=250 },
  { id:'es_basket',    mode:'easter',  icon:'🌷', name:'Spring Basket',     desc:'Score 500 in Easter',       tier:'gold',   check:()=>bests.easter>=500 },
  { id:'es_legend',    mode:'easter',  icon:'🍫', name:'Chocolate Master',  desc:'Score 1000 in Easter',      tier:'legend', check:()=>bests.easter>=1000 },
];

// ── Item pools ───────────────────────────────────────────────────────────
const POOLS = {
  classic:   { good:['🥕','🥕','🥕','🎂','🧁','🍰','⭐','🎂','🍩'],         bad:['🐛','💧'],              badChance:0.28, icingChance:0.04 },
  timeattack:{ good:['🥕','🥕','🎂','🧁','⭐','⭐','🍩','🍰'],               bad:['🐛','💧','🌀'],          badChance:0.32, icingChance:0.05 },
  zen:       { good:['🥕','🥕','🥕','🎂','🧁','🍰','🍮','🍩','⭐','🌸'],     bad:[],                       badChance:0,    icingChance:0.06 },
  nightmare: { good:['🥕','🎂','🧁','⭐'],                                    bad:['🐛','💧','💧','🌀'],     badChance:0.44, icingChance:0.03 },
  blitz:     { good:['🥕','🥕','🎂','⭐','⭐','⭐','🍦'],                     bad:['🐛','💧','🌀','🌀'],     badChance:0.36, icingChance:0.08, timeLimit:30 },
  precision: { good:['⭐','⭐','🎂','🍦'],                                     bad:['🥕','🥕','🐛','💧'],     badChance:0.55, icingChance:0.05 },
  reversed:  { good:['🥕','🥕','🎂','🧁','🍰','🍩'],                         bad:['⭐','🍦','🐛'],           badChance:0.40, icingChance:0    },
  bigbasket: { good:['🥕','🥕','🥕','🎂','🧁','🍰','🍮','🍩','⭐','🌸'],     bad:['🐛','💧'],              badChance:0.20, icingChance:0.07 },
  nocombo:   { good:['🥕','🥕','🎂','🧁','⭐'],                               bad:['🐛','💧','🌀'],          badChance:0.30, icingChance:0.04 },
  speed:     { good:['🥕','🎂','⭐','🍦'],                                    bad:['🐛','💧'],              badChance:0.25, icingChance:0.06 },
  survival:  { good:['🥕','🎂','🧁'],                                         bad:['🐛','💧','💧','🌀','🌀'],badChance:0.50, icingChance:0.02 },
  golden:    { good:['⭐','⭐','⭐','🍦','🎂'],                               bad:['🥕','🐛','💧'],          badChance:0.45, icingChance:0.10 },
  chaos:     { good:['🥕','🎂','🧁','🍰','⭐','🍦','🌸'],                    bad:['🐛','💧','🌀','🌀','🌀'],badChance:0.45, icingChance:0.06 },
  easter:    { good:['🥚','🐣','🐰','🌷','🍫','🧁','⭐'],                    bad:['🐛','💧','🦊'],          badChance:0.25, icingChance:0.05 },
};

const POINTS = {
  '🥕':10,'🎂':25,'🧁':20,'🍰':30,'🍮':20,'🍩':15,'⭐':50,'🌸':15,'🍦':100,'🥇':200,
  '🥚':15,'🐣':25,'🐰':40,'🌷':10,'🍫':20,
};

const MODE_NAMES = {
  classic:'Classic',timeattack:'Time Attack ⏱️',zen:'Zen 🌿',nightmare:'Nightmare 💀',
  blitz:'Blitz ⚡',precision:'Precision 🎯',reversed:'Reversed 🔄',bigbasket:'Big Basket 🧺',
  nocombo:'No Combo 🚫',speed:'Speed Run 💨',survival:'Survival ☠️',golden:'Golden 🌟',
  chaos:'Chaos 🌀',easter:'🥚 Easter Event',
};

// ── Persistence ───────────────────────────────────────────────────────────
function saveData() {
  try { localStorage.setItem('ccc_data', JSON.stringify({ bests, stats, unlockedBadges })); } catch(e){}
}

function loadData() {
  try {
    const d = JSON.parse(localStorage.getItem('ccc_data')||'{}');
    if (d.bests)          Object.assign(bests, d.bests);
    if (d.stats)          Object.assign(stats, d.stats);
    if (d.unlockedBadges) Object.assign(unlockedBadges, d.unlockedBadges);
    Object.keys(stats).forEach(k=>{ if(!stats[k]) stats[k]={played:0,totalScore:0,maxCombo:0}; if(!stats[k].maxCombo) stats[k].maxCombo=0; });
    Object.keys(bests).forEach(k=>{ if(!bests[k]) bests[k]=0; });
  } catch(e){}
}

loadData();
bestVal.textContent = bests[currentMode] || 0;

// ── Badge checking ────────────────────────────────────────────────────────
let toastQueue = [];
let toastShowing = false;

function checkBadges() {
  BADGES.forEach(b => {
    if (!unlockedBadges[b.id] && b.check()) {
      unlockedBadges[b.id] = Date.now();
      toastQueue.push(b);
      saveData();
    }
  });
  drainToast();
}

function drainToast() {
  if (toastShowing || toastQueue.length === 0) return;
  const b = toastQueue.shift();
  toastShowing = true;
  toastIcon.textContent = b.icon;
  toastName.textContent  = b.name;
  badgeToast.style.opacity = '1';
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    badgeToast.style.opacity = '0';
    setTimeout(() => { toastShowing = false; drainToast(); }, 400);
  }, 2500);
}

// ── Mode card wiring ──────────────────────────────────────────────────────
function wireCards(container) {
  container.querySelectorAll('.mode-card').forEach(card => {
    card.addEventListener('click', () => {
      container.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      currentMode = card.dataset.mode;
      modeBadge.textContent = MODE_NAMES[currentMode];
      bestVal.textContent   = bests[currentMode] || 0;
    });
  });
}

wireCards(document.getElementById('overlay'));

// Init easter card styling
(function(){
  const ec=document.getElementById('easter-card');
  const el=document.getElementById('easter-label');
  if(EASTER_ACTIVE && ec){ ec.classList.add('easter-glow'); if(el) el.textContent='🥚 Easter (LIVE!)'; }
})();

// ── Helpers ────────────────────────────────────────────────────────────
function getSpeed() {
  const speedMap = {
    nightmare:4.5, blitz:3.5, speed:4, chaos:3.5, survival:3, precision:2,
    timeattack:3, reversed:2.8, bigbasket:2, nocombo:2.5, golden:2.5,
    classic:2.5, zen:2, easter:2.2,
  };
  const base = speedMap[currentMode] || 2.5;
  return base + level * (currentMode==='nightmare'||currentMode==='speed' ? 1.0 : 0.55);
}

function getModeTimeLimit() {
  if(currentMode==='timeattack') return 60;
  if(currentMode==='blitz') return 30;
  if(currentMode==='speed') return 45;
  return 0;
}

function getModeBackground() {
  const map = {
    timeattack:'mode-blitz', blitz:'mode-blitz', zen:'mode-zen', nightmare:'mode-nightmare',
    speed:'mode-nightmare', survival:'mode-nightmare', reversed:'mode-reversed',
    golden:'mode-golden', easter:'mode-easter', chaos:'mode-chaos',
    precision:'mode-precision', bigbasket:'mode-zen', nocombo:'',classic:'',
  };
  return map[currentMode]||'';
}

function setBasketWidth(w) {
  basketWidth = w; basket.style.width = w+'px'; basketSvg.setAttribute('width', w);
}

function showPowerup(msg) {
  powerupMsg.textContent = msg; powerupMsg.style.opacity = '1';
  clearTimeout(powerupTimeout);
  powerupTimeout = setTimeout(() => { powerupMsg.style.opacity = '0'; }, 1600);
}

function shrinkBasket() {
  setBasketWidth(46); showPowerup('🌀 Basket shrunk!');
  clearTimeout(shrinkTimeout);
  shrinkTimeout = setTimeout(() => { setBasketWidth(80); showPowerup('✅ Basket restored!'); }, 4000);
}

function updateCombo(good) {
  if (!good) { combo=0; comboDisplay.style.opacity='0'; return; }
  combo++;
  const ms = stats[currentMode]; if (ms) ms.maxCombo = Math.max(ms.maxCombo||0, combo);
  clearTimeout(comboTimeout);
  if (combo >= 3) { comboDisplay.textContent=`🔥 COMBO x${combo}!`; comboDisplay.style.opacity='1'; }
  else             { comboDisplay.style.opacity='0'; }
  comboTimeout = setTimeout(() => { combo=0; comboDisplay.style.opacity='0'; }, 2200);
}

function comboMult() { return combo>=5?3:combo>=3?2:1; }

function showPopup(text,x,y,bad) {
  popup.textContent=text; popup.style.left=(x-20)+'px'; popup.style.top=(y-10)+'px';
  popup.style.color=bad?'#c0392b':'#e8722a'; popup.style.opacity='1';
  clearTimeout(popupTimeout);
  popupTimeout=setTimeout(()=>{popup.style.opacity='0';},600);
}

function burst(x,y,bad) {
  const cols=bad?['#c0392b','#e74c3c','#922b21']:['#e8722a','#f5d020','#4a7c2f','#fdf6e3'];
  for(let i=0;i<10;i++){
    const p=document.createElement('div'); p.className='particle';
    p.style.cssText=`left:${x}px;top:${y}px;background:${cols[Math.floor(Math.random()*cols.length)]}`;
    const a=Math.random()*Math.PI*2,d=30+Math.random()*50;
    particlesC.appendChild(p);
    p.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px) scale(0)`,opacity:0}],
      {duration:500+Math.random()*300,easing:'ease-out',fill:'forwards'}).onfinish=()=>p.remove();
  }
}

// ── Spawn ─────────────────────────────────────────────────────────────
function spawnItem() {
  const pool=POOLS[currentMode];
  const isGolden = Math.random() < 0.015;
  const isIcing = !isGolden && Math.random() < (pool.icingChance||0);
  let emoji, isBad;
  if (isGolden) {
    emoji='🥇'; isBad=false;
  } else if (isIcing) {
    emoji='🍦'; isBad=false;
  } else {
    isBad=pool.bad.length>0&&Math.random()<pool.badChance;
    const arr=isBad?pool.bad:pool.good;
    emoji=arr[Math.floor(Math.random()*arr.length)];
  }
  const el=document.createElement('div');
  el.className='item'; el.textContent=emoji; el.dataset.emoji=emoji; el.dataset.bad=isBad?'1':'0';
  if(isGolden) el.style.filter='drop-shadow(0 0 10px #ffd700) drop-shadow(0 0 4px #fff59d)';
  else if(isIcing) el.style.filter='drop-shadow(0 0 6px #ff9fe0) drop-shadow(2px 3px 3px rgba(0,0,0,0.18))';
  const x=20+Math.random()*(AREA_W()-60);
  el.style.left=x+'px'; el.style.top='-44px';
  gameArea.appendChild(el);
  items.push({el,x,y:-44,speed:getSpeed()*(isIcing?0.7:1)*(0.85+Math.random()*0.3)});
}

// ── Collision ────────────────────────────────────────────────────────────
function checkCollision(item) {
  const bx=Math.max(0,Math.min(AREA_W()-basketWidth,basketX-basketWidth/2));
  return item.x+36>bx&&item.x+4<bx+basketWidth&&item.y+36>GROUND_Y&&item.y<GROUND_Y+BASKET_H;
}

function updateBasket() {
  basket.style.left=Math.max(0,Math.min(AREA_W()-basketWidth,basketX-basketWidth/2))+'px';
}

// ── Loop ─────────────────────────────────────────────────────────────
function loop(ts) {
  if (!running) return;
  frameCount++;
  const dt=lastTimestamp?(ts-lastTimestamp)/1000:0; lastTimestamp=ts;
  const limit=getModeTimeLimit();
  if(limit>0){
    timeLeft=Math.max(0,timeLeft-dt);
    timerBar.style.width=(timeLeft/limit*100)+'%';
    timerBar.style.background=timeLeft<10?'linear-gradient(90deg,#e74c3c,#ff6b6b)':'linear-gradient(90deg,var(--carrot),#f5d020)';
    if(timeLeft<=0){endGame();return;}
  }

  spawnTimer++;
  const extraSpawnModes={nightmare:0.4,timeattack:0.35,blitz:0.5,chaos:0.6,speed:0.3,easter:0.25};
  const extraChance=extraSpawnModes[currentMode]||0;
  if(spawnTimer>=spawnInterval){
    spawnTimer=0; spawnItem();
    if(extraChance>0&&Math.random()<extraChance)spawnItem();
    if(currentMode==='chaos'&&Math.random()<0.3)spawnItem();
    if(currentMode==='nocombo') combo=0;
    const baseInterval=currentMode==='blitz'||currentMode==='chaos'?50:currentMode==='speed'?40:90;
    spawnInterval=Math.max(20,baseInterval-level*6);
  }
  const nl=Math.floor(score/100)+1;
  if(nl!==level){level=nl;lvVal.textContent=level;}

  for(let i=items.length-1;i>=0;i--){
    const item=items[i];
    item.y+=item.speed; item.el.style.top=item.y+'px';
    item.el.style.transform=`rotate(${Math.sin(frameCount*0.05+i)*15}deg)`;
    if(checkCollision(item)){
      const bad=item.el.dataset.bad==='1', emoji=item.el.dataset.emoji;
      burst(item.x+20,item.y+20,bad);
      if(bad){
        updateCombo(false);
        if(emoji==='🌀'){shrinkBasket();}
        else{lives--;livesVal.textContent=lives;showPopup('-1 ❤️',item.x,item.y,true);if(lives<=0){endGame();return;}}
      } else {
        updateCombo(true);
        const mult=comboMult(), pts=(POINTS[emoji]||10)*mult;
        score+=pts; scoreVal.textContent=score;
        showPopup(mult>1?`+${pts} x${mult}!`:'+'+pts,item.x,item.y,false);
        if(emoji==='🥇'){
          showPopup('✨ GOLDEN CARROT! ✨',item.x-20,item.y-24,false);
        }
      }
      item.el.remove();items.splice(i,1);continue;
    }
    if(item.y>AREA_H){item.el.remove();items.splice(i,1);}
  }
  updateBasket();
  animId=requestAnimationFrame(loop);
}

// ── Start / End ───────────────────────────────────────────────────────────
function startGame() {
  score=0;level=1;frameCount=0;spawnTimer=0;spawnInterval=90;
  combo=0;lastTimestamp=0;
  timeLeft=getModeTimeLimit();
  const livesMap={nightmare:1,survival:1,blitz:3,precision:3,reversed:3,chaos:2,speed:5,golden:3,nocombo:3,bigbasket:5,easter:3,timeattack:3,zen:999,classic:3};
  lives=livesMap[currentMode]||3;
  const wMap={nightmare:52,precision:56,speed:56,chaos:70,classic:80,timeattack:80,zen:80,blitz:80,reversed:80,bigbasket:120,nocombo:80,survival:65,golden:80,easter:80};
  setBasketWidth(wMap[currentMode]||80);
  scoreVal.textContent=0; livesVal.textContent=lives==='999'?'∞':lives; lvVal.textContent=1;
  modeBadge.textContent=MODE_NAMES[currentMode]; bestVal.textContent=bests[currentMode]||0;
  items.forEach(it=>it.el.remove()); items=[];
  comboDisplay.style.opacity='0';
  gameArea.className=getModeBackground();
  const hasTimer=timeLeft>0;
  timerBarWrap.style.display=hasTimer?'block':'none';
  timerBar.style.width='100%';
  overlay.style.display='none';
  running=true;
  animId=requestAnimationFrame(loop);
}

function endGame() {
  running=false; cancelAnimationFrame(animId);
  items.forEach(it=>it.el.remove()); items=[];
  clearTimeout(shrinkTimeout); setBasketWidth(80);

  if(score>bests[currentMode]) bests[currentMode]=score;
  const ms=stats[currentMode]; ms.played++; ms.totalScore+=score;
  saveData(); checkBadges();
  bestVal.textContent=bests[currentMode];

  const rank=score>=300?'🏆 Master Baker!':score>=150?'🎂 Pretty Sweet!':score>=50?'🥕 Not Bad!':'🌱 Keep Baking!';
  const newBadges=BADGES.filter(b=>unlockedBadges[b.id]&&Date.now()-unlockedBadges[b.id]<5000);

  overlay.innerHTML=`
    <div class="big-emoji">${score>=200?'🏆':'🎂'}</div>
    <h2>${rank}</h2>
    <div style="width:100%;display:flex;flex-direction:column;gap:4px;margin:2px 0">
      <div class="results-row">Mode <span>${MODE_NAMES[currentMode]}</span></div>
      <div class="results-row">Score <span>${score} pts</span></div>
      <div class="results-row">Level Reached <span>${level}</span></div>
      <div class="results-row">Mode Best <span>${bests[currentMode]} pts</span></div>
    </div>
    ${newBadges.length?`
    <div class="badge-section-title">🏅 Badges Earned!</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
      ${newBadges.map(b=>`
        <div style="text-align:center">
          <div class="badge-circle tier-${b.tier} unlocked badge-new">${b.icon}</div>
          <div class="badge-name">${b.name}</div>
        </div>`).join('')}
    </div>`:''}
    <button class="play-btn" id="play-again-btn">🔄 Play Again</button>
    <div style="display:flex;gap:6px;width:100%">
      <button class="small-btn" id="menu-btn" style="flex:1">🏠 Modes</button>
      <button class="small-btn" id="badges-btn" style="flex:1">🏅 Badges</button>
    </div>
  `;
  overlay.style.display='flex';
  document.getElementById('play-again-btn').addEventListener('click', startGame);
  document.getElementById('menu-btn').addEventListener('click', showMenu);
  document.getElementById('badges-btn').addEventListener('click', ()=>{ overlay.style.display='none'; showBadgesPanel(); });
}

// ── Menu ─────────────────────────────────────────────────────────────
function showMenu() {
  overlay.innerHTML=`
    <div class="big-emoji">🎂</div>
    <h2>Pick a Mode</h2>
    <div class="mode-grid">
      <div class="mode-card ${currentMode==='classic'?'selected':''}" data-mode="classic"><div class="mode-icon">🥕</div><div class="mode-name">Classic</div><div class="mode-desc">Catch & dodge 3 lives!</div></div>
      <div class="mode-card ${currentMode==='timeattack'?'selected':''}" data-mode="timeattack"><div class="mode-icon">⏱️</div><div class="mode-name">Time Attack</div><div class="mode-desc">60 seconds!</div></div>
      <div class="mode-card ${currentMode==='zen'?'selected':''}" data-mode="zen"><div class="mode-icon">🌿</div><div class="mode-name">Zen</div><div class="mode-desc">No baddies!</div></div>
      <div class="mode-card ${currentMode==='nightmare'?'selected':''}" data-mode="nightmare"><div class="mode-icon">💀</div><div class="mode-name">Nightmare</div><div class="mode-desc">1 life!</div></div>
      <div class="mode-card ${currentMode==='blitz'?'selected':''}" data-mode="blitz"><div class="mode-icon">⚡</div><div class="mode-name">Blitz</div><div class="mode-desc">30 seconds!</div></div>
      <div class="mode-card ${currentMode==='precision'?'selected':''}" data-mode="precision"><div class="mode-icon">🎯</div><div class="mode-name">Precision</div><div class="mode-desc">Only stars & cake!</div></div>
      <div class="mode-card ${currentMode==='reversed'?'selected':''}" data-mode="reversed"><div class="mode-icon">🔄</div><div class="mode-name">Reversed</div><div class="mode-desc">Opposites!</div></div>
      <div class="mode-card ${currentMode==='bigbasket'?'selected':''}" data-mode="bigbasket"><div class="mode-icon">🧺</div><div class="mode-name">Big Basket</div><div class="mode-desc">Huge basket!</div></div>
      <div class="mode-card ${currentMode==='nocombo'?'selected':''}" data-mode="nocombo"><div class="mode-icon">🚫</div><div class="mode-name">No Combo</div><div class="mode-desc">Raw skill!</div></div>
      <div class="mode-card ${currentMode==='speed'?'selected':''}" data-mode="speed"><div class="mode-icon">💨</div><div class="mode-name">Speed Run</div><div class="mode-desc">45 seconds!</div></div>
      <div class="mode-card ${currentMode==='survival'?'selected':''}" data-mode="survival"><div class="mode-icon">☠️</div><div class="mode-name">Survival</div><div class="mode-desc">50% baddies!</div></div>
      <div class="mode-card ${currentMode==='golden'?'selected':''}" data-mode="golden"><div class="mode-icon">🌟</div><div class="mode-name">Golden</div><div class="mode-desc">Stars only!</div></div>
      <div class="mode-card ${currentMode==='chaos'?'selected':''}" data-mode="chaos"><div class="mode-icon">🌀</div><div class="mode-name">Chaos</div><div class="mode-desc">Madness!</div></div>
      <div class="mode-card ${currentMode==='easter'?'selected':''} easter-glow" data-mode="easter"><div class="mode-icon">🥚</div><div class="mode-name">Easter</div><div class="mode-desc">Eggs!</div></div>
    </div>
    <button class="play-btn" id="start-btn2">🍰 Start Baking!</button>
    <div class="legend">Combo x3=2x · x5=3x · 🍦=+100 rare</div>
  `;
  overlay.style.display='flex'; gameArea.className='';
  wireCards(overlay);
  document.getElementById('start-btn2').addEventListener('click', startGame);
}

// ── Badges Panel ──────────────────────────────────────────────────────────
let badgesPanelOpen = false;
let badgesPanelEl   = null;

const MODE_SECTIONS = [
  { key:'classic',    label:'🥕 Classic' },
  { key:'timeattack', label:'⏱️ Time Attack' },
  { key:'zen',        label:'🌿 Zen' },
  { key:'nightmare',  label:'💀 Nightmare' },
  { key:'blitz',      label:'⚡ Blitz' },
  { key:'precision',  label:'🎯 Precision' },
  { key:'reversed',   label:'🔄 Reversed' },
  { key:'bigbasket',  label:'🧺 Big Basket' },
  { key:'nocombo',    label:'🚫 No Combo' },
  { key:'speed',      label:'💨 Speed Run' },
  { key:'survival',   label:'☠️ Survival' },
  { key:'golden',     label:'🌟 Golden' },
  { key:'chaos',      label:'🌀 Chaos' },
  { key:'easter',     label:'🥚 Easter Event' },
];

function showBadgesPanel() {
  badgesPanelOpen = true;
  btnBadges.classList.add('active');
  btnPlay.classList.remove('active');

  if (badgesPanelEl) { badgesPanelEl.remove(); }

  const panel = document.createElement('div');
  panel.id = 'badges-panel';
  panel.style.cssText = `
    position:absolute; inset:0;
    background:rgba(255,240,200,0.97);
    display:flex; flex-direction:column;
    padding:14px 12px; gap:9px; z-index:50;
    border-radius:20px; overflow-y:auto;
  `;

  let html = `<h2 style="font-family:'Fredoka One',cursive;color:var(--carrot-dark);font-size:1.5rem;text-shadow:2px 2px 0 #f5e6c8">🏅 Badges</h2>`;

  MODE_SECTIONS.forEach(sec => {
    const sectionBadges = BADGES.filter(b => b.mode === sec.key);
    if (sectionBadges.length === 0) return;
    
    const unlockedCount = sectionBadges.filter(b => unlockedBadges[b.id]).length;
    html += `<div class="badge-section-title">${sec.label} (${unlockedCount}/${sectionBadges.length})</div>`;
    html += `<div class="badge-grid">`;
    sectionBadges.forEach(b => {
      const unlocked = !!unlockedBadges[b.id];
      html += `
        <div class="badge-item" title="${b.desc}">
          <div class="badge-circle ${unlocked ? 'unlocked' : 'locked'} tier-${b.tier}" style="cursor:pointer">${b.icon}</div>
          <div class="${unlocked ? 'badge-name' : 'badge-locked-name'}">${unlocked ? b.name : '???'}</div>
        </div>
      `;
    });
    html += `</div>`;
  });

  html += `<button class="small-btn" id="close-badges-btn" style="width:100%;margin-top:8px">🏠 Back</button>`;

  panel.innerHTML = html;
  gameArea.appendChild(panel);
  badgesPanelEl = panel;

  document.getElementById('close-badges-btn').addEventListener('click', () => {
    badgesPanelOpen = false;
    badgesPanelEl.remove();
    btnPlay.classList.add('active');
    btnBadges.classList.remove('active');
    showMenu();
  });
}

// ── UI Button Wiring ───────────────────────────────────────────────────────
btnPlay.addEventListener('click', () => {
  if (badgesPanelOpen && badgesPanelEl) badgesPanelEl.remove();
  badgesPanelOpen = false;
  showMenu();
});

btnBadges.addEventListener('click', showBadgesPanel);

// ── Mouse Control ──────────────────────────────────────────────────────────
document.addEventListener('mousemove', (e) => {
  if (!running) return;
  const rect = gameArea.getBoundingClientRect();
  basketX = e.clientX - rect.left;
});

document.addEventListener('touchmove', (e) => {
  if (!running) return;
  e.preventDefault();
  const rect = gameArea.getBoundingClientRect();
  basketX = e.touches[0].clientX - rect.left;
});

// ── Dark mode toggle ───────────────────────────────────────────────────────
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function toggleMute() {
  isMuted = !isMuted;
  localStorage.setItem('isMuted', isMuted);
  document.getElementById('mute-toggle-btn').textContent = isMuted ? '🔇' : '🔊';
}

// Load dark mode preference
if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark-mode');
}

// ── Start button ───────────────────────────────────────────────────────────
document.getElementById('start-btn').addEventListener('click', startGame);

// Show menu on load
window.addEventListener('load', () => {
  showMenu();
});
