// =================== STATE ===================
let expenses   = JSON.parse(localStorage.getItem('expenses'))   || [];
let incomes    = JSON.parse(localStorage.getItem('incomes'))    || [];
let goals      = JSON.parse(localStorage.getItem('goals'))      || [];
let budgets    = JSON.parse(localStorage.getItem('budgets'))    || {};
let recurring  = JSON.parse(localStorage.getItem('recurring'))  || [];

let myPieChart;
let myTrendChart;

const CATEGORIES = ['ອາຫານ','ຄ່າໄຟ','ສຸຂະພາບ','ຄ່ານ້ຳມັນ','ຄ່າເຊົ່າ','ບາດ','ອື່ນໆ'];
const CAT_COLORS  = ['#FF6384','#36A2EB','#FFCE56','#9966FF','#4BC0C0','#FF9F40','#C9CBCF'];

// =================== HELPERS ===================
function save() {
    localStorage.setItem('expenses',  JSON.stringify(expenses));
    localStorage.setItem('incomes',   JSON.stringify(incomes));
    localStorage.setItem('goals',     JSON.stringify(goals));
    localStorage.setItem('budgets',   JSON.stringify(budgets));
    localStorage.setItem('recurring', JSON.stringify(recurring));
}

function getExchangeRate() {
    return parseFloat(document.getElementById('exchangeRate').value) || 0;
}

function convertToLAK(amount, currency) {
    return currency === 'THB' ? amount * getExchangeRate() : amount;
}

function fmt(n, currency = 'LAK') {
    const sym = currency === 'THB' ? '฿' : '₭';
    return n.toLocaleString('lo-LA', { maximumFractionDigits: 0 }) + ' ' + sym;
}

function fmtDate(d) {
    if (!d) return '';
    return new Date(d + 'T00:00:00').toLocaleDateString('lo-LA', { day: '2-digit', month: 'short', year: '2-digit' });
}

function getMonth(dateStr) {
    return dateStr ? dateStr.substring(0, 7) : '';
}

function today() {
    return new Date().toISOString().split('T')[0];
}

function thisMonth() {
    return today().substring(0, 7);
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show ' + type;
    setTimeout(() => t.className = 'toast', 2500);
}

function toggleSection(id) {
    const el = document.getElementById(id);
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function confirmClear() {
    document.getElementById('confirmModal').style.display = 'flex';
}
function closeModal() {
    document.getElementById('confirmModal').style.display = 'none';
}
function clearAll() {
    expenses = []; incomes = []; goals = []; budgets = {}; recurring = [];
    save(); updateUI(); closeModal();
    showToast('ລ້າງຂໍ້ມູນສຳເລັດ', 'info');
}

// =================== EXCHANGE ===================
window.calculateExchange = () => {
    const rate = getExchangeRate();
    const baht = parseFloat(document.getElementById('thaiBaht').value) || 0;
    document.getElementById('resultLAK').value = (rate * baht).toLocaleString() + ' ₭';
};

window.calculateLiters = () => {
    const price = parseFloat(document.getElementById('pricePerLiter').value) || 0;
    const total = parseFloat(document.getElementById('totalAmountPaid').value) || 0;
    document.getElementById('calculatedLiters').value = price > 0 ? (total / price).toFixed(3) + ' L' : '0 L';
};

// =================== FILTER ===================
function getFilterMonth() {
    return document.getElementById('filterMonth').value;
}

window.clearFilter = () => {
    document.getElementById('filterMonth').value = '';
    updateUI();
};

function filterByMonth(arr, dateField = 'date') {
    const m = getFilterMonth();
    if (!m) return arr;
    return arr.filter(x => getMonth(x[dateField]) === m);
}

// =================== ADD INCOME ===================
window.addIncome = () => {
    const name   = document.getElementById('incomeName');
    const amount = document.getElementById('incomeAmount');
    const curr   = document.getElementById('currencyIncome');
    const date   = document.getElementById('incomeDate');
    if (!name.value || !amount.value || !date.value) { showToast('ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ!', 'error'); return; }
    incomes.push({ name: name.value, amount: parseFloat(amount.value), currency: curr.value, date: date.value });
    name.value = ''; amount.value = ''; date.value = '';
    save(); updateUI();
    showToast('ບັນທຶກລາຍຮັບສຳເລັດ ✓');
};

// =================== ADD EXPENSE (GENERAL) ===================
window.addGeneral = () => {
    const item   = document.getElementById('item1');
    const amount = document.getElementById('amount1');
    const cat    = document.getElementById('category1');
    const curr   = document.getElementById('currency1');
    const date   = document.getElementById('date1');
    if (!item.value || !amount.value || !date.value) { showToast('ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ!', 'error'); return; }
    expenses.push({ item: item.value, amount: parseFloat(amount.value), category: cat.value, currency: curr.value, date: date.value });
    item.value = ''; amount.value = ''; date.value = '';
    save(); updateUI();
    showToast('ບັນທຶກລາຍຈ່າຍສຳເລັດ ✓');
};

// =================== ADD FUEL ===================
window.addFuel = () => {
    const total  = parseFloat(document.getElementById('totalAmountPaid').value);
    const liters = document.getElementById('calculatedLiters').value;
    const date   = document.getElementById('fuelDate').value || today();
    if (!total > 0) return;
    expenses.push({ item: `ເຕີມນ້ຳມັນ (${liters})`, amount: total, category: 'ຄ່ານ້ຳມັນ', currency: 'LAK', date });
    document.getElementById('pricePerLiter').value = '';
    document.getElementById('totalAmountPaid').value = '';
    document.getElementById('calculatedLiters').value = '';
    document.getElementById('fuelDate').value = '';
    save(); updateUI();
    showToast('ບັນທຶກຄ່ານ້ຳມັນສຳເລັດ ✓');
};

// =================== DELETE (FIX: use global index) ===================
window.delEx = (globalIdx) => {
    if (globalIdx < 0 || globalIdx >= expenses.length) return;
    expenses.splice(globalIdx, 1);
    save(); updateUI();
};
window.delInc = (globalIdx) => {
    if (globalIdx < 0 || globalIdx >= incomes.length) return;
    incomes.splice(globalIdx, 1);
    save(); updateUI();
};

// =================== TABS ===================
window.openTab = (tabId, event) => {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).style.display = 'block';
    event.currentTarget.classList.add('active');
};

// =================== GOALS ===================
window.saveGoal = () => {
    const name   = document.getElementById('goalName').value;
    const amount = parseFloat(document.getElementById('goalAmount').value);
    const dl     = document.getElementById('goalDeadline').value;
    if (!name || !amount) { showToast('ກະລຸນາໃສ່ຊື່ ແລະຈຳນວນ!', 'error'); return; }
    goals.push({ id: Date.now(), name, amount, deadline: dl, created: thisMonth() });
    document.getElementById('goalName').value = '';
    document.getElementById('goalAmount').value = '';
    document.getElementById('goalDeadline').value = '';
    save(); updateUI();
    showToast('ບັນທຶກເປົ້າໝາຍສຳເລັດ ✓');
};

window.delGoal = (id) => {
    goals = goals.filter(g => g.id !== id);
    save(); updateUI();
};

function renderGoals(totalSavedLAK) {
    const el = document.getElementById('goalsList');
    if (!goals.length) { el.innerHTML = '<p class="empty-msg">ຍັງບໍ່ມີເປົ້າໝາຍ — ເພີ່ມເປົ້າໝາຍ​ຂ້າງ​ເທິງ</p>'; return; }
    el.innerHTML = goals.map(g => {
        const pct = Math.min(100, Math.round((totalSavedLAK / g.amount) * 100));
        const dl  = g.deadline ? ` · ກຳນົດ: ${g.deadline}` : '';
        return `<div class="goal-item">
            <div class="goal-top">
                <span class="goal-name">${g.name}</span>
                <span class="goal-meta">${fmt(g.amount)}${dl}</span>
                <button class="btn-del" onclick="delGoal(${g.id})">×</button>
            </div>
            <div class="goal-bar-wrap">
                <div class="goal-bar" style="width:${pct}%"></div>
            </div>
            <div class="goal-pct">${pct}% · ເກັບໄດ້ ${fmt(Math.round(totalSavedLAK))} / ${fmt(g.amount)}</div>
        </div>`;
    }).join('');
}

// =================== BUDGET ===================
function renderBudgetInputs() {
    document.getElementById('budgetInputs').innerHTML = CATEGORIES.map(cat => `
        <div class="budget-input-item">
            <label>${cat}</label>
            <input type="number" placeholder="0 ₭" value="${budgets[cat] || ''}"
                oninput="budgets['${cat}'] = parseFloat(this.value) || 0; save(); renderBudgetBars(filterByMonth(expenses));">
        </div>`).join('');
}

function renderBudgetBars(filteredExpenses) {
    const hasBudget = CATEGORIES.some(c => budgets[c] > 0);
    const el = document.getElementById('budgetBars');
    if (!hasBudget) { el.innerHTML = ''; return; }
    el.innerHTML = CATEGORIES.filter(c => budgets[c] > 0).map((cat, i) => {
        const spent = filteredExpenses.filter(e => e.category === cat)
            .reduce((s, e) => s + convertToLAK(e.amount, e.currency), 0);
        const pct   = Math.min(100, Math.round((spent / budgets[cat]) * 100));
        const over  = spent > budgets[cat];
        return `<div class="budget-bar-item">
            <div class="budget-bar-label">
                <span>${cat}</span>
                <span class="${over ? 'over-budget' : ''}">${fmt(Math.round(spent))} / ${fmt(budgets[cat])} ${over ? '⚠️ ເກີນງົບ!' : ''}</span>
            </div>
            <div class="budget-track">
                <div class="budget-fill ${over ? 'budget-over' : ''}" style="width:${pct}%"></div>
            </div>
        </div>`;
    }).join('');
}

// =================== RECURRING ===================
window.applyRecurring = () => {
    const item   = document.getElementById('recItem').value;
    const amount = parseFloat(document.getElementById('recAmount').value);
    const cat    = document.getElementById('recCategory').value;
    const curr   = document.getElementById('recCurrency').value;
    const month  = document.getElementById('recMonth').value || thisMonth();
    if (!item || !amount) { showToast('ກະລຸນາໃສ່ຂໍ້ມູນໃຫ້ຄົບ!', 'error'); return; }

    const rec = { id: Date.now(), item, amount, category: cat, currency: curr };
    recurring.push(rec);

    // Add to expenses for that month (1st day)
    expenses.push({ item, amount, category: cat, currency: curr, date: month + '-01', recurringId: rec.id });
    save(); updateUI();
    document.getElementById('recItem').value = '';
    document.getElementById('recAmount').value = '';
    showToast('ເພີ່ມ recurring ສຳເລັດ ✓');
};

window.delRecurring = (id) => {
    recurring = recurring.filter(r => r.id !== id);
    save(); updateUI();
};

function renderRecurring() {
    const el = document.getElementById('recurringList');
    if (!recurring.length) { el.innerHTML = ''; return; }
    el.innerHTML = '<div class="rec-tags">' + recurring.map(r =>
        `<div class="rec-tag">
            <span>${r.item} · ${fmt(r.amount, r.currency)}</span>
            <button onclick="delRecurring(${r.id})">×</button>
        </div>`).join('') + '</div>';
}

// =================== CHARTS ===================
function updatePieChart(data) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (myPieChart) myPieChart.destroy();
    myPieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: CATEGORIES,
            datasets: [{ data, backgroundColor: CAT_COLORS, borderWidth: 3, borderColor: '#fff' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { family: "'Noto Sans Lao'", size: 12 }, padding: 12 } } }
        }
    });
}

function updateTrendChart() {
    // Collect last 6 months
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toISOString().substring(0, 7));
    }
    const labels = months.map(m => {
        const [y, mo] = m.split('-');
        return `${mo}/${y.slice(2)}`;
    });
    const incData = months.map(m =>
        incomes.filter(x => getMonth(x.date) === m)
            .reduce((s, x) => s + convertToLAK(x.amount, x.currency), 0));
    const expData = months.map(m =>
        expenses.filter(x => getMonth(x.date) === m)
            .reduce((s, x) => s + convertToLAK(x.amount, x.currency), 0));

    const ctx = document.getElementById('trendChart').getContext('2d');
    if (myTrendChart) myTrendChart.destroy();
    myTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'ລາຍຮັບ', data: incData, borderColor: '#4BC0C0', backgroundColor: 'rgba(75,192,192,0.1)', fill: true, tension: 0.4, borderWidth: 2 },
                { label: 'ລາຍຈ່າຍ', data: expData, borderColor: '#FF6384', backgroundColor: 'rgba(255,99,132,0.1)', fill: true, tension: 0.4, borderWidth: 2 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { font: { family: "'Noto Sans Lao'", size: 12 } } } },
            scales: {
                y: { ticks: { callback: v => (v / 1000).toFixed(0) + 'k' } }
            }
        }
    });
}

// =================== EXPORT CSV ===================
window.exportCSV = () => {
    const m = getFilterMonth();
    const exps = m ? expenses.filter(e => getMonth(e.date) === m) : expenses;
    const incs = m ? incomes.filter(i => getMonth(i.date) === m) : incomes;

    let csv = '\uFEFFປະເພດ,ລາຍການ,ຈຳນວນ,ສະກຸນ,ວັນທີ,ໝວດ\n';
    incs.forEach(i => csv += `ລາຍຮັບ,"${i.name}",${i.amount},${i.currency},${i.date},-\n`);
    exps.forEach(e => csv += `ລາຍຈ່າຍ,"${e.item}",${e.amount},${e.currency},${e.date},${e.category}\n`);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ການເງິນ_${m || 'ທັງໝົດ'}.csv`;
    a.click();
    showToast('Export CSV ສຳເລັດ ✓');
};

// =================== MAIN UI UPDATE ===================
function updateUI() {
    const filterM = getFilterMonth();
    const filteredExpenses = filterByMonth(expenses);
    const filteredIncomes  = filterByMonth(incomes, 'date');

    // Filter label
    const label = document.getElementById('filterSummaryLabel');
    if (filterM) {
        label.textContent = `📆 ສະແດງ: ${filterM} (${filteredExpenses.length} ລາຍຈ່າຍ, ${filteredIncomes.length} ລາຍຮັບ)`;
    } else {
        label.textContent = `ສະແດງທັງໝົດ (${expenses.length} ລາຍຈ່າຍ, ${incomes.length} ລາຍຮັບ)`;
    }

    // ===== RENDER EXPENSE TABLE (FIX: track globalIdx) =====
    const expBody = document.getElementById('expenseList');
    if (!filteredExpenses.length) {
        expBody.innerHTML = '<tr><td colspan="3" class="empty-row">ຍັງບໍ່ມີລາຍຈ່າຍ</td></tr>';
    } else {
        expBody.innerHTML = filteredExpenses.map(ex => {
            const globalIdx = expenses.indexOf(ex);
            return `<tr>
                <td class="td-main">
                    <strong>${ex.item}</strong>
                    <small>${ex.category} · ${fmtDate(ex.date)}</small>
                </td>
                <td class="td-amount">${fmt(ex.amount, ex.currency)}</td>
                <td><button class="btn-del" onclick="delEx(${globalIdx})">×</button></td>
            </tr>`;
        }).join('');
    }

    // ===== RENDER INCOME TABLE =====
    const incBody = document.getElementById('incomeList');
    if (!filteredIncomes.length) {
        incBody.innerHTML = '<tr><td colspan="3" class="empty-row">ຍັງບໍ່ມີລາຍຮັບ</td></tr>';
    } else {
        incBody.innerHTML = filteredIncomes.map(inc => {
            const globalIdx = incomes.indexOf(inc);
            return `<tr>
                <td class="td-main">
                    <strong>${inc.name}</strong>
                    <small>${fmtDate(inc.date)}</small>
                </td>
                <td class="td-amount">${fmt(inc.amount, inc.currency)}</td>
                <td><button class="btn-del" onclick="delInc(${globalIdx})">×</button></td>
            </tr>`;
        }).join('');
    }

    // ===== TOTALS (FIX: use same filtered set for both income & expense when filter is active) =====
    const incLAK = filteredIncomes.filter(i => i.currency === 'LAK').reduce((s, i) => s + i.amount, 0);
    const incTHB = filteredIncomes.filter(i => i.currency === 'THB').reduce((s, i) => s + i.amount, 0);
    const expLAK = filteredExpenses.filter(e => e.currency === 'LAK').reduce((s, e) => s + e.amount, 0);
    const expTHB = filteredExpenses.filter(e => e.currency === 'THB').reduce((s, e) => s + e.amount, 0);

    const rate   = getExchangeRate();
    const totalIncLAK = incLAK + (incTHB * rate);
    const totalExpLAK = expLAK + (expTHB * rate);
    const balLAK = incLAK - expLAK;
    const balTHB = incTHB - expTHB;

    document.getElementById('totalIncomeLAK').textContent  = fmt(incLAK);
    document.getElementById('totalIncomeTHB').textContent  = fmt(incTHB, 'THB');
    document.getElementById('totalExpenseLAK').textContent = fmt(expLAK);
    document.getElementById('totalExpenseTHB').textContent = fmt(expTHB, 'THB');

    const balLAKEl = document.getElementById('balanceLAK');
    balLAKEl.textContent = fmt(balLAK);
    balLAKEl.style.color = balLAK < 0 ? '#ff4757' : '';

    const balTHBEl = document.getElementById('balanceTHB');
    balTHBEl.textContent = fmt(balTHB, 'THB');
    balTHBEl.style.color = balTHB < 0 ? '#ff4757' : '';

    // Savings
    const saved = totalIncLAK - totalExpLAK;
    const savedPct = totalIncLAK > 0 ? Math.round((saved / totalIncLAK) * 100) : 0;
    document.getElementById('savedThisMonth').textContent = fmt(Math.max(0, Math.round(saved)));
    document.getElementById('savedPercent').textContent = `${savedPct}% ຂອງລາຍຮັບ`;

    // Goals
    const totalBalLAK = incomes.filter(i=>i.currency==='LAK').reduce((s,i)=>s+i.amount,0) +
                        incomes.filter(i=>i.currency==='THB').reduce((s,i)=>s+i.amount*rate,0) -
                        expenses.filter(e=>e.currency==='LAK').reduce((s,e)=>s+e.amount,0) -
                        expenses.filter(e=>e.currency==='THB').reduce((s,e)=>s+e.amount*rate,0);
    renderGoals(Math.max(0, totalBalLAK));

    // Budget
    renderBudgetBars(filteredExpenses);

    // Recurring
    renderRecurring();

    // Charts
    const pieData = CATEGORIES.map(cat =>
        filteredExpenses.filter(e => e.category === cat)
            .reduce((s, e) => s + convertToLAK(e.amount, e.currency), 0));
    updatePieChart(pieData);
    updateTrendChart();
}

// =================== INIT ===================
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date as default for date inputs
    document.getElementById('date1').value = today();
    document.getElementById('incomeDate').value = today();
    document.getElementById('fuelDate').value = today();
    document.getElementById('filterMonth').value = thisMonth();

    // Restore exchange rate
    const savedRate = localStorage.getItem('exchangeRate');
    if (savedRate) document.getElementById('exchangeRate').value = savedRate;

    document.getElementById('exchangeRate').addEventListener('input', function() {
        localStorage.setItem('exchangeRate', this.value);
    });

    renderBudgetInputs();
    updateUI();
});
