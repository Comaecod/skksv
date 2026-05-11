import { useState } from 'react';

const ALLOWED_TYPES = ['pdf', 'docx', 'jpg', 'png', 'zip'];

const TimedProjectScreen = ({ assessment, onComplete, onBack }) => {
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const config = assessment || {};
  const allowFileUpload = config.allowFileUpload !== false;
  const allowedFileTypes = config.allowedFileTypes || ALLOWED_TYPES;
  const maxSizeMB = config.maxFileSizeMB || 10;
  const needsTopic = config.studentInputs?.topic !== false;
  const needsDescription = config.studentInputs?.description !== false;

  const validateForm = () => {
    const errs = {};
    if (needsTopic && !topic.trim()) errs.topic = 'Topic is required';
    if (needsDescription && !description.trim()) errs.description = 'Description is required';
    if (file && allowFileUpload) {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!allowedFileTypes.includes(ext)) errs.file = `Allowed types: ${allowedFileTypes.join(', ')}`;
      else if (file.size > maxSizeMB * 1024 * 1024) errs.file = `File must be under ${maxSizeMB}MB`;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isUploading) return;
    setSubmitError('');
    setUploadProgress(0);
    setIsUploading(!!file);

    try {
      await onComplete({ topic: topic.trim(), description: description.trim() }, file, setUploadProgress);
      setUploadProgress(100);
      await new Promise(r => setTimeout(r, 400));
      setSubmitted(true);
    } catch (err) {
      setUploadProgress(0);
      setSubmitError(err.message || 'Failed to submit project. Please check your network connection and try again.');
    }
    setIsUploading(false);
  };

  return (
    <div className="glass-card w-full max-w-lg animate-slideUp">
      <div className="text-center mb-6 sm:mb-8">
        <div className="text-5xl mb-4">📁</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{config.title || 'Project Submission'}</h2>
        <p className="text-gray-500 dark:text-gray-400">{config.projectDescription || 'Submit your project'}</p>
      </div>

      {submitted ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Submission Received!</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Your project has been submitted successfully.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
          >
            ← Back
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {needsTopic && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2" htmlFor="topic">Topic</label>
              <input
                type="text"
                id="topic"
                className={`w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all ${errors.topic ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-primary/50'}`}
                placeholder="Enter project topic"
                value={topic}
                onChange={e => { setTopic(e.target.value); if (errors.topic) setErrors(p => ({ ...p, topic: '' })); }}
              />
              {errors.topic && <p className="text-red-400 text-sm mt-1">⚠️ {errors.topic}</p>}
            </div>
          )}

          {needsDescription && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2" htmlFor="description">Description</label>
              <textarea
                id="description"
                rows={4}
                className={`w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all resize-none ${errors.description ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-primary/50'}`}
                placeholder="Describe your project"
                value={description}
                onChange={e => { setDescription(e.target.value); if (errors.description) setErrors(p => ({ ...p, description: '' })); }}
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">⚠️ {errors.description}</p>}
            </div>
          )}

          {allowFileUpload && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Upload File</label>
              <div className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${file ? 'border-green-500/50 bg-green-500/5' : 'border-gray-300 dark:border-white/20 hover:border-primary/50'}`}>
                {file ? (
                  <div>
                    <div className="text-3xl mb-2">📄</div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium break-all">{file.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    <button type="button" onClick={() => setFile(null)} className="mt-2 text-xs text-red-400 hover:text-red-300">Remove</button>
                  </div>
                ) : (
                  <div>
                    <div className="text-3xl mb-2">📎</div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Drop file here or click to browse</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Allowed: {allowedFileTypes.join(', ')} | Max: {maxSizeMB}MB</p>
                    <input
                      type="file"
                      accept={allowedFileTypes.map(t => `.${t}`).join(',')}
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) {
                          const ext = f.name.split('.').pop()?.toLowerCase();
                          if (!allowedFileTypes.includes(ext)) {
                            setErrors(p => ({ ...p, file: `Allowed types: ${allowedFileTypes.join(', ')}` }));
                            return;
                          }
                          if (f.size > maxSizeMB * 1024 * 1024) {
                            setErrors(p => ({ ...p, file: `File must be under ${maxSizeMB}MB` }));
                            return;
                          }
                          setFile(f);
                          if (errors.file) setErrors(p => ({ ...p, file: '' }));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>
              {errors.file && <p className="text-red-400 text-sm mt-1">⚠️ {errors.file}</p>}
              {isUploading && (
                <div className="mt-3">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-secondary h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${Math.min(uploadProgress, 100)}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 text-center">{Math.round(uploadProgress)}% uploaded</p>
                </div>
              )}
            </div>
          )}

          {submitError && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <span className="font-medium">⚠️ {submitError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className="w-full px-8 py-4 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all text-lg mb-3 disabled:opacity-50"
          >
            {isUploading ? 'Uploading...' : 'Submit Project'}
          </button>

          <div className="text-center">
            <button type="button" className="px-6 py-3 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all" onClick={onBack}>
              ← Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default TimedProjectScreen;
