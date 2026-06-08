import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteImage } from '../../services/cloudinaryService';
import { getImagesPaginated, updateImage, deleteImageRecord } from '../../services/imageService';
import ConfirmModal from '../ConfirmModal';


const PAGE_SIZE = 12;

const AdminImages = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const sentinelRef = useRef(null);

  const fetchPage = useCallback(async (lastDocCursor, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setLoadError('');
    try {
      const result = await getImagesPaginated({
        pageSize: PAGE_SIZE,
        lastDoc: lastDocCursor,
        category: categoryFilter,
      });
      if (append) {
        setImages(prev => [...prev, ...result.items]);
      } else {
        setImages(result.items);
      }
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      setLoadError(err.message);
      console.error('Error loading images:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    setImages([]);
    setLastDoc(null);
    setHasMore(true);
    fetchPage(null, false);
  }, [fetchPage]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore || loadingMore) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        fetchPage(lastDoc, true);
      }
    }, { rootMargin: '300px' });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, lastDoc, fetchPage]);

  const categories = ['all', ...new Set(images.flatMap(i => i.categories || [i.category]))];

  const startEdit = (img) => {
    setEditingId(img.id);
    setEditData({ title: img.title || '', description: img.description || '', categories: [...(img.categories || [img.category])], subCategory: img.subCategory || '' });
  };

  const toggleEditCategory = (cat) => {
    setEditData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat]
    }));
  };

  const saveEdit = async () => {
    const payload = {
      ...editData,
      categories: editData.categories.length ? editData.categories : ['uncategorized'],
      category: editData.categories.length ? editData.categories[0] : 'uncategorized',
    };
    try {
      await updateImage(editingId, payload);
      setImages(prev => prev.map(i => i.id === editingId ? { ...i, ...payload } : i));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating image:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      if (confirmDelete.publicId) {
        await deleteImage(confirmDelete.publicId);
      }
      await deleteImageRecord(confirmDelete.id);
      setImages(prev => prev.filter(i => i.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting image:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-8">
        <div className="glass-card p-8 text-center w-full max-w-md">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading images...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to load images</h3>
          <p className="text-sm text-red-400 mb-4">{loadError}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            If using a category filter, you may need a composite index. Check the browser console (F12) for a link to create it.
          </p>
          <button onClick={() => { setImages([]); setLastDoc(null); setHasMore(true); fetchPage(null, false); }} className="px-4 py-2 rounded-xl text-sm bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manage Images</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{hasMore ? 'At least ' : ''}{images.length} image(s)</p>
        </div>
        <button onClick={() => navigate('/admin/images/upload')} className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all">
          + Upload New
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${categoryFilter === c ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/20'}`}
          >
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>

      {images.length === 0 && !loading ? (
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-500 dark:text-gray-400">No images found</p>
          <button onClick={() => navigate('/admin/images/upload')} className="mt-4 px-4 py-2 rounded-xl text-sm bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-all">Upload your first image</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map(img => (
              <div key={img.id} className="glass-card group">
                <div className="aspect-video bg-black/5 dark:bg-white/5 overflow-hidden">
                  <img src={img.url} alt={img.title || 'Image'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  {editingId === img.id ? (
                    <div className="space-y-2">
                      <input type="text" value={editData.title} onChange={e => setEditData(p => ({ ...p, title: e.target.value }))} placeholder="Title" className="w-full px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm outline-none focus:border-primary/50" />
                      <textarea value={editData.description} onChange={e => setEditData(p => ({ ...p, description: e.target.value }))} placeholder="Description" rows={2} className="w-full px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm outline-none focus:border-primary/50 resize-none" />
                      <div className="flex flex-wrap gap-2">
                        {['carousel', 'staff', 'gallery', 'uncategorized'].map(cat => (
                          <label key={cat} className="flex items-center gap-1 cursor-pointer">
                            <input type="checkbox" checked={editData.categories.includes(cat)} onChange={() => toggleEditCategory(cat)} className="w-3 h-3" />
                            <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">{cat}</span>
                          </label>
                        ))}
                      </div>
                      <input type="text" value={editData.subCategory} onChange={e => setEditData(p => ({ ...p, subCategory: e.target.value }))} placeholder="Sub-category" className="w-full px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm outline-none focus:border-primary/50" />
                      <div className="flex gap-2 pt-1">
                        <button onClick={saveEdit} className="flex-1 px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 text-sm hover:bg-green-500/30 transition-all">Save</button>
                        <button onClick={() => setEditingId(null)} className="flex-1 px-3 py-1.5 rounded-lg bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-sm hover:bg-gray-100 dark:hover:bg-white/20 transition-all">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{img.title || 'Untitled'}</p>
                      {img.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{img.description}</p>}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {(img.categories || [img.category]).map(cat => (
                          <span key={cat} className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">{cat}</span>
                        ))}
                        {img.subCategory && <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">{img.subCategory}</span>}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => startEdit(img)} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/20 transition-all">Edit</button>
                        <button onClick={() => setConfirmDelete(img)} className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all">Delete</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {loadingMore && (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {hasMore && !loadingMore && (
            <div ref={sentinelRef} className="h-4" />
          )}

          {!hasMore && images.length > 0 && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">All images loaded</p>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete Image"
        description="This will permanently delete the image from Cloudinary and the database. Continue?"
        confirmText="Delete"
        confirmLoadingText="Deleting..."
        isLoading={deleting}
        variant="danger"
      />
    </div>
  );
};

export default AdminImages;