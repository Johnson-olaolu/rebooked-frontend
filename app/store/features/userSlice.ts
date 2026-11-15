import type { StateCreator } from "zustand";
import type { IUser } from "~/types/user";
import type { IStore } from "../store";

export interface IUserSlice {
  user?: IUser;
  setUser: (user: IUser) => void;
}

export const createUserSlice: StateCreator<IStore, [], [], IUserSlice> = (set) => ({
  user: undefined,
  setUser: (user) => set({ user }),
});
