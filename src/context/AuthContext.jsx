import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { DEMO_ACCOUNTS, INITIAL_STUDENTS, DEFAULT_SCHEDULE } from '../data/initialData';
import { TP_DATA } from '../data/tpData';

const readStoredValue = (key, fallback) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    return fallback;
  }
};

const migrateStudentProfile = (student) => {
  if (!student) return student;

  const migratedStudent = { ...student };
  if (migratedStudent.homeroomTeacher === 'Bu Nurhayati, S.Pd') {
    migratedStudent.homeroomTeacher = 'Ustadz Iski';
  }
  if (migratedStudent.className === 'Kelas 4A - Bintang Cemerlang') {
    migratedStudent.className = 'Kelas 5 SDQ - Madani Al washiyyah';
  }

  return migratedStudent;
};

const migrateScheduleProfile = (schedule) => ({
  ...schedule,
  teacherMapping: (schedule.teacherMapping || DEFAULT_SCHEDULE.teacherMapping).map((teacher) => {
    if (teacher.name === 'Bu Nurhayati, S.Pd' || teacher.name === 'Bu Nurhayati') {
      return {
        ...teacher,
        name: 'Ustadz Iski',
        role: 'Guru Kelas / Wali Kelas',
        mapel: 'Matematika, B. Indonesia, IPAS, Seni Rupa, Pancasila, B. Arab, PAI Nasional, PAI Lokal, Tahfidz',
        avatar: 'https://i.pinimg.com/1200x/1d/c1/39/1dc139c14c38e85d8c05f5d250df1743.jpg'
      };
    }
    const defaultTeacher = DEFAULT_SCHEDULE.teacherMapping.find((item) => item.name === teacher.name);
    return { ...defaultTeacher, ...teacher, avatar: teacher.avatar || defaultTeacher?.avatar || '' };
  })
});

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    return readStoredValue('eduprogress_user', null);
  });

  const [selectedStudent, setSelectedStudent] = useState(() => {
    return migrateStudentProfile(readStoredValue('eduprogress_student', INITIAL_STUDENTS[0]));
  });

  const [students, setStudents] = useState(() => {
    const storedStudents = readStoredValue('eduprogress_students', INITIAL_STUDENTS);
    return storedStudents.map(migrateStudentProfile);
  });
  const [tpData, setTpData] = useState(() => readStoredValue('eduprogress_tp_data', TP_DATA));
  const [scheduleData, setScheduleData] = useState(() => migrateScheduleProfile(readStoredValue('eduprogress_schedule_data', DEFAULT_SCHEDULE)));

  useEffect(() => {
    localStorage.setItem('eduprogress_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('eduprogress_student', JSON.stringify(selectedStudent));
  }, [selectedStudent]);

  useEffect(() => {
    localStorage.setItem('eduprogress_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('eduprogress_tp_data', JSON.stringify(tpData));
  }, [tpData]);

  useEffect(() => {
    localStorage.setItem('eduprogress_schedule_data', JSON.stringify(scheduleData));
  }, [scheduleData]);

  useEffect(() => {
    if (!students.length) return;
    const currentStudentStillExists = students.some(student => student.id === selectedStudent?.id);
    if (!currentStudentStillExists) {
      setSelectedStudent(students[0]);
    }
  }, [students, selectedStudent]);

  useEffect(() => {
    const updatedStudent = students.find(student => student.id === selectedStudent?.id);
    if (updatedStudent && updatedStudent !== selectedStudent) {
      setSelectedStudent(updatedStudent);
    }
  }, [students, selectedStudent]);

  const loginWithRole = (roleName) => {
    const foundAcc = DEMO_ACCOUNTS.find(acc => acc.role === roleName) || DEMO_ACCOUNTS[0];
    setUser(foundAcc);
    return foundAcc;
  };

  const switchStudent = (studentId) => {
    const found = students.find(s => s.id === studentId);
    if (found) {
      setSelectedStudent(found);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const resetAllData = () => {
    setStudents(INITIAL_STUDENTS);
    setSelectedStudent(INITIAL_STUDENTS[0]);
    setTpData(TP_DATA);
    setScheduleData(DEFAULT_SCHEDULE);
  };

  return (
    <AuthContext.Provider value={{
      user,
      setUser,
      loginWithRole,
      selectedStudent,
      setSelectedStudent,
      switchStudent,
      students,
      setStudents,
      tpData,
      setTpData,
      scheduleData,
      setScheduleData,
      logout,
      demoAccounts: DEMO_ACCOUNTS,
      resetAllData
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
