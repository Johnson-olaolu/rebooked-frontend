import { create, type StateCreator } from "zustand";
import type { IUser } from "~/types/user";

export interface IUserSlice {
  user?: IUser;
  setUser: (user: IUser) => void;
}

export const createUserSlice: StateCreator<IUserSlice, [], [], IUserSlice> = (set, get) => ({
  setUser: (user) => set({ user }),
  user: undefined,
});
