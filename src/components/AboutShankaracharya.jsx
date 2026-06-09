import { motion } from 'framer-motion';

const sections = [
  {
    title: 'Who is Adi Shankaracharya?',
    content: `Adi Shankaracharya (8th century CE) was one of the greatest philosophers, spiritualists, and reformers India has ever produced. Born in Kaladi, Kerala, he revived the ancient Vedic Dharma at a time when heretic and non-Vedic sects threatened to wipe it away. Within a short span of 32 years, he travelled the length and breadth of Bharat on foot, established the philosophy of Advaita Vedanta (non-duality), wrote commentaries on the Brahma Sutras, the principal Upanishads, and the Bhagavad Gita, and composed numerous stotras that continue to inspire millions.

Scholarly consensus places Shankara in the early 8th century CE (c. 700–750 CE). The traditional dating followed by the Kanchi Kamakoti Peetham places his birth in 509 BCE. He is regarded as the systematizer of Advaita Vedanta, harmonizing the teachings of the Upanishads, the Bhagavad Gita, and the Brahma Sutras into a unified philosophical framework.`,
    image: 'https://www.kamakoti.org/kamakoti/stotras/Jagadguru-Adi-Shankaracharya.jpg',
  },
  {
    title: 'The Birth and Early Life',
    content: `Sivaguru and Aryamba, a pious Brahmin couple in Kaladi, prayed to Lord Vadakkunathan (Shiva) for a son. The Lord appeared and offered them a choice: many dull children or one brilliant son who would live a short life. They left the decision to Him. Thus, on the fifth day of the bright fortnight of Vaisaka month (509 BCE), Adi Shankara was born.

At age 5, he had his Upanayana. At age 8, while bathing in the river, a crocodile caught his foot. He obtained his mother's permission to take Sannyasa, and the crocodile released him — it was a Gandharva testing him.`,
    image: 'https://www.kamakoti.org/kamakoti/books/Malayalam%20Book%20Kanchi%20Kamakoti%20Peetam/scan0029.jpg',
  },
  {
    title: 'The Kanakadhara Stotram',
    content: `While collecting alms as a young Brahmachari, Shankara stopped at a poor woman's house. Having nothing to offer, she gave him a single amla fruit. Moved by her selflessness, Shankara prayed to Goddess Lakshmi in eighteen beautiful verses — the Kanakadhara Stotram. The Goddess appeared and showered golden amlakas on the woman's house, relieving her poverty forever.`,
  },
  {
    title: 'Meeting His Guru',
    content: `Leaving Kaladi, Shankara travelled north to the banks of the Narmada river. There he met the great yogi Govinda Bhagavatpada, who was living in a cave. Shankara announced himself with ten verses (Dasasloki) ending with "Sivah kevaloham" (I am Shiva alone). Govinda accepted him as a disciple, initiated him into Sannyasa, and taught him the Mahavakyas and Advaita Vidya. He instructed Shankara to go to Kasi (Varanasi) and write a commentary on the Brahma Sutras.`,
    image: 'https://www.kamakoti.org/images/adi/5.jpg',
  },
  {
    title: 'At Kasi — The Commentary and The Chandala',
    content: `At Kasi, Shankara wrote his famous Bhashyas on the Brahma Sutras, the principal Upanishads, and the Bhagavad Gita. Disciples gathered around him, including Sanandana (later Padmapada).

One day, an outcaste (Chandala) with four dogs blocked his path. When asked to move, the Chandala questioned: "From which do you want me to go? This body or the Atman?" Recognizing Lord Shiva himself, Shankara composed the Manisha Panchakam — five verses declaring that one who has realized the oneness of Brahman is his master, regardless of birth.`,
    image: 'https://www.kamakoti.org/images/adi.jpg',
  },
  {
    title: 'The Debate with Sage Vyasa',
    content: `When Shankara was 16, an old Brahmin challenged him on his Brahma Sutra Bhashya. They debated for days. Shankara's disciple Padmapada discerned that the old man was none other than Sage Vyasa himself, author of the Brahma Sutras. Vyasa blessed Shankara, affirmed his commentary as correct, and granted him an additional 16 years of life to spread Advaita throughout the country.`,
  },
  {
    title: 'The Debate with Mandana Mishra',
    content: `In Mahishmati, Shankara debated Mandana Mishra, a great scholar of Karma Mimamsa. His wife Sarasavani was the judge. She suggested both wear flower garlands — whose faded first would be the loser. Shankara's garland remained fresh, while Mandana's wilted. Accepting defeat, Mandana Mishra took Sannyasa and became Sureswaracharya, one of Shankara's four principal disciples. Sarasavani too became a disciple.`,
    image: 'https://www.kamakoti.org/kamakoti/details/Sankara%20Charitram00006.jpg',
  },
  {
    title: 'The Four Principal Disciples',
    content: `Adi Shankara had four great disciples:
    
• Padmapada — who walked on lotus flowers that sprang from his footsteps
• Sureswaracharya — formerly Mandana Mishra, the great Mimamsaka
• Hastamalaka — a deaf-mute boy who, when touched by Shankara, expounded Advaita
• Totakacharya — the silent disciple who burst forth with the Totaka Ashtakam

These four were entrusted with propagating Advaita in different parts of the country.`,
  },
  {
    title: 'Journey to Kailasa',
    content: `During his Himalayan travels, Shankara used his yogic powers to reach Kailasa, the abode of Lord Shiva. He sang two hymns — Sivapadadi-kesanta and Sivakesadi-padanta stotras. Pleased, Lord Shiva presented him with five Sphatika (crystal) Lingas and the palm-leaf manuscript of Soundarya Lahari. The five Lingas — Yoga, Bhoga, Vara, Mukti, and Moksha — were established at different sacred places across India.`,
  },
  {
    title: 'Kanchi and the Sarvajna Peetha',
    content: `After his Digvijaya tours covering the entire country, Shankara settled at Kanchi — the Southern Mokshapuri. With the help of King Rajasena, he remodeled the city and reconstructed the three principal temples: Sri Ekamranatha, Devi Kamakshi, and Sri Varadaraja. He consecrated the Sri Chakra before Devi Kamakshi.

At Kanchi, he ascended the Sarvajna Peetha (Throne of Omniscience), defeating all scholars in debate. He established the Kanchi Kamakoti Peetham as his own Matha, initiated a young boy (Sarvajnatman) as his successor, and placed him under the care of Sureswaracharya.`,
    image: 'https://www.kamakoti.org/assets/images/kamakoti/home_Adi.jpg',
  },
  {
    title: 'Advaita Vedanta — The Philosophy of Non-Duality',
    content: `Advaita Vedanta teaches that Brahman (the ultimate Reality) is one, non-dual, and identical with the Atman (the Self). The world of multiplicity is an appearance (Maya) superimposed on Brahman, like a rope mistaken for a snake in dim light. Liberation (Moksha) is attained not by rituals or good deeds alone, but by knowledge (Jnana) — realizing one's identity with Brahman.

The central concern of Shankara's writings was the liberating knowledge of the true identity of jivatman (individual self) as Atman-Brahman. He emphasized that "right knowledge arises at the moment of hearing" the Mahavakyas (great sayings) from the Upanishads — particularly "Tat Tvam Asi" (That Thou Art), "Aham Brahmasmi" (I Am Brahman), and "Prajnanam Brahma" (Consciousness is Brahman).

Shankara established that all deities worshipped in Hinduism are manifestations of the One Supreme Paramaatma. He systematized the Shanmata (six paths) — worship of Shiva, Vishnu, Devi, Surya, Ganapati, and Skanda — as equal paths to the same goal. He also introduced the Panchayatana form of worship, where five deities are worshipped simultaneously.

The Nirvana Shatakam, one of his most profound compositions, declares:
"I am Consciousness, I am Bliss, I am Shiva, I am Shiva.
Without hate, without infatuation, without craving, without greed;
Neither dharma, nor artha, neither kama, nor moksha am I;
I am Consciousness, I am Bliss, I am Shiva, I am Shiva."

Even modern physicists like Einstein, Jeans, and Eddington have come remarkably close to the Advaita view of reality.`,
  },
  {
    title: 'The Four Amnaya Peethams',
    content: `Shankara established four monastic institutions (Mathas) in the four corners of India to safeguard the Veda-Dharma:

• Jyotir Math (Badrinath, North) — Totakacharya
• Govardhan Math (Puri, East) — Padmapada
• Sharada Peetha (Sringeri, South) — Sureswaracharya
• Dwaraka Math (Dwaraka, West) — Hastamalaka

The Kanchi Kamakoti Peetham, presided over by Shankara himself, is the supreme seat. Today, the 70th Acharya, Pujyashri Shankara Vijayendra Saraswati Shankaracharya Swamigal, adorns this Peetham.`,
  },
  {
    title: 'Mahasamadhi at Kanchi',
    content: `Adi Shankara Bhagavatpada attained Videha Mukti (eternal bliss) at Kanchi in his 32nd year (477 BCE). The Markandeya Samhita, Sivarahasya, and Anantanandagiri's biography all affirm that he absorbed his gross body into the subtle one and became one with the all-pervading Consciousness.

His legacy — the Advaita philosophy, the Bhashyas, the Stotras, and the living tradition of the Kanchi Kamakoti Peetham — continues to guide humanity towards the realization of the oneness of all existence.`,
    image: 'https://www.kamakoti.org/kamakoti/details/adi%20sankara%20statue%20kanchi.jpg',
  },
];

const images = [
  'https://www.kamakoti.org/kamakoti/includes/Adi%20Sankara%20in%20Ekamranatha%20Temple.JPG',
  'https://www.kamakoti.org/kamakoti/details/adi-sankara-at-Gokarna2.jpg',
  'https://www.kamakoti.org/kamakoti/articles/rishikesh.JPG',
  'https://www.kamakoti.org/kamakoti/news/2023/shankara-jayanti-68034-20230422/Shankara-Jayanti21.jpg',
];

const stotras = [
  'Nirvana Shatakam', 'Bhaja Govindam', 'Soundarya Lahari',
  'Sivananda Lahari', 'Kanakadhara Stotram', 'Manisha Panchakam',
  'Subrahmanya Bhujanga Stotram', 'Shiva Manasa Puja', 'Shatpadi Stotram',
  'Dakshinamurthy Ashtakam', 'Totaka Ashtakam', 'Prashnottara Ratna Malika',
];

const authenticWorks = [
  { type: 'Commentary (Bhashya)', works: 'Brahma Sutra Bhashya, commentaries on 10 principal Upanishads (Brihadaranyaka, Taittiriya, Chandogya, Aitareya, Kena, Isha, Katha, Prashna, Mandukya, Mundaka), Bhagavad Gita Bhashya' },
  { type: 'Original Work', works: 'Upadesasahasri (Thousand Teachings) — his most important original philosophical work' },
  { type: 'Commentaries', works: 'Vivarana on Vedavyasa\'s Yogasutra commentary, Apastamba Dharma-sutra commentary' },
  { type: 'Stotras (Poetic)', works: 'Dakshinamurti Stotra, Bhaja Govindam (Mohamudgara), Shivanandalahari, Vishnu-satpadi, Harimide, Dasha-shloki, Krishna-staka' },
];

const AboutShankaracharya = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/90 via-red-900/80 to-amber-900/90" />
        <div className="absolute inset-0 bg-[url('https://www.kamakoti.org/kamakoti/stotras/Jagadguru-Adi-Shankaracharya.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">
              Jagadguru Adi Shankaracharya
            </h1>
            <p className="text-lg sm:text-xl text-orange-200 max-w-3xl mx-auto leading-relaxed">
              The greatest philosopher, spiritual reformer, and Jagadguru who revived Sanatana Dharma
              and established the timeless philosophy of Advaita Vedanta
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-orange-200">
              <span className="px-3 py-1 bg-white/10 rounded-full">509–477 BCE</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">32 Years on Earth</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">56 Kingdoms Traveled</span>
              <span className="px-3 py-1 bg-white/10 rounded-full">4 Amnaya Peethams</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="space-y-10">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.05 }}
              className={`flex flex-col ${idx % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} gap-6 md:gap-10 items-start`}
            >
              <div className={`flex-1 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 overflow-hidden ${section.image ? '' : 'p-8'}`}>
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                    <span className="w-8 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
                    {section.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line text-base">
                    {section.content}
                  </p>
                </div>
              </div>
              {section.image && (
                <div className="md:w-96 w-full flex-shrink-0 flex rounded-2xl shadow-lg overflow-hidden max-h-[360px]">
                  <img
                    src={section.image}
                    alt={section.title}
                    className="flex-1 w-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Stotras Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
            Compositions & Stotras
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Adi Shankaracharya composed numerous stotras that are sung and recited to this day. His works include:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {stotras.map((stotra, idx) => (
              <div
                key={idx}
                className="px-4 py-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl text-gray-700 dark:text-gray-300 text-sm font-medium text-center border border-orange-100 dark:border-orange-800/30"
              >
                {stotra}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Authentic Works */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
            Authentic Works
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Over 300 texts are attributed to Shankara, but scholars authenticate only a subset. His genuine works include:
          </p>
          <div className="grid gap-4">
            {authenticWorks.map((item, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-white/5">
                <span className="px-3 py-1 h-fit text-xs font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full whitespace-nowrap">
                  {item.type}
                </span>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{item.works}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-4">
            Note: Vivekachudamani, though traditionally attributed to Shankara, is considered of doubtful authenticity by modern scholarship.
          </p>
        </motion.div>

        {/* Image Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="w-8 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full" />
            Temples & Sacred Places
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((url, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/5">
                <img
                  src={url}
                  alt={`Adi Shankara related ${idx + 1}`}
                  className="w-full h-48 object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center py-8"
        >
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Sources:{' '}
            <a
              href="https://www.kamakoti.org/kamakoti/details/Adi%20Sankara%20Focus.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 dark:text-orange-400 hover:underline"
            >
              Sri Kanchi Kamakoti Peetham
            </a>
            {' | '}
            <a
              href="https://en.wikipedia.org/wiki/Adi_Shankara"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-600 dark:text-orange-400 hover:underline"
            >
              Wikipedia
            </a>
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
            Our school, Sri Kanchi Kamakoti Sankara Vidyalaya, is proud to be named in honour of
            this great Jagadguru and the sacred Peetham at Kanchi.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutShankaracharya;
