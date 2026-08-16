/**
 * Offline / demo API for Force Gift Mini App
 * Перехватывает fetch('/api/...') чтобы UI работал без бэкенда.
 * Баланс и инвентарь в localStorage.
 */
(function () {
  const STORAGE_BAL = 'fg_demo_balance';
  const STORAGE_INV = 'fg_demo_inventory';

  function getBalance() {
    const v = localStorage.getItem(STORAGE_BAL);
    return v === null ? 500 : parseInt(v, 10) || 0;
  }
  function setBalance(n) {
    localStorage.setItem(STORAGE_BAL, String(Math.max(0, n | 0)));
  }
  function getInv() {
    try { return JSON.parse(localStorage.getItem(STORAGE_INV) || '[]'); } catch { return []; }
  }
  function setInv(arr) {
    localStorage.setItem(STORAGE_INV, JSON.stringify(arr || []));
  }

  const GIFTS = [
    { id: 1, name: 'Plush Pepe', value: 120, image: 'images/refcase15.webp' },
    { id: 2, name: 'Blue Cap', value: 80, image: 'images/refcase15.webp' },
    { id: 3, name: 'NYC Heart', value: 60, image: 'images/refcase15.webp' },
    { id: 4, name: 'Oscar Box', value: 150, image: 'images/promocode.webp' },
    { id: 5, name: 'B-Day', value: 40, image: 'images/promocode.webp' },
    { id: 6, name: 'Snake', value: 25, image: 'images/promocode.webp' },
    { id: 7, name: 'Common Star', value: 10, image: 'images/StarsBanner.webp' },
    { id: 8, name: 'Rare Gift', value: 200, image: 'images/force.jpg' }
  ];

  function makeCase(id, name, price, image, extras) {
    const items = GIFTS.map((g, i) => ({
      id: g.id,
      name: g.name,
      value: g.value,
      image: g.image,
      chance: i === 0 ? 5 : i < 3 ? 12 : 20
    }));
    return Object.assign({
      id: id,
      name: name,
      price: price,
      image: image,
      items: items
    }, extras || {});
  }

  const CASES = {
    case1: makeCase('case1', 'Daily Case', 0, 'images/promocode.webp'),
    case2: makeCase('case2', 'Free Starter', 0, 'images/promocode.webp'),
    case3: makeCase('case3', 'Gift Case', 50, 'images/refcase15.webp'),
    case4: makeCase('case4', 'Farm Blue', 25, 'images/refcase15.webp'),
    case5: makeCase('case5', 'Farm Gold', 35, 'images/refcase15.webp'),
    case6: makeCase('case6', 'Farm Night', 40, 'images/refcase15.webp'),
    case7: makeCase('case7', 'Farm Plus', 45, 'images/refcase15.webp'),
    case8: makeCase('case8', 'Regular 1', 75, 'images/refcase15.webp'),
    case9: makeCase('case9', 'Regular 2', 90, 'images/refcase15.webp'),
    case10: makeCase('case10', 'Regular 3', 100, 'images/refcase15.webp'),
    case11: makeCase('case11', 'Regular 4', 120, 'images/refcase15.webp'),
    case12: makeCase('case12', 'ALL IN Mini', 200, 'images/refcase15.webp'),
    case13: makeCase('case13', 'ALL IN Mid', 350, 'images/refcase15.webp'),
    case14: makeCase('case14', 'ALL IN Big', 500, 'images/refcase15.webp'),
    case15: makeCase('case15', 'Dubai Case', 250, 'images/refcase15.webp'),
    case16: makeCase('case16', 'ALL IN Pro', 600, 'images/refcase15.webp'),
    case17: makeCase('case17', 'ALL IN Max', 800, 'images/refcase15.webp'),
    case18: makeCase('case18', 'Referral Easy', 0, 'images/refcase15.webp', { referralOnly: true, referralPrice: 3 }),
    case19: makeCase('case19', 'Referral Hard', 0, 'images/refcase15.webp', { referralOnly: true, referralPrice: 10 }),
    case20: makeCase('case20', 'Farm Special', 30, 'images/promocode.webp')
  };

  function json(data, status) {
    return new Response(JSON.stringify(data), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  function pickWeighted(items) {
    const list = items && items.length ? items : GIFTS;
    const total = list.reduce((s, x) => s + (x.chance || 10), 0);
    let r = Math.random() * total;
    for (let i = 0; i < list.length; i++) {
      r -= (list[i].chance || 10);
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  }

  const origFetch = window.fetch.bind(window);
  window.fetch = async function (url, opts) {
    const u = typeof url === 'string' ? url : (url && url.url) || '';
    if (u.indexOf('/api/') === -1) return origFetch(url, opts);

    const path = u.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
    const method = ((opts && opts.method) || 'GET').toUpperCase();
    let body = {};
    try {
      if (opts && opts.body) body = JSON.parse(opts.body);
    } catch (e) {}

    console.log('[mock-api]', method, path, body);

    if (path === '/api/check-ban') return json({ banned: false });
    if (path === '/api/admin/meta') return json({ isAdmin: false });
    if (path === '/api/get-cases') return json(CASES);
    if (path === '/api/get-balance') return json({ balance: getBalance() });
    if (path === '/api/referral-count') return json({ count: 5, spent: 2, available: 3 });
    if (path === '/api/gifts') return json(GIFTS);

    if (path.indexOf('/api/inventory/') === 0) return json(getInv());

    if (path === '/api/create-stars-invoice') {
      const amount = parseInt(body.amount, 10) || 0;
      // demo invoice: Telegram.WebApp.openInvoice mock calls cb('paid')
      window.__fg_pending_topup = amount;
      return json({
        success: true,
        invoice_url: 'https://t.me/invoice/demo',
        bonusPercent: 0
      });
    }


    if (path === '/api/daily-case/status') {
      return json({ canOpen: true, subscribed: true, sharesDone: true, shareCount: 3, cooldown: 0 });
    }

    if (path === '/api/open-case' || path === '/api/case/open' || path === '/api/openCase') {
      const caseId = body.caseId || body.case_id || body.id;
      const count = Math.max(1, parseInt(body.count, 10) || 1);
      const c = CASES[caseId] || Object.values(CASES).find(x => x.id === caseId);
      if (!c) return json({ error: 'case not found' }, 404);
      const price = (Number(c.price) || 0) * count;
      let bal = getBalance();
      const isDemo = !!body.isDemo;
      if (!isDemo && bal < price) return json({ error: 'Недостаточно Stars' }, 400);
      if (!isDemo) {
        bal -= price;
        setBalance(bal);
      }
      const gifts = [];
      const inv = getInv();
      for (let i = 0; i < count; i++) {
        const win = pickWeighted(c.items);
        gifts.push({
          name: win.name,
          value: win.value,
          image: win.image,
          rarity: win.value >= 100 ? 'legendary' : win.value >= 50 ? 'rare' : 'common'
        });
        if (!isDemo) {
          inv.push({
            id: Date.now() + i,
            item_name: win.name,
            item_value: win.value,
            item_image: win.image
          });
        }
      }
      if (!isDemo) setInv(inv);
      return json({
        success: true,
        gifts: gifts,
        newBalance: getBalance(),
        isDemo: isDemo,
        prizeTokens: []
      });
    }

    if (path === '/api/sell-item' || path === '/api/sell') {
      const id = body.id || body.inventoryItemId || body.itemId;
      let inv = getInv();
      const item = inv.find(x => String(x.id) === String(id));
      if (!item) return json({ error: 'not found' }, 404);
      inv = inv.filter(x => String(x.id) !== String(id));
      setInv(inv);
      setBalance(getBalance() + (item.item_value || 0));
      return json({ success: true, balance: getBalance(), newBalance: getBalance() });
    }

    if (path === '/api/sell-all-items') {
      const inv = getInv();
      const sum = inv.reduce((s, x) => s + (x.item_value || 0), 0);
      setInv([]);
      setBalance(getBalance() + sum);
      return json({ success: true, balance: getBalance(), newBalance: getBalance(), sold: inv.length });
    }

    if (path === '/api/confirm-prize') {
      return json({ success: true, itemId: Date.now() });
    }

    if (path === '/api/referral-cases-status') {
      return json({ case18: true, case19: true, available: 5 });
    }

    if (path === '/api/upgrade') {
      const inv = getInv();
      const from = inv.find(x => String(x.id) === String(body.inventoryItemId));
      const target = GIFTS.find(g => String(g.id) === String(body.targetGiftId));
      if (!from || !target) return json({ error: 'item not found' }, 400);
      const chance = Math.min(90, Math.max(1, (from.item_value / target.value) * 100));
      const win = Math.random() * 100 < chance;
      const next = inv.filter(x => String(x.id) !== String(from.id));
      if (win) {
        next.push({
          id: Date.now(),
          item_name: target.name,
          item_value: target.value,
          item_image: target.image
        });
      }
      setInv(next);
      return json({ success: true, win: win, chance: chance });
    }

    if (path === '/api/daily-case/verify') {
      return json({ success: true, subscribed: true, sharesDone: true, shareCount: 3 });
    }

    // fallback empty success for unknown api
    return json({ success: true, demo: true, path: path });
  };

    // Telegram WebApp: demo user если нет initData
  if (!window.Telegram) window.Telegram = {};
  var demoInit = 'user=%7B%22id%22%3A1%2C%22first_name%22%3A%22Demo%22%2C%22username%22%3A%22demo%22%7D';
  var demoUser = { id: 1, first_name: 'Demo', username: 'demo' };
  function patchInvoice(tg) {
    var orig = tg.openInvoice && tg.openInvoice.bind(tg);
    tg.openInvoice = function (url, cb) {
      var a = window.__fg_pending_topup || 0;
      if (a) {
        var b = parseInt(localStorage.getItem('fg_demo_balance') || '500', 10) + a;
        localStorage.setItem('fg_demo_balance', String(b));
        window.__fg_pending_topup = 0;
      }
      if (orig && url && String(url).indexOf('demo') === -1) return orig(url, cb);
      if (cb) cb('paid');
    };
  }
  if (!window.Telegram.WebApp) {
    window.Telegram.WebApp = {
      ready: function () {},
      expand: function () {},
      initData: demoInit,
      initDataUnsafe: { user: demoUser },
      openInvoice: function () {},
      openTelegramLink: function (u) { window.open(u, '_blank'); },
      HapticFeedback: { impactOccurred: function () {}, notificationOccurred: function () {} },
      setHeaderColor: function () {},
      setBackgroundColor: function () {}
    };
  }
  var tg = window.Telegram.WebApp;
  if (!tg.initData) tg.initData = demoInit;
  if (!tg.initDataUnsafe || !tg.initDataUnsafe.user) tg.initDataUnsafe = { user: demoUser };
  patchInvoice(tg);

  console.log('[mock-api] ready, balance=', getBalance());
})();
