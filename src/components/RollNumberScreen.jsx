import { useState, useCallback, useRef } from 'react';
import { formatName } from '../utils/format';

const RollNumberScreen = ({ onStartQuiz, questionsCount, onBack }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    rollNumber: ''
  });
  const [errors, setErrors] = useState({});
  const firstInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.rollNumber.trim()) {
      newErrors.rollNumber = 'Roll number is required';
    } else if (!/^\d+$/.test(formData.rollNumber.trim())) {
      newErrors.rollNumber = 'Must be numeric';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onStartQuiz({
        firstName: formatName(formData.firstName),
        lastName: formatName(formData.lastName),
        rollNumber: Number(formData.rollNumber.trim()) || formData.rollNumber.trim()
      });
    } else {
      if (errors.firstName || errors.lastName || errors.rollNumber) {
        const firstErrorField = Object.keys(errors)[0];
        const errorInput = document.getElementById(firstErrorField);
        if (errorInput) errorInput.focus();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'BUTTON') {
      e.preventDefault();
      const form = e.target.form;
      const index = Array.from(form.elements).indexOf(e.target);
      if (index < form.elements.length - 1) {
        form.elements[index + 1].focus();
      }
    }
  };

  return (
    <div className="glass-card w-full max-w-md animate-slideUp" role="region" aria-labelledby="student-details-heading">
      <div className="text-center mb-6 sm:mb-8">
        <div className="text-4xl sm:text-5xl mb-4" aria-hidden="true">✍️</div>
        <h2 id="student-details-heading" className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Student Details
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg mt-2">
          Fill in your details to begin
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2" htmlFor="firstName">
            <span aria-hidden="true">👤</span> First Name
          </label>
          <input
            ref={firstInputRef}
            type="text"
            id="firstName"
            name="firstName"
            className={`w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all ${errors.firstName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20'}`}
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoComplete="given-name"
            aria-required="true"
            aria-invalid={errors.firstName ? 'true' : 'false'}
            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
          />
          {errors.firstName && (
            <p id="firstName-error" className="text-red-400 text-sm mt-1 flex items-center gap-1" role="alert">
              <span aria-hidden="true">⚠️</span> {errors.firstName}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2" htmlFor="lastName">
            <span aria-hidden="true">👤</span> Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            className={`w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all ${errors.lastName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20'}`}
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoComplete="family-name"
            aria-required="true"
            aria-invalid={errors.lastName ? 'true' : 'false'}
            aria-describedby={errors.lastName ? 'lastName-error' : undefined}
          />
          {errors.lastName && (
            <p id="lastName-error" className="text-red-400 text-sm mt-1 flex items-center gap-1" role="alert">
              <span aria-hidden="true">⚠️</span> {errors.lastName}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2" htmlFor="rollNumber">
            <span aria-hidden="true">🔢</span> Roll Number
          </label>
          <input
            type="text"
            id="rollNumber"
            name="rollNumber"
            className={`w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all ${errors.rollNumber ? 'border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/20'}`}
            placeholder="Enter your roll number"
            value={formData.rollNumber}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            aria-required="true"
            aria-invalid={errors.rollNumber ? 'true' : 'false'}
            aria-describedby={errors.rollNumber ? 'rollNumber-error' : undefined}
          />
          {errors.rollNumber && (
            <p id="rollNumber-error" className="text-red-400 text-sm mt-1 flex items-center gap-1" role="alert">
              <span aria-hidden="true">⚠️</span> {errors.rollNumber}
            </p>
          )}
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/20 dark:bg-primary/20 text-sm" role="status" aria-live="polite">
            <span aria-hidden="true">📝</span>
            <span>{questionsCount} questions will be selected randomly</span>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full px-8 py-4 rounded-xl font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 transition-all text-lg mb-3"
          aria-label="Begin Quiz"
        >
          Begin Quiz <span aria-hidden="true">🏁</span>
        </button>
        
        <div className="text-center">
          <button 
            type="button" 
            className="px-6 py-3 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all" 
            onClick={onBack}
            aria-label="Go back to previous screen"
          >
            ← Back
          </button>
        </div>
      </form>
    </div>
  );
};

export default RollNumberScreen;
