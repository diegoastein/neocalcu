import { createContext, ReactNode, useContext, useState } from 'react';
import { Patient } from '../types';

export interface SavedPatient {
  id: string;
  label: string;
  patient: Patient;
}

interface PatientContextType {
  patient: Patient;
  setPatient: (patient: Patient) => void;
  savedPatients: SavedPatient[];
  activeId: string;
  switchPatient: (id: string) => void;
  addPatient: () => string;
  removePatient: (id: string) => void;
  renamePatient: (id: string, label: string) => void;
}

const STORAGE_KEY = 'neo_patients';
const ACTIVE_KEY = 'neo_active_patient';
const MAX_PATIENTS = 4;

export { MAX_PATIENTS };

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function init(): { patients: SavedPatient[]; activeId: string } {
  let patients: SavedPatient[] = [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) patients = JSON.parse(stored);
  } catch {}

  if (patients.length === 0) {
    // Migrar desde sessionStorage si existe
    let initial: Patient = { weightGrams: 0 };
    try {
      const legacy = sessionStorage.getItem('patient');
      if (legacy) initial = JSON.parse(legacy);
    } catch {}
    const id = generateId();
    patients = [{ id, label: 'Paciente', patient: initial }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
  }

  let activeId = localStorage.getItem(ACTIVE_KEY) ?? '';
  if (!patients.find((p) => p.id === activeId)) {
    activeId = patients[0].id;
    localStorage.setItem(ACTIVE_KEY, activeId);
  }

  return { patients, activeId };
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [savedPatients, setSavedPatients] = useState<SavedPatient[]>(() => init().patients);
  const [activeId, setActiveId] = useState<string>(() => init().activeId);

  const persist = (patients: SavedPatient[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
    setSavedPatients(patients);
  };

  const active = savedPatients.find((p) => p.id === activeId) ?? savedPatients[0];
  const patient = active?.patient ?? { weightGrams: 0 };

  const setPatient = (newPatient: Patient) => {
    persist(savedPatients.map((p) => (p.id === activeId ? { ...p, patient: newPatient } : p)));
  };

  const switchPatient = (id: string) => {
    localStorage.setItem(ACTIVE_KEY, id);
    setActiveId(id);
  };

  const addPatient = (): string => {
    if (savedPatients.length >= MAX_PATIENTS) return activeId;
    const id = generateId();
    const newSaved: SavedPatient = {
      id,
      label: `Paciente ${savedPatients.length + 1}`,
      patient: { weightGrams: 0 },
    };
    persist([...savedPatients, newSaved]);
    switchPatient(id);
    return id;
  };

  const removePatient = (id: string) => {
    if (savedPatients.length <= 1) return;
    const updated = savedPatients.filter((p) => p.id !== id);
    persist(updated);
    if (activeId === id) switchPatient(updated[0].id);
  };

  const renamePatient = (id: string, label: string) => {
    persist(savedPatients.map((p) => (p.id === id ? { ...p, label } : p)));
  };

  return (
    <PatientContext.Provider
      value={{ patient, setPatient, savedPatients, activeId, switchPatient, addPatient, removePatient, renamePatient }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const context = useContext(PatientContext);
  if (!context) throw new Error('usePatient debe usarse dentro de PatientProvider');
  return context;
}
