const VEDASTRO_API_URL = 'https://api.vedastro.org/api/Calculate/PanchangaTable';
const CACHE_DURATION = 5 * 60 * 1000;
let cache = { data: null, timestamp: 0 };

const PODILI = { lat: 15.6158, lon: 79.6167, city: 'Podili' };

function pad(n) { return String(n).padStart(2, '0'); }

function getFormattedTime(date) {
  const d = date || new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getYear() + 1900} +05:30`;
}

// Derive samvatsara (60-year cycle) from year
function getSamvatsara(year) {
  const samvatsaraNames = [
    'Prabhava', 'Vibhava', 'Shukla', 'Pramoda', 'Prajapati',
    'Angirasa', 'Shrimukha', 'Bhava', 'Yuva', 'Dhata',
    'Ishvara', 'Bahudhanya', 'Pramathi', 'Vikrama', 'Vishu',
    'Chitra', 'Svabhanu', 'Tarana', 'Parthiva', 'Vyaya',
    'Sarvajit', 'Sarvadhari', 'Virodhi', 'Vikrita', 'Khara',
    'Nandana', 'Vijaya', 'Jaya', 'Manmatha', 'Durmukha',
    'Hemalamba', 'Vilamba', 'Vikari', 'Sharvari', 'Plava',
    'Shubhakrit', 'Shobhana', 'Krodhi', 'Vishvavasu', 'Parabhava',
    'Plavanga', 'Kilaka', 'Saumya', 'Sadharana', 'Virodhakrit',
    'Paridhavi', 'Pramadin', 'Ananda', 'Rakshasa', 'Nala',
    'Pingala', 'Kalayukti', 'Siddharthi', 'Raudra', 'Durmata',
    'Dundubhi', 'Rudhirodgari', 'Raktaksha', 'Krodhana', 'Akshaya'
  ];
  const startYear = 1867; // Prabhava corresponds to 1867-68 CE
  const diff = year - startYear;
  const idx = ((diff % 60) + 60) % 60;
  return { name: samvatsaraNames[idx], index: idx + 1 };
}

// Derive ayana from month (1=Chaitra)
function getAyana(monthIndex) {
  // Chaitra (1) to Bhadrapada (6) = Dakshinayana, Ashvina (7) to Phalguna (12) = Uttarayana
  // Actually: Makara Sankranti to Mesha Sankranti = Uttarayana (Jan-Jun)
  // Mesha Sankranti to Karka Sankranti = Dakshinayana (Jul-Dec)
  // Simplified: Jan-Jun = Uttarayana, Jul-Dec = Dakshinayana
  const m = new Date().getMonth() + 1;
  return m >= 1 && m <= 6 ? { name: 'Uttarayana', index: 1 } : { name: 'Dakshinayana', index: 2 };
}

function getRutu(monthIndex) {
  // 1-2: Vasanta, 3-4: Grishma, 5-6: Varsha, 7-8: Sharad, 9-10: Hemanta, 11-12: Shishira
  const rutuMap = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4, 9: 5, 10: 5, 11: 6, 12: 6 };
  const rutuNames = ['Vasanta', 'Grishma', 'Varsha', 'Sharad', 'Hemanta', 'Shishira'];
  const idx = rutuMap[monthIndex] || 1;
  return { name: rutuNames[idx - 1], index: idx };
}

// Map English month names to lunar month index
const lunarMonthIndex = {
  'chaitra': 1, 'vaisakha': 2, 'vaishakha': 2, 'jyeshtha': 3, 'ashadha': 4,
  'shravana': 5, 'bhadrapada': 6, 'ashvina': 7, 'kartika': 8,
  'margashirsha': 9, 'pausha': 10, 'magha': 11, 'phalguna': 12,
};

function getLunarMonthIndex(name) {
  return lunarMonthIndex[name?.toLowerCase().replace(/[^a-z]/g, '')] || null;
}

// Map English weekday names to Vara index (1=Sunday)
const weekdayIndex = { sunday: 1, monday: 2, tuesday: 3, wednesday: 4, thursday: 5, friday: 6, saturday: 7 };

export async function getPanchangam() {
  if (cache.data && Date.now() - cache.timestamp < CACHE_DURATION) {
    return cache.data;
  }

  const requestBody = {
    inputTime: {
      StdTime: getFormattedTime(),
      Location: {
        Name: 'Podili',
        Latitude: PODILI.lat,
        Longitude: PODILI.lon,
      },
    },
    Ayanamsa: 'RAMAN',
  };

  const response = await fetch(VEDASTRO_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (response.status === 429) {
    throw new Error('RATE_LIMIT');
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const result = await response.json();

  const data = parseResponse(result);

  cache = { data, timestamp: Date.now() };
  return data;
}

function parseTime(timeStr) {
  if (!timeStr) return null;
  try {
    // Format: "HH:mm DD/MM/YYYY +TZ"
    const match = timeStr.match(/(\d{2}):(\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) {
      const h = parseInt(match[1]), m = parseInt(match[2]);
      const d = parseInt(match[3]), mo = parseInt(match[4]) - 1, y = parseInt(match[5]);
      return new Date(y, mo, d, h, m);
    }
    const fallback = new Date(timeStr);
    if (!isNaN(fallback.getTime())) return fallback;
  } catch (e) {}
  return null;
}

function fmtTime(d) {
  return d?.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) || '';
}

function parseResponse(apiResult) {
  const table = apiResult?.Payload?.PanchangaTable;
  if (!table || apiResult?.Status !== 'Pass') {
    throw new Error('Invalid API response format');
  }

  const now = new Date();
  const year = now.getFullYear();
  const samvatsara = getSamvatsara(year);

  // Extract sunrise/sunset from Time objects
  const sunrise = parseTime(table.Sunrise?.StdTime);
  const sunset = parseTime(table.Sunset?.StdTime);

  // Fallback estimation for Podili
  function estimateSunriseSunset() {
    const dayOfYear = Math.floor((now - new Date(year, 0, 0)) / 86400000);
    const amplitude = 30;
    const offset = Math.sin((dayOfYear - 80) * Math.PI / 180) * amplitude;
    const riseMin = Math.round(370 - offset);
    const setMin = Math.round(1070 + offset);
    return {
      rise: new Date(year, now.getMonth(), now.getDate(), Math.floor(riseMin / 60), riseMin % 60),
      set: new Date(year, now.getMonth(), now.getDate(), Math.floor(setMin / 60), setMin % 60),
    };
  }

  const finalSunrise = sunrise || estimateSunriseSunset().rise;
  const finalSunset = sunset || estimateSunriseSunset().set;

  // Sandhyavandanam computation
  const noon = new Date((finalSunrise.getTime() + finalSunset.getTime()) / 2);
  const sandhya = {
    pratah: { start: fmtTime(new Date(finalSunrise.getTime() - 30 * 60 * 1000)), end: fmtTime(finalSunrise) },
    madhyanika: { start: fmtTime(new Date(noon.getTime() - 15 * 60 * 1000)), end: fmtTime(new Date(noon.getTime() + 15 * 60 * 1000)) },
    sayam: { start: fmtTime(new Date(finalSunset.getTime() - 30 * 60 * 1000)), end: fmtTime(new Date(finalSunset.getTime() + 15 * 60 * 1000)) },
    sunrise: fmtTime(finalSunrise),
    sunset: fmtTime(finalSunset),
  };

  // Parse Tithi
  const tithiName = table.Tithi?.Name || '';
  const pakshaName = table.Tithi?.Paksha || '';
  const tithiIndex = table.Tithi?.Day ? parseInt(table.Tithi.Day.split('/')[0]) : null;

  // Nakshatra: format "Uttarabhadra - 1" (the number is pada, NOT nakshatra index)
  let nakshatraName = table.Nakshatra || '';
  const nakshatraMatch = nakshatraName.match(/^(.+?)\s*-\s*(\d+)$/);
  if (nakshatraMatch) {
    nakshatraName = nakshatraMatch[1].trim();
  }

  // Parse Vara
  const varaName = table.Vara || '';
  const varaIndex = weekdayIndex[varaName.toLowerCase()] || null;

  // Parse LunarMonth
  const masaName = table.LunarMonth || '';
  const masaIndex = getLunarMonthIndex(masaName);

  // Parse Paksha index (Shukla=1, Krishna=2)
  const pakshaIndex = pakshaName.toLowerCase() === 'shukla' ? 1 : 2;

  // Derive Ayana
  const ayana = getAyana(masaIndex || (now.getMonth() + 1));

  // Derive Rutu
  const rutu = getRutu(masaIndex || (now.getMonth() + 1));

  // Tithi index: API gives "9/15" format, take first number
  // Also derive tithi index from name as fallback
  function getTithiIndex(name) {
    const map = { 'prathama': 1, 'pratipada': 1, 'dvitiya': 2, 'tritiya': 3, 'chaturthi': 4, 'panchami': 5, 'shashthi': 6, 'saptami': 7, 'ashtami': 8, 'navami': 9, 'dasami': 10, 'ekadasi': 11, 'dwadasi': 12, 'trayodasi': 13, 'chaturdasi': 14, 'purnima': 15, 'amavasya': 15 };
    return map[name?.toLowerCase().replace(/[^a-z]/g, '')] || null;
  }

  const finalTithiIndex = tithiIndex || getTithiIndex(tithiName);

  return {
    tithi: { name: tithiName, index: finalTithiIndex !== null ? String(finalTithiIndex) : '' },
    nakshatra: { name: nakshatraName, index: '' },
    yoga: { name: table.Yoga?.Name || '', index: '' },
    karana: { name: table.Karana || '', index: '' },
    masa: { name: masaName, index: masaIndex ? String(masaIndex) : '' },
    paksha: { name: pakshaName, index: String(pakshaIndex) },
    ayana: { name: ayana.name, index: String(ayana.index) },
    samvatsara: { name: samvatsara.name, index: String(samvatsara.index) },
    vara: { name: varaName, index: varaIndex ? String(varaIndex) : '' },
    rutu: { name: rutu.name, index: String(rutu.index) },
    sandhya,
    location: { name: 'Podili', lat: PODILI.lat, lon: PODILI.lon },
    raw: apiResult,
  };
}
