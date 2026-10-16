import { create } from 'zustand'
import type { PageId } from '../types'

interface NavStore {
  page: PageId
  navigate: (page: PageId) => void
}

export const useNavStore = create<NavStore>((set) => ({
  page: 'dashboard',
  navigate: (page) => set({ page }),
}))
