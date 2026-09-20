/* ==========================================================================
 * PigZap in-game feedback (BUG-053) — dependency-free widget for the static
 * games' pause / game-over cards, per the agreed design (owner 2026-09-19):
 * a subtle last-row "💬 Feedback" ghost button expanding into an emoji rating
 * (😞 😐 😊) + optional one-line note, posted to the shared comments service
 * as contentType='game' / kind='feedback' (contentId = game slug), landing in
 * the existing admin moderation panel. Primary actions stay above it.
 *
 * Mount points: the script finds the pause/game-over cards by id on its own —
 * games only include this file. Bump ?v=N in each index.html when editing.
 * ========================================================================== */
(function () {
  'use strict';

  var API_BASE = (function () {
    var host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3012/api/v1';
    }
    return 'https://api.pigzap.com/api/v1';
  })();

  var GAME = (window.location.pathname.match(/\/games\/([^/]+)\//) || [])[1] || 'unknown-game';

  var PAUSE_CARDS = [
    '#overlay-pause .card',
    '#overlay-pause .overlay-card',
    '#pause-overlay .menu-card',
  ];
  var OVER_CARDS = [
    '#overlay-over .card',
    '#overlay-feedback .card',
    '#overlay-win .overlay-card',
    '#overlay-result .overlay-card',
    '#overlay .overlay-card',
  ];

  var STYLES =
    '.pig-fb{margin-top:14px;text-align:center}' +
    '.pig-fb__btn{background:transparent;border:0;padding:6px 10px;font:inherit;font-size:12px;' +
    'font-weight:600;opacity:.55;cursor:pointer;color:inherit;text-decoration:underline dotted}' +
    '.pig-fb__btn:hover{opacity:.85}' +
    '.pig-fb__form{margin-top:8px;display:flex;flex-direction:column;gap:8px;align-items:center}' +
    '.pig-fb__form[hidden]{display:none}' +
    '.pig-fb__row{display:flex;gap:10px}' +
    '.pig-fb__face{width:38px;height:38px;font-size:20px;border-radius:10px;border:1.5px solid rgba(148,163,184,.4);' +
    'background:transparent;cursor:pointer;font-family:inherit}' +
    '.pig-fb__face--on{border-color:#fbbf24;background:rgba(251,191,36,.15)}' +
    '.pig-fb__text{width:100%;max-width:280px;box-sizing:border-box;padding:8px 10px;font:inherit;font-size:12.5px;' +
    'border-radius:10px;border:1.5px solid rgba(148,163,184,.4);background:transparent;color:inherit}' +
    '.pig-fb__send{padding:7px 18px;font:inherit;font-size:12px;font-weight:700;border:0;border-radius:10px;' +
    'cursor:pointer;background:#6366f1;color:#fff}' +
    '.pig-fb__send[disabled]{opacity:.5;cursor:default}' +
    '.pig-fb__note{font-size:11.5px;opacity:.7;margin:0}';

  function guestId() {
    var key = 'aiquiz:guest-id';
    var id = null;
    try {
      id = window.localStorage.getItem(key);
    } catch (e) {
      id = null;
    }
    if (!id) {
      id =
        'guest_' +
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
      try {
        window.localStorage.setItem(key, id);
      } catch (e) {
        /* private mode — the send will be rejected; UI shows the error state */
      }
    }
    return id;
  }

  function mount(card) {
    var wrap = document.createElement('div');
    wrap.className = 'pig-fb';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pig-fb__btn';
    btn.textContent = '💬 Feedback';

    var form = document.createElement('form');
    form.hidden = true;

    var rating = '';
    var row = document.createElement('div');
    row.className = 'pig-fb__row';
    ['😞', '😐', '😊'].forEach(function (face) {
      var faceBtn = document.createElement('button');
      faceBtn.type = 'button';
      faceBtn.className = 'pig-fb__face';
      faceBtn.textContent = face;
      faceBtn.addEventListener('click', function () {
        rating = face;
        row.querySelectorAll('.pig-fb__face').forEach(function (el) {
          el.classList.remove('pig-fb__face--on');
        });
        faceBtn.classList.add('pig-fb__face--on');
      });
      row.appendChild(faceBtn);
    });

    var input = document.createElement('input');
    input.className = 'pig-fb__text';
    input.type = 'text';
    input.maxLength = 200;
    input.placeholder = 'Anything to add? (optional)';

    var send = document.createElement('button');
    send.type = 'submit';
    send.className = 'pig-fb__send';
    send.textContent = 'Send';

    var note = document.createElement('p');
    note.className = 'pig-fb__note';

    form.appendChild(row);
    form.appendChild(input);
    form.appendChild(send);
    form.appendChild(note);

    btn.addEventListener('click', function () {
      form.hidden = !form.hidden;
      btn.hidden = form.hidden ? false : false;
      if (!form.hidden) input.focus();
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (send.disabled) return;
      var text = (rating + ' ' + input.value).trim();
      if (!text) {
        note.textContent = 'Tap a face first 🙂';
        return;
      }
      send.disabled = true;
      note.textContent = 'Sending…';
      fetch(API_BASE + '/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType: 'game',
          contentId: GAME,
          kind: 'feedback',
          guestId: guestId(),
          text: text,
        }),
      })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.hidden = true;
          btn.textContent = '✓ Sent — thank you!';
          setTimeout(function () {
            btn.textContent = '💬 Feedback';
          }, 2500);
        })
        .catch(function () {
          send.disabled = false;
          note.textContent = "Couldn't send — try again.";
        });
    });

    wrap.appendChild(btn);
    wrap.appendChild(form);
    card.appendChild(wrap);
  }

  function init() {
    var style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);

    PAUSE_CARDS.concat(OVER_CARDS).forEach(function (selector) {
      var card = document.querySelector(selector);
      if (card && !card.querySelector('.pig-fb')) mount(card);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
