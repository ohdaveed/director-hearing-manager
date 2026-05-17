import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type AppUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

type UserContextType = {
  appUser: AppUser | null;
  login: (user: AppUser) => void;
  logout: () => void;
};

const STORAGE_KEY = 'ehd_selected_user';

function loadStored(): AppUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    return null;
  }
}

const UserContext = createContext<UserContextType>({
  appUser: null,
  login: () => {},
  logout: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [appUser, setAppUser] = useState<AppUser | null>(loadStored);

  const login = useCallback((user: AppUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setAppUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAppUser(null);
  }, []);

  return (
    <UserContext.Provider value={{ appUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useAppUser() {
  return useContext(UserContext);
}
