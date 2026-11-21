/* humancheck.js — проверка «Вы человек?» перед загрузкой сайта.
 *
 * Подключение в index.html (до основного <script>):
 *   <script src="https://cdn.jsdelivr.net/gh/SyntexHyperSoft/SyntexHyperSoft-Database@main/humancheck.js"></script>
 * и вместо запуска загрузки:
 *   if (window.HumanCheck) HumanCheck.run(boot); else boot();
 *
 * Отключение: убрать строку <script src=...> и заменить вызов на boot();
 *
 * Что можно менять:
 *   LOGO_URL      — логотип в футере и адрес, по которому проверяется соединение
 *   SLOW_AFTER_MS — через сколько мс показывать подсказку про VPN/DNS
 *   SLOW_TEXT     — текст подсказки
 */
(function (global) {
  'use strict';

  const LOGO_URL = 'https://syntexhypersoft.github.io/SyntexHyperSoft-Database/SyntexHyperSoftLogo.png';
  const SLOW_AFTER_MS = 5000;
  const MIN_PHASE_MS = 300; // минимум анимации, чтобы не мелькало
  const SLOW_TEXT = 'Проверка идет дольше чем обычно? Проверьте интернет соединение и наличие стабильной работы VPN/Proxy/DNS сервера если используете и повторите попытку снова!';

  const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@500;700;800;900&display=swap');

#humanCheck {
  position: fixed; inset: 0; z-index: 300; overflow: hidden;
  font-family: 'Exo 2', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-weight: 800; color: #0b0e14;
  background: #000;
  transition: opacity 0.45s ease;
}
#humanCheck.hc-out { opacity: 0; pointer-events: none; }
#humanCheck[hidden], #humanCheck [hidden] { display: none !important; }

/* Фон: глубокий чёрный с движущимися градиентами и светящимися пятнами */
.hc-bg { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.hc-bg::before {
  content: ""; position: absolute; inset: -20%;
  background:
    radial-gradient(40% 35% at 20% 25%, rgba(56,232,255,0.35), transparent 70%),
    radial-gradient(38% 34% at 80% 30%, rgba(167,139,250,0.35), transparent 70%),
    radial-gradient(45% 40% at 55% 85%, rgba(255,225,74,0.22), transparent 72%),
    radial-gradient(35% 30% at 10% 90%, rgba(255,60,140,0.20), transparent 70%);
  filter: blur(40px);
  animation: hcMesh 14s ease-in-out infinite alternate;
}
.hc-bg::after {
  content: ""; position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(56,232,255,0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(56,232,255,0.07) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at center, #000 35%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at center, #000 35%, transparent 80%);
  animation: hcGrid 24s linear infinite;
}
.hc-beam {
  position: absolute; left: -40%; top: 0; width: 60%; height: 100%;
  background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%);
  animation: hcBeam 9s ease-in-out infinite;
}
.hc-scan {
  position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 4px);
  mix-blend-mode: overlay;
}
@keyframes hcMesh { 0% { transform: translate3d(0,0,0) scale(1); } 100% { transform: translate3d(-4%,3%,0) scale(1.12); } }
@keyframes hcGrid { to { background-position: 48px 48px; } }
@keyframes hcBeam { 0%, 100% { transform: translateX(0); opacity: 0.4; } 50% { transform: translateX(260%); opacity: 0.9; } }

/* Белый технологичный баннер: полупрозрачное стекло, рамка-уголки, блик */
.hc-box {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  width: min(400px, calc(100vw - 32px));
  background: linear-gradient(160deg, rgba(255,255,255,0.93), rgba(240,246,255,0.86));
  backdrop-filter: blur(20px) saturate(170%);
  -webkit-backdrop-filter: blur(20px) saturate(170%);
  border: 1px solid rgba(255,255,255,0.7);
  border-radius: 6px;
  box-shadow: 0 0 0 1px rgba(56,232,255,0.25), 0 24px 80px rgba(0,0,0,0.75), 0 0 60px rgba(56,232,255,0.18), inset 0 1px 0 rgba(255,255,255,0.9);
  overflow: hidden;
}
.hc-box::before, .hc-box::after { content: ""; position: absolute; width: 18px; height: 18px; border-color: #0b0e14; border-style: solid; pointer-events: none; }
.hc-box::before { left: 8px; top: 8px; border-width: 2px 0 0 2px; }
.hc-box::after { right: 8px; bottom: 8px; border-width: 0 2px 2px 0; }
.hc-box .hc-sheen {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.7) 50%, transparent 60%);
  transform: translateX(-120%); animation: hcSheen 3.6s ease-in-out infinite;
}
@keyframes hcSheen { 0%, 55% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }

.hc-main { position: relative; display: flex; align-items: flex-start; gap: 16px; padding: 22px 22px 18px; }
.hc-slot { position: relative; width: 40px; height: 40px; flex: 0 0 40px; display: flex; align-items: center; justify-content: center; }

.hc-ring { position: relative; width: 32px; height: 32px; animation: hcSpin 1.2s linear infinite; }
.hc-ring i {
  position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%;
  background: linear-gradient(135deg, #0b0e14, #00a8c8);
  box-shadow: 0 0 8px rgba(56,232,255,0.8);
  transform: rotate(calc(var(--i) * 45deg)) translateY(-12px);
  animation: hcFade 1.2s ease-in-out infinite; animation-delay: calc(var(--i) * -0.15s);
}
@keyframes hcSpin { to { transform: rotate(360deg); } }
@keyframes hcFade { 0%, 100% { opacity: 0.15; } 50% { opacity: 1; } }

.hc-check {
  width: 36px; height: 36px; border: 2px solid #0b0e14; border-radius: 4px; background: rgba(255,255,255,0.6);
  cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0;
  transition: border-color 0.2s, background 0.2s, transform 0.15s, box-shadow 0.2s;
}
.hc-check:hover { box-shadow: 0 0 0 4px rgba(56,232,255,0.25); }
.hc-check:active { transform: scale(0.94); }
.hc-check:focus-visible { outline: 2px solid #00a8c8; outline-offset: 3px; }
.hc-check:disabled { cursor: default; }
.hc-check svg { width: 24px; height: 24px; stroke: #00a86b; stroke-width: 3.2; fill: none; stroke-linecap: round; stroke-linejoin: round; opacity: 0; transform: scale(0.4); transition: opacity 0.25s, transform 0.25s; }
.hc-check.on { border-color: #00a86b; background: rgba(0,168,107,0.14); box-shadow: 0 0 18px rgba(0,168,107,0.45); }
.hc-check.on svg { opacity: 1; transform: scale(1); }

.hc-text { flex: 1; min-width: 0; padding-top: 4px; }
.hc-label {
  font-size: 19px; line-height: 1.25; font-weight: 900; letter-spacing: 0.01em; overflow-wrap: anywhere;
  background: linear-gradient(90deg, #0b0e14, #0077b6, #7c3aed, #0b0e14);
  background-size: 300% 100%;
  -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: hcTextGrad 3.5s linear infinite;
}
@keyframes hcTextGrad { to { background-position: -300% 0; } }
.hc-slow { margin-top: 10px; font-size: 14px; line-height: 1.5; font-weight: 700; color: #2a2f3a; overflow-wrap: anywhere; }
.hc-retry {
  margin-top: 12px; padding: 9px 18px; border-radius: 4px; border: 2px solid #0b0e14;
  background: #0b0e14; color: #fff; font-size: 14px; font-weight: 800; cursor: pointer; font-family: inherit; letter-spacing: 0.04em;
  transition: background 0.2s, box-shadow 0.2s;
}
.hc-retry:hover { background: #1f2937; box-shadow: 0 0 16px rgba(56,232,255,0.5); }
.hc-retry:focus-visible { outline: 2px solid #00a8c8; outline-offset: 2px; }

.hc-foot {
  position: relative; display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 12px 18px; border-top: 1px solid rgba(11,14,20,0.15); font-size: 13px; font-weight: 800;
  letter-spacing: 0.06em; color: #0b0e14; text-transform: uppercase;
}
.hc-foot img { width: 28px; height: 28px; object-fit: contain; opacity: 0; transition: opacity 0.2s ease; filter: drop-shadow(0 0 6px rgba(56,232,255,0.6)); }
.hc-foot img.ready { opacity: 1; }

.hc-bottom {
  position: absolute; left: 0; right: 0; bottom: 18px; text-align: center; padding: 0 16px;
  font-size: 13px; font-weight: 800; letter-spacing: 0.06em;
  background: linear-gradient(90deg, #56e6ff, #a78bfa, #ffe14a, #56e6ff);
  background-size: 300% 100%; -webkit-background-clip: text; background-clip: text; color: transparent;
  animation: hcTextGrad 6s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .hc-ring, .hc-ring i, .hc-bg::before, .hc-bg::after, .hc-beam, .hc-label, .hc-bottom { animation-duration: 6s; }
}
`;

  const HTML = `
<div id="humanCheck" hidden role="dialog" aria-label="Проверка, что вы человек">
  <div class="hc-bg"><div class="hc-beam"></div></div>
  <div class="hc-scan"></div>
  <div class="hc-box">
    <div class="hc-sheen"></div>
    <div class="hc-main">
      <div class="hc-slot">
        <div class="hc-ring" id="hcRing" aria-hidden="true"><i style="--i:0"></i><i style="--i:1"></i><i style="--i:2"></i><i style="--i:3"></i><i style="--i:4"></i><i style="--i:5"></i><i style="--i:6"></i><i style="--i:7"></i></div>
        <button type="button" class="hc-check" id="hcCheck" role="checkbox" aria-checked="false" aria-label="Подтвердите, что вы человек" hidden disabled>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
        </button>
      </div>
      <div class="hc-text">
        <div class="hc-label" id="hcLabel">Проверяем браузер...</div>
        <div class="hc-slow" id="hcSlow" hidden>
          <div>{{SLOW}}</div>
          <button type="button" class="hc-retry" id="hcRetry">Повторить проверку</button>
        </div>
      </div>
    </div>
    <div class="hc-foot">
      <span>SyntexHyperSoft-Milana AI Protect</span>
      <img src="{{LOGO}}" alt="SyntexHyperSoft">
    </div>
  </div>
  <div class="hc-bottom">SyntexHyperSoft—A Technology-Driven Independent Software Development Studio</div>
</div>
`;

  function buildHtml() {
    return HTML
      .replace('{{LOGO}}', LOGO_URL)
      .replace('{{SLOW}}', SLOW_TEXT)
      .trim();
  }

  function mount() {
    if (document.getElementById('humanCheck')) return;
    const style = document.createElement('style');
    style.id = 'humanCheckStyle';
    style.textContent = CSS;
    document.head.appendChild(style);
    const holder = document.createElement('div');
    holder.innerHTML = buildHtml();
    document.body.appendChild(holder.firstElementChild);
  }

  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  function run(done) {
    mount();
    const $ = id => document.getElementById(id);
    const root = $('humanCheck');
    const ring = $('hcRing');
    const cb = $('hcCheck');
    const label = $('hcLabel');
    const slow = $('hcSlow');
    const retry = $('hcRetry');
    const logo = root.querySelector('.hc-foot img');

    // Проверка идёт, пока иконка (логотип в футере) не загрузится полностью.
    // Если сеть/домен недоступны, иконка продолжает пробовать загрузиться,
    // а через SLOW_AFTER_MS появляется подсказка про соединение.
    function logoReady() {
      return new Promise(resolve => {
        const finish = () => {
          const reveal = () => { logo.classList.add('ready'); resolve(); };
          if (typeof logo.decode === 'function') logo.decode().then(reveal, reveal);
          else reveal();
        };
        if (logo.complete && logo.naturalWidth > 0) return finish();
        logo.addEventListener('load', finish, { once: true });
        logo.onerror = () => {
          setTimeout(() => { logo.src = LOGO_URL + '?r=' + Date.now(); }, 2000);
        };
      });
    }

    let gen = 0; // номер текущей фазы: устаревшие таймеры и запросы игнорируются
    const setSlow = on => { slow.hidden = !on; };

    function busy(text, next) {
      const g = ++gen;
      ring.hidden = false;
      cb.hidden = true;
      cb.disabled = true;
      cb.classList.remove('on');
      cb.setAttribute('aria-checked', 'false');
      label.textContent = text;
      setSlow(false);

      setTimeout(() => { if (g === gen) setSlow(true); }, SLOW_AFTER_MS);

      Promise.all([wait(MIN_PHASE_MS), logoReady()]).then(() => {
        if (g !== gen) return;
        next();
      });
    }

    function ask() {
      const g = ++gen;
      setSlow(false);
      ring.hidden = true;
      cb.hidden = false;
      cb.disabled = false;
      cb.classList.remove('on');
      cb.setAttribute('aria-checked', 'false');
      label.textContent = 'Подтвердите, что вы человек';
      cb.onclick = () => {
        if (g !== gen) return;
        cb.onclick = null;
        cb.disabled = true;
        cb.classList.add('on');
        cb.setAttribute('aria-checked', 'true');
        setTimeout(() => busy('Проверяем...', finish), 350);
      };
    }

    function finish() {
      const g = ++gen;
      ring.hidden = true;
      cb.hidden = false;
      cb.disabled = true;
      cb.classList.add('on');
      cb.setAttribute('aria-checked', 'true');
      label.textContent = 'Проверка пройдена';
      setSlow(false);
      setTimeout(() => {
        if (g !== gen) return;
        root.classList.add('hc-out');
        setTimeout(() => {
          if (g !== gen) return;
          root.hidden = true;
          if (typeof done === 'function') done();
        }, 450);
      }, 700);
    }

    retry.onclick = () => {
      logo.src = LOGO_URL + '?r=' + Date.now();
      busy('Проверяем браузер...', ask);
    };

    root.classList.remove('hc-out');
    root.hidden = false;
    busy('Проверяем браузер...', ask);
  }

  // Предзагрузка иконки сразу, чтобы к моменту показа она уже была в кэше браузера.
  const preload = new Image();
  preload.src = LOGO_URL;

  global.HumanCheck = { run };
})(window);
