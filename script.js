// =================== STATE ===================
let expenses  = JSON.parse(localStorage.getItem('expenses'))  || [];
let incomes   = JSON.parse(localStorage.getItem('incomes'))   || [];
let goals     = JSON.parse(localStorage.getItem('goals'))     || [];
let budgets   = JSON.parse(localStorage.getItem('budgets'))   || {};
let recurring = JSON.parse(localStorage.getItem('recurring')) || [];
let debts     = JSON.parse(localStorage.getItem('debts'))     || [];
let netWorth  = JSON.parse(localStorage.getItem('netWorth'))  || { assets: [], liabilities: [] };
let bills     = JSON.parse(localStorage.getItem('bills'))     || [];
let myPieChart, myTrendChart;
let editTarget = null;

let CATEGORIES = JSON.parse(localStorage.getItem('categories')) ||
  ['ອາຫານ','ຄ່າໄຟ','ສຸຂະພາບ','ຄ່ານ້ຳມັນ','ຄ່າເຊົ່າ','ບັນທ່ອງ','ອື່ນໆ'];
let CAT_COLORS = JSON.parse(localStorage.getItem('catColors')) ||
  ['#FF6384','#36A2EB','#FFCE56','#9966FF','#4BC0C0','#FF9F40','#C9CBCF'];

// Exchange rates
let exRates = JSON.parse(localStorage.getItem('exRates')) || { THB: 850, USD: 18000, CNY: 2500 };

// =================== SAVE ===================
function save() {
  localStorage.setItem('expenses',   JSON.stringify(expenses));
  localStorage.setItem('incomes',    JSON.stringify(incomes));
  localStorage.setItem('goals',      JSON.stringify(goals));
  localStorage.setItem('budgets',    JSON.stringify(budgets));
  localStorage.setItem('recurring',  JSON.stringify(recurring));
  localStorage.setItem('debts',      JSON.stringify(debts));
  localStorage.setItem('netWorth',   JSON.stringify(netWorth));
  localStorage.setItem('bills',      JSON.stringify(bills));
  localStorage.setItem('categories', JSON.stringify(CATEGORIES));
  localStorage.setItem('catColors',  JSON.stringify(CAT_COLORS));
  localStorage.setItem('exRates',    JSON.stringify(exRates));
}

// =================== HELPERS ===================
function getRate(currency) {
  if (currency === 'LAK') return 1;
  const rates = {
    THB: parseFloat(document.getElementById('exchangeRateTHB')?.value) || exRates.THB || 850,
    USD: parseFloat(document.getElementById('exchangeRateUSD')?.value) || exRates.USD || 18000,
    CNY: parseFloat(document.getElementById('exchangeRateCNY')?.value) || exRates.CNY || 2500,
  };
  return rates[currency] || 1;
}
function convertToLAK(amount, currency) { return amount * getRate(currency); }
function fmt(n, currency = 'LAK') {
  if (isNaN(n)) n = 0;
  const sym = { LAK: '₭', THB: '฿', USD: '$', CNY: '¥' }[currency] || '₭';
  return n.toLocaleString('lo-LA', { maximumFractionDigits: 0 }) + ' ' + sym;
}
function fmtDate(d) {
  if (!d) return '';
  try { return new Date(d + 'T00:00:00').toLocaleDateString('lo-LA', { day: '2-digit', month: 'short', year: '2-digit' }); }
  catch { return d; }
}
function getMonth(d) { return d ? d.substring(0, 7) : ''; }
function today() { return new Date().toISOString().split('T')[0]; }
function thisMonth() { return today().substring(0, 7); }

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => { t.className = 'toast'; }, 2800);
}
function toggleSection(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// =================== DARK MODE ===================
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? saved === 'dark' : prefersDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  updateThemeBtn(isDark);
}
function updateThemeBtn(isDark) {
  ['themeToggle', 'themeToggle2'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  });
}
window.toggleTheme = () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
  updateThemeBtn(!isDark);
};

// =================== PIN LOCK ===================
function initPin() {
  const pin = localStorage.getItem('appPin');
  if (!pin) return;
  const appEl = document.getElementById('appContent');
  const pinEl = document.getElementById('pinScreen');
  if (appEl) appEl.style.display = 'none';
  if (pinEl) pinEl.style.display = 'flex';
}
window.submitPin = () => {
  const input = document.getElementById('pinInput');
  const saved = localStorage.getItem('appPin');
  if (!input || !saved) return;
  if (input.value === saved) {
    document.getElementById('pinScreen').style.display = 'none';
    document.getElementById('appContent').style.display = 'block';
    input.value = '';
  } else {
    const err = document.getElementById('pinError');
    if (err) { err.style.display = 'block'; setTimeout(() => { err.style.display = 'none'; }, 2000); }
    input.value = '';
  }
};
window.pinKeypad = (v) => {
  const inp = document.getElementById('pinInput');
  if (!inp) return;
  if (v === 'del') { inp.value = inp.value.slice(0, -1); return; }
  if (inp.value.length >= 6) return;
  inp.value += v;
  const pinLen = (localStorage.getItem('appPin') || '').length;
  if (inp.value.length >= pinLen && pinLen > 0) submitPin();
};
window.savePin = () => {
  const np = document.getElementById('newPin').value;
  const cp = document.getElementById('confirmPin').value;
  if (!np) { localStorage.removeItem('appPin'); showToast('ລົບ PIN ສຳເລັດ'); return; }
  if (np.length < 4) { showToast('PIN ຕ້ອງ 4-6 ຕົວ!', 'error'); return; }
  if (np !== cp) { showToast('PIN ບໍ່ກົງກັນ!', 'error'); return; }
  localStorage.setItem('appPin', np);
  document.getElementById('newPin').value = '';
  document.getElementById('confirmPin').value = '';
  showToast('ຕັ້ງ PIN ສຳເລັດ 🔒');
};
window.clearPin = () => {
  localStorage.removeItem('appPin');
  ['newPin', 'confirmPin'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  showToast('ລົບ PIN ສຳເລັດ');
};

// =================== BACKUP / RESTORE JSON ===================
window.backupData = () => {
  const data = {
    v: 3, ts: Date.now(), expenses, incomes, goals, budgets, recurring,
    debts, netWorth, bills, CATEGORIES, CAT_COLORS, exRates
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ການເງິນ_backup_${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  showToast('Backup ສຳເລັດ 💾');
};
window.restoreData = () => {
  const inp = document.getElementById('restoreFileInput');
  if (inp) inp.click();
};
function handleRestore(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const d = JSON.parse(e.target.result);
      if (!d.expenses && !d.incomes) throw new Error('ຟາຍຜິດ');
      expenses  = d.expenses  || [];
      incomes   = d.incomes   || [];
      goals     = d.goals     || [];
      budgets   = d.budgets   || {};
      recurring = d.recurring || [];
      debts     = d.debts     || [];
      netWorth  = d.netWorth  || { assets: [], liabilities: [] };
      bills     = d.bills     || [];
      if (d.CATEGORIES) CATEGORIES = d.CATEGORIES;
      if (d.CAT_COLORS) CAT_COLORS = d.CAT_COLORS;
      if (d.exRates) exRates = d.exRates;
      save(); updateUI(); renderBudgetInputs(); renderCategoryManager();
      showToast('Restore ສຳເລັດ ✓');
    } catch { showToast('ຟາຍຜິດພາດ!', 'error'); }
  };
  reader.readAsText(file, 'utf-8');
}

// =================== EXCHANGE RATES (Auto) ===================
async function fetchRates() {
  const rateInfoEl = document.getElementById('rateInfo');
  if (rateInfoEl) rateInfoEl.textContent = 'ກຳລັງໂຫຼດ...';
  try {
    const r = await fetch('https://api.exchangerate-api.com/v4/latest/LAK');
    if (!r.ok) throw new Error('Network error');
    const d = await r.json();
    if (d.rates) {
      if (d.rates.THB) exRates.THB = Math.round(1 / d.rates.THB);
      if (d.rates.USD) exRates.USD = Math.round(1 / d.rates.USD);
      if (d.rates.CNY) exRates.CNY = Math.round(1 / d.rates.CNY);
      save();
    }
  } catch {
    // Use cached rates silently
  }
  // Update input fields with fetched rates
  const tEl = document.getElementById('exchangeRateTHB');
  const uEl = document.getElementById('exchangeRateUSD');
  const cEl = document.getElementById('exchangeRateCNY');
  if (tEl) tEl.value = exRates.THB || 850;
  if (uEl) uEl.value = exRates.USD || 18000;
  if (cEl) cEl.value = exRates.CNY || 2500;
  if (rateInfoEl) {
    rateInfoEl.textContent = `1฿=${fmt(exRates.THB)} · 1$=${fmt(exRates.USD)} · 1¥=${fmt(exRates.CNY)}`;
  }
  updateUI();
}
window.calculateExchange = () => {
  const rate = parseFloat(document.getElementById('exchangeRateTHB')?.value) || exRates.THB || 850;
  const baht = parseFloat(document.getElementById('thaiBaht')?.value) || 0;
  const el = document.getElementById('resultLAK');
  if (el) el.value = (rate * baht).toLocaleString() + ' ₭';
};
window.calculateLiters = () => {
  const price = parseFloat(document.getElementById('pricePerLiter')?.value) || 0;
  const total = parseFloat(document.getElementById('totalAmountPaid')?.value) || 0;
  const el = document.getElementById('calculatedLiters');
  if (el) el.value = price > 0 ? (total / price).toFixed(3) + ' L' : '0 L';
};

// =================== SEARCH & FILTER ===================
function getFilterMonth() { return (document.getElementById('filterMonth')?.value) || ''; }
function getSearchQuery() { return ((document.getElementById('searchQuery')?.value) || '').toLowerCase().trim(); }

window.clearFilter = () => {
  const fm = document.getElementById('filterMonth');
  const sq = document.getElementById('searchQuery');
  if (fm) fm.value = '';
  if (sq) sq.value = '';
  updateUI();
};

function filterItems(arr, dateField = 'date', nameField = 'item') {
  const m = getFilterMonth();
  const q = getSearchQuery();
  let out = arr;
  if (m) out = out.filter(x => getMonth(x[dateField]) === m);
  if (q) out = out.filter(x =>
    (x[nameField] || '').toLowerCase().includes(q) ||
    (x.category || '').toLowerCase().includes(q) ||
    (x.currency || '').toLowerCase().includes(q)
  );
  return out;
}

// =================== SORT ===================
let sortField = 'date', sortDir = -1;
window.setSort = (field) => {
  if (sortField === field) sortDir *= -1;
  else { sortField = field; sortDir = -1; }
  updateUI();
};
function sortItems(arr) {
  return [...arr].sort((a, b) => {
    let av = a[sortField], bv = b[sortField];
    if (sortField === 'amount') {
      av = convertToLAK(a.amount, a.currency);
      bv = convertToLAK(b.amount, b.currency);
    }
    if (av < bv) return -sortDir;
    if (av > bv) return sortDir;
    return 0;
  });
}

// =================== INCOME ===================
window.addIncome = () => {
  const nameEl   = document.getElementById('incomeName');
  const amountEl = document.getElementById('incomeAmount');
  const currEl   = document.getElementById('currencyIncome');
  const dateEl   = document.getElementById('incomeDate');
  if (!nameEl.value || !amountEl.value || !dateEl.value) {
    showToast('ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ!', 'error'); return;
  }
  const entry = {
    name: nameEl.value.trim(),
    amount: parseFloat(amountEl.value),
    currency: currEl.value,
    date: dateEl.value
  };
  if (editTarget?.type === 'income') {
    incomes[editTarget.index] = entry;
    cancelEdit();
    showToast('ແກ້ໄຂສຳເລັດ ✓');
  } else {
    incomes.push(entry);
    showToast('ບັນທຶກລາຍຮັບສຳເລັດ ✓');
  }
  nameEl.value = ''; amountEl.value = ''; dateEl.value = today();
  save(); updateUI();
};

// =================== EXPENSE ===================
window.addGeneral = () => {
  const itemEl   = document.getElementById('item1');
  const amountEl = document.getElementById('amount1');
  const catEl    = document.getElementById('category1');
  const currEl   = document.getElementById('currency1');
  const dateEl   = document.getElementById('date1');
  if (!itemEl.value || !amountEl.value || !dateEl.value) {
    showToast('ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ!', 'error'); return;
  }
  const noteEl = document.getElementById('note1');
  const entry = {
    item: itemEl.value.trim(),
    amount: parseFloat(amountEl.value),
    category: catEl.value,
    currency: currEl.value,
    date: dateEl.value,
    note: noteEl ? noteEl.value.trim() : ''
  };
  if (editTarget?.type === 'expense') {
    expenses[editTarget.index] = entry;
    cancelEdit();
    showToast('ແກ້ໄຂສຳເລັດ ✓');
  } else {
    expenses.push(entry);
    showToast('ບັນທຶກລາຍຈ່າຍສຳເລັດ ✓');
  }
  itemEl.value = ''; amountEl.value = ''; if(noteEl) noteEl.value = ''; dateEl.value = today();
  save(); updateUI();
};
window.addFuel = () => {
  const total  = parseFloat(document.getElementById('totalAmountPaid')?.value);
  const liters = document.getElementById('calculatedLiters')?.value || '';
  const date   = document.getElementById('fuelDate')?.value || today();
  if (!(total > 0)) { showToast('ກະລຸນາໃສ່ຈຳນວນເງິນ!', 'error'); return; }
  expenses.push({ item: `ເຕີມນ້ຳມັນ (${liters})`, amount: total, category: 'ຄ່ານ້ຳມັນ', currency: 'LAK', date });
  ['pricePerLiter', 'totalAmountPaid', 'fuelDate'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const cl = document.getElementById('calculatedLiters'); if (cl) cl.value = '';
  save(); updateUI(); showToast('ບັນທຶກຄ່ານ້ຳມັນສຳເລັດ ✓');
};

// =================== EDIT ===================
window.editInc = (idx) => {
  const inc = incomes[idx]; if (!inc) return;
  editTarget = { type: 'income', index: idx };
  document.getElementById('incomeName').value    = inc.name;
  document.getElementById('incomeAmount').value  = inc.amount;
  document.getElementById('currencyIncome').value = inc.currency;
  document.getElementById('incomeDate').value    = inc.date;
  const banner = document.getElementById('incomeEditBanner');
  if (banner) banner.style.display = 'flex';
  const btn = document.getElementById('incomeSubmitBtn');
  if (btn) { btn.textContent = '✎ ບັນທຶກການແກ້ໄຂ'; btn.className = 'btn-edit-save'; }
  document.getElementById('incomeCard')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  navTo('transactions');
};
window.editEx = (idx) => {
  const ex = expenses[idx]; if (!ex) return;
  editTarget = { type: 'expense', index: idx };
  document.getElementById('item1').value     = ex.item;
  document.getElementById('amount1').value   = ex.amount;
  document.getElementById('category1').value = ex.category;
  document.getElementById('currency1').value = ex.currency;
  document.getElementById('date1').value     = ex.date;
  const n1 = document.getElementById('note1'); if (n1) n1.value = ex.note || '';
  const banner = document.getElementById('expenseEditBanner');
  if (banner) banner.style.display = 'flex';
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  const gf = document.getElementById('generalForm');
  if (gf) gf.style.display = 'block';
  const firstTab = document.querySelector('.tab-btn');
  if (firstTab) firstTab.classList.add('active');
  const btn = document.getElementById('expenseSubmitBtn');
  if (btn) { btn.textContent = '✎ ບັນທຶກການແກ້ໄຂ'; btn.className = 'btn-edit-save'; }
  document.getElementById('expenseCard')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  navTo('transactions');
};
window.cancelEdit = () => {
  editTarget = null;
  ['incomeEditBanner', 'expenseEditBanner'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'none';
  });
  ['incomeName', 'incomeAmount'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const id = document.getElementById('incomeDate'); if (id) id.value = today();
  ['item1', 'amount1', 'note1'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const d1 = document.getElementById('date1'); if (d1) d1.value = today();
  const ib = document.getElementById('incomeSubmitBtn');
  if (ib) { ib.textContent = '+ ບັນທຶກລາຍຮັບ'; ib.className = 'btn-success'; }
  const eb = document.getElementById('expenseSubmitBtn');
  if (eb) { eb.textContent = '+ ບັນທຶກລາຍຈ່າຍ'; eb.className = 'btn-danger'; }
};
window.delEx  = (idx) => { expenses.splice(idx, 1); if (editTarget?.type === 'expense') cancelEdit(); save(); updateUI(); };
window.delInc = (idx) => { incomes.splice(idx, 1);  if (editTarget?.type === 'income')  cancelEdit(); save(); updateUI(); };

// =================== TABS ===================
window.openTab = (tabId, event) => {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  const tab = document.getElementById(tabId);
  if (tab) tab.style.display = 'block';
  if (event?.currentTarget) event.currentTarget.classList.add('active');
};

// =================== BOTTOM NAV ===================
window.navTo = (section) => {
  document.querySelectorAll('.nav-section').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.bottom-nav-btn').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('nav-' + section);
  if (el) el.style.display = 'block';
  const btn = document.querySelector(`.bottom-nav-btn[data-nav="${section}"]`);
  if (btn) btn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// =================== GOALS ===================
window.saveGoal = () => {
  const name   = document.getElementById('goalName')?.value;
  const amount = parseFloat(document.getElementById('goalAmount')?.value);
  const dl     = document.getElementById('goalDeadline')?.value;
  if (!name || !amount) { showToast('ກະລຸນາໃສ່ຊື່ ແລະ ຈຳນວນ!', 'error'); return; }
  goals.push({ id: Date.now(), name, amount, deadline: dl, created: thisMonth() });
  ['goalName', 'goalAmount', 'goalDeadline'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  save(); updateUI(); showToast('ບັນທຶກເປົ້າໝາຍສຳເລັດ ✓');
};
window.delGoal = (id) => { goals = goals.filter(g => g.id !== id); save(); updateUI(); };

function renderGoals(totalSavedLAK, containerId = 'goalsListMain') {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!goals.length) { el.innerHTML = '<p class="empty-msg">ຍັງບໍ່ມີເປົ້າໝາຍ</p>'; return; }
  const now = new Date();
  el.innerHTML = goals.map(g => {
    const pct = Math.min(100, Math.round((totalSavedLAK / g.amount) * 100));
    const dlStr = g.deadline ? ` · ກຳນົດ: ${g.deadline}` : '';
    let warn = '';
    if (g.deadline) {
      const diff = (new Date(g.deadline + '-01') - now) / (1000 * 60 * 60 * 24 * 30);
      if (diff <= 2 && diff >= 0 && pct < 100) warn = `<span class="goal-warn">⚠️ ໃກ້ຮອດ!</span>`;
      else if (diff < 0 && pct < 100) warn = `<span class="goal-warn goal-overdue">❌ ເກີນ</span>`;
    }
    return `<div class="goal-item">
      <div class="goal-top">
        <span class="goal-name">${escHtml(g.name)}</span>${warn}
        <span class="goal-meta">${fmt(g.amount)}${dlStr}</span>
        <button class="btn-del" onclick="delGoal(${g.id})">×</button>
      </div>
      <div class="goal-bar-wrap"><div class="goal-bar" style="width:${pct}%"></div></div>
      <div class="goal-pct">${pct}% · ${fmt(Math.round(totalSavedLAK))} / ${fmt(g.amount)}</div>
    </div>`;
  }).join('');
}

// =================== BUDGET ===================
function renderBudgetInputs() {
  const el = document.getElementById('budgetInputs');
  if (!el) return;
  el.innerHTML = CATEGORIES.map(cat => `
    <div class="budget-input-item">
      <label>${escHtml(cat)}</label>
      <input type="number" placeholder="0 ₭" value="${budgets[cat] || ''}"
        oninput="budgets[${JSON.stringify(cat)}]=parseFloat(this.value)||0;save();renderBudgetBars(filterItems(expenses));">
    </div>`).join('');
}
function renderBudgetBars(filteredExpenses) {
  const el = document.getElementById('budgetBars');
  if (!el) return;
  const hasBudget = CATEGORIES.some(c => budgets[c] > 0);
  if (!hasBudget) { el.innerHTML = ''; return; }
  el.innerHTML = CATEGORIES.filter(c => budgets[c] > 0).map(cat => {
    const spent = filteredExpenses
      .filter(e => e.category === cat)
      .reduce((s, e) => s + convertToLAK(e.amount, e.currency), 0);
    const pct  = Math.min(100, Math.round((spent / budgets[cat]) * 100));
    const over = spent > budgets[cat], near = !over && pct >= 80;
    return `<div class="budget-bar-item">
      <div class="budget-bar-label">
        <span>${escHtml(cat)}</span>
        <span class="${over ? 'over-budget' : near ? 'near-budget' : ''}">
          ${fmt(Math.round(spent))} / ${fmt(budgets[cat])} ${over ? '⚠️ ເກີນ!' : near ? '⚡ ໃກ້' : ''}
        </span>
      </div>
      <div class="budget-track"><div class="budget-fill ${over ? 'budget-over' : near ? 'budget-near' : ''}" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

// =================== RECURRING ===================
window.applyRecurring = () => {
  const item   = document.getElementById('recItem')?.value;
  const amount = parseFloat(document.getElementById('recAmount')?.value);
  const cat    = document.getElementById('recCategory')?.value;
  const curr   = document.getElementById('recCurrency')?.value;
  const month  = document.getElementById('recMonth')?.value || thisMonth();
  if (!item || !amount) { showToast('ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ!', 'error'); return; }
  const rec = { id: Date.now(), item, amount, category: cat, currency: curr };
  recurring.push(rec);
  expenses.push({ item, amount, category: cat, currency: curr, date: month + '-01', recurringId: rec.id });
  save(); updateUI();
  ['recItem', 'recAmount'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const rm = document.getElementById('recMonth'); if (rm) rm.value = thisMonth();
  showToast('ເພີ່ມ recurring ສຳເລັດ ✓');
};
window.delRecurring = (id) => { recurring = recurring.filter(r => r.id !== id); save(); updateUI(); };
function renderRecurring() {
  const el = document.getElementById('recurringList');
  if (!el) return;
  if (!recurring.length) { el.innerHTML = ''; return; }
  el.innerHTML = '<div class="rec-tags">' + recurring.map(r =>
    `<div class="rec-tag"><span>${escHtml(r.item)} · ${fmt(r.amount, r.currency)}</span>
     <button onclick="delRecurring(${r.id})">×</button></div>`
  ).join('') + '</div>';
}

// =================== SPENDING HEATMAP ===================
function renderHeatmap() {
  const el = document.getElementById('heatmapWrap');
  if (!el) return;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const dayMap = {};
  expenses.forEach(e => {
    if (!e.date || getMonth(e.date) !== thisMonth()) return;
    const d = parseInt(e.date.split('-')[2]);
    if (!isNaN(d)) dayMap[d] = (dayMap[d] || 0) + convertToLAK(e.amount, e.currency);
  });
  const maxAmt = Math.max(...Object.values(dayMap), 1);
  const monthName = now.toLocaleDateString('lo-LA', { month: 'long', year: 'numeric' });
  const days = ['ອາ', 'ຈ', 'ອ', 'ພ', 'ພຫ', 'ສຸ', 'ສ'];
  let html = `<div class="heatmap-title">${monthName}</div><div class="heatmap-grid">
    ${days.map(d => `<div class="hm-day-label">${d}</div>`).join('')}`;
  for (let i = 0; i < firstDay; i++) html += '<div></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const amt = dayMap[d] || 0;
    const intensity = amt > 0 ? Math.ceil((amt / maxAmt) * 5) : 0;
    const isToday = d === now.getDate();
    html += `<div class="hm-cell hm-${intensity}${isToday ? ' hm-today' : ''}" title="${d}: ${fmt(Math.round(amt))}">${d}</div>`;
  }
  html += '</div>';
  if (Object.keys(dayMap).length > 0) {
    const topDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
    html += `<div class="heatmap-legend">
      <span class="hm-legend-label">ໜ້ອຍ</span>
      <div class="hm-0"></div><div class="hm-1"></div><div class="hm-2"></div>
      <div class="hm-3"></div><div class="hm-4"></div><div class="hm-5"></div>
      <span class="hm-legend-label">ຫຼາຍ</span>
      <span class="hm-peak">📍 ສູງສຸດ: ວັນທີ ${topDay[0]} = ${fmt(Math.round(topDay[1]))}</span>
    </div>`;
  }
  el.innerHTML = html;
}

// =================== DEBT TRACKER ===================
window.addDebt = () => {
  const who    = document.getElementById('debtWho')?.value;
  const amount = parseFloat(document.getElementById('debtAmount')?.value);
  const curr   = document.getElementById('debtCurrency')?.value;
  const type   = document.getElementById('debtType')?.value;
  const note   = document.getElementById('debtNote')?.value;
  const date   = document.getElementById('debtDate')?.value || today();
  if (!who || !amount) { showToast('ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ!', 'error'); return; }
  const debtId = Date.now();
  debts.push({ id: debtId, who, amount, currency: curr, type, note, date, paid: 0 });
  // ຢືມເງິນມາ = ເງິນສົດເຂົ້າ (ລາຍຮັບ) / ໃຫ້ຢືມເງິນໄປ = ເງິນສົດອອກ (ລາຍຈ່າຍ)
  if (type === 'borrowed') {
    incomes.push({ name: `ຢືມເງິນຈາກ ${who}`, amount, currency: curr, date, debtId, debtTx: true });
  } else if (type === 'lent') {
    expenses.push({ item: `ໃຫ້ຢືມເງິນ ${who}`, amount, category: 'ອື່ນໆ', currency: curr, date, note: note || 'ໃຫ້ຢືມເງິນ', debtId, debtTx: true });
  }
  ['debtWho', 'debtAmount', 'debtNote'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  save(); updateUI(); showToast(type === 'lent' ? 'ບັນທຶກການໃຫ້ຢືມ ✓' : 'ບັນທຶກການຢືມ ✓');
};
window.payDebt = (id) => {
  const d = debts.find(x => x.id === id); if (!d) return;
  // Remove existing pay modal if any
  const existing = document.getElementById('payDebtModal');
  if (existing) existing.remove();
  const remaining = d.amount - d.paid;
  const modal = document.createElement('div');
  modal.id = 'payDebtModal';
  modal.className = 'pay-modal-overlay';
  modal.innerHTML = `
    <div class="pay-modal-box">
      <h3>💰 ຈ່າຍຄືນໜີ້</h3>
      <p>${escHtml(d.who)} · ຄ້າງ ${fmt(remaining, d.currency)}</p>
      <div class="input-group">
        <label>ຈຳນວນທີ່ຈ່າຍ (${d.currency})</label>
        <input type="number" id="payDebtAmount" placeholder="0" step="any" max="${remaining}" autofocus>
      </div>
      <div class="pay-modal-actions">
        <button class="btn-link" onclick="document.getElementById('payDebtModal').remove()">ຍົກເລີກ</button>
        <button class="btn-primary" onclick="confirmPayDebt(${id})">✓ ຈ່າຍ</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  setTimeout(() => { const inp = document.getElementById('payDebtAmount'); if (inp) inp.focus(); }, 50);
};
window.confirmPayDebt = (id) => {
  const d = debts.find(x => x.id === id); if (!d) return;
  const pv = parseFloat(document.getElementById('payDebtAmount')?.value || 0);
  if (!(pv > 0)) { showToast('ກະລຸນາໃສ່ຈຳນວນ!', 'error'); return; }
  const remaining = d.amount - d.paid;
  const payAmount = Math.min(remaining, pv);
  d.paid = Math.min(d.amount, d.paid + pv);
  // ຮັບຄືນໜີ້ (ໃຫ້ຢືມ) = ເງິນສົດເຂົ້າ / ຈ່າຍຄືນໜີ້ (ຢືມມາ) = ເງິນສົດອອກ
  if (d.type === 'lent') {
    incomes.push({ name: `ຮັບຄືນໜີ້ຈາກ ${d.who}`, amount: payAmount, currency: d.currency, date: today(), debtId: d.id, debtTx: true });
  } else if (d.type === 'borrowed') {
    expenses.push({ item: `ຈ່າຍຄືນໜີ້ ${d.who}`, amount: payAmount, category: 'ອື່ນໆ', currency: d.currency, date: today(), note: 'ຈ່າຍຄືນໜີ້', debtId: d.id, debtTx: true });
  }
  document.getElementById('payDebtModal')?.remove();
  if (d.paid >= d.amount) showToast('ຊຳລະໜີ້ຄົບແລ້ວ! 🎉');
  else showToast(`ຈ່າຍ ${fmt(pv, d.currency)} ສຳເລັດ ✓`);
  save(); updateUI();
};
window.delDebt = (id) => {
  debts = debts.filter(x => x.id !== id);
  incomes  = incomes.filter(x => !(x.debtTx && x.debtId === id));
  expenses = expenses.filter(x => !(x.debtTx && x.debtId === id));
  save(); updateUI();
};
function renderDebts() {
  const el = document.getElementById('debtList');
  if (!el) return;
  if (!debts.length) { el.innerHTML = '<p class="empty-msg">ຍັງບໍ່ມີລາຍການໜີ້</p>'; return; }
  el.innerHTML = debts.map(d => {
    const remaining = d.amount - d.paid;
    const pct = Math.round((d.paid / d.amount) * 100);
    const typeLabel = d.type === 'lent' ? '💸 ໃຫ້ຢືມ' : '🤲 ຢືມຈາກ';
    const done = remaining <= 0;
    return `<div class="debt-item ${done ? 'debt-done' : ''}">
      <div class="debt-top">
        <span class="debt-type ${d.type}">${typeLabel}</span>
        <strong>${escHtml(d.who)}</strong>
        <span class="debt-amount">${fmt(d.amount, d.currency)}</span>
        ${d.note ? `<span class="debt-note">${escHtml(d.note)}</span>` : ''}
        <span class="debt-date">${fmtDate(d.date)}</span>
      </div>
      <div class="goal-bar-wrap">
        <div class="goal-bar" style="width:${pct}%;background:${d.type === 'lent' ? '#4BC0C0' : '#FF6384'}"></div>
      </div>
      <div class="debt-bottom">
        <span>${done ? '✅ ຊຳລະຄົບ' : `ຄ້າງ: ${fmt(remaining, d.currency)} (${100 - pct}%)`}</span>
        <div style="display:flex;gap:6px;">
          ${!done ? `<button class="btn-edit" onclick="payDebt(${d.id})">+ ຈ່າຍ</button>` : ''}
          <button class="btn-del" onclick="delDebt(${d.id})">×</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// =================== NET WORTH ===================
window.addAsset = () => {
  const name  = document.getElementById('assetName')?.value;
  const value = parseFloat(document.getElementById('assetValue')?.value);
  const curr  = document.getElementById('assetCurrency')?.value;
  if (!name || !value) { showToast('ກະລຸນາໃສ່ຂໍ້ມູນ!', 'error'); return; }
  netWorth.assets.push({ id: Date.now(), name, value, currency: curr, date: today() });
  ['assetName', 'assetValue'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  save(); renderNetWorth(); showToast('ບັນທຶກຊັບສິນ ✓');
};
window.addLiability = () => {
  const name  = document.getElementById('liabName')?.value;
  const value = parseFloat(document.getElementById('liabValue')?.value);
  const curr  = document.getElementById('liabCurrency')?.value;
  if (!name || !value) { showToast('ກະລຸນາໃສ່ຂໍ້ມູນ!', 'error'); return; }
  netWorth.liabilities.push({ id: Date.now(), name, value, currency: curr, date: today() });
  ['liabName', 'liabValue'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  save(); renderNetWorth(); showToast('ບັນທຶກໜີ້ສິນ ✓');
};
window.delAsset = (id) => { netWorth.assets = netWorth.assets.filter(x => x.id !== id); save(); renderNetWorth(); };
window.delLiab  = (id) => { netWorth.liabilities = netWorth.liabilities.filter(x => x.id !== id); save(); renderNetWorth(); };
function renderNetWorth() {
  const el = document.getElementById('netWorthDisplay');
  if (!el) return;
  const totalAssets = netWorth.assets.reduce((s, a) => s + convertToLAK(a.value, a.currency), 0);
  const totalLiab   = netWorth.liabilities.reduce((s, l) => s + convertToLAK(l.value, l.currency), 0);
  const nw = totalAssets - totalLiab;
  el.innerHTML = `
    <div class="nw-summary">
      <div class="nw-card nw-assets"><div class="nw-label">ຊັບສິນ</div><div class="nw-val">${fmt(Math.round(totalAssets))}</div></div>
      <div class="nw-card nw-liab"><div class="nw-label">ໜີ້ສິນ</div><div class="nw-val">${fmt(Math.round(totalLiab))}</div></div>
      <div class="nw-card nw-net"><div class="nw-label">Net Worth</div>
        <div class="nw-val" style="color:${nw >= 0 ? 'var(--income)' : 'var(--expense)'}">${fmt(Math.round(nw))}</div>
      </div>
    </div>
    <div class="nw-lists">
      <div>
        <div class="nw-list-title">ຊັບສິນ</div>
        ${netWorth.assets.length ? netWorth.assets.map(a =>
          `<div class="nw-item"><span>${escHtml(a.name)}</span><span>${fmt(a.value, a.currency)}</span>
           <button class="btn-del" onclick="delAsset(${a.id})">×</button></div>`
        ).join('') : '<p class="empty-msg">ຍັງບໍ່ມີ</p>'}
      </div>
      <div>
        <div class="nw-list-title">ໜີ້ສິນ</div>
        ${netWorth.liabilities.length ? netWorth.liabilities.map(l =>
          `<div class="nw-item"><span>${escHtml(l.name)}</span>
           <span style="color:var(--expense)">${fmt(l.value, l.currency)}</span>
           <button class="btn-del" onclick="delLiab(${l.id})">×</button></div>`
        ).join('') : '<p class="empty-msg">ຍັງບໍ່ມີ</p>'}
      </div>
    </div>`;
}

// =================== BILL REMINDER ===================
window.addBill = () => {
  const name   = document.getElementById('billName')?.value;
  const amount = parseFloat(document.getElementById('billAmount')?.value);
  const dueDay = parseInt(document.getElementById('billDueDay')?.value);
  const curr   = document.getElementById('billCurrency')?.value;
  if (!name || !dueDay) { showToast('ກະລຸນາໃສ່ຂໍ້ມູນ!', 'error'); return; }
  bills.push({ id: Date.now(), name, amount: amount || 0, currency: curr, dueDay, paid: false });
  ['billName', 'billAmount', 'billDueDay'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  save(); renderBills(); showToast('ເພີ່ມ Bill ສຳເລັດ ✓');
};
window.toggleBillPaid = (id) => {
  const b = bills.find(x => x.id === id); if (!b) return;
  b.paid = !b.paid; save(); renderBills();
};
window.delBill = (id) => { bills = bills.filter(x => x.id !== id); save(); renderBills(); };
function renderBills() {
  const el = document.getElementById('billList');
  if (!el) return;
  if (!bills.length) { el.innerHTML = '<p class="empty-msg">ຍັງບໍ່ມີ Bill</p>'; return; }
  const todayD = new Date().getDate();
  el.innerHTML = bills.map(b => {
    let daysLeft = b.dueDay - todayD;
    if (daysLeft < 0) daysLeft += 30;
    const urgent  = daysLeft <= 3 && !b.paid;
    const overdue = b.dueDay < todayD && !b.paid;
    return `<div class="bill-item ${b.paid ? 'bill-paid' : urgent ? 'bill-urgent' : ''}">
      <label style="display:flex;align-items:center;gap:8px;flex:1;cursor:pointer;">
        <input type="checkbox" ${b.paid ? 'checked' : ''} onchange="toggleBillPaid(${b.id})">
        <span class="bill-name ${b.paid ? 'bill-name-done' : ''}">${escHtml(b.name)}</span>
        ${b.amount ? `<span class="bill-amount">${fmt(b.amount, b.currency)}</span>` : ''}
      </label>
      <span class="bill-due ${overdue && !b.paid ? 'bill-overdue' : urgent ? 'bill-near-due' : ''}">
        ${b.paid ? '✅ ຈ່າຍແລ້ວ' : overdue ? '❌ ເກີນ' : urgent ? `⚡ ${daysLeft}ວັນ` : `ວທ ${b.dueDay}`}
      </span>
      <button class="btn-del" onclick="delBill(${b.id})">×</button>
    </div>`;
  }).join('');
}

// =================== CHARTS ===================
function updatePieChart(data) {
  const canvas = document.getElementById('expenseChart');
  if (!canvas) return;
  if (myPieChart) { myPieChart.destroy(); myPieChart = null; }
  myPieChart = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: { labels: CATEGORIES, datasets: [{ data, backgroundColor: CAT_COLORS, borderWidth: 3, borderColor: 'transparent' }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { family: "'Noto Sans Lao'", size: 11 }, padding: 10 } } }
    }
  });
}
function updateTrendChart() {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().substring(0, 7));
  }
  const labels  = months.map(m => { const [y, mo] = m.split('-'); return `${mo}/${y.slice(2)}`; });
  const incData = months.map(m => incomes.filter(x => getMonth(x.date) === m).reduce((s, x) => s + convertToLAK(x.amount, x.currency), 0));
  const expData = months.map(m => expenses.filter(x => getMonth(x.date) === m).reduce((s, x) => s + convertToLAK(x.amount, x.currency), 0));
  if (myTrendChart) { myTrendChart.destroy(); myTrendChart = null; }
  myTrendChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels, datasets: [
        { label: 'ລາຍຮັບ', data: incData, borderColor: '#4BC0C0', backgroundColor: 'rgba(75,192,192,0.08)', fill: true, tension: 0.4, borderWidth: 2 },
        { label: 'ລາຍຈ່າຍ', data: expData, borderColor: '#FF6384', backgroundColor: 'rgba(255,99,132,0.08)', fill: true, tension: 0.4, borderWidth: 2 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { family: "'Noto Sans Lao'", size: 11 } } } },
      scales: { y: { ticks: { callback: v => (v / 1000).toFixed(0) + 'k' } } }
    }
  });
}

// =================== MONTHLY REPORT ===================
function buildMonthlyReport() {
  const allMonths = [...new Set([
    ...incomes.map(i => getMonth(i.date)),
    ...expenses.map(e => getMonth(e.date))
  ])].filter(Boolean).sort().reverse();
  if (!allMonths.length) return '<p class="empty-msg">ຍັງບໍ່ມີຂໍ້ມູນ</p>';
  const rows = allMonths.map(m => {
    const inc = incomes.filter(i => getMonth(i.date) === m).reduce((s, i) => s + convertToLAK(i.amount, i.currency), 0);
    const exp = expenses.filter(e => getMonth(e.date) === m).reduce((s, e) => s + convertToLAK(e.amount, e.currency), 0);
    const sv  = inc - exp;
    const pct = inc > 0 ? Math.round((sv / inc) * 100) : 0;
    return `<tr>
      <td><strong>${m}</strong></td>
      <td class="td-amount" style="color:var(--income)">${fmt(Math.round(inc))}</td>
      <td class="td-amount" style="color:var(--expense)">${fmt(Math.round(exp))}</td>
      <td class="td-amount ${sv >= 0 ? 'pos' : 'neg'}">${fmt(Math.round(sv))}</td>
      <td style="color:${pct >= 0 ? 'var(--income)' : 'var(--expense)'};font-weight:700;font-family:'Space Mono',monospace">${pct}%</td>
    </tr>`;
  }).join('');
  return `<div class="table-wrap" style="padding:0 20px 20px">
    <table><thead><tr><th>ເດືອນ</th><th>ລາຍຮັບ</th><th>ລາຍຈ່າຍ</th><th>ເກັບໄດ້</th><th>%</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

// =================== IMPORT / EXPORT CSV ===================
window.exportCSV = () => {
  const m    = getFilterMonth();
  const exps = m ? expenses.filter(e => getMonth(e.date) === m) : expenses;
  const incs = m ? incomes.filter(i  => getMonth(i.date) === m) : incomes;
  let csv = '\uFEFFປະເພດ,ລາຍການ,ຈຳນວນ,ສະກຸນ,ວັນທີ,ໝວດ\n';
  incs.forEach(i  => { csv += `ລາຍຮັບ,"${(i.name||'').replace(/"/g,'""')}",${i.amount},${i.currency},${i.date},-\n`; });
  exps.forEach(e  => { csv += `ລາຍຈ່າຍ,"${(e.item||'').replace(/"/g,'""')}",${e.amount},${e.currency},${e.date},${e.category||''}\n`; });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `ການເງິນ_${m || 'ທັງໝົດ'}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  showToast('Export CSV ສຳເລັດ ✓');
};
window.importCSV = () => { const inp = document.getElementById('csvFileInput'); if (inp) inp.click(); };
function handleCSVImport(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result.replace(/^\uFEFF/, '');
    const lines = text.split('\n').slice(1).filter(l => l.trim());
    let imported = 0;
    lines.forEach(line => {
      const cols = [];
      let cur = '', inQuote = false;
      for (const ch of line) {
        if (ch === '"') { inQuote = !inQuote; }
        else if (ch === ',' && !inQuote) { cols.push(cur); cur = ''; }
        else { cur += ch; }
      }
      cols.push(cur);
      const [type, name, amount, currency, date, category] = cols.map(c => c.trim());
      if (!type || !amount || !date) return;
      if (type === 'ລາຍຮັບ') {
        incomes.push({ name: name || 'Import', amount: parseFloat(amount) || 0, currency: currency || 'LAK', date });
        imported++;
      } else if (type === 'ລາຍຈ່າຍ') {
        expenses.push({ item: name || 'Import', amount: parseFloat(amount) || 0, category: category || 'ອື່ນໆ', currency: currency || 'LAK', date });
        imported++;
      }
    });
    save(); updateUI(); showToast(`Import ສຳເລັດ: ${imported} ລາຍການ ✓`);
  };
  reader.readAsText(file, 'utf-8');
}

// =================== EXPORT PDF ===================
window.exportPDF = () => {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) { showToast('PDF library ບໍ່ພ້ອມ', 'error'); return; }
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text('Financial Report', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${today()}`, 14, 28);

  // Summary
  const fm = getFilterMonth();
  const filteredInc = fm ? incomes.filter(i => getMonth(i.date) === fm) : incomes;
  const filteredExp = fm ? expenses.filter(e => getMonth(e.date) === fm) : expenses;
  const totalInc = filteredInc.reduce((s, i) => s + convertToLAK(i.amount, i.currency), 0);
  const totalExp = filteredExp.reduce((s, e) => s + convertToLAK(e.amount, e.currency), 0);
  const balance  = totalInc - totalExp;

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`Period: ${fm || 'All time'}`, 14, 36);
  doc.text(`Total Income:  ${fmt(Math.round(totalInc))}`, 14, 44);
  doc.text(`Total Expense: ${fmt(Math.round(totalExp))}`, 14, 51);
  doc.text(`Balance:       ${fmt(Math.round(balance))}`, 14, 58);

  let y = 68;

  // Income table
  if (filteredInc.length) {
    doc.setFontSize(12); doc.setTextColor(16, 185, 129);
    doc.text('Income', 14, y); y += 5;
    doc.autoTable({
      startY: y,
      head: [['Item', 'Amount', 'Currency', 'Date']],
      body: filteredInc.map(i => [i.name, i.amount.toLocaleString(), i.currency, i.date]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Expense table
  if (filteredExp.length) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12); doc.setTextColor(244, 63, 94);
    doc.text('Expenses', 14, y); y += 5;
    doc.autoTable({
      startY: y,
      head: [['Item', 'Category', 'Amount', 'Currency', 'Date']],
      body: filteredExp.map(e => [e.item, e.category, e.amount.toLocaleString(), e.currency, e.date]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [244, 63, 94], textColor: 255 },
      margin: { left: 14, right: 14 },
    });
  }

  // Note: jsPDF standard font doesn't support Lao Unicode - text renders as boxes in PDF
  // Items are saved as-is; open in modern PDF reader that has Unicode support
  doc.save(`Finance_Report_${fm || 'all'}_${today()}.pdf`);
  showToast('Export PDF ສຳເລັດ ✓ (ເປີດດ້ວຍ Adobe Reader ສຳລັບ ຕົວອັກສອນລາວ)');
};

// =================== AI INSIGHTS ===================
// =================== API KEY ===================
window.saveApiKey = () => {
  const val = document.getElementById('aiApiKey')?.value?.trim();
  if (val) {
    localStorage.setItem('anthropicKey', val);
    const st = document.getElementById('aiKeyStatus');
    if (st) st.textContent = '✅ Key ບັນທຶກແລ້ວ (ບໍ່ sync ໄປ cloud)';
  }
};
window.clearApiKey = () => {
  localStorage.removeItem('anthropicKey');
  const el = document.getElementById('aiApiKey');
  if (el) el.value = '';
  const st = document.getElementById('aiKeyStatus');
  if (st) st.textContent = 'ລົບ Key ແລ້ວ';
};

async function callAI(prompt) {
  const apiKey = localStorage.getItem('anthropicKey') || '';
  if (!apiKey) throw new Error('ກະລຸນາໃສ່ Anthropic API Key ໃນ Settings ກ່ອນ');
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'API error ' + response.status);
  }
  const data = await response.json();
  if (data.content && data.content[0]) return data.content[0].text;
  throw new Error('No response');
}

function buildFinancialContext() {
  const fm = getFilterMonth() || thisMonth();
  const filteredInc = incomes.filter(i => getMonth(i.date) === fm);
  const filteredExp = expenses.filter(e => getMonth(e.date) === fm);
  const totalInc = filteredInc.reduce((s, i) => s + convertToLAK(i.amount, i.currency), 0);
  const totalExp = filteredExp.reduce((s, e) => s + convertToLAK(e.amount, e.currency), 0);

  const catBreakdown = {};
  filteredExp.forEach(e => {
    catBreakdown[e.category] = (catBreakdown[e.category] || 0) + convertToLAK(e.amount, e.currency);
  });

  return `
User's Financial Data (${fm}):
- Total Income: ${fmt(Math.round(totalInc))} LAK
- Total Expense: ${fmt(Math.round(totalExp))} LAK
- Balance: ${fmt(Math.round(totalInc - totalExp))} LAK
- Savings Rate: ${totalInc > 0 ? Math.round(((totalInc - totalExp) / totalInc) * 100) : 0}%

Expense by Category:
${Object.entries(catBreakdown).map(([cat, amt]) => `- ${cat}: ${fmt(Math.round(amt))}`).join('\n')}

Number of transactions: ${filteredInc.length} income, ${filteredExp.length} expenses
Recurring expenses: ${recurring.length}
Active debts: ${debts.filter(d => d.paid < d.amount).length}
`;
}

window.askAI = async () => {
  const question = document.getElementById('aiQuestion')?.value;
  if (!question) { showToast('ກະລຸນາຖາມຄຳຖາມ!', 'error'); return; }
  const context = buildFinancialContext();
  const prompt = `You are a personal finance advisor for a Lao user. Respond in Lao language (ພາສາລາວ). Be concise and practical.

${context}

User question: ${question}

Please provide helpful, specific advice based on their actual data.`;

  await runAIQuery(prompt);
};

window.quickAsk = async (question) => {
  const inp = document.getElementById('aiQuestion');
  if (inp) inp.value = question;
  const context = buildFinancialContext();
  const prompt = `You are a personal finance advisor for a Lao user. Respond in Lao language (ພາສາລາວ). Be concise, practical and use bullet points where appropriate.

${context}

Task: ${question}

Provide specific, actionable advice based on their actual financial data.`;

  await runAIQuery(prompt);
};

window.loadAIInsights = async () => {
  const context = buildFinancialContext();
  const prompt = `You are a personal finance advisor for a Lao user. Respond in Lao language (ພາສາລາວ). Format response clearly with sections.

${context}

Please analyze this financial data and provide:
1. ການປະເມີນໂດຍລວມ (Overall assessment)
2. ຈຸດດີ (Strengths)
3. ຈຸດທີ່ຕ້ອງປັບປຸງ (Areas to improve)
4. ຄຳແນະນຳ 3 ຂໍ້ (3 specific recommendations)`;

  await runAIQuery(prompt);
};

async function runAIQuery(prompt) {
  const resultEl = document.getElementById('aiResult');
  const loadingEl = document.getElementById('aiLoading');
  if (resultEl) resultEl.style.display = 'none';
  if (loadingEl) loadingEl.style.display = 'flex';

  try {
    const text = await callAI(prompt);
    if (resultEl) {
      resultEl.innerHTML = `<div class="ai-response">${text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}</div>`;
      resultEl.style.display = 'block';
    }
  } catch (err) {
    if (resultEl) {
      const isKey = err.message && err.message.includes('API Key');
      resultEl.innerHTML = `<div class="ai-error">❌ ${isKey ? err.message + ' ໄປທີ່ Settings > AI Settings' : 'ບໍ່ສາມາດເຊື່ອມຕໍ່ AI ໄດ້: ' + err.message}</div>`;
      resultEl.style.display = 'block';
    }
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

// =================== CUSTOM CATEGORIES ===================
function renderCategoryManager() {
  const el = document.getElementById('categoryManagerList');
  if (!el) return;
  el.innerHTML = CATEGORIES.map((cat, i) =>
    `<div class="cat-tag"><span>${escHtml(cat)}</span>
     ${CATEGORIES.length > 1 ? `<button onclick="deleteCategory(${i})">×</button>` : ''}</div>`
  ).join('');
  refreshCategorySelects();
}
window.addCategory = () => {
  const inp = document.getElementById('newCategoryInput');
  const val = inp?.value.trim();
  if (!val) { showToast('ກະລຸນາໃສ່ຊື່ໝວດ!', 'error'); return; }
  if (CATEGORIES.includes(val)) { showToast('ມີໝວດນີ້ຢູ່ແລ້ວ!', 'error'); return; }
  CATEGORIES.push(val);
  CAT_COLORS.push('#' + Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0'));
  budgets[val] = 0;
  if (inp) inp.value = '';
  renderBudgetInputs(); renderCategoryManager(); save(); showToast(`ເພີ່ມໝວດ "${val}" ✓`);
};
window.deleteCategory = (idx) => {
  const cat = CATEGORIES[idx];
  if (expenses.some(e => e.category === cat)) { showToast(`ໝວດ "${cat}" ມີລາຍຈ່າຍ — ບໍ່ສາມາດລົບ`, 'error'); return; }
  CATEGORIES.splice(idx, 1); CAT_COLORS.splice(idx, 1); delete budgets[cat];
  renderBudgetInputs(); renderCategoryManager(); save(); showToast(`ລົບໝວດ "${cat}" ✓`);
};
function refreshCategorySelects() {
  ['category1', 'recCategory'].forEach(id => {
    const sel = document.getElementById(id); if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = CATEGORIES.map(c => `<option value="${escHtml(c)}">${escHtml(c)}</option>`).join('');
    if (CATEGORIES.includes(cur)) sel.value = cur;
  });
}

// =================== CONFIRM CLEAR ===================
window.confirmClear = () => {
  const m = document.getElementById('confirmModal');
  if (m) m.style.display = 'flex';
};
window.closeModal = () => {
  const m = document.getElementById('confirmModal');
  if (m) m.style.display = 'none';
};
window.clearAll = () => {
  expenses = []; incomes = []; goals = []; budgets = {}; recurring = []; debts = []; bills = [];
  netWorth = { assets: [], liabilities: [] };
  save(); updateUI(); closeModal(); showToast('ລ້າງຂໍ້ມູນສຳເລັດ', 'info');
};

// =================== ESCAPE HTML ===================
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// =================== MAIN UI ===================
function updateUI() {
  const filteredExp = sortItems(filterItems(expenses));
  const filteredInc = sortItems(filterItems(incomes, 'date', 'name'));

  // Filter label
  const fm = getFilterMonth(), q = getSearchQuery();
  const fl = document.getElementById('filterSummaryLabel');
  if (fl) fl.textContent = (fm || q)
    ? `🔍 ${filteredExp.length} ລາຍຈ່າຍ, ${filteredInc.length} ລາຍຮັບ ທີ່ກົງ`
    : `ທັງໝົດ (${expenses.length} ລາຍຈ່າຍ, ${incomes.length} ລາຍຮັບ)`;

  // --- Expense table ---
  const expBody = document.getElementById('expenseList');
  if (expBody) {
    expBody.innerHTML = filteredExp.length
      ? filteredExp.map(ex => {
          const gi = expenses.indexOf(ex);
          return `<tr>
            <td class="td-main"><strong>${escHtml(ex.item)}</strong><small>${escHtml(ex.category)} · ${fmtDate(ex.date)}${ex.note ? ' · <span class="note-tag">' + escHtml(ex.note) + '</span>' : ''}</small></td>
            <td class="td-amount">${fmt(ex.amount, ex.currency)}</td>
            <td>${fmtDate(ex.date)}</td>
            <td><button class="btn-edit" onclick="editEx(${gi})" title="ແກ້ໄຂ">✎</button></td>
            <td><button class="btn-del" onclick="delEx(${gi})">×</button></td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="5" class="empty-row">ຍັງບໍ່ມີລາຍຈ່າຍ</td></tr>';
  }

  // --- Income table ---
  const incBody = document.getElementById('incomeList');
  if (incBody) {
    incBody.innerHTML = filteredInc.length
      ? filteredInc.map(inc => {
          const gi = incomes.indexOf(inc);
          return `<tr>
            <td class="td-main"><strong>${escHtml(inc.name)}</strong></td>
            <td class="td-amount">${fmt(inc.amount, inc.currency)}</td>
            <td>${fmtDate(inc.date)}</td>
            <td><button class="btn-edit" onclick="editInc(${gi})" title="ແກ້ໄຂ">✎</button></td>
            <td><button class="btn-del" onclick="delInc(${gi})">×</button></td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="5" class="empty-row">ຍັງບໍ່ມີລາຍຮັບ</td></tr>';
  }

  // --- Totals ---
  const totalIncLAK = filteredInc.reduce((s, i) => s + convertToLAK(i.amount, i.currency), 0);
  const totalExpLAK = filteredExp.reduce((s, e) => s + convertToLAK(e.amount, e.currency), 0);

  // Multi-currency display (show THB secondary)
  const incTHBRate = getRate('THB');
  const incTHBEq   = totalIncLAK / incTHBRate;
  const expTHBEq   = totalExpLAK / incTHBRate;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('totalIncomeLAK',  fmt(Math.round(totalIncLAK)));
  setEl('totalIncMulti',   `≈ ${fmt(Math.round(incTHBEq), 'THB')}`);
  setEl('totalExpenseLAK', fmt(Math.round(totalExpLAK)));
  setEl('totalExpMulti',   `≈ ${fmt(Math.round(expTHBEq), 'THB')}`);

  const balLAK = totalIncLAK - totalExpLAK;
  const balEl  = document.getElementById('balanceLAK');
  if (balEl) { balEl.textContent = fmt(Math.round(balLAK)); balEl.style.color = balLAK < 0 ? '#ff4757' : ''; }
  setEl('balanceMulti', `≈ ${fmt(Math.round(balLAK / incTHBRate), 'THB')}`);

  const saved    = totalIncLAK - totalExpLAK;
  const savedPct = totalIncLAK > 0 ? Math.round((saved / totalIncLAK) * 100) : 0;
  setEl('savedThisMonth', fmt(Math.max(0, Math.round(saved))));
  setEl('savedPercent',   `${savedPct}% ຂອງລາຍຮັບ`);

  // Goals
  const totalBal = incomes.reduce((s, i) => s + convertToLAK(i.amount, i.currency), 0)
                 - expenses.reduce((s, e) => s + convertToLAK(e.amount, e.currency), 0);
  renderGoals(Math.max(0, totalBal), 'goalsListMain');
  renderGoals(Math.max(0, totalBal), 'goalsList');

  renderBudgetBars(filteredExp);
  renderRecurring();

  const pieData = CATEGORIES.map(cat =>
    filteredExp.filter(e => e.category === cat).reduce((s, e) => s + convertToLAK(e.amount, e.currency), 0)
  );
  updatePieChart(pieData);
  updateTrendChart();

  const reportEl = document.getElementById('monthlyReportBody');
  if (reportEl) reportEl.innerHTML = buildMonthlyReport();

  renderHeatmap();
  renderDebts();
  renderNetWorth();
  renderBills();
}


// =================== CURRENCY CONVERTER ===================
window.convertCurrency = () => {
  const amount  = parseFloat(document.getElementById('convAmount')?.value) || 0;
  const fromCur = document.getElementById('convFrom')?.value || 'LAK';
  const toCur   = document.getElementById('convTo')?.value || 'THB';
  const resultEl = document.getElementById('convResult');
  if (!resultEl) return;
  if (amount === 0) { resultEl.textContent = '0'; return; }
  // Convert through LAK
  const inLAK  = convertToLAK(amount, fromCur);
  const toRate = getRate(toCur);
  const result = toRate > 0 ? inLAK / toRate : inLAK;
  const sym = { LAK: '₭', THB: '฿', USD: '$', CNY: '¥' }[toCur] || '';
  resultEl.textContent = result.toLocaleString('lo-LA', { maximumFractionDigits: 2 }) + ' ' + sym;
};


// =================== BILL MONTHLY RESET ===================
function checkBillMonthReset() {
  const lastMonth = localStorage.getItem('billLastMonth');
  const current = thisMonth();
  if (lastMonth && lastMonth !== current) {
    // New month - reset all paid bills
    bills.forEach(b => { b.paid = false; });
    save();
    showToast('🔄 ເດືອນໃໝ່: Bill reset ແລ້ວ');
  }
  localStorage.setItem('billLastMonth', current);
}

// =================== INIT ===================
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initPin();

  // Default dates
  ['date1', 'incomeDate', 'fuelDate', 'debtDate'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = today();
  });
  const fm = document.getElementById('filterMonth');
  if (fm) fm.value = thisMonth();
  const rm = document.getElementById('recMonth');
  if (rm) rm.value = thisMonth();

  // Restore saved exchange rates to inputs
  const tEl = document.getElementById('exchangeRateTHB');
  const uEl = document.getElementById('exchangeRateUSD');
  const cEl = document.getElementById('exchangeRateCNY');
  if (tEl) tEl.value = exRates.THB || 850;
  if (uEl) uEl.value = exRates.USD || 18000;
  if (cEl) cEl.value = exRates.CNY || 2500;

  // Save rates on input change
  ['exchangeRateTHB', 'exchangeRateUSD', 'exchangeRateCNY'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => {
      exRates.THB = parseFloat(document.getElementById('exchangeRateTHB')?.value) || exRates.THB;
      exRates.USD = parseFloat(document.getElementById('exchangeRateUSD')?.value) || exRates.USD;
      exRates.CNY = parseFloat(document.getElementById('exchangeRateCNY')?.value) || exRates.CNY;
      save(); updateUI();
    });
  });

  // File inputs
  const csvInput = document.getElementById('csvFileInput');
  if (csvInput) csvInput.addEventListener('change', function () { handleCSVImport(this.files[0]); this.value = ''; });
  const restoreInput = document.getElementById('restoreFileInput');
  if (restoreInput) restoreInput.addEventListener('change', function () { handleRestore(this.files[0]); this.value = ''; });

  // Search
  const sq = document.getElementById('searchQuery');
  if (sq) sq.addEventListener('input', updateUI);

  // PIN enter key
  const pinInp = document.getElementById('pinInput');
  if (pinInp) pinInp.addEventListener('keydown', e => { if (e.key === 'Enter') submitPin(); });

  checkBillMonthReset();
  renderBudgetInputs();
  renderCategoryManager();

  // Load saved API key
  const savedKey = localStorage.getItem('anthropicKey');
  const keyEl = document.getElementById('aiApiKey');
  if (keyEl && savedKey) keyEl.value = savedKey;
  const st = document.getElementById('aiKeyStatus');
  if (st && savedKey) st.textContent = '✅ API Key ຖືກໂຫຼດແລ້ວ';

  // Fetch live rates (non-blocking)
  fetchRates().catch(() => {});

  updateUI();

  // Default to dashboard
  navTo('dashboard');
});
