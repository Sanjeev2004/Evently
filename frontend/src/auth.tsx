import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import type { ApiResponse, User } from "./types";
type Auth = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (v: {
    name: string;
    email: string;
    password: string;
    role: "USER" | "ORGANIZER";
  }) => Promise<void>;
  logout: () => Promise<void>;
};
const AuthContext = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!localStorage.getItem("accessToken")) {
      setLoading(false);
      return;
    }
    api
      .get<ApiResponse<User>>("/auth/me")
      .then((r) => setUser(r.data.data))
      .catch(() => localStorage.removeItem("accessToken"))
      .finally(() => setLoading(false));
  }, []);
  const login = async (email: string, password: string) => {
    const { data } = await api.post<
      ApiResponse<{ user: User; accessToken: string }>
    >("/auth/login", { email, password });
    localStorage.setItem("accessToken", data.data.accessToken);
    setUser(data.data.user);
  };
  const register = async (v: {
    name: string;
    email: string;
    password: string;
    role: "USER" | "ORGANIZER";
  }) => {
    const { data } = await api.post<
      ApiResponse<{ user: User; accessToken: string }>
    >("/auth/register", v);
    localStorage.setItem("accessToken", data.data.accessToken);
    setUser(data.data.user);
  };
  const logout = async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("accessToken");
    setUser(null);
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
// The hook intentionally shares its module with the provider that owns its context.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const v = useContext(AuthContext);
  if (!v) throw new Error("AuthProvider missing");
  return v;
};
