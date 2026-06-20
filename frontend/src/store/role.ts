import { create } from 'zustand';
import { action } from '../lib/api';

interface RoleStore {
  isSuperAdmin: boolean | null;
  loaded: boolean;
  load: () => Promise<void>;
}

export const useRoleStore = create<RoleStore>((set, get) => ({
  isSuperAdmin: null,
  loaded: false,
  load: async () => {
    if (get().loaded) return;
    set({ loaded: true });
    try {
      const r = await action('/api/pri/identity/role', {});
      set({ isSuperAdmin: r?.is_superadmin === true });
    } catch {
      set({ isSuperAdmin: false });
    }
  },
}));
