import { motion } from 'framer-motion';

const historySections = [
  {
    year: '2022',
    title: 'The Vision Takes Shape',
    content: `Jagadguru Sri Sankara Vijayendra Saraswati Shankaracharya Swamiji, the 70th Acharya of the Sri Kanchi Kamakoti Peetham, conceives the Sanatana Dharma Seva Gramam — a holistic community development project to revive and propagate Sanatana Dharma among youth. The project is envisioned on a 31-acre campus at Obulakappally, Podili, Markapur District, Andhra Pradesh.`,
    image: 'https://www.kamakoti.org/assets/images/kamakoti/home_Adi.jpg',
  },
  {
    year: 'April 2023',
    title: 'First Visit to Podili',
    content: `Pujyashri Shankaracharya Swamiji visits the project site for the first time, accompanied by devotees in a grand procession. He also visits the 100-year-old Shivalayam at Podili and the ancient Rama Theertham temple near Ongole, blessing the land and the endeavour.`,
    image: 'https://www.kamakoti.org/kamakoti/news/2023/pujya-shankaracharya-65370-20230416/shankara%20(12).JPG',
  },
  {
    year: '2024',
    title: 'Sri Kanchi Kamakoti Sankara Vidyalaya is Born',
    content: `The school is officially launched as the flagship educational institution of the Sanatana Dharma Seva Gramam. It receives CBSE affiliation (No. 130803) and begins operations as an English-medium school for Grades 6 to 12, blending modern education with Vedic studies. The first batch serves 44 students in Grades 6 and 7.`,
    image: 'https://www.deccanchronicle.com/h-upload/2024/12/09/1870896-kanchi.webp',
  },
  {
    year: 'December 2024',
    title: 'Featured in Deccan Chronicle',
    content: `The school gains statewide attention as Deccan Chronicle publishes a feature article titled "Sankara Vidyalaya in Podili to promote Sanatana Dharma." Director Ashwini Kumar shares the school's mission: "To integrate core Sanatana Dharma values into modern education by preparing students as holistic individuals and global citizens."`,
  },
  {
    year: 'Ongoing',
    title: 'Building the Future',
    content: `The campus continues to grow with construction of staff quarters, a Brahmin boys' hostel for Vedic students, and plans for a Skill Development Centre, Health Centre, 300-cattle Goshala, Yagasala, Hanuman Sports Complex, Nakshatra Vanam, and a yoga centre. The school actively recruits experienced faculty from across the country to expand its educational offerings.`,
    image: 'https://www.kamakoti.org/kamakoti/details/adi%20sankara%20statue%20kanchi.jpg',
  },
];

const AboutSchool = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/90 via-orange-900/80 to-yellow-900/90" />
        <div className="absolute inset-0 bg-[url('https://www.deccanchronicle.com/h-upload/2024/12/09/1870896-kanchi.webp')] bg-cover bg-center opacity-15" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
              Our History
            </h1>
            <p className="text-lg sm:text-xl text-amber-200 max-w-3xl mx-auto leading-relaxed">
              The story of Sri Kanchi Kamakoti Sankara Vidyalaya — from a vision to reality,
              rooted in the timeless tradition of the Kanchi Kamakoti Peetham
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-amber-200">
              <span className="px-3 py-1 bg-white/10 rounded-full">Founded 2024</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">Podili, Andhra Pradesh</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">Sanatana Dharma Seva Gramam</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">Kanchi Kamakoti Peetham</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-orange-500 to-amber-400 hidden md:block" />

          {historySections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className={`relative flex flex-col md:flex-row gap-6 mb-12 ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
            >
              <div className="hidden md:flex items-center justify-center w-24 flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg flex flex-col items-center justify-center text-white font-bold z-10 leading-tight">
                  <span className="text-[10px] opacity-80">{section.year}</span>
                </div>
              </div>

              <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="p-6 sm:p-8">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider md:hidden">
                    {section.year}
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                    <span className="w-8 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" />
                    {section.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-base">
                    {section.content}
                  </p>
                </div>
                {section.image && (
                  <div className="w-full max-h-[300px] overflow-hidden">
                    <img
                      src={section.image}
                      alt={section.title}
                      className="w-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl shadow-lg border border-amber-100 dark:border-amber-800/30 p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            The Guiding Vision
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg italic max-w-2xl mx-auto leading-relaxed">
            "Revival and propagation of the Sanatana Dharma among youth and upcoming generations has become a dire need of the hour. It is extremely important that right channels of participation and opportunities are developed and made available to youngsters, to be able to involve them and provide them a conducive environment to stay connected and rooted to our culture."
          </p>
          <p className="text-gray-500 dark:text-gray-400 mt-4 font-medium">
            — Jagadguru Sri Sankara Vijayendra Saraswati Shankaracharya Swamiji
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center py-8"
        >
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Sources:{' '}
            <a href="https://kksfusa.org/sdsg/" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline">Kanchi Kamakoti Seva Foundation</a>
            {' | '}
            <a href="https://www.deccanchronicle.com/southern-states/andhra-pradesh/sankara-vidyalaya-in-podili-to-promote-sanatana-dharma-1845495" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline">Deccan Chronicle</a>
            {' | '}
            <a href="https://www.kamakoti.org/" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline">Sri Kanchi Kamakoti Peetham</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutSchool;
