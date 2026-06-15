import { useState, useEffect } from 'react';
import { getPanchangam } from '../services/panchangamAPI';
import { PANCHANGAM_DICTIONARY, PANCHANGAM_ICONS, PANCHANGAM_FIELDS, FIELD_LABELS, translate } from '../data/panchangamDictionary';

const FALLBACK_MSG = '⚠️ Panchangam temporarily unavailable';

const weekdayToIndex = {
  sunday: '1', monday: '2', tuesday: '3', wednesday: '4',
  thursday: '5', friday: '6', saturday: '7',
};

const masaNameToIndex = {
  chaitra: '1', vaisakha: '2', vaishakha: '2', jyeshtha: '3',
  ashadha: '4', shravana: '5', bhadrapada: '6', ashvina: '7',
  kartika: '8', margashirsha: '9', pausha: '10', magha: '11', phalguna: '12',
};

const nameOverrides = {
  karana: { taitula: '4' },
  nakshatra: {
    uttarabhadra: '26', purvabhadra: '25', uttaraphalguni: '12',
    purvaphalguni: '11', purvaashadha: '20', uttaraashadha: '21',
    mrigashira: '5', mrigasira: '5', punarvasu: '7', shatabhisha: '24',
  },
};

function getSanskrit(field, name, idx) {
  if (idx && idx !== '') {
    const t = translate(field, idx, 'sa');
    if (t && t !== idx) return t;
  }
  if (!name) return '';
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const override = nameOverrides[field]?.[clean];
  if (override) {
    const t = translate(field, override, 'sa');
    if (t) return t;
  }
  if (field === 'vara' && weekdayToIndex[clean]) {
    const t = translate(field, weekdayToIndex[clean], 'sa');
    if (t) return t;
  }
  if (field === 'masa' && masaNameToIndex[clean]) {
    const t = translate(field, masaNameToIndex[clean], 'sa');
    if (t) return t;
  }
  const en = PANCHANGAM_DICTIONARY?.[field]?.en;
  if (en) {
    for (const [k, v] of Object.entries(en)) {
      if (v.toLowerCase().replace(/[^a-z]/g, '') === clean) {
        const t = translate(field, k, 'sa');
        if (t) return t;
      }
    }
  }
  return name;
}

const PanchangamMarquee = () => {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    getPanchangam()
      .then(data => {
        if (!mounted) return;
        const result = PANCHANGAM_FIELDS.map(field => {
          const val = data[field];
          const sa = getSanskrit(field, val?.name, val?.index);
          return `${PANCHANGAM_ICONS[field]} ${FIELD_LABELS.sa[field]} - ${sa}`;
        });
        setItems(result);
      })
      .catch(() => {
        if (!mounted) return;
        setError(true);
      });
    return () => { mounted = false; };
  }, []);

  if (error) return (
    <div className="bg-gradient-to-r from-amber-900/10 via-amber-700/15 to-amber-900/10 border-b border-amber-700/20 py-2">
      <p className="text-center text-sm text-amber-800 dark:text-amber-400 font-medium">{FALLBACK_MSG}</p>
    </div>
  );

  if (!items) return null;

  return (
    <div className="overflow-hidden bg-gradient-to-r from-amber-900/10 via-amber-700/15 to-amber-900/10 border-b border-amber-700/20 py-2">
      <div className="flex gap-16 w-max animate-marquee">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="text-sm sm:text-base text-amber-900 dark:text-amber-300 font-medium tracking-wide whitespace-nowrap">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PanchangamMarquee;
