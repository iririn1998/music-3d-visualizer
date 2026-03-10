import { create } from 'zustand';

export interface AppError {
  id: string;
  message: string;
  type: 'warning' | 'error';
  dismissible: boolean;
}

interface ErrorStore {
  errors: AppError[];

  pushError: (error: Omit<AppError, 'id'>) => void;
  dismissError: (id: string) => void;
  clearErrors: () => void;
}

let errorIdCounter = 0;

export const useErrorStore = create<ErrorStore>((set) => ({
  errors: [],

  pushError: (error) =>
    set((state) => ({
      errors: [...state.errors, { ...error, id: String(++errorIdCounter) }],
    })),

  dismissError: (id) =>
    set((state) => ({
      errors: state.errors.filter((e) => e.id !== id),
    })),

  clearErrors: () => set({ errors: [] }),
}));
