import {
   createContext,
   useContext,
   useState,
   useEffect,
   useCallback,
   type ReactNode,
} from 'react';
import api from '@/lib/api';

type User = {
   id: number;
   email: string;
   name: string;
   role: 'ADMIN' | 'ORGANIZER';
};

type AuthContextType = {
   user: User | null;
   isAuthenticated: boolean;
   isLoading: boolean;
   login: (email: string, password: string) => Promise<User>;
   register: (
      code: string,
      name: string,
      email: string,
      password: string
   ) => Promise<void>;
   logout: () => void;
   hasRole: (role: string) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
   const [user, setUser] = useState<User | null>(null);
   const [isLoading, setIsLoading] = useState(true);

   // Restore session on mount
   useEffect(() => {
      const restoreSession = async () => {
         const refreshToken = localStorage.getItem('refreshToken');
         if (!refreshToken) {
            setIsLoading(false);
            return;
         }

         try {
            const { data } = await api.post('/auth/refresh', {
               refreshToken,
            });
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            setUser(data.user);
         } catch {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
         } finally {
            setIsLoading(false);
         }
      };

      restoreSession();
   }, []);

   const login = useCallback(
      async (email: string, password: string): Promise<User> => {
         const { data } = await api.post('/auth/login', { email, password });
         localStorage.setItem('accessToken', data.accessToken);
         localStorage.setItem('refreshToken', data.refreshToken);
         setUser(data.user);
         return data.user;
      },
      []
   );

   const register = useCallback(
      async (code: string, name: string, email: string, password: string) => {
         const { data } = await api.post('/auth/register', {
            code,
            name,
            email,
            password,
         });
         // Auto-login after successful registration
         localStorage.setItem('accessToken', data.accessToken);
         localStorage.setItem('refreshToken', data.refreshToken);
         setUser(data.user);
      },
      []
   );

   const logout = useCallback(() => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
         api.post('/auth/logout', { refreshToken }).catch(() => {});
      }
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
   }, []);

   const hasRole = useCallback(
      (role: string) => {
         return user?.role === role;
      },
      [user]
   );

   return (
      <AuthContext.Provider
         value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            register,
            logout,
            hasRole,
         }}
      >
         {children}
      </AuthContext.Provider>
   );
}

export function useAuth() {
   const context = useContext(AuthContext);
   if (!context) {
      throw new Error('useAuth must be used within an AuthProvider');
   }
   return context;
}
