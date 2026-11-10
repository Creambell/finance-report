export const defaultState = { version: 2, profile: { name: '', age: '', annualSalary: '', monthlySalary: '', annualBonus: '', retirementAge: 65, pension: '' }, assumptions: { returnRate: 3, inflationRate: 2, salaryGrowth: 2, retirementSpend: 75 }, assets: [], expenses: [], goals: [] };
export const numeric = value => Number.isFinite(Number(value)) ? Number(value) : 0;
export const money = value => { const n = Math.round(Math.abs(numeric(value))); return `${value < 0 ? '−' : ''}${n >= 10000 ? `${Math.floor(n / 10000).toLocaleString('ko-KR')}억${n % 10000 ? ' ' + (n % 10000).toLocaleString('ko-KR') + '만원' : '원'}` : n.toLocaleString('ko-KR') + '만원'}`; };
export function summary(state) {
  const p = state.profile;
  const hasMonthly = p.monthlySalary !== '' && p.monthlySalary !== null;
  const monthlyIncome = hasMonthly ? numeric(p.monthlySalary) : numeric(p.annualSalary) / 12;
  const annualIncome = monthlyIncome * 12 + numeric(p.annualBonus);
  const annualExpense = state.expenses.reduce((sum, item) => sum + numeric(item.amount) * (item.period === 'monthly' ? 12 : 1), 0);
  const assetTotal = state.assets.filter(item => item.category !== 'debt').reduce((sum, item) => sum + numeric(item.amount), 0);
  const debt = state.assets.filter(item => item.category === 'debt').reduce((sum, item) => sum + numeric(item.amount), 0);
  const financial = state.assets.filter(item => item.category === 'financial').reduce((sum, item) => sum + numeric(item.amount), 0);
  const netWorth = assetTotal - debt;
  const surplus = annualIncome - annualExpense;
  return { monthlyIncome, annualIncome, annualExpense, monthlyExpense: annualExpense / 12, surplus, monthlySurplus: surplus / 12, savingRate: annualIncome > 0 ? surplus / annualIncome * 100 : 0, assetTotal, debt, financial, netWorth, liquid: financial - debt, hasMonthly, hasIncome: p.monthlySalary !== '' || p.annualSalary !== '', ready: numeric(p.age) >= 18 && numeric(p.age) <= 99 && (p.monthlySalary !== '' || p.annualSalary !== '') };
}
export function goalPlan(goal, state, totals = summary(state)) {
  const years = Math.max(0, numeric(goal.age) - numeric(state.profile.age));
  const target = numeric(goal.amount) * Math.pow(1 + numeric(state.assumptions.inflationRate) / 100, years);
  const months = years * 12;
  const r = years <= 3 ? 0 : numeric(state.assumptions.returnRate) / 1200;
  const requiredMonthly = months === 0 ? target : r === 0 ? target / months : target * r / (Math.pow(1 + r, months) - 1);
  return { ...goal, years, target, requiredMonthly, overdue: numeric(goal.age) < numeric(state.profile.age), availableMonthly: Math.max(0, totals.monthlySurplus) };
}
export function project(state, adjustment = {}) {
  const t = summary(state);
  const age = numeric(state.profile.age);
  if (!t.ready) return [];
  const retirementAge = numeric(adjustment.retirementAge ?? state.profile.retirementAge);
  const rate = numeric(adjustment.returnRate ?? state.assumptions.returnRate) / 100;
  const inflation = numeric(state.assumptions.inflationRate) / 100;
  const growth = numeric(state.assumptions.salaryGrowth) / 100;
  const cut = numeric(adjustment.expenseCut) / 100;
  const extra = numeric(adjustment.extraSaving) * 12;
  let assets = t.liquid;
  const points = [];
  for (let a = age; a <= 100; a++) {
    const year = a - age;
    let income = 0, expense = 0;
    if (year > 0) {
      income = a < retirementAge ? (t.annualIncome + extra) * Math.pow(1 + growth, year) : numeric(state.profile.pension) * 12;
      expense = t.annualExpense * (1 - cut) * Math.pow(1 + inflation, year) * (a >= retirementAge ? numeric(state.assumptions.retirementSpend) / 100 : 1);
      assets += Math.max(0, assets) * rate + income - expense;
    }
    const events = state.goals.filter(g => numeric(g.age) === a);
    const eventCost = events.reduce((sum, g) => sum + numeric(g.amount) * Math.pow(1 + inflation, year), 0);
    assets -= eventCost;
    points.push({ age: a, assets, income, expense, eventCost, events: events.map(g => g.name) });
  }
  return points;
}
export function projectionMetrics(points, retirementAge) {
  if (!points.length) return { retirement: null, depletion: null, minimum: null };
  const retired = points.filter(p => p.age >= numeric(retirementAge));
  const atRetirement = points.find(p => p.age >= numeric(retirementAge));
  const depletion = retired.find(p => p.assets < 0);
  return { retirement: atRetirement?.assets ?? null, depletion: depletion?.age ?? null, minimum: Math.min(...points.map(p => p.assets)) };
}
