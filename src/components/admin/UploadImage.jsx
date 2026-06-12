import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadImage } from '../../services/cloudinaryService';
import { addImage } from '../../services/imageService';

const CATEGORIES = ['carousel', 'staff', 'gallery', 'uncategorized'];

const UploadImage = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState(['uncategorized']);
  const [subCategory, setSubCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  const toggleCategory = (cat) => {
    setCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const handleUpload = async () => {
    if (!file) { setStatus('Please select an image'); return; }
    setUploading(true);
    setProgress(0);
    setStatus('Uploading to Cloudinary...');
    try {
      const { url, publicId } = await uploadImage(file, setProgress);
      setProgress(100);
      setStatus('Saving to database...');
      await addImage({ url, publicId, title: title.trim(), description: description.trim(), categories, subCategory: subCategory.trim() });
      setStatus('Upload complete!');
      setFile(null);
      setPreview(null);
      setTitle('');
      setDescription('');
      setCategories(['uncategorized']);
      setSubCategory('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="glass-card p-6 sm:p-8 animate-slideUp">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🖼️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload Image</h2>
          <p className="text-gray-500 dark:text-gray-400">Upload images for carousel, staff, or gallery</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Image *</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-all"
            >
              {preview ? (
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
              ) : (
                <>
                  <div className="text-3xl mb-2">📁</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Click to select an image</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Title (optional)</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Annual Day 2026" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the image" rows={3} className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Categories *</label>
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={categories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-white/20"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Sub-category (optional)</label>
            <input type="text" value={subCategory} onChange={e => setSubCategory(e.target.value)} placeholder="e.g. sports-day, annual-day" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm" />
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="w-full py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {uploading ? `Uploading ${progress}%` : 'Upload to Cloudinary'}
          </button>

          {uploading && progress > 0 && progress < 100 && (
            <div className="space-y-2">
              <div className="w-full h-2.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-500 dark:text-gray-400">{progress}% uploaded</p>
            </div>
          )}

          {status && !uploading && (
            <div className={`p-4 rounded-xl text-sm ${status.startsWith('Error') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : status === 'Upload complete!' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
              {status}
            </div>
          )}
        </div>

        <div className="text-center mt-6">
          <button onClick={() => navigate('/dashboard/images')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all">
            ← View all images
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadImage;
