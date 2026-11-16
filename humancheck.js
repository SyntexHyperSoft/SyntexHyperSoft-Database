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
 *   LOGO_URL     — логотип в футере и адрес, по которому проверяется соединение
 *   SLOW_AFTER_MS — через сколько мс показывать подсказку про VPN/DNS
 *   SLOW_TEXT    — текст подсказки
 * SyntexHyperSoft
 */
(function (global) {
  'use strict';

  const LOGO_URL = 'https://raw.githubusercontent.com/SyntexHyperSoft/SyntexHyperSoft-Database/refs/heads/main/SyntexHyperSoftLogo.png';
  const SLOW_AFTER_MS = 5000;
  const PROBE_TIMEOUT_MS = 15000;
  const SLOW_TEXT = 'Проверка идет дольше чем обычно? Проверьте интернет соединение и наличие стабильной работы VPN/Proxy/DNS сервера если используете и повторите попытку снова!';

  const CSS = `
#humanCheck { position: fixed; inset: 0; z-index: 300; background: #000; color: #ececec; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif; transition: opacity 0.45s ease; }
#humanCheck.hc-out { opacity: 0; pointer-events: none; }
#humanCheck[hidden], #humanCheck [hidden] { display: none !important; }

.hc-box { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(380px, calc(100vw - 32px)); background: #161618; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; box-shadow: 0 16px 56px rgba(0,0,0,0.75); overflow: hidden; }

.hc-main { display: flex; align-items: flex-start; gap: 16px; padding: 20px 20px 18px; }
.hc-slot { position: relative; width: 40px; height: 40px; flex: 0 0 40px; display: flex; align-items: center; justify-content: center; }

.hc-ring { position: relative; width: 32px; height: 32px; animation: hcSpin 1.2s linear infinite; }
.hc-ring i { position: absolute; left: 50%; top: 50%; width: 5px; height: 5px; margin: -2.5px 0 0 -2.5px; border-radius: 50%; background: #e6e6e6; transform: rotate(calc(var(--i) * 45deg)) translateY(-12px); animation: hcFade 1.2s ease-in-out infinite; animation-delay: calc(var(--i) * -0.15s); }
@keyframes hcSpin { to { transform: rotate(360deg); } }
@keyframes hcFade { 0%, 100% { opacity: 0.15; } 50% { opacity: 1; } }

.hc-check { width: 34px; height: 34px; border: 2px solid #7a7a7a; border-radius: 7px; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: border-color 0.2s, background 0.2s, transform 0.15s; }
.hc-check:hover { border-color: #e5e5e5; }
.hc-check:active { transform: scale(0.94); }
.hc-check:focus-visible { outline: 2px solid #60a5fa; outline-offset: 3px; }
.hc-check:disabled { cursor: default; }
.hc-check svg { width: 22px; height: 22px; stroke: #4ade80; stroke-width: 3; fill: none; stroke-linecap: round; stroke-linejoin: round; opacity: 0; transform: scale(0.4); transition: opacity 0.25s, transform 0.25s; }
.hc-check.on { border-color: #4ade80; background: rgba(74,222,128,0.12); }
.hc-check.on svg { opacity: 1; transform: scale(1); }

.hc-text { flex: 1; min-width: 0; padding-top: 6px; }
.hc-label { font-size: 17px; line-height: 1.35; font-weight: 500; overflow-wrap: anywhere; }
.hc-slow { margin-top: 10px; font-size: 14px; line-height: 1.5; color: #b8b8b8; overflow-wrap: anywhere; }
.hc-retry { margin-top: 12px; padding: 8px 16px; border-radius: 7px; border: 1px solid rgba(255,255,255,0.28); background: transparent; color: #fff; font-size: 14px; cursor: pointer; font-family: inherit; }
.hc-retry:hover { background: rgba(255,255,255,0.08); }
.hc-retry:focus-visible { outline: 2px solid #60a5fa; outline-offset: 2px; }

.hc-foot { display: flex; align-items: center; justify-content: flex-end; gap: 10px; padding: 12px 18px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 14px; color: #a0a0a0; }
.hc-foot img { width: 28px; height: 28px; object-fit: contain; }

.hc-bottom { position: absolute; left: 0; right: 0; bottom: 16px; text-align: center; font-size: 13px; color: #7a7a7a; letter-spacing: 0.02em; padding: 0 16px; }

@media (prefers-reduced-motion: reduce) {
  .hc-ring, .hc-ring i { animation-duration: 3s; }
}
`;

  const HTML = `
<div id="humanCheck" hidden role="dialog" aria-label="Проверка, что вы человек">
  <div class="hc-box">
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

  const rnd = (a, b) => a + Math.random() * (b - a);
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

  // Реальная проверка соединения: запрос к логотипу на GitHub.
  function probe() {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
    return fetch(LOGO_URL + '?t=' + Date.now(), { mode: 'no-cors', cache: 'no-store', signal: ctrl.signal })
      .then(() => true, () => false)
      .finally(() => clearTimeout(timer));
  }

  function run(done) {
    mount();
    const $ = id => document.getElementById(id);
    const root = $('humanCheck');
    const ring = $('hcRing');
    const cb = $('hcCheck');
    const label = $('hcLabel');
    const slow = $('hcSlow');
    const retry = $('hcRetry');

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

      Promise.all([wait(rnd(1000, 2500)), probe()]).then(([, ok]) => {
        if (g !== gen) return;
        if (!ok) setSlow(true);
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

    retry.onclick = () => busy('Проверяем браузер...', ask);

    root.classList.remove('hc-out');
    root.hidden = false;
    busy('Проверяем браузер...', ask);
  }

  global.HumanCheck = { run };
})(window);
