import { create } from 'zustand';

interface HabitModalStore {
  isOpen: boolean;
  editingHabitId: number | undefined;
  openModal: (habitId?: number) => void;
  closeModal: () => void;
}

export const useHabitModal = create<HabitModalStore>((set) => ({
  isOpen: false,
  editingHabitId: undefined,
  openModal: (habitId?: number) => set({ isOpen: true, editingHabitId: habitId }),
  closeModal: () => set({ isOpen: false, editingHabitId: undefined }),
}));
