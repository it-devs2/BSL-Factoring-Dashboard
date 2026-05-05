// --- Global State ---
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

let RAW_DATA1 = []; 
let SUMMARY_MAP = {}; 
let INITIAL_CHART_DATA = { chart1: [], chart2: [] }; 

const KPI_DATA = [
    { title: "ชื่อบริษัท", amount: "กำลังโหลด...", color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "รายละเอียดงาน", amount: "กำลังโหลด...", color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "เครดิต", amount: "กำลังโหลด...", color: "text-amber-600", bg: "bg-amber-50" },
    { title: "วงเงินแต่ละหน้างาน", amount: "กำลังโหลด...", color: "text-blue-600", bg: "bg-blue-50" },
    { title: "วงเงินที่ใช้ไป", amount: "กำลังโหลด...", color: "text-purple-600", bg: "bg-purple-50" },
    { title: "วงเงินคงเหลือ", amount: "กำลังโหลด...", color: "text-rose-600", bg: "bg-rose-50" }
];

const API_URL = "https://script.google.com/macros/s/AKfycby2-H9fuh0eGdD0OurjJeqGOuo343puWMmcHERVz787V_hVZo1_Wv8HXLKfI7HC8BrJ/exec";

let DATA1_COL = {
    date: 1,      // คอลัมน์ B - วันที่เบิกเงิน
    dueDate: 2,   // คอลัมน์ C - วันครบกำหนด
    debtor: 8,    // คอลัมน์ I - ชื่อลูกหนี้
    used: 15,     // คอลัมน์ P - ยอดเบิกเงิน (ยอดรับซื้อ)
    remain: 16    // คอลัมน์ Q - วงเงินคงเหลือ
};

// --- Top Loading Bar ---
const TopLoader = {
    _raf: null, _progress: 0, _target: 0, _el: null, _bar: null,
    _getEl() {
        if (!this._el) this._el = document.getElementById('top-loader');
        if (!this._bar) this._bar = document.getElementById('top-loader-bar');
    },
    start() {
        this._getEl(); if (!this._el) return;
        this._progress = 0; this._target = 70;
        this._el.style.opacity = '1'; this._bar.style.width = '0%';
        cancelAnimationFrame(this._raf); this._animate();
    },
    _animate() {
        if (this._progress < this._target) {
            const step = (this._target - this._progress) * 0.04;
            this._progress = Math.min(this._progress + Math.max(step, 0.3), this._target);
            this._bar.style.width = this._progress + '%';
            this._raf = requestAnimationFrame(() => this._animate());
        }
    },
    finish() {
        this._getEl(); if (!this._el) return;
        cancelAnimationFrame(this._raf); this._progress = 100;
        this._bar.style.width = '100%';
        setTimeout(() => { this._el.style.opacity = '0'; }, 300);
    },
    fail() {
        this._getEl(); if (!this._el) return;
        cancelAnimationFrame(this._raf);
        this._bar.style.background = '#f43f5e'; this._bar.style.width = '100%';
        setTimeout(() => { this._el.style.opacity = '0'; }, 500);
    }
};

// --- Helpers ---
function normalizeName(name) {
    if (!name) return "";
    return name.toString().toLowerCase().replace(/\s+/g, "").replace(/[()\-\/._,]/g, "").trim();
}

function parseNumber(val) {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === "number") return val;
    return parseFloat(val.toString().replace(/[^0-9.-]/g, "")) || 0;
}

function formatMoney(num) {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseDateParts(value) {
    if (value === undefined || value === null || value === "") return { d: "", m: "", y: "" };
    let dt = null;
    if (value instanceof Date) { dt = value; } 
    else if (typeof value === 'number' && value > 30000) { dt = new Date((value - 25569) * 86400 * 1000); } 
    else {
        const str = value.toString().trim();
        if (str.includes('/')) {
            const p = str.split('/');
            if (p.length === 3) {
                let y = parseInt(p[2]);
                if (y > 2400) y -= 543;
                if (y < 100) y += 2000;
                return { d: p[0].padStart(2, '0'), m: p[1].padStart(2, '0'), y: y.toString() };
            }
        }
        dt = new Date(str);
    }
    if (dt && !isNaN(dt.getTime())) {
        return { d: dt.getDate().toString().padStart(2, '0'), m: (dt.getMonth() + 1).toString().padStart(2, '0'), y: dt.getFullYear().toString() };
    }
    return { d: "", m: "", y: "" };
}

function findColumnIndex(headers, keywords, fallback) {
    if (!headers) return fallback;
    for (let i = 0; i < headers.length; i++) {
        const h = headers[i].toString().toLowerCase();
        for (const kw of keywords) if (h.includes(kw.toLowerCase())) return i;
    }
    return fallback;
}

// --- Main Flow ---
document.addEventListener('DOMContentLoaded', () => {
    TopLoader.start();
    fetch(API_URL, { redirect: "follow" })
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                processRealData(res.summary, res.details);
                TopLoader.finish();
            } else {
                TopLoader.fail();
                alert("Error: " + res.message);
            }
        })
        .catch(err => { TopLoader.fail(); console.error(err); });
});

function processRealData(summary, details) {
    const companyRows = summary.data.filter(row => row[0] && row[0].toString().trim() !== "" && row[0].toString().toLowerCase() !== "ชื่อบริษัท");
    
    let totalCredit = 0, validCount = 0;
    companyRows.forEach(row => {
        let c = parseFloat(row[2]); if (!isNaN(c)) { totalCredit += c; validCount++; }
    });

    const totalLimitRaw = parseFloat(summary.headers[3]) || 0;
    const totalUsedRaw = parseFloat(summary.headers[4]) || 0;
    const totalRemainingRaw = parseFloat(summary.headers[5]) || 0;

    KPI_DATA[0].amount = "รวม " + companyRows.length + " บริษัท"; KPI_DATA[0].list = companyRows.map(r => r[0]);
    KPI_DATA[1].amount = "รวม " + companyRows.length + " งาน";   KPI_DATA[1].list = companyRows.map(r => r[1]);
    KPI_DATA[2].amount = "เฉลี่ย " + (validCount > 0 ? Math.round(totalCredit / validCount) : 0) + " วัน"; KPI_DATA[2].list = companyRows.map(r => r[2] + " วัน");
    KPI_DATA[3].amount = formatMoney(totalLimitRaw);      KPI_DATA[3].list = companyRows.map(r => formatMoney(parseNumber(r[3])));
    KPI_DATA[4].amount = formatMoney(totalUsedRaw);       KPI_DATA[4].list = companyRows.map(r => formatMoney(parseNumber(r[4])));
    KPI_DATA[5].amount = formatMoney(totalRemainingRaw);  KPI_DATA[5].list = companyRows.map(r => formatMoney(parseNumber(r[5])));

    const usableCreditEl = document.getElementById('usable-credit-amount');
    if (usableCreditEl) {
        const usableCredit = totalRemainingRaw - totalUsedRaw;
        usableCreditEl.textContent = formatMoney(usableCredit);
        usableCreditEl.className = usableCredit < 0 ? 'text-2xl font-black text-rose-600' : 'text-2xl font-black text-slate-800';
    }

    renderKPIs(KPI_DATA);

    companyRows.forEach(row => {
        const norm = normalizeName(row[0]);
        if (norm) SUMMARY_MAP[norm] = { originalName: row[0], limit: parseNumber(row[3]) };
    });

    if (details && details.data) {
        RAW_DATA1 = details.data;
        DATA1_COL.debtor = findColumnIndex(details.headers, ['ลูกหนี้', 'ลูกค้า', 'บริษัท'], 8);
        
        const buildInitial = (col) => {
            const map = {};
            Object.keys(SUMMARY_MAP).forEach(k => map[k] = { name: SUMMARY_MAP[k].originalName, limit: SUMMARY_MAP[k].limit, used: 0, remain: 0 });
            RAW_DATA1.forEach((row, idx) => {
                if (idx === 0 || !row[DATA1_COL.debtor]) return;
                const norm = normalizeName(row[DATA1_COL.debtor]);
                if (map[norm]) {
                    map[norm].used += parseNumber(row[DATA1_COL.used]);
                    map[norm].remain += parseNumber(row[DATA1_COL.remain]);
                }
            });
            return Object.values(map);
        };

        INITIAL_CHART_DATA.chart1 = buildInitial(DATA1_COL.date);
        INITIAL_CHART_DATA.chart2 = buildInitial(DATA1_COL.dueDate);

        updateChart1(INITIAL_CHART_DATA.chart1);
        updateChart2(INITIAL_CHART_DATA.chart2);
        populateFilters(RAW_DATA1);
    }

    renderTable(companyRows.map(r => ({
        col1: r[0], col2: r[1], col3: r[2],
        col4: formatMoney(parseNumber(r[3])), col5: formatMoney(parseNumber(r[4])), col6: formatMoney(parseNumber(r[5]))
    })));
}

function renderKPIs(data) {
    const container = document.getElementById('kpi-container'); if (!container) return;
    container.innerHTML = data.map(kpi => `
        <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
            <div class="flex items-center space-x-2">
                <div class="p-2 rounded-lg ${kpi.bg || 'bg-slate-50'} ${kpi.color}"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg></div>
                <h3 class="text-slate-500 font-bold text-sm uppercase truncate">${kpi.title}</h3>
            </div>
            <p class="text-xl font-black text-slate-800 mt-3">${kpi.amount}</p>
            <div class="mt-4 border-t border-slate-100 pt-3 space-y-1.5">
                ${(kpi.list || []).map(item => `<div class="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1.5 rounded border-l-2 ${kpi.color.replace('text-', 'border-')} truncate" title="${item}">${item}</div>`).join('')}
            </div>
        </div>
    `).join('');
}

function populateFilters(data) {
    const m1Set = new Set(), y1Set = new Set();
    const d2Set = new Set(), m2Set = new Set(), y2Set = new Set();
    data.forEach((row, idx) => {
        const p1 = parseDateParts(row[DATA1_COL.date]); if (p1.m && p1.y) { m1Set.add(p1.m); y1Set.add(p1.y); }
        const p2 = parseDateParts(row[DATA1_COL.dueDate]); if (p2.d && p2.m && p2.y) { d2Set.add(p2.d); m2Set.add(p2.m); y2Set.add(p2.y); }
    });

    const fill = (id, set, handler) => {
        const el = document.getElementById(id); if (!el) return;
        const first = el.options[0]; el.innerHTML = ''; el.appendChild(first);
        Array.from(set).sort().forEach(v => { const opt = document.createElement('option'); opt.value = v; opt.textContent = v; el.appendChild(opt); });
        el.addEventListener('change', handler);
    };

    fill('f1-month', m1Set, applyFilter1); fill('f1-year', y1Set, applyFilter1);
    fill('f2-day', d2Set, applyFilter2); fill('f2-month', m2Set, applyFilter2); fill('f2-year', y2Set, applyFilter2);
}

function applyFilter1() {
    const m = document.getElementById('f1-month').value;
    const y = document.getElementById('f1-year').value;
    if (!m && !y) { updateChart1(INITIAL_CHART_DATA.chart1); return; }
    
    const map = {};
    Object.keys(SUMMARY_MAP).forEach(k => map[k] = { name: SUMMARY_MAP[k].originalName, limit: SUMMARY_MAP[k].limit, used: 0 });
    RAW_DATA1.forEach((row, idx) => {
        if (idx === 0) return;
        const p = parseDateParts(row[DATA1_COL.date]);
        if ((!m || p.m === m.padStart(2, '0')) && (!y || p.y === y)) {
            const norm = normalizeName(row[DATA1_COL.debtor]);
            if (map[norm]) map[norm].used += parseNumber(row[DATA1_COL.used]);
        }
    });
    updateChart1(Object.values(map).filter(c => c.used > 0));
}

function applyFilter2() {
    const d = document.getElementById('f2-day').value;
    const m = document.getElementById('f2-month').value;
    const y = document.getElementById('f2-year').value;
    if (!d && !m && !y) { updateChart2(INITIAL_CHART_DATA.chart2); return; }
    
    const map = {};
    Object.keys(SUMMARY_MAP).forEach(k => map[k] = { name: SUMMARY_MAP[k].originalName, used: 0, remain: 0 });
    RAW_DATA1.forEach((row, idx) => {
        if (idx === 0) return;
        const p = parseDateParts(row[DATA1_COL.dueDate]);
        if ((!d || p.d === d.padStart(2, '0')) && (!m || p.m === m.padStart(2, '0')) && (!y || p.y === y)) {
            const norm = normalizeName(row[DATA1_COL.debtor]);
            if (map[norm]) {
                map[norm].used += parseNumber(row[DATA1_COL.used]);
                map[norm].remain += parseNumber(row[DATA1_COL.remain]);
            }
        }
    });
    updateChart2(Object.values(map).filter(c => c.used > 0 || c.remain > 0));
}

let c1Inst = null, c2Inst = null;
const commonOptions = {
    responsive: true, maintainAspectRatio: false,
    layout: {
        padding: {
            top: 30 // เพิ่มพื้นที่ด้านบนสุดของพื้นที่กราฟ
        }
    },
    plugins: { 
        legend: { position: 'top' },
        datalabels: { 
            anchor: 'end',
            align: 'top',
            offset: 4,
            color: '#475569',
            font: { weight: 'bold', size: 11 }, 
            formatter: v => v > 0 ? (v/1000000).toFixed(1) + 'M' : '' 
        }
    },
    scales: { 
        y: { 
            beginAtZero: true, 
            grace: '15%', // เพิ่มพื้นที่ว่างด้านบน 15% ของค่าสูงสุดโดยอัตโนมัติ
            ticks: { callback: v => '฿' + (v/1000000) + 'M' } 
        } 
    }
};

function updateChart1(data) {
    if (c1Inst) c1Inst.destroy();
    c1Inst = new Chart(document.getElementById('comparisonChart'), {
        type: 'bar',
        data: {
            labels: data.map(x => x.name),
            datasets: [
                { label: 'วงเงิน', data: data.map(x => x.limit), backgroundColor: '#6366f1' },
                { label: 'ยอดเบิก', data: data.map(x => x.used), backgroundColor: '#f43f5e' }
            ]
        },
        options: commonOptions
    });
}

function updateChart2(data) {
    if (c2Inst) c2Inst.destroy();
    c2Inst = new Chart(document.getElementById('trendChart'), {
        type: 'bar',
        data: {
            labels: data.map(x => x.name),
            datasets: [
                { label: 'ยอดเบิก', data: data.map(x => x.used), backgroundColor: '#f43f5e' },
                { label: 'วงเงินคงเหลือ', data: data.map(x => x.remain), backgroundColor: '#10b981' }
            ]
        },
        options: commonOptions
    });
}

function renderTable(data) {
    const body = document.getElementById('table-body'); if (!body) return;
    body.innerHTML = data.map(r => `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <td class="p-4 font-medium text-slate-800">${r.col1}</td>
            <td class="p-4 text-slate-600">${r.col2}</td>
            <td class="p-4 text-right text-slate-600">${r.col3}</td>
            <td class="p-4 text-right text-slate-600">${r.col4}</td>
            <td class="p-4 text-right text-slate-600">${r.col5}</td>
            <td class="p-4 text-right text-slate-600 font-medium text-amber-600">${r.col6}</td>
        </tr>
    `).join('');
}