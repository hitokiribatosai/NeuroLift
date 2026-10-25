import { useCopy } from '../../hooks/useCopy';
import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { useLanguage } from '../../contexts/LanguageContext';
import { safeStorage } from '../../utils/storage';
import { usePersistenceAction } from '../../hooks/usePersistenceAction';

const durations = [60, 90, 120, 180, 300];
export function RestDurationPicker() {
  const persist = usePersistenceAction();
  const { t, language } = useLanguage();
  const c = useCopy();
  const [open, setOpen] = useState(false);
  const [seconds, setSeconds] = useState(() => {
    const saved = Number(safeStorage.getItem('neuroLift_rest_seconds'));
    return durations.includes(saved) ? saved : 120;
  });
  const duration = (value: number) => `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
  return <>
    <button type="button" className="web-rest-picker-trigger" aria-haspopup="dialog" onClick={() => setOpen(true)}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="13" r="8" /><path d="M9 2h6M12 9v4l2 2" /></svg>
      <span>{t('tracker_rest_between_sets')}</span><strong>{duration(seconds)}</strong><span aria-hidden="true">⌄</span>
    </button>
    <Modal isOpen={open} onClose={() => setOpen(false)} label={t('tracker_rest_between_sets')}>
      <div className="web-rest-picker">
        <header><span className="web-eyebrow">{c('recovery')}</span><h2>{t('tracker_rest_between_sets')}</h2><p>{c('choose_your_default_rest_after_each_set')}</p></header>
        <div className="web-rest-options" role="group" aria-label={t('tracker_rest_between_sets')}>
          {durations.map(value => <button type="button" key={value} aria-pressed={seconds === value}
            onClick={() => persist(async () => { await safeStorage.setItem('neuroLift_rest_seconds', String(value)); setSeconds(value); setOpen(false); })}>
            <strong>{duration(value)}</strong><span>{value} {c('seconds')}</span><span className="web-rest-check" aria-hidden="true">{seconds === value ? '✓' : ''}</span>
          </button>)}
        </div>
        <button type="button" className="web-secondary" onClick={() => setOpen(false)}>{t('modal_close')}</button>
      </div>
    </Modal>
  </>;
}
