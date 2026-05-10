import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SCHOOL_CONFIG } from '../config/schoolConfig';
import skksv1 from '../assets/carousel/skksv1.jpg';
import skksv2 from '../assets/carousel/skksv2.jpg';
import skksv3 from '../assets/carousel/skksv3.jpg';
import skksv4 from '../assets/carousel/skksv4.jpg';
import skksv5 from '../assets/carousel/skksv5.jpg';
import skksv6 from '../assets/carousel/skksv6.jpg';
import skksv7 from '../assets/carousel/skksv7.jpg';
import skksv8 from '../assets/carousel/skksv8.jpg';
import skksv9 from '../assets/carousel/skksv9.jpg';
import skksv10 from '../assets/carousel/skksv10.jpg';
import skksv11 from '../assets/carousel/skksv11.jpg';
import skksv12 from '../assets/carousel/skksv12.jpg';
import skksv13 from '../assets/carousel/skksv13.jpg';
import skksv14 from '../assets/carousel/skksv14.jpg';

const StatItem = ({ icon, value, label }) => (
    <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-lg px-3 py-2">
    <span className="text-lg">{icon}</span>
    <div>
      <div className="text-gray-900 dark:text-white font-semibold text-sm">{value}</div>
      <div className="text-gray-500 dark:text-gray-400 text-xs">{label}</div>
    </div>
  </div>
);

const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="glass-card p-4 sm:p-5 flex items-start gap-4"
  >
    <div className="text-2xl sm:text-3xl shrink-0">{icon}</div>
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm sm:text-base">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">{description}</p>
    </div>
  </motion.div>
);

const ImageCarousel = ({ images }) => {
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState({});

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    const preloadNext = () => {
      const nextIndex = (current + 1) % images.length;
      const prevIndex = (current - 1 + images.length) % images.length;
      [nextIndex, prevIndex].forEach(index => {
        if (!loaded[index]) {
          const img = new Image();
          img.src = images[index];
          img.onload = () => setLoaded(prev => ({ ...prev, [index]: true }));
        }
      });
    };
    preloadNext();
  }, [current, images, loaded]);

  if (images.length === 0) {
    return (
      <div className="w-full h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-primary/30 to-purple-600/30 rounded-2xl flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400 text-sm">Gallery coming soon</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden mb-8">
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={images[current]}
          alt={`School image ${current + 1}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full h-full object-cover"
        />
      </AnimatePresence>

      {images.length > 1 && (
        <>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrent(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === current ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrent(prev => (prev - 1 + images.length) % images.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            onClick={() => setCurrent(prev => (prev + 1) % images.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all"
            aria-label="Next image"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
};

const HomeScreen = () => {
  const images = [
    skksv1, skksv2, skksv3, skksv4, skksv5, skksv6,
    skksv7, skksv8, skksv9, skksv10, skksv11, skksv12,
    skksv13, skksv14
  ];

  const features = [
    { icon: '🎓', title: 'CBSE Curriculum', description: 'Integrated CBSE Curriculum with academic excellence and holistic development' },
    { icon: '👩‍🏫', title: 'Expert Faculty', description: 'Experienced, Dedicated & Caring teachers who nurture every student' },
    { icon: '📖', title: 'Indian Heritage', description: 'Strong Values, Culture & Indian Knowledge Systems woven into learning' },
    { icon: '🏫', title: 'Modern Classrooms', description: 'Spacious, Well-Ventilated Classrooms designed for optimal learning' },
    { icon: '🔬', title: 'Labs & Tech', description: 'Modern Science & Computer Laboratories with latest equipment' },
    { icon: '📚', title: 'Digital Library', description: 'Well-Stocked Library with Digital Access and vast collection' },
    { icon: '⚽', title: 'Sports Facilities', description: 'Indoor & Outdoor Sports & Physical Development Facilities' },
    { icon: '🚑', title: 'Health & Safety', description: 'On-Campus Medical Care & 24×7 Security for your child\'s safety' },
    { icon: '🌳', title: 'Green Campus', description: '34-Acre Green Campus with Playgrounds, Garden & Central Lawn' },
    { icon: '🛕', title: 'Spiritual Living', description: 'Goshala, Scripture teachings & spiritual practices on campus' },
  ];

  return (
    <div className="w-full min-h-screen">
      <div className="max-w-7xl mx-auto px-4 pt-20 sm:pt-16 pb-20 sm:pb-16">
        <div className="mt-6 sm:mt-8">
          <ImageCarousel images={images} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 sm:mb-10 mt-8"
        >
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-2">
            Sri Kanchi Kamakoti
          </h1>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent mb-3">
            Sankara Vidyalaya
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base italic mb-4">
            Sanatana Dharma Seva Gramam
          </p>

          <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
            {['Sacred', 'Smart', 'Skilled'].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs sm:text-sm font-medium border border-primary/30"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Step into a vibrant space where tradition meets innovation. With top-class infrastructure,
            healthy meals, and a caring hostel, we nurture your child's academic, emotional, and cultural growth.
            Here, every child thrives!
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3 mb-8 sm:mb-10"
        >
          <StatItem icon="📍" value="Podili, AP" label="Location" />
          <StatItem icon="🌳" value="34 Acres" label="Campus" />
          <StatItem icon="🏛️" value="CBSE" label="Curriculum" />
          <StatItem icon="🛡️" value="24×7" label="Security" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-4 sm:p-8 mb-10 sm:mb-14 text-center"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Where Tradition Meets Tomorrow
          </h2>
          <p className="text-primary font-medium text-sm sm:text-base mb-2">A Home for Scholars</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            Nestled in the serene surroundings of Sanatana Dharma Seva Gramam, we provide an environment
            where young minds blossom into confident, compassionate individuals rooted in Indian values
            yet prepared for the global stage.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-10 sm:mb-14"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
            Why Choose Us
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-wrap justify-center items-center gap-4 py-6 border-t border-gray-200 dark:border-white/10"
        >
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Sri Kanchi Kamakoti Sankara Vidyalaya, Sanatana Dharma Seva Gramam, Podili - AP
          </p>
          <a
            href="https://maps.app.goo.gl/tJxDJYtwDYMbrGzv9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white text-sm transition-all"
          >
            📍 View on Maps
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default HomeScreen;