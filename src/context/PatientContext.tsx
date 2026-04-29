import { createContext, ReactNode, useContext, useState, useEffect } from 'react';
import { Patient } from '../types';

interface PatientContextType {
  patient: Patient;
  setPatient: (patient: Patient) => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [patient, setPatientState] = useState<Patient>(() => {
    const stored = sessionStorage.getItem('patient');
    return stored ? JSON.parse(stored) : { weightGrams: 2500 };
  });

  useEffect(() => {
    sessionStorage.setItem('patient', JSON.stringify(patient));
  }, [patient]);

  const setPatient = (newPatient: Patient) => {
    setPatientState(newPatient);
  };

  return (
    <PatientContext.Provider value={{ patient, setPatient }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient debe usarse dentro de PatientProvider');
  }
  return context;
}
