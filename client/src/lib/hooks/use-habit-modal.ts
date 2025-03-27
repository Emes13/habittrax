import { create } from 'zustand';

type HabitModalState = {
  isOpen: boolean;
  editingHabitId: number | null;
  openModal: (habitId?: number) => void;
  closeModal: () => void;
};

export const useHabitModal = create<HabitModalState>((set) => ({
  isOpen: false,
  editingHabitId: null,
  openModal: (habitId = null) => set({ isOpen: true, editingHabitId: habitId }),
  closeModal: () => set({ isOpen: false, editingHabitId: null }),
}));
