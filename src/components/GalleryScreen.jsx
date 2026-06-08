import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getImagesByCategory } from '../services/imageService';
import ImageModal from './ImageModal';

const GalleryScreen = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subCategory, setSubCategory] = useState('all');
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    getImagesByCategory('gallery').then(items => {
      setImages(items);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const subCategories = ['all', ...new Set(images.map(i => i.subCategory).filter(Boolean))];
  const filtered = subCategory === 'all' ? images : images.filter(i => i.subCategory === subCategory);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="text-5xl mb-4">🖼️</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Gallery</h2>
        <p className="text-gray-500 dark:text-gray-400">No gallery images yet</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Gallery</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Moments from our school</p>
      </motion.div>

      {subCategories.length > 1 && (
        <div className="flex gap-2 mb-8 flex-wrap justify-center">
          {subCategories.map(sc => (
            <button key={sc} onClick={() => setSubCategory(sc)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${subCategory === sc ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/20'}`}
            >
              {sc === 'all' ? 'All' : sc.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      )}

      <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((img, index) => (
          <motion.div
            key={img.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-card overflow-hidden cursor-pointer group"
            onClick={() => setViewer(img)}
          >
            <div className="aspect-[4/3] bg-black/5 dark:bg-white/5">
              <img src={img.url} alt={img.title || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            {(img.title || img.description) && (
              <div className="p-4">
                {img.title && <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{img.title}</p>}
                {img.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{img.description}</p>}
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence>
        {viewer && <ImageModal image={viewer} onClose={() => setViewer(null)} />}
      </AnimatePresence>
    </div>
  );
};

export default GalleryScreen;