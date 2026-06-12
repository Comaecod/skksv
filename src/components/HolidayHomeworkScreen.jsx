import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/contexts/AuthContext';
import { useLayout } from '../context/LayoutContext';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getSubjectsForClass, getExamConfig } from '../utils/examLoader';
import ClassSelectionScreen from './ClassSelectionScreen';
import SubjectSelectionScreen from './SubjectSelectionScreen';
import HolidayHomeworkContent from './HolidayHomeworkContent';
import EmptyState from './EmptyState';

const HolidayHomeworkScreen = () => {
  const navigate = useNavigate();
  const { userProfile: authUser } = useAuth();

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [examConfig, setExamConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  const profileClass = authUser?.studentClass;
  const [classNum, setClassNum] = useState(profileClass || null);
  const [subject, setSubject] = useState(null);
  const [screen, setScreen] = useState(profileClass ? 'subject' : 'class');

  const { setHideHeader, setHideFooter } = useLayout();

  useEffect(() => {
    const hide = screen === 'content';
    setHideHeader(hide);
    setHideFooter(hide);
    return () => { setHideHeader(false); setHideFooter(false); };
  }, [screen, setHideHeader, setHideFooter]);

  useEffect(() => {
    const loadClasses = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'examConfigs'),
          where('examType', '==', 'Holiday Homework')
        );
        const snapshot = await getDocs(q);
        const cls = new Set();
        snapshot.forEach(d => {
          const data = d.data();
          if (data.classNum) cls.add(data.classNum);
        });
        setClasses([...cls].sort((a, b) => Number(a) - Number(b)));
      } catch (err) {
        console.error('Error loading classes:', err);
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!classNum) { setSubjects([]); return; }
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
      if (!subject) { setExamConfig(null); return; }
      try {
        const config = await getExamConfig('Holiday Homework', classNum, subject);
        setExamConfig(config);
      } catch (err) {
        console.error('Error loading config:', err);
      }
    };
    loadConfig();
  }, [subject, classNum]);

  const goBack = () => {
    if (screen === 'subject' && !profileClass) { setScreen('class'); setClassNum(null); return; }
    if (screen === 'content') { setScreen('subject'); setSubject(null); return; }
    navigate('/');
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

  if (loading && !classes.length) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="glass-card p-8 text-center w-full max-w-md">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  switch (screen) {
    case 'class':
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <ClassSelectionScreen examType="Holiday Homework" classes={classes} onSelect={handleSelectClass} onBack={() => navigate('/')} isLoading={loading} />
        </div>
      );

    case 'subject':
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <SubjectSelectionScreen examType="Holiday Homework" classNum={classNum} subjects={subjects} isLoading={subjectsLoading} onSelect={handleSelectSubject} onBack={goBack} />
        </div>
      );

    case 'content':
      return examConfig && examConfig.isHolidayHomework ? (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <HolidayHomeworkContent config={examConfig} onBack={goBack} />
        </div>
      ) : (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <EmptyState />
        </div>
      );

    default:
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <EmptyState />
        </div>
      );
  }
};

export default HolidayHomeworkScreen;
