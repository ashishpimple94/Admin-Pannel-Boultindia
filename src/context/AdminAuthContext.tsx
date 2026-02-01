import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
  name: string;
  lastLogin?: string;
  createdAt: string;
}

interface AdminAuthContextType {
  user: AdminUser | null;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

// Default admin credentials (in production, this should be in backend)
const DEFAULT_ADMIN_USERS = [
  {
    id: 'ADMIN_001',
    username: 'admin',
    email: 'admin@boultindia.com',
    password: 'admin123',
    role: 'super_admin' as const,
    name: 'Boult Admin',
    createdAt: '2026-01-30T00:00:00.000Z'
  },
  {
    id: 'ADMIN_002',
    username: 'boultadmin',
    email: 'support@boultindia.com',
    password: 'boult2026',
    role: 'admin' as const,
    name: 'Boult Support',
    createdAt: '2026-01-30T00:00:00.000Z'
  }
];

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('adminAuthUser');

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored admin user data:', error);
        localStorage.removeItem('adminAuthUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Basic validation
      if (!username || !password) {
        return { success: false, error: 'Username and password are required' };
      }
      
      // Try backend first, fallback to default admin users
      try {
        const response = await fetch(`${backendUrl}/api/admin/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setUser(data.user);
          localStorage.setItem('adminAuthUser', JSON.stringify(data.user));
          return { success: true };
        } else {
          // If backend fails, try default admin users
          console.log('Backend login failed, trying default credentials');
        }
      } catch (backendError) {
        console.log('Backend not available, using default admin authentication');
      }
      
      // Fallback: Check default admin users
      const adminUser = DEFAULT_ADMIN_USERS.find(u => 
        (u.username === username || u.email === username) && u.password === password
      );
      
      if (adminUser) {
        const { password: _, ...userWithoutPassword } = adminUser;
        const authenticatedUser = {
          ...userWithoutPassword,
          lastLogin: new Date().toISOString()
        };
        
        setUser(authenticatedUser);
        localStorage.setItem('adminAuthUser', JSON.stringify(authenticatedUser));
        return { success: true };
      } else {
        return { success: false, error: 'Invalid username or password' };
      }
      
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('adminAuthUser');
  };

  const value: AdminAuthContextType = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};