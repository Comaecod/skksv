export const SCHOOL_CONFIG = {
  name: 'Sri Kanchi Kamakoti Sankara Vidyalaya',
  shortName: 'SKKSV Scholar',
  beta: true,
  correspondence: {
    name: 'M K Prabhakaran',
    salutation: 'Mr',
    alias: 'MKP',
    designation: 'Correspondent'
  },
  principal: {
    name: 'Padma Gayathri',
    salutation: 'Mrs',
    alias: 'PG',
    designation: 'Principal',
    qualifications: 'X AISSCE, XII AISSE, BSc (OU), B.Ed (Annamalai University), MA English (OU), MA Economics (IGNOU)'
  },
  director: {
    name: 'Bhavaraju V N U R Sekhar',
    salutation: 'Mr',
    designation: 'Director',
    qualifications: 'M.Sc., MBA'
  }
};

export const GRADING_SYSTEM = {
  A1: { min: 91, grade: 'A1', label: 'Outstanding', color: 'text-green-400' },
  A2: { min: 81, grade: 'A2', label: 'Excellent', color: 'text-green-500' },
  B1: { min: 71, grade: 'B1', label: 'Very Good', color: 'text-blue-400' },
  B2: { min: 61, grade: 'B2', label: 'Good', color: 'text-blue-500' },
  C1: { min: 51, grade: 'C1', label: 'Fair', color: 'text-yellow-400' },
  C2: { min: 41, grade: 'C2', label: 'Satisfactory', color: 'text-yellow-500' },
  D: { min: 33, grade: 'D', label: 'Pass', color: 'text-orange-400' },
  E: { min: 0, grade: 'E', label: 'Needs Improvement', color: 'text-red-400' }
};

export const EXAM_TYPES = {
  ASSESSMENT: 'Assessment',
  HOLIDAY_HOMEWORK: 'Holiday Homework'
};

export const SCREENS = {
  HOME: 'home',
  HOLIDAY_TYPE: 'holiday-type',
  CLASS: 'class',
  SUBJECT: 'subject',
  INTRO: 'intro',
  PREASSESSMENT: 'preassessment',
  STUDENT: 'student',
  QUIZ: 'quiz',
  RESULT: 'result',
  REPORTS: 'reports',
  CONTENT: 'content'
};

export const SUBJECTS = [
  { value: 1, label: 'Mathematics' },
  { value: 2, label: 'English' },
  { value: 3, label: 'Hindi' },
  { value: 4, label: 'Telugu' },
  { value: 5, label: 'Sanskrit' },
  { value: 6, label: 'Science' },
  { value: 7, label: 'Physics' },
  { value: 8, label: 'Biology' },
  { value: 9, label: 'Chemistry' },
  { value: 10, label: 'Social Science' },
  { value: 11, label: 'History' },
  { value: 12, label: 'Civics' },
  { value: 13, label: 'Geography' },
  { value: 14, label: 'Economics' },
  { value: 15, label: 'Computers' },
  { value: 16, label: 'EVS' },
];