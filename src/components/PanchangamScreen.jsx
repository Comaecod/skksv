import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPanchangam } from '../services/panchangamAPI';
import { PANCHANGAM_DICTIONARY, PANCHANGAM_ICONS, PANCHANGAM_FIELDS, FIELD_LABELS, translate } from '../data/panchangamDictionary';

const LANGUAGES = [
  { code: 'en', label: 'English', script: 'EN' },
  { code: 'te', label: 'తెలుగు', script: 'తె' },
  { code: 'sa', label: 'संस्कृत', script: 'सं' },
];

const TABS = [
  { id: 'sthanam', label: 'Sthanam', icon: '📍' },
  { id: 'kalaha', label: 'Kalaha', icon: '⏱️' },
];

const masaToRutu = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 5, 11: 6, 12: 6 };

const sankalpaLines = [
  { text: 'Jambudvīpe', te: 'జంబూద్వీపే', sa: 'जम्बुद्वीपे' },
  { text: 'Bhāratavarshe', te: 'భారతవర్షే', sa: 'भारतवर्षे' },
  { text: 'Bhāratakhande', te: 'భారతఖండే', sa: 'भारतखण्डे' },
  { text: 'Meroḥ Dakṣiṇa Digbhāge', te: 'మేరోః దక్షిణ దిగ్భాగే', sa: 'मेरोः दक्षिण दिग्भागे' },
  { text: 'Śrīśailasya Āgneya Bhāge', te: 'శ్రీశైలస్య ఆగ్నేయ భాగే', sa: 'श्रीशैलस्य आग्नेय भागे' },
  { text: 'Krishna Kaverī Madhya Pradēśe', te: 'కృష్ణా కావేరీ మధ్య ప్రదేశే', sa: 'कृष्णा कावेरी मध्य प्रदेशे' },
  { text: 'Prudulapuri Nagare', te: 'ప్రుదులపురి నగరే', sa: 'प्रुदुलपुरि नगरे' },
];

// Map common English names to dictionary indices for reverse lookup
function buildReverseMap(type) {
  const en = PANCHANGAM_DICTIONARY?.[type]?.en;
  if (!en) return {};
  const map = {};
  for (const [idx, name] of Object.entries(en)) {
    map[name.toLowerCase().replace(/[^a-z]/g, '')] = idx;
    // Also map alternate names
    if (name.includes('/')) {
      name.split('/').forEach(part => {
        map[part.trim().toLowerCase().replace(/[^a-z]/g, '')] = idx;
      });
    }
  }
  return map;
}

const reverseMaps = {};
function getReverseMap(type) {
  if (!reverseMaps[type]) {
    reverseMaps[type] = buildReverseMap(type);
  }
  return reverseMaps[type];
}

// Map English weekday names to Vara indices (1=Sunday)
const weekdayToIndex = {
  sunday: '1', monday: '2', tuesday: '3', wednesday: '4',
  thursday: '5', friday: '6', saturday: '7',
};

// Map common masa names to indices
const masaNameToIndex = {
  'chaitra': '1', 'vaisakha': '2', 'vaishakha': '2', 'jyeshtha': '3',
  'ashadha': '4', 'aashaadha': '4',
  'shravana': '5', 'bhadrapada': '6', 'ashvina': '7', 'aashvina': '7',
  'kartika': '8', 'margashirsha': '9', 'pausha': '10', 'magha': '11',
  'phalguna': '12',
};

function getRutuFromMasa(masaIdx) {
  if (!masaIdx) return '';
  const idx = masaToRutu[parseInt(masaIdx)];
  return idx !== undefined ? String(idx) : '';
}

function resolveIndex(field, name, fallbackIdx) {
  if (fallbackIdx && fallbackIdx !== '') return fallbackIdx;

  if (!name) return '';

  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Override map for API spelling variants
  const nameOverrides = {
    karana: { taitula: '4' },
    nakshatra: {
      uttarabhadra: '26', purvabhadra: '25', uttaraphalguni: '12',
      purvaphalguni: '11', purvaashadha: '20', uttaraashadha: '21',
      mrigashira: '5', punarvasu: '7', shatabhisha: '24',
    },
    yoga: {},
    tithi: {},
  };
  const override = nameOverrides[field]?.[clean];
  if (override) return override;

  // Special handling for vara (weekday)
  if (field === 'vara' && weekdayToIndex[clean]) {
    return weekdayToIndex[clean];
  }

  // Special handling for masa
  if (field === 'masa' && masaNameToIndex[clean]) {
    return masaNameToIndex[clean];
  }

  // Handle split names like "Shukla Paksha" -> look for "paksha"
  const words = clean.split(/[\s]+/);
  const reverseMap = getReverseMap(field);

  for (const word of words) {
    if (reverseMap[word]) return reverseMap[word];
  }

  // Try full cleaned name
  if (reverseMap[clean]) return reverseMap[clean];

  return '';
}

function getTranslatedValue(field, data, lang) {
  if (!data) return '';
  const val = data[field];
  if (!val) return '';

  const name = val.name || '';
  const rawIdx = val.index !== undefined ? String(val.index) : '';

  // For rutu: derive from masa if not provided
  if (field === 'rutu' && !rawIdx && !name) {
    const masaData = data.masa;
    if (masaData) {
      const masaIdx = resolveIndex('masa', masaData.name, masaData.index);
      const rutuIdx = getRutuFromMasa(masaIdx);
      if (rutuIdx) {
        const t = translate('rutu', rutuIdx, lang);
        if (t && t !== rutuIdx) return t;
      }
    }
  }

  // Resolve the index from name or use the one from API
  const idx = resolveIndex(field, name, rawIdx);

  if (idx) {
    const t = translate(field, idx, lang);
    if (t && t !== idx) return t;
  }

  // Fallback: return the English name from API (already in English)
  if (lang === 'en' && name) return name;

  // Last resort: return empty
  return name || '—';
}

function formatTimeDisplay(sandhya, field) {
  if (!sandhya) return '';
  const period = sandhya[field];
  if (!period) return '';
  return `${period.start} – ${period.end}`;
}

const PanchangamScreen = () => {
  const [lang, setLang] = useState('en');
  const [tab, setTab] = useState('sthanam');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setRateLimited(false);
      const result = await getPanchangam();
      setData(result);
    } catch (err) {
      if (err.message === 'RATE_LIMIT') {
        setRateLimited(true);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const tl = (field) => getTranslatedValue(field, data, lang);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/90 via-orange-900/80 to-yellow-900/90" />
        <div className="absolute inset-0 bg-[url('https://www.kamakoti.org/assets/images/kamakoti/home_Adi.jpg')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-amber-200 text-sm mb-6 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {loading ? 'Fetching...' : '📍 Podili, Markapur District'}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">Panchangam</h1>
            <p className="text-lg text-amber-200/80 max-w-2xl mx-auto">
              Daily Hindu calendar aligned with the tradition of the Kanchi Kamakoti Peetham
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex justify-center mt-8">
            <div className="inline-flex rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 p-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    lang === l.code
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'text-amber-200/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {l.script}
                  <span className="ml-1.5 text-[10px] opacity-60">{l.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-6 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex gap-1 mb-8">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === t.id
                  ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-lg border border-gray-200 dark:border-white/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </motion.div>

        {rateLimited && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-700/50 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">⏳</span>
              <div>
                <h3 className="font-semibold text-amber-800 dark:text-amber-300">Service Temporarily Busy</h3>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">Panchangam service is temporarily busy. Please try again shortly.</p>
              </div>
            </div>
          </motion.div>
        )}

        {error && !rateLimited && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 border border-red-200 dark:border-red-700/50 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300">Unable to Load Panchangam</h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
              </div>
              <button onClick={fetchData} className="ml-auto px-4 py-1.5 rounded-lg bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700/50 transition-colors">
                Retry
              </button>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {tab === 'sthanam' ? (
            <motion.div key="sthanam" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-white/10 p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                  <span className="w-8 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
                  Sankalpa Sthanam
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                  Traditional location declaration used in Vedic rituals
                </p>
                <div className="space-y-3">
                  {sankalpaLines.map((line, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.08 }}
                    >
                      <div className="flex items-center gap-4 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-800/20 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-gray-700 dark:text-gray-200 text-sm sm:text-base font-medium">
                          {lang === 'te' ? line.te : lang === 'sa' ? line.sa : line.text}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="kalaha" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
              {loading && !data ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="h-24 rounded-2xl bg-gray-200 dark:bg-slate-700 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PANCHANGAM_FIELDS.map((field, idx) => (
                    <motion.div
                      key={field}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                    >
                      <div className="h-full p-5 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 hover:shadow-lg hover:border-amber-200/50 dark:hover:border-amber-700/50 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            {FIELD_LABELS[lang]?.[field] || field}
                          </span>
                          <span className="text-lg">{PANCHANGAM_ICONS[field]}</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {tl(field) || '—'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sandhyavandanam Timings - always visible */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 mb-12"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 dark:border-white/10 p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <span className="w-8 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
              Sandhyavandanam Timings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm">🌅</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pratah Sandhya</p>
                    <p className="text-[10px] text-amber-500 dark:text-amber-500">Morning</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-800 dark:text-white">
                  {data?.sandhya ? formatTimeDisplay(data.sandhya, 'pratah') : '—'}
                </p>
                {data?.sandhya?.sunrise && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Sunrise: {data.sandhya.sunrise}</p>
                )}
              </div>
              <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm">☀️</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Madhyanika</p>
                    <p className="text-[10px] text-amber-500 dark:text-amber-500">Noon</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-800 dark:text-white">
                  {data?.sandhya ? formatTimeDisplay(data.sandhya, 'madhyanika') : '—'}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-100 dark:border-amber-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm">🌇</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Sayam Sandhya</p>
                    <p className="text-[10px] text-amber-500 dark:text-amber-500">Evening</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-gray-800 dark:text-white">
                  {data?.sandhya ? formatTimeDisplay(data.sandhya, 'sayam') : '—'}
                </p>
                {data?.sandhya?.sunset && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Sunset: {data.sandhya.sunset}</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Spacer to prevent bg-gray-50 showing through before footer */}
        <div className="h-16 sm:h-20" />
      </div>
    </div>
  );
};

export default PanchangamScreen;
