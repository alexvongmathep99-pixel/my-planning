let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let incomes = JSON.parse(localStorage.getItem('incomes')) || [];
let myChart; 

// --- ຟັງຊັນຄວບຄຸມ Tab ---
window.openTab = (tabId, event) => {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).style.display = 'block';
    event.currentTarget.classList.add('active');
};

// --- ຟັງຊັນຄິດໄລ່ຄ່ານ້ຳມັນ ---
window.calculateLiters = () => {
    const price = parseFloat(document.getElementById('pricePerLiter').value) || 0;
    const total = parseFloat(document.getElementById('totalAmountPaid').value) || 0;
    const calcField = document.getElementById('calculatedLiters');
    calcField.value = price > 0 ? (total / price).toFixed(3) + " L" : "0 L";
};

// --- ຟັງຊັນຄິດໄລ່ອັດຕາແລກປ່ຽນ ---
window.calculateExchange = () => {
    const rate = parseFloat(document.getElementById('exchangeRate').value) || 0;
    const baht = parseFloat(document.getElementById('thaiBaht').value) || 0;
    const resultField = document.getElementById('resultLAK');
    resultField.value = (rate * baht).toLocaleString() + " ກີບ";
};

// --- ຟັງຊັນຊ່ວຍຄິດໄລ່ຍອດເປັນກີບ ---
function convertToLAK(amount, currency) {
    if (currency === 'THB') {
        const rate = parseFloat(document.getElementById('exchangeRate').value) || 0;
        return amount * rate;
    }
    return amount;
}

// --- ຟັງຊັນບັນທຶກລາຍຈ່າຍທົ່ວໄປ ---
window.addGeneral = () => {
    const item = document.getElementById('item1');
    const amount = document.getElementById('amount1');
    const category = document.getElementById('category1');
    const currency = document.getElementById('currency1');
    const date = document.getElementById('date1');

    if (item.value && amount.value && date.value) {
        expenses.push({ 
            item: item.value, 
            amount: parseFloat(amount.value),
            category: category.value,
            currency: currency.value,
            date: date.value
        });
        item.value = ''; amount.value = ''; date.value = '';
        updateUI();
    } else {
        alert("ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ!");
    }
};

// --- ຟັງຊັນບັນທຶກຄ່ານ້ຳມັນ ---
window.addFuel = () => {
    const totalVal = parseFloat(document.getElementById('totalAmountPaid').value);
    const liters = document.getElementById('calculatedLiters').value;
    if (totalVal > 0) {
        expenses.push({ 
            item: `ເຕີມນ້ຳມັນ (${liters})`, 
            amount: totalVal,
            category: 'ຄ່ານ້ຳມັນ',
            currency: 'LAK',
            date: new Date().toISOString().split('T')[0]
        });
        document.getElementById('pricePerLiter').value = '';
        document.getElementById('totalAmountPaid').value = '';
        document.getElementById('calculatedLiters').value = '';
        updateUI();
    }
};

// --- ຟັງຊັນບັນທຶກລາຍຮັບ ---
window.addIncome = () => {
    const name = document.getElementById('incomeName');
    const amount = document.getElementById('incomeAmount');
    const currency = document.getElementById('currencyIncome');
    if (name.value && amount.value) {
        incomes.push({ name: name.value, amount: parseFloat(amount.value), currency: currency.value });
        name.value = ''; amount.value = '';
        updateUI();
    }
};

// --- ຟັງຊັນອັບເດດ Chart ---
function updateChart(dataToDisplay) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const categories = ['ອາຫານ', 'ຄ່າໄຟ', 'ສຸຂະພາບ', 'ບາດ', 'ອື່ນໆ', 'ຄ່ານ້ຳມັນ'];
    
    const data = categories.map(cat => {
        return dataToDisplay
            .filter(ex => ex.category === cat)
            .reduce((sum, ex) => sum + convertToLAK(parseFloat(ex.amount), ex.currency), 0);
    });

    if (myChart) myChart.destroy(); 

    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: data,
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#FF9F40', '#4BC0C0', '#9966FF'],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { font: { family: "'Noto Sans Lao', sans-serif", size: 13 }, padding: 20 } }
            }
        }
    });
}

// --- ຟັງຊັນອັບເດດໜ້າຈໍ ---
function updateUI() {
    const filterDate = document.getElementById('filterDate').value;
    let filteredExpenses = filterDate ? expenses.filter(ex => ex.date === filterDate) : expenses;

    // ສະແດງລາຍຈ່າຍໃນຕາຕະລາງ
    document.getElementById('expenseList').innerHTML = filteredExpenses.map((ex, i) => 
        `<tr>
            <td>
                <div style="font-weight: 700;">${ex.item}</div>
                <small style="color: #888;">${ex.category} | ${ex.date} | ${ex.currency}</small>
            </td>
            <td>${ex.amount.toLocaleString()} ${ex.currency === 'THB' ? '฿' : '₭'}</td>
            <td><button onclick="delEx(${i})">ລົບ</button></td>
        </tr>`).join('');
    
    // ສະແດງລາຍຮັບໃນຕາຕະລາງ
    document.getElementById('incomeList').innerHTML = incomes.map((inc, i) => 
        `<tr><td>${inc.name} (${inc.currency})</td><td>${parseFloat(inc.amount).toLocaleString()}</td><td><button onclick="delInc(${i})">ລົບ</button></td></tr>`).join('');
    
    // ຄິດໄລ່ຍອດລວມແຍກຕາມສະກຸນເງິນ
    const incLAK = incomes.filter(i => i.currency === 'LAK').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const incTHB = incomes.filter(i => i.currency === 'THB').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
    const expLAK = filteredExpenses.filter(e => e.currency === 'LAK').reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    const expTHB = filteredExpenses.filter(e => e.currency === 'THB').reduce((s, e) => s + parseFloat(e.amount || 0), 0);
    
    // ອັບເດດຍອດລວມໃສ່ໜ້າຈໍ
    document.getElementById('totalIncomeLAK').textContent = incLAK.toLocaleString() + ' ₭';
    document.getElementById('totalExpenseLAK').textContent = expLAK.toLocaleString() + ' ₭';
    document.getElementById('totalIncomeTHB').textContent = incTHB.toLocaleString() + ' ฿';
    document.getElementById('totalExpenseTHB').textContent = expTHB.toLocaleString() + ' ฿';
    
    // ຄິດໄລ່ຍອດເຫຼືອ
    const balLAK = incLAK - expLAK;
    const balTHB = incTHB - expTHB;

    const balLAKEl = document.getElementById('balanceLAK');
    const balTHBEl = document.getElementById('balanceTHB');

    balLAKEl.textContent = balLAK.toLocaleString() + ' ₭';
    balTHBEl.textContent = balTHB.toLocaleString() + ' ฿';

    // ລະບົບເຕືອນໄພສີແດງ (ກີບ < 1,000,000 ຫຼື ບາດ < 500)
    balLAKEl.style.color = balLAK < 1000000 ? '#ff0000' : '#2c3e50';
    balTHBEl.style.color = balTHB < 500 ? '#ff0000' : '#2c3e50';
    
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('incomes', JSON.stringify(incomes));
    updateChart(filteredExpenses);
}

window.delEx = (i) => { expenses.splice(i, 1); updateUI(); };
window.delInc = (i) => { incomes.splice(i, 1); updateUI(); };

updateUI();