import { useEffect } from 'react';
import { motion } from 'framer-motion';

const ImageModal = ({ image, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
        <motion.div
          initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
          className="relative max-w-4xl w-full"
        >
          <button onClick={onClose} className="sticky top-0 float-right mb-2 text-white/70 hover:text-white text-sm z-10 bg-black/40 rounded-lg px-3 py-1">
            Close ✕
          </button>
          <img src={image.url} alt={image.title || ''} className="w-full rounded-lg" />
          {(image.title || image.description) && (
            <div className="mt-3 text-center text-white pb-4">
              {image.title && <p className="font-medium">{image.title}</p>}
              {image.description && <p className="text-sm text-white/70 mt-1">{image.description}</p>}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ImageModal;
