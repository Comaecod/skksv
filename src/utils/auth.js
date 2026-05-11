/**
 * Authentication Utilities
 * Handles key validation with master key support
 */

export const MASTER_KEY = import.meta.env.VITE_ADMIN_KEY || 'AdminKey123';

export const isMasterKey = (key) => key === MASTER_KEY;

export const validateKey = (inputKey, config) => {
  const key = inputKey?.trim();
  if (!key) return false;
  
  if (isMasterKey(key)) return true;
  
  const preassessmentKey = config?.preassessmentsecretkey;
  const secretKey = config?.secretKey;
  const teacherKey = config?.teacherSecretKey;
  
  if (preassessmentKey && key === preassessmentKey) return true;
  if (secretKey && key === secretKey) return true;
  if (teacherKey && key === teacherKey) return true;
  
  return false;
};

export const validatePreassessment = (inputKey, config) => {
  const key = inputKey?.trim();
  if (!key) return false;
  
  if (isMasterKey(key)) return true;
  if (config?.preassessmentsecretkey && key === config.preassessmentsecretkey) return true;
  
  return false;
};

export const validateTeacherKey = (inputKey, config) => {
  const key = inputKey?.trim();
  if (!key) return false;
  
  if (isMasterKey(key)) return true;
  if (config?.teacherSecretKey && key === config.teacherSecretKey) return true;
  if (config?.preassessmentsecretkey && key === config.preassessmentsecretkey) return true;
  
  return false;
};

export const validateAnswerReveal = (inputKey, config) => {
  const key = inputKey?.trim();
  if (!key) return false;
  
  if (isMasterKey(key)) return true;
  if (config?.secretKey && key === config.secretKey) return true;
  
  return false;
};
