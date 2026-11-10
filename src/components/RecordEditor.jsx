import React, { useEffect, useRef } from 'react';
const labels = { assets:'자산·부채', expenses:'지출', goals:'인생 목표' };
export default function RecordEditor({ editor, onSave, onClose }) {
  const dialog = useRef(null);
  useEffect(() => { if (editor) dialog.current?.showModal(); }, [editor]);
  if (!editor) return null;
  const item = editor.item;
  function submit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name')).trim();
    if (!name) { e.currentTarget.elements.name.setCustomValidity('항목 이름을 입력하세요.'); e.currentTarget.reportValidity(); return; }
    const value = { id: item?.id || crypto.randomUUID(), name, amount: Number(form.get('amount')) };
    if (editor.collection === 'assets') value.category = form.get('category');
    if (editor.collection === 'expenses') value.period = form.get('period');
    if (editor.collection === 'goals') value.age = Number(form.get('age'));
    onSave(value);
  }
  return <dialog ref={dialog} className="record-dialog" onCancel={onClose} onClick={e => { if(e.target===e.currentTarget)onClose(); }}><form onSubmit={submit}><div className="section-head"><div><span className="eyebrow">MY FINANCE</span><h2>{labels[editor.collection]} {item ? '수정' : '추가'}</h2></div><button type="button" onClick={onClose} aria-label="닫기">✕</button></div><label className="field">항목 이름<input name="name" defaultValue={item?.name || ''} required maxLength="80" placeholder={editor.collection==='assets'?'예: 주거래 통장':editor.collection==='expenses'?'예: 월세 · 식비':'예: 내 집 마련'} autoFocus onChange={e=>e.target.setCustomValidity('')}/></label>{editor.collection==='assets' && <label className="field">분류<select name="category" defaultValue={item?.category || 'financial'}><option value="financial">금융자산 · 현금, 예금, 투자, 연금</option><option value="home">부동산 · 주택, 보증금</option><option value="other">기타 자산 · 자동차 등</option><option value="debt">부채 · 대출 잔액</option></select></label>}{editor.collection==='expenses' && <label className="field">반복 주기<select name="period" defaultValue={item?.period || 'monthly'}><option value="monthly">매월</option><option value="annual">매년 · 명절, 여행 등</option></select></label>}<label className="field">{editor.collection==='goals'?'목표 금액 · 현재 가치':'금액'}<div className="input-unit"><input name="amount" type="number" min="0" max="1000000000" step="0.1" defaultValue={item?.amount ?? ''} required/><span>만원</span></div></label>{editor.collection==='goals' && <label className="field">목표를 이루고 싶은 나이<div className="input-unit"><input name="age" type="number" min={editor.currentAge || 18} max="100" step="1" required defaultValue={item?.age ?? Math.min(100,(editor.currentAge || 30)+5)}/><span>세</span></div></label>}<p className="muted">{editor.collection==='goals'?'목표 금액은 물가상승을 반영해 해당 나이에 한 번 지출하는 것으로 계산합니다.':'입력하는 금액 단위는 만원입니다. 변경 즉시 리포트에 반영됩니다.'}</p><button type="submit" className="btn primary full">{item?'수정 저장':'항목 추가'}</button></form></dialog>;
}
