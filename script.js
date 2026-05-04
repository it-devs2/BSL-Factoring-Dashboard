// --- Mock Data จาก Google Sheets ภาพล่าสุด ---
const MOCK_MONTHLY_DATA = [
    { name: 'ปูน(ท่าหลวง)', purchase: 20, payment: 12.7, outstanding: 7.2 },
    { name: 'ปูน(ท่าหลวง)ขายหิน', purchase: 30, payment: 26.1, outstanding: 3.8 },
    { name: 'ปูน(ทุ่งสง)', purchase: 45, payment: 43.5, outstanding: 1.4 },
    { name: 'ปูนซีเมนต์เอเซีย', purchase: 10, payment: 8.1, outstanding: 1.8 },
    { name: 'ศิลาสานนท์', purchase: 85, payment: 80.5, outstanding: 4.4 },
    { name: 'ปูน(ลำปาง)', purchase: 30, payment: 17.5, outstanding: 12.4 }
];

const MOCK_PIE_DATA = {
    labels: ['ปูน(ท่าหลวง)', 'ปูน(ทุ่งสง)', 'ปูนซีเมนต์เอเซีย', 'ศิลาสานนท์', 'ปูน(ลำปาง)'],
    data: [20, 45, 10, 85, 30]
};

const MOCK_TABLE_DATA = [
    { col1: 'ปูนซิเมนต์ไทย(ท่าหลวง)', col2: 'งานเหมือง', col3: '90', col4: '20,000,000.00', col5: '12,731,893.99', col6: '7,268,106.01' },
    { col1: 'ปูนซิเมนต์ไทย(ท่าหลวง)-ขายหิน', col2: 'ขายหินอัลคาไลน์', col3: '60', col4: '30,000,000.00', col5: '26,189,690.99', col6: '3,810,309.02' },
    { col1: 'ปูนซิเมนต์ไทย(ทุ่งสง)', col2: 'งานเหมือง /เช่าแบ็คโฮ/ขนหิน...', col3: '60', col4: '45,000,000.00', col5: '43,544,451.51', col6: '1,455,548.49' },
    { col1: 'ปูนซีเมนต์เอเซีย', col2: 'งานเหมือง', col3: '105', col4: '10,000,000.00', col5: '8,122,103.88', col6: '1,877,896.12' },
    { col1: 'ศิลาสานนท์', col2: 'เช่าเครื่องจักร/โมบาย - ขนส่ง...', col3: '120', col4: '85,000,000.00', col5: '80,585,796.44', col6: '4,414,203.56' },
    { col1: 'ปูนซิเมนต์ไทย (ลำปาง)', col2: 'งานเหมือง', col3: '90', col4: '30,000,000.00', col5: '17,570,174.00', col6: '12,429,826.00' },
    { col1: 'ซีแพคคอนสตรัคชั่น', col2: 'งานเหมือง', col3: '105', col4: '5,000,000.00', col5: '0.00', col6: '5,000,000.00' },
    { col1: 'มินเนอรัล', col2: 'งานเหมือง', col3: '90', col4: '20,000,000.00', col5: '0.00', col6: '20,000,000.00' }
];

let RAW_DATA1 = []; // ตัวแปรเก็บข้อมูลดิบจาก Data1 ไว้สำหรับการ Filter
let SUMMARY_MAP = {}; // เก็บข้อมูลวงเงินจากชีตชื่อลูกหนี้ไว้เทียบ
let INITIAL_CHART_DATA = []; // เก็บข้อมูลกราฟชุดแรกสุด (สรุปผล) ไว้คืนค่าตอนเลือก "ทั้งหมด"

// KPI 6 กล่อง ให้ตรงกับ 6 คอลัมน์
const KPI_DATA = [
    { title: "ชื่อบริษัท", amount: "7 บริษัท", trend: "", trendUp: true, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "รายละเอียดงาน", amount: "8 งาน", trend: "", trendUp: true, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "เครดิต", amount: "90 วัน", trend: "", trendUp: true, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "วงเงินแต่ละหน้างาน", amount: "฿245M", trend: "", trendUp: true, color: "text-blue-600", bg: "bg-blue-50" },
    { title: "วงเงินที่ใช้ไป", amount: "฿188.7M", trend: "", trendUp: true, color: "text-purple-600", bg: "bg-purple-50" },
    { title: "วงเงินคงเหลือ", amount: "฿150M", trend: "", trendUp: true, color: "text-rose-600", bg: "bg-rose-50" }
];

// ใส่ลิงก์ URL ที่ได้จากการ Deploy Web App ของ Google Apps Script ที่นี่
const API_URL = "https://script.google.com/macros/s/AKfycby2-H9fuh0eGdD0OurjJeqGOuo343puWMmcHERVz787V_hVZo1_Wv8HXLKfI7HC8BrJ/exec";

// --- Initialize Functions ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. ถ้าไม่ได้ใส่ API URL ให้แสดง Mock Data ไปก่อน
    if (API_URL === "ใส่ URL ของคุณที่นี่" || API_URL === "") {
        console.log("คุณยังไม่ได้ใส่ API URL กำลังใช้ข้อมูลจำลอง...");
        renderKPIs(KPI_DATA);
        renderCharts(MOCK_MONTHLY_DATA, MOCK_PIE_DATA);
        renderTable(MOCK_TABLE_DATA);
        return;
    }

    // 2. ถ้าใส่ API URL แล้ว ให้ดึงข้อมูลจาก Google Sheets เลย
    console.log("กำลังดึงข้อมูลจาก Google Sheets ผ่าน API...");

    // ตั้งค่ากล่องให้ขึ้นคำว่า "กำลังโหลด..." เพื่อให้ผู้ใช้รู้ว่ากำลังทำงาน
    const loadingKPIs = KPI_DATA.map(k => ({ ...k, amount: "กำลังโหลด..." }));
    renderKPIs(loadingKPIs);

    fetch(API_URL, { redirect: "follow" })
        .then(response => response.json())
        .then(response => {
            if (response.status === 'success') {
                console.log("ดึงข้อมูลสำเร็จ!", response);
                processRealData(response.summary, response.details);
            } else {
                console.error("ข้อผิดพลาดจากเซิร์ฟเวอร์:", response.message);
                alert("เกิดข้อผิดพลาด: " + response.message);
            }
        })
        .catch(error => {
            console.error("เชื่อมต่อ API ไม่สำเร็จ:", error);
            alert("เชื่อมต่อฐานข้อมูลไม่ได้ โปรดตรวจสอบ API URL");

            // สลับกลับไปแสดง Mock Data เผื่อมีข้อผิดพลาด
            renderKPIs(KPI_DATA);
            renderCharts(MOCK_MONTHLY_DATA, MOCK_PIE_DATA);
            renderTable(MOCK_TABLE_DATA);
        });
});

function processRealData(summary, details) {
    // 1. ดึงข้อมูล 6 กล่อง จากชีต "ชื่อลูกหนี้"
    // summary.headers = ข้อมูลแถว 1 (เช่น ตาราง1, ..., 245000000, 188744110.81, 150000000)
    // summary.data[0] = ชื่อหัวคอลัมน์ (เช่น ชื่อบริษัท, รายละเอียดงาน, ...)
    // summary.data[1..n] = ข้อมูลแต่ละบริษัท

    // กรองบรรทัดข้อมูลจริง (ตัดหัวคอลัมน์ออก และเอาเฉพาะบรรทัดที่มีชื่อบริษัท)
    const companyRows = summary.data.slice(1).filter(row => row[0] && row[0].toString().trim() !== "");
    
    const companyCount = companyRows.length;
    
    // คำนวณเครดิตเฉลี่ย
    let totalCredit = 0;
    let validCreditCount = 0;
    companyRows.forEach(row => {
        let credit = parseFloat(row[2]);
        if (!isNaN(credit)) {
            totalCredit += credit;
            validCreditCount++;
        }
    });
    const avgCredit = validCreditCount > 0 ? Math.round(totalCredit / validCreditCount) : 0;

    // ดึงยอดรวมจากบรรทัดที่ 1 ของ Sheet
    const totalLimitRaw = parseFloat(summary.headers[3]) || 0;
    const totalUsedRaw = parseFloat(summary.headers[4]) || 0;
    const totalRemainingRaw = parseFloat(summary.headers[5]) || 0;

    // ฟังก์ชันแปลงตัวเลขให้มีคอมม่าและทศนิยม 2 ตำแหน่ง
    const formatMoney = (num) => num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // เตรียม List รายละเอียดสำหรับโชว์ในแต่ละกล่อง (เอาตัวเลข 1. 2. ออกตามคำขอ)
    const companyList = companyRows.map(row => `${row[0]}`);
    const jobList = companyRows.map(row => `${row[1]}`);
    const creditList = companyRows.map(row => `${row[2]} วัน`);
    const limitList = companyRows.map(row => `${formatMoney(parseFloat(row[3])||0)}`);
    const usedList = companyRows.map(row => `${formatMoney(parseFloat(row[4])||0)}`);
    const remainList = companyRows.map(row => `${formatMoney(parseFloat(row[5])||0)}`);

    // อัปเดตข้อมูลกล่อง
    KPI_DATA[0].amount = "รวม " + companyCount + " บริษัท";
    KPI_DATA[0].list = companyList;

    KPI_DATA[1].amount = "รวม " + companyCount + " งาน";
    KPI_DATA[1].list = jobList;

    KPI_DATA[2].amount = "เฉลี่ย " + avgCredit + " วัน";
    KPI_DATA[2].list = creditList;

    KPI_DATA[3].amount = formatMoney(totalLimitRaw);
    KPI_DATA[3].list = limitList;

    KPI_DATA[4].amount = formatMoney(totalUsedRaw);
    KPI_DATA[4].list = usedList;

    KPI_DATA[5].amount = formatMoney(totalRemainingRaw);
    KPI_DATA[5].list = remainList;
    
    // คำนวณวงเงินที่ใช้ได้ (F - E) แถวบนสุด
    const usableCredit = totalRemainingRaw - totalUsedRaw;
    const usableCreditEl = document.getElementById('usable-credit-amount');
    if (usableCreditEl) {
        usableCreditEl.textContent = formatMoney(usableCredit);
        
        // ถ้าวงเงินติดลบ ให้เปลี่ยนสีเป็นสีแดงเพื่อเตือน
        if (usableCredit < 0) {
            usableCreditEl.classList.remove('text-slate-800');
            usableCreditEl.classList.add('text-rose-600');
        } else {
            usableCreditEl.classList.remove('text-rose-600');
            usableCreditEl.classList.add('text-slate-800');
        }
    }
    
    renderKPIs(KPI_DATA);

// ฟังก์ชันล้างชื่อบริษัท (ตัดช่องว่างออกทั้งหมด และทำเป็นพิมพ์เล็ก) เพื่อให้เปรียบเทียบกันได้เป๊ะ 100%
function normalizeName(name) {
    if (!name) return "";
    return name.toString().toLowerCase().replace(/\s+/g, "");
}

    // --- 2. อัปเดตกราฟ (Charts) จากตาราง ชื่อลูกหนี้ (8 บริษัทหลัก) ---
    // เก็บค่าวงเงินไว้ใช้ตอน Filter ด้วย
    companyRows.forEach(row => {
        const originalName = row[0] ? row[0].toString().trim() : "";
        if (originalName) {
            const normName = normalizeName(originalName);
            SUMMARY_MAP[normName] = {
                originalName: originalName,
                limit: parseNumber(row[3])
            };
        }
    });

    INITIAL_CHART_DATA = companyRows.map(row => ({
        name: row[0] ? row[0].toString().trim() : "",
        limit: parseNumber(row[3]),
        used: parseNumber(row[4]),
        remain: parseNumber(row[5])
    }));

    renderCharts(INITIAL_CHART_DATA);

    // เก็บข้อมูล Data1 ไว้สำหรับ Filter
    if (details && details.data) {
        RAW_DATA1 = details.data;
        populateFilters(RAW_DATA1);
    }

    // --- 3. อัปเดตตาราง (Table) ตามข้อมูลจริง ---
    const realTableData = companyRows.map(row => ({
        col1: row[0].toString(),
        col2: row[1].toString(),
        col3: row[2].toString(),
        col4: (parseFloat(row[3]) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
        col5: (parseFloat(row[4]) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
        col6: (parseFloat(row[5]) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })
    }));

    renderTable(realTableData);
}

function renderKPIs(data = KPI_DATA) {
    const container = document.getElementById('kpi-container');
    if (!container) return;

    let html = '';
    data.forEach(kpi => {
        // ดึงสีสำหรับแต่งขอบซ้ายของไฮไลต์ (เปลี่ยนจาก text-xxx-600 เป็น border-xxx-400)
        let borderColorClass = kpi.color ? kpi.color.replace('text-', 'border-').replace('600', '400') : 'border-slate-300';

        // สร้าง HTML สำหรับ List ถ่ายทอดรายละเอียด (ถ้ามี)
        let listHtml = '';
        if (kpi.list && kpi.list.length > 0) {
            listHtml = `
            <div class="mt-4 border-t border-slate-100 pt-3 space-y-1.5">
                ${kpi.list.map(item => `
                    <div class="text-[11px] leading-tight font-bold text-slate-800 bg-slate-50 px-2 py-2 rounded-lg border-l-4 ${borderColorClass} shadow-sm hover:bg-slate-100 transition-colors break-words" title="${item}">
                        ${item}
                    </div>
                `).join('')}
            </div>
            `;
        }

        html += `
        <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow overflow-hidden">
            <div class="flex items-center space-x-2">
                <div class="p-1.5 rounded-lg ${kpi.bg} ${kpi.color} shrink-0">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                    </svg>
                </div>
                <h3 class="text-slate-500 font-bold text-[10px] leading-tight uppercase truncate" title="${kpi.title}">${kpi.title}</h3>
            </div>
            <p class="text-lg font-black text-slate-800 mt-2 truncate" title="${kpi.amount}">${kpi.amount}</p>
            ${listHtml}
        </div>
        `;
    });
    container.innerHTML = html;
}

// --- ฟังก์ชันเกี่ยวกับการ Filter ---
function populateFilters(data) {
    const daySet = new Set();
    const monthSet = new Set();
    const yearSet = new Set();
    const debtorSet = new Set();

    data.forEach(row => {
        if (!row) return;
        
        // คอลัมน์ B (Index 1) คือวันที่
        if (row[1]) {
            const dateStr = row[1].toString();
            let d, m, y;

            // ตรวจสอบว่าเป็นรูปแบบ ISO (เช่น 2026-01-14...) หรือไม่
            if (dateStr.includes('-') && dateStr.includes('T')) {
                const dateObj = new Date(dateStr);
                if (!isNaN(dateObj)) {
                    d = dateObj.getDate().toString().padStart(2, '0');
                    m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                    y = dateObj.getFullYear().toString();
                }
            } else if (dateStr.includes('/')) {
                // รูปแบบ DD/MM/YYYY
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    d = parts[0].padStart(2, '0');
                    m = parts[1].padStart(2, '0');
                    y = parts[2];
                }
            }

            if (d && m && y) {
                daySet.add(d);
                monthSet.add(m);
                yearSet.add(y);
            }
        }
        
        // คอลัมน์ I (Index 8) คือ ลูกหนี้
        if (row[8] && row[8] !== "ลูกหนี้" && row[8] !== "") {
            debtorSet.add(row[8].toString());
        }
    });

    const populateSelect = (id, set) => {
        const select = document.getElementById(id);
        if (!select) return;
        
        // เก็บ option แรกไว้ (ทั้งหมด)
        const firstOption = select.options[0];
        select.innerHTML = '';
        select.appendChild(firstOption);
        
        // เรียงลำดับและเพิ่มเข้าไป
        Array.from(set).sort().forEach(val => {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val;
            select.appendChild(opt);
        });
    };

    populateSelect('filter-day', daySet);
    populateSelect('filter-month', monthSet);
    populateSelect('filter-year', yearSet);
    populateSelect('filter-debtor', debtorSet);
    
    // ผูก Event Listener
    ['filter-day', 'filter-month', 'filter-year', 'filter-debtor'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            // ป้องกันการ bind ซ้ำซ้อน
            el.removeEventListener('change', applyFilters);
            el.addEventListener('change', applyFilters);
        }
    });
}

// ฟังก์ชันช่วยแปลงค่าเป็นตัวเลข (รองรับกรณีมีเครื่องหมายคอมมา)
function parseNumber(val) {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === "number") return val;
    // ลบเครื่องหมายคอมมาออกก่อน parseFloat
    const cleaned = val.toString().replace(/,/g, "");
    return parseFloat(cleaned) || 0;
}

function applyFilters() {
    const day = document.getElementById('filter-day')?.value;
    const month = document.getElementById('filter-month')?.value;
    const year = document.getElementById('filter-year')?.value;
    const debtor = document.getElementById('filter-debtor')?.value;

    // --- จุดสำคัญ: ถ้าเลือก "ทั้งหมด" ทุกช่อง ให้เอากราฟสรุปผลตั้งต้นกลับมาแสดงทันที ---
    if (!day && !month && !year && !debtor) {
        renderCharts(INITIAL_CHART_DATA);
        return;
    }

    const filteredData = RAW_DATA1.filter(row => {
        if (!row) return false;
        
        let matchDay = true, matchMonth = true, matchYear = true, matchDebtor = true;
        
        if (day || month || year) {
            const dateStr = row[1] ? row[1].toString().trim() : '';
            let d = "", m = "", y = "";

            if (dateStr.includes('-') && dateStr.includes('T')) {
                // ต้องใช้ new Date() แบบเดียวกับตอนสร้าง Dropdown เพื่อป้องกันปัญหา Timezone (GMT)
                const dateObj = new Date(dateStr);
                if (!isNaN(dateObj)) {
                    d = dateObj.getDate().toString().padStart(2, '0');
                    m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
                    y = dateObj.getFullYear().toString();
                }
            } else if (dateStr.includes('/')) {
                // รองรับ DD/MM/YYYY
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    d = parts[0].padStart(2, '0');
                    m = parts[1].padStart(2, '0');
                    y = parts[2];
                }
            }

            // ตรวจสอบเงื่อนไขการกรอง (ถ้าไม่ได้เลือกค่านั้นๆ ให้ถือว่าผ่าน)
            if (day && d !== day.padStart(2, '0')) matchDay = false;
            if (month && m !== month.padStart(2, '0')) matchMonth = false;
            if (year && y !== year) matchYear = false;
            
            // ถ้าข้อมูลวันที่อ่านไม่ได้เลย แต่มีการสั่งกรอง ให้กรองออก
            if (!d && !m && !y && (day || month || year)) {
                matchDay = false;
            }
        }
        
        if (debtor) {
            const rowDebtor = row[8] ? row[8].toString() : '';
            if (rowDebtor !== debtor) matchDebtor = false;
        }
        
        return matchDay && matchMonth && matchYear && matchDebtor;
    });

    updateChartsWithData(filteredData);
}

function updateChartsWithData(dataList) {
    const companyMap = {};
    
    // ตั้งต้นด้วย 8 บริษัทหลักจาก SUMMARY_MAP
    Object.keys(SUMMARY_MAP).forEach(normKey => {
        companyMap[normKey] = { 
            name: SUMMARY_MAP[normKey].originalName, // เก็บชื่อดั้งเดิมไว้แสดงผล
            limit: SUMMARY_MAP[normKey].limit, 
            used: 0, 
            remain: 0 
        };
    });

    // นำข้อมูลที่กรองแล้วจาก Data1 มาบวกสะสม
    dataList.forEach(row => {
        if (!row || !row[8]) return;
        const normCompany = normalizeName(row[8]);
        
        // ถ้าเป็น 1 ใน 8 บริษัทหลัก
        if (companyMap[normCompany]) {
            // ใช้คอลัมน์ O (14) = ยอดรับซื้อ 90% และ Q (16) = ยอดคงเหลือ 10%
            const purchase90 = parseNumber(row[14]);
            const remain10 = parseNumber(row[16]);
            
            companyMap[normCompany].used += purchase90;
            companyMap[normCompany].remain += remain10;
        }
    });

    const chartData = Object.keys(companyMap).map(key => ({
        name: companyMap[key].name,
        limit: companyMap[key].limit,
        used: companyMap[key].used,
        remain: companyMap[key].remain
    }));

    renderCharts(chartData);
}

// เก็บ object กราฟไว้ เพื่อจะได้ลบ (destroy) ก่อนวาดใหม่ได้
let compChartInstance = null;
let trendChartInstance = null;

function renderCharts(companyData = []) {
    Chart.defaults.font.family = "'Prompt', sans-serif";
    Chart.defaults.color = '#64748b';

    // 1. กราฟเปรียบเทียบ วงเงิน VS ยอดที่ใช้ไป
    const ctxComp = document.getElementById('comparisonChart');
    if (ctxComp) {
        if (compChartInstance) compChartInstance.destroy();
        compChartInstance = new Chart(ctxComp.getContext('2d'), {
            type: 'bar',
            data: {
                labels: companyData.map(d => d.name),
                datasets: [
                    {
                        label: 'วงเงินแต่ละหน้างาน',
                        data: companyData.map(d => d.limit),
                        backgroundColor: '#6366f1', // indigo-500
                        borderRadius: 4
                    },
                    {
                        label: 'ยอดที่ใช้ไป',
                        data: companyData.map(d => d.used),
                        backgroundColor: '#f43f5e', // rose-500
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let value = context.raw || 0;
                                return context.dataset.label + ': ฿' + value.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return '฿' + (value / 1000000).toLocaleString() + 'M'; }
                        }
                    }
                }
            }
        });
    }

    // 2. กราฟเปรียบเทียบ ยอดที่ใช้ไป VS วงเงินคงเหลือ
    const ctxTrend = document.getElementById('trendChart');
    if (ctxTrend) {
        if (trendChartInstance) trendChartInstance.destroy();
        trendChartInstance = new Chart(ctxTrend.getContext('2d'), {
            type: 'bar',
            data: {
                labels: companyData.map(d => d.name),
                datasets: [
                    {
                        label: 'ยอดที่ใช้ไป',
                        data: companyData.map(d => d.used),
                        backgroundColor: '#f43f5e', // rose-500
                        borderRadius: 4
                    },
                    {
                        label: 'วงเงินคงเหลือ',
                        data: companyData.map(d => d.remain),
                        backgroundColor: '#10b981', // emerald-500
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let value = context.raw || 0;
                                return context.dataset.label + ': ฿' + value.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return '฿' + (value / 1000000).toLocaleString() + 'M'; }
                        }
                    }
                }
            }
        });
    }
}

function renderTable(tableData = MOCK_TABLE_DATA) {
    const tableHead = document.getElementById('table-head');
    const tableBody = document.getElementById('table-body');

    // Headers ตาม Sheet
    const columns = ['ชื่อบริษัท', 'รายละเอียดงาน', 'เครดิต', 'วงเงินแต่ละหน้างาน', 'วงเงินที่ใช้ไป', 'วงเงินคงเหลือ'];

    let headHtml = '';
    columns.forEach((col, index) => {
        headHtml += `<th class="p-4 ${index >= 2 ? 'text-right' : 'text-left'}">${col}</th>`;
    });
    if (tableHead) tableHead.innerHTML = headHtml;

    // Body
    let bodyHtml = '';
    tableData.forEach(row => {
        bodyHtml += `<tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">`;
        bodyHtml += `<td class="p-4 font-medium text-slate-800">${row.col1}</td>`;
        bodyHtml += `<td class="p-4 text-slate-600">${row.col2}</td>`;
        bodyHtml += `<td class="p-4 text-right text-slate-600">${row.col3}</td>`;
        bodyHtml += `<td class="p-4 text-right text-slate-600">${row.col4}</td>`;
        bodyHtml += `<td class="p-4 text-right text-slate-600">${row.col5}</td>`;
        bodyHtml += `<td class="p-4 text-right text-slate-600 font-medium text-amber-600">${row.col6}</td>`;
        bodyHtml += `</tr>`;
    });
    if (tableBody) tableBody.innerHTML = bodyHtml;
}
