'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GithubAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGitHub: () => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        localStorage.setItem('authToken', token);
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || undefined,
        });
      } else {
        localStorage.removeItem('authToken');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGitHub = async () => {
    const provider = new GithubAuthProvider();
    // Add required scopes for accessing repositories
    provider.addScope('repo');
    provider.addScope('read:user');

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      const githubToken = credential?.accessToken;

      if (!githubToken) {
        throw new Error('Failed to get GitHub access token');
      }

      const firebaseUser = result.user;

      // Get GitHub username from the provider data
      const githubUsername = 
        firebaseUser.providerData[0]?.displayName || 
        firebaseUser.displayName || 
        'unknown';

      // Store user profile in Firestore
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
        image: firebaseUser.photoURL || '',
        githubUsername: githubUsername,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // Store GitHub token in private subcollection
      await setDoc(doc(db, 'users', firebaseUser.uid, 'private', 'github_token'), {
        accessToken: githubToken,
        updatedAt: new Date().toISOString(),
      });

    } catch (error) {
      console.error('GitHub sign-in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const getIdToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGitHub, logout, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
