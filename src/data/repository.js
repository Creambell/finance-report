import { defaultState } from '../domain/finance.js';
export const STORAGE_KEY = 'lifeplan-personal-v2';
const clone = value => JSON.parse(JSON.stringify(value));
const collections = new Set(['assets', 'expenses', 'goals']);
export function validateState(value) {
  if (!value || value.version !== 2 || typeof value.profile !== 'object' || !value.assumptions) throw new Error('지원하는 리포트 백업 파일이 아닙니다.');
  const result = clone(defaultState);
  for (const key of Object.keys(result.profile)) {
    const v = value.profile[key];
    if (key === 'name') { if (typeof v !== 'string' || v.length > 40) throw new Error('이름 형식을 확인하세요.'); result.profile[key] = v; }
    else { if (v !== '' && (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1e9)) throw new Error('입력된 숫자를 확인하세요.'); result.profile[key] = v; }
  }
  if (result.profile.age !== '' && (!Number.isInteger(result.profile.age) || result.profile.age < 18 || result.profile.age > 99)) throw new Error('현재 나이는 18~99세로 입력하세요.');
  if (!Number.isInteger(result.profile.retirementAge) || result.profile.retirementAge < 18 || result.profile.retirementAge > 100) throw new Error('은퇴 나이를 확인하세요.');
  const ranges = {returnRate: [0, 15], inflationRate: [0, 10], salaryGrowth: [0, 10], retirementSpend: [0, 150]};
  for (const [key, [min,max]] of Object.entries(ranges)) { const v = value.assumptions[key]; if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new Error('계산 가정 범위를 확인하세요.'); result.assumptions[key] = v; }
  for (const key of collections) {
    if (!Array.isArray(value[key]) || value[key].length > 500) throw new Error('항목 목록을 확인하세요.');
    const ids = new Set();
    result[key] = value[key].map(item => {
      if (!item || typeof item.id !== 'string' || ids.has(item.id) || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 80 || typeof item.amount !== 'number' || !Number.isFinite(item.amount) || item.amount < 0 || item.amount > 1e9) throw new Error('항목의 이름과 금액을 확인하세요.');
      ids.add(item.id);
      const r = { id:item.id, name:item.name, amount:item.amount };
      if (key === 'assets') { if (!['financial','home','other','debt'].includes(item.category)) throw new Error('자산 분류를 확인하세요.'); r.category = item.category; }
      if (key === 'expenses') { if (!['monthly','annual'].includes(item.period)) throw new Error('지출 주기를 확인하세요.'); r.period = item.period; }
      if (key === 'goals') { if (!Number.isInteger(item.age) || item.age < 18 || item.age > 100) throw new Error('목표 나이를 확인하세요.'); r.age = item.age; }
      return r;
    });
  }
  return result;
}
export function readReport(storage = localStorage) {
  try { const raw = storage.getItem(STORAGE_KEY); return { state: raw ? validateState(JSON.parse(raw)) : clone(defaultState), error: null }; }
  catch { return { state: clone(defaultState), error: '저장된 정보를 읽지 못했습니다. 백업 파일을 불러오거나 새로 입력하세요.' }; }
}
export function writeReport(state, storage = localStorage) { try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return null; } catch { return '이 브라우저에서 저장할 수 없습니다. JSON 백업으로 보관하세요.'; } }
export function reduceReport(state, action) {
  if (action.type === 'REPLACE') return validateState(action.value);
  if (action.type === 'RESET') return clone(defaultState);
  if (action.type === 'PROFILE') return { ...state, profile:{...state.profile,...action.value} };
  if (action.type === 'ASSUMPTIONS') return { ...state, assumptions:{...state.assumptions,...action.value} };
  if (!collections.has(action.collection)) return state;
  const items = state[action.collection];
  if (action.type === 'CREATE') return { ...state, [action.collection]:[...items, action.value] };
  if (action.type === 'UPDATE') return { ...state, [action.collection]:items.map(item => item.id === action.value.id ? action.value : item) };
  if (action.type === 'DELETE') return { ...state, [action.collection]:items.filter(item => item.id !== action.id) };
  return state;
}
