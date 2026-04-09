const formatCurrency = (value, decimals = 0) =>
 new Intl.NumberFormat("en-GB", {
   style: "currency",
   currency: "GBP",
   minimumFractionDigits: decimals,
   maximumFractionDigits: decimals,
 }).format(value);

function calculateGrowth(initial, monthly, annualRate, years) {
 const monthlyRate = annualRate / 100 / 12;
 const totalMonths = years * 12;
 let balance = Number(initial);
 const data = [balance];

 for (let month = 1; month <= totalMonths; month++) {
   balance = balance * (1 + monthlyRate) + Number(monthly);
   if (month % 12 === 0) data.push(balance);
 }

 const contributions = Number(initial) + Number(monthly) * totalMonths;
 const growth = balance - contributions;

 return {
   finalValue: balance,
   contributions,
   growth,
   yearlyData: data,
 };
}

function drawChart(canvasId, data) {
 const canvas = document.getElementById(canvasId);
 if (!canvas || !data || data.length === 0) return;

 const parent = canvas.parentElement;
 const rect = parent.getBoundingClientRect();

 canvas.width = rect.width;
 canvas.height = 220;

 const ctx = canvas.getContext("2d");
 const width = canvas.width;
 const height = canvas.height;
 const padding = 20;

 ctx.clearRect(0, 0, width, height);

 const max = Math.max(...data, 1);
 const innerWidth = width - padding * 2;
 const innerHeight = height - padding * 2;

 ctx.strokeStyle = "#e2e8f0";
 ctx.lineWidth = 1;

 for (let i = 0; i <= 4; i++) {
   const y = padding + (innerHeight / 4) * i;
   ctx.beginPath();
   ctx.moveTo(padding, y);
   ctx.lineTo(width - padding, y);
   ctx.stroke();
 }

 ctx.strokeStyle = "#cbd5e1";
 ctx.beginPath();
 ctx.moveTo(padding, padding);
 ctx.lineTo(padding, height - padding);
 ctx.lineTo(width - padding, height - padding);
 ctx.stroke();

 const points = data.map((value, index) => {
   const x = padding + (index / Math.max(data.length - 1, 1)) * innerWidth;
   const y = height - padding - (value / max) * innerHeight;
   return { x, y };
 });

 ctx.beginPath();
 ctx.moveTo(points[0].x, height - padding);
 points.forEach((point) => ctx.lineTo(point.x, point.y));
 ctx.lineTo(points[points.length - 1].x, height - padding);
 ctx.closePath();
 ctx.fillStyle = "rgba(15, 118, 110, 0.12)";
 ctx.fill();

 ctx.beginPath();
 points.forEach((point, index) => {
   index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y);
 });
 ctx.strokeStyle = "#0f766e";
 ctx.lineWidth = 3;
 ctx.stroke();

 // ✅ FINAL POINT FIXED (inside function)
 const lastPoint = points[points.length - 1];
 ctx.beginPath();
 ctx.arc(lastPoint.x, lastPoint.y, 5, 0, Math.PI * 2);
 ctx.fillStyle = "#0f766e";
 ctx.fill();
}

function updateCalculator(prefix, mode = "growth") {
 const initial = parseFloat(document.getElementById(`${prefix}-initial`)?.value) || 0;
 const monthly = parseFloat(document.getElementById(`${prefix}-monthly`)?.value) || 0;
 const rate = parseFloat(document.getElementById(`${prefix}-rate`)?.value) || 0;
 const years = parseFloat(document.getElementById(`${prefix}-years`)?.value) || 0;

 const result = calculateGrowth(initial, monthly, rate, years);

 const finalEl = document.getElementById(`${prefix}-final`);
 const contrEl = document.getElementById(`${prefix}-contributions`);

 if (finalEl) finalEl.textContent = formatCurrency(result.finalValue);
 if (contrEl) contrEl.textContent = formatCurrency(result.contributions);

 if (mode === "millionaire") {
   const gapEl = document.getElementById(`${prefix}-gap`);
   const gap = Math.max(0, 1000000 - result.finalValue);
   if (gapEl) {
     gapEl.textContent =
       result.finalValue >= 1000000 ? "Target reached" : formatCurrency(gap);
   }
 } else {
   const growthEl = document.getElementById(`${prefix}-growth`);
   if (growthEl) growthEl.textContent = formatCurrency(result.growth);
 }

 drawChart(`${prefix}-chart`, result.yearlyData);
}

function initCalculatorPage(prefix, mode = "growth") {
 ["initial", "monthly", "rate", "years"].forEach((field) => {
   const input = document.getElementById(`${prefix}-${field}`);
   if (input) {
     input.addEventListener("input", () => updateCalculator(prefix, mode));
     input.addEventListener("change", () => updateCalculator(prefix, mode));
   }
 });

 document.querySelectorAll(`.example-btn[data-target="${prefix}"]`).forEach((btn) => {
   btn.addEventListener("click", () => {
     const initialEl = document.getElementById(`${prefix}-initial`);
     const monthlyEl = document.getElementById(`${prefix}-monthly`);
     const rateEl = document.getElementById(`${prefix}-rate`);
     const yearsEl = document.getElementById(`${prefix}-years`);
     if (initialEl) initialEl.value = btn.dataset.initial || 0;
     if (monthlyEl) monthlyEl.value = btn.dataset.monthly || 0;
     if (rateEl) rateEl.value = btn.dataset.rate || 8;
     if (yearsEl) yearsEl.value = btn.dataset.years || 10;
     updateCalculator(prefix, mode);
   });
 });

 updateCalculator(prefix, mode);
}

function calculateIsaGrowth() {
 const initialEl = document.getElementById("isa-initial");
 const monthlyEl = document.getElementById("isa-monthly");
 const rateEl = document.getElementById("isa-rate");
 const yearsEl = document.getElementById("isa-years");
 const taxEl = document.getElementById("isa-tax");
 const limitModeEl = document.getElementById("isa-limit-mode");
 const capMessageEl = document.getElementById("isa-cap-message");

 if (!initialEl || !monthlyEl || !rateEl || !yearsEl || !taxEl || !limitModeEl) return;

 const initial = parseFloat(initialEl.value) || 0;
 const enteredMonthly = parseFloat(monthlyEl.value) || 0;
 const annualRate = parseFloat(rateEl.value) || 0;
 const years = parseFloat(yearsEl.value) || 0;
 const taxRate = parseFloat(taxEl.value) || 0.2;
 const applyIsaCap = limitModeEl.value === "on";

 const monthlyCap = 20000 / 12;
 const effectiveMonthly = applyIsaCap
   ? Math.min(enteredMonthly, monthlyCap)
   : enteredMonthly;

 const monthlyRate = annualRate / 100 / 12;
 const totalMonths = years * 12;

 let balance = initial;
 let contributions = initial;
 const yearlyData = [balance];

 for (let month = 1; month <= totalMonths; month++) {
   balance = balance * (1 + monthlyRate) + effectiveMonthly;
   contributions += effectiveMonthly;
   if (month % 12 === 0) yearlyData.push(balance);
 }

 const growth = balance - contributions;
 const taxSaved = Math.max(0, growth) * taxRate;

 const resultEl = document.getElementById("isa-result");
 const contributionsEl = document.getElementById("isa-contributions");
 const growthEl = document.getElementById("isa-growth");
 const taxSavedEl = document.getElementById("isa-tax-saved");

 if (resultEl) resultEl.textContent = formatCurrency(balance);
 if (contributionsEl) contributionsEl.textContent = formatCurrency(contributions);
 if (growthEl) growthEl.textContent = formatCurrency(growth);
 if (taxSavedEl) taxSavedEl.textContent = formatCurrency(taxSaved);

 drawChart("isa-chart", yearlyData);
}

function initIsaCalculator() {
 ["isa-initial","isa-monthly","isa-rate","isa-years","isa-tax","isa-limit-mode"].forEach((id) => {
   const el = document.getElementById(id);
   if (el) {
     el.addEventListener("input", calculateIsaGrowth);
     el.addEventListener("change", calculateIsaGrowth);
   }
 });

 calculateIsaGrowth();
}

initCalculatorPage("compound");
initIsaCalculator();

function updateFIRE() {
 const savings = parseFloat(document.getElementById("savings").value) || 0;
 const monthly = parseFloat(document.getElementById("monthly").value) || 0;
 const expenses = parseFloat(document.getElementById("expenses").value) || 0;
 const rate = (parseFloat(document.getElementById("rate").value) || 0) / 100;
 const withdrawalRate = (parseFloat(document.getElementById("withdrawal-rate").value) || 4) / 100;
 const currentAge = parseFloat(document.getElementById("current-age").value) || 30;
 const targetAge = parseFloat(document.getElementById("target-age").value) || 55;

 const yearsAvailable = targetAge - currentAge;
 if (withdrawalRate <= 0 || yearsAvailable <= 0) return;

 const fireNumber = expenses / withdrawalRate;

 let total = savings;
 let years = 0;
 const history = [total];

 while (total < fireNumber && years < 100) {
   total = total * (1 + rate) + monthly * 12;
   years++;
   history.push(total);
 }

 const canvas = document.getElementById("fire-chart");
 const ctx = canvas.getContext("2d");

 ctx.clearRect(0, 0, canvas.width, canvas.height);

 const maxVal = Math.max(...history, fireNumber);

 ctx.beginPath();
 history.forEach((val, i) => {
   const x = (i / Math.max(history.length - 1, 1)) * canvas.width;
   const y = canvas.height - (val / maxVal) * (canvas.height - 10);
   i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
 });

 ctx.strokeStyle = "#0f766e";
 ctx.stroke();
}

window.addEventListener("load", updateFIRE);

function toggleMenu() {
 const menu = document.querySelector(".nav-links");
 if (menu) menu.classList.toggle("active");
}

window.addEventListener("resize", () => {
 updateCalculator("compound");
 calculateIsaGrowth();
 updateFIRE();
});