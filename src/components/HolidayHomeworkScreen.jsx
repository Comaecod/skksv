import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHolidayTypes, getHolidayClassesForType, getSubjectsForClass, getExamConfig } from '../utils/examLoader';
import HolidayTypeScreen from './HolidayTypeScreen';
import ClassSelectionScreen from './ClassSelectionScreen';
import SubjectSelectionScreen from './SubjectSelectionScreen';
import HolidayHomeworkContent from './HolidayHomeworkContent';
import EmptyState from './EmptyState';

const HolidayHomeworkScreen = () => {
  const navigate = useNavigate();
  
  const [holidayTypes, setHolidayTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examConfig, setExamConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const [holidayType, setHolidayType] = useState(null);
  const [classNum, setClassNum] = useState(null);
  const [subject, setSubject] = useState(null);
  const [screen, setScreen] = useState('holiday-type');

  useEffect(() => {
    const loadHolidayTypes = async () => {
      setLoading(true);
      try {
        const types = await getHolidayTypes();
        setHolidayTypes(types);
      } catch (err) {
        console.error('Error loading holiday types:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHolidayTypes();
  }, []);

  useEffect(() => {
    const loadClasses = async () => {
      if (!holidayType) {
        setClasses([]);
        return;
      }
      setLoading(true);
      try {
        const cls = await getHolidayClassesForType(holidayType);
        setClasses(cls);
      } catch (err) {
        console.error('Error loading classes:', err);
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, [holidayType]);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!classNum) {
        setSubjects([]);
        return;
      }
      setSubjectsLoading(true);
      try {
        const subs = await getSubjectsForClass('Holiday Homework', classNum);
        setSubjects(subs);
      } catch (err) {
        console.error('Error loading subjects:', err);
      } finally {
        setSubjectsLoading(false);
      }
    };
    loadSubjects();
  }, [classNum]);

  useEffect(() => {
    const loadConfig = async () => {
      if (!subject) {
        setExamConfig(null);
        return;
      }
      try {
        const config = await getExamConfig('Holiday Homework', classNum, subject, holidayType);
        setExamConfig(config);
      } catch (err) {
        console.error('Error loading config:', err);
      }
    };
    loadConfig();
  }, [subject, classNum, holidayType]);

  const goBack = () => {
    if (screen === 'class') {
      setScreen('holiday-type');
      setHolidayType(null);
      return;
    }
    if (screen === 'subject') {
      setScreen('class');
      setClassNum(null);
      return;
    }
    if (screen === 'content') {
      setScreen('subject');
      setSubject(null);
      return;
    }
    navigate('/');
  };

  const handleSelectHolidayType = (type) => {
    setHolidayType(type);
    setClassNum(null);
    setSubject(null);
    setScreen('class');
  };

  const handleSelectClass = (num) => {
    setClassNum(num);
    setSubject(null);
    setScreen('subject');
  };

  const handleSelectSubject = (subj) => {
    setSubject(subj);
    setScreen('content');
  };

  if (loading && !holidayTypes.length) {
    return (
      <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center w-full max-w-md">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  switch (screen) {
    case 'holiday-type':
      return (
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
          <HolidayTypeScreen holidayTypes={holidayTypes} onSelect={handleSelectHolidayType} onBack={() => navigate('/')} />
        </div>
      );

    case 'class':
      return (
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
          <ClassSelectionScreen examType="Holiday Homework" classes={classes} onSelect={handleSelectClass} onBack={goBack} isLoading={loading} />
        </div>
      );

    case 'subject':
      return (
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
          <SubjectSelectionScreen examType="Holiday Homework" classNum={classNum} subjects={subjects} isLoading={subjectsLoading} onSelect={handleSelectSubject} onBack={goBack} />
        </div>
      );

    case 'content':
      return examConfig && examConfig.isHolidayHomework ? (
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
          <HolidayHomeworkContent config={examConfig} onBack={goBack} />
        </div>
      ) : (
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
          <EmptyState />
        </div>
      );

    default:
      return (
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
          <HolidayTypeScreen holidayTypes={holidayTypes} onSelect={handleSelectHolidayType} onBack={() => navigate('/')} />
        </div>
      );
  }
};

export default HolidayHomeworkScreen;