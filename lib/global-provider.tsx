import { router } from "expo-router";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { getCurrentSession, getCurrentUser, getUserProfile, signOut } from "./appwrite";
import { VPNProvider } from "./vpn-context";

interface GlobalContextType {
  isLogged: boolean;
  user: User | null;
  loading: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
}

interface User {
  $id: string;
  name: string;
  email: string;
  avatar: string;
  createdAt: string;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

interface GlobalProviderProps {
  children: ReactNode;
}

export const GlobalProvider = ({ children }: GlobalProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setUser(null);
        return;
      }

      const userProfile = await getUserProfile(currentUser.$id);
      if (!userProfile) {
        // If no profile exists, user is authenticated but profile not created
        setUser({
          $id: currentUser.$id,
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar,
          createdAt: currentUser.$createdAt,
        });
        return;
      }

      // Use profile data if it exists
      setUser({
        $id: currentUser.$id,
        name: userProfile.name,
        email: userProfile.email,
        avatar: currentUser.avatar,
        createdAt: userProfile.createdAt,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut();
      setUser(null);
      router.replace('/welcomescreen');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        const session = await getCurrentSession();
        if (session) {
          await fetchUser();
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        setUser(null);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const refetch = async () => {
    setLoading(true);
    await fetchUser();
  };

  return (
    <GlobalContext.Provider
      value={{
        isLogged: !!user,
        user,
        loading,
        refetch,
        logout,
      }}
    >
      <VPNProvider>
        {children}
      </VPNProvider>
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }
  return context;
};

export default GlobalProvider;
