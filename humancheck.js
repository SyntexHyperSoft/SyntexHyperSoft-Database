/* humancheck.js — проверка «Вы человек?» перед загрузкой сайта.
 *
 * Подключение в index.html (до основного <script>):
 *   <script src="humancheck.js"></script>
 * и вместо запуска загрузки:
 *   HumanCheck.run(boot);
 *
 * Отключение: убрать строку <script src="humancheck.js"> и заменить
 * HumanCheck.run(boot) на boot().
 *
 * Тексты, цвета, логотип и время меняются здесь же:
 *   логотип — src у <img> в HTML_TEMPLATE, подпись — «SyntexHyperSoft-Milana AI Protect».
 */
(function (global) {
  'use strict';

  const CSS = `
  /* ===== Проверка «вы человек?» — каждый раз перед интро ===== */
  #humanCheck { position: fixed; inset: 0; z-index: 300; background: #000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif; color: #e6e6e6; transition: opacity 0.4s ease; }
  .hc-box { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(300px, calc(100vw - 32px)); background: rgba(24,24,26,0.95); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; box-shadow: 0 10px 40px rgba(0,0,0,0.6); }
  #humanCheck.fade { opacity: 0; }
  #humanCheck[hidden], #humanCheck [hidden] { display: none !important; }
  .hc-main { display: flex; align-items: center; gap: 12px; padding: 14px 16px; min-height: 62px; }
  .hc-slot { width: 28px; height: 28px; flex: 0 0 28px; display: flex; align-items: center; justify-content: center; }
  .hc-spinner { display: flex; align-items: center; gap: 4px; }
  .hc-spinner span { width: 6px; height: 6px; border-radius: 50%; background: #bbb; animation: hcDot 1.1s ease-in-out infinite; }
  .hc-spinner span:nth-child(2) { animation-delay: 0.12s; }
  .hc-spinner span:nth-child(3) { animation-delay: 0.24s; }
  .hc-spinner span:nth-child(4) { animation-delay: 0.36s; }
  .hc-spinner span:nth-child(5) { animation-delay: 0.48s; }
  @keyframes hcDot { 0%, 100% { opacity: 0.2; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-4px); } }
  .hc-check { width: 26px; height: 26px; border: 2px solid #777; border-radius: 4px; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0; transition: border-color 0.2s, background 0.2s; }
  .hc-check:hover { border-color: #ddd; }
  .hc-check svg { width: 18px; height: 18px; stroke: #4ade80; stroke-width: 3; fill: none; stroke-linecap: round; stroke-linejoin: round; opacity: 0; transform: scale(0.5); transition: all 0.25s ease; }
  .hc-check.on { border-color: #4ade80; background: rgba(74,222,128,0.12); cursor: default; }
  .hc-check.on svg { opacity: 1; transform: scale(1); }
  .hc-label { font-size: 14px; line-height: 1.3; flex: 1; }
  .hc-foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 8px 14px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #8a8a8a; letter-spacing: 0.02em; }
  .hc-foot img { width: 22px; height: 22px; object-fit: contain; }
`;

  const HTML_TEMPLATE = `
<div id="humanCheck" hidden>
  <div class="hc-box">
  <div class="hc-main">
    <div class="hc-slot">
      <div class="hc-spinner" id="hcSpinner"><span></span><span></span><span></span><span></span><span></span></div>
      <button class="hc-check" id="hcCheck" type="button" aria-label="Подтвердите, что вы человек" hidden><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>
    </div>
    <div class="hc-label" id="hcLabel">Проверяем браузер...</div>
  </div>
  <div class="hc-foot">
    <span>SyntexHyperSoft-Milana AI Protect</span>
    <img src="https://raw.githubusercontent.com/SyntexHyperSoft/SyntexHyperSoft-Database/refs/heads/main/SyntexHyperSoftLogo.png" alt="SyntexHyperSoft">
  </div>
  </div>
</div>
`;

  function mount() {
    if (document.getElementById('humanCheck')) return;
    const style = document.createElement('style');
    style.id = 'humanCheckStyle';
    style.textContent = CSS;
    document.head.appendChild(style);
    const holder = document.createElement('div');
    holder.innerHTML = HTML_TEMPLATE.trim();
    document.body.appendChild(holder.firstElementChild);
  }

/* ============ ПРОВЕРКА «ВЫ ЧЕЛОВЕК?» — каждый раз перед интро ============ */
function runHumanCheck(done) {
  const box = document.getElementById('humanCheck');
  const spin = document.getElementById('hcSpinner');
  const cb = document.getElementById('hcCheck');
  const label = document.getElementById('hcLabel');
  const rnd = () => 1000 + Math.random() * 2000;

  const busy = (text, ms, next) => {
    spin.hidden = false; cb.hidden = true; cb.classList.remove('on');
    label.textContent = text;
    setTimeout(next, ms);
  };
  const finish = () => {
    spin.hidden = true; cb.hidden = false; cb.classList.add('on');
    label.textContent = 'Проверка пройдена';
    setTimeout(() => {
      box.classList.add('fade');
      setTimeout(() => { box.hidden = true; done(); }, 400);
    }, 700);
  };
  const ask = () => {
    spin.hidden = true; cb.hidden = false; cb.classList.remove('on');
    label.textContent = 'Подтвердите, что вы человек';
    cb.addEventListener('click', () => {
      cb.classList.add('on');
      setTimeout(() => busy('Проверяем...', rnd(), finish), 350);
    }, { once: true });
  };

  box.hidden = false;
  busy('Проверяем браузер...', rnd(), ask);
}

  global.HumanCheck = { run: function (done) { mount(); runHumanCheck(done); } };
})(window);
