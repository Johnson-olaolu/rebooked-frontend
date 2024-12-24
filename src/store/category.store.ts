import { ICategory } from "@/services/types";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface CategoryState {
  categories: ICategory[];
  setCategories: (categories: ICategory[]) => void;
  addCategory: (category: ICategory) => void;
  updateCategory: (updatedCategory: ICategory) => void;
  deleteCategory: (categoryId: string) => void;
  clearCategories: () => void;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set) => ({
      categories: [],
      setCategories: (categories) => set({ categories }),
      addCategory: (category) =>
        set((state) => ({
          categories: [...state.categories, category],
        })),
      updateCategory: (updatedCategory) =>
        set((state) => ({
          categories: state.categories.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat)),
        })),
      deleteCategory: (categoryId) =>
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== categoryId),
        })),
      clearCategories: () => set({ categories: [] }),
    }),
    {
      name: "category-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        categories: state.categories,
      }),
    }
  )
);
