import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

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

const STORAGE_VERSION = 1;
const STORAGE_KEY = `ehd_selected_user_v${STORAGE_VERSION}`;
const LEGACY_STORAGE_KEY = "ehd_selected_user";

function loadStored(): AppUser | null {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        localStorage.setItem(STORAGE_KEY, raw);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    }

    return raw ? (JSON.parse(raw) as AppUser) : null;
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
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
