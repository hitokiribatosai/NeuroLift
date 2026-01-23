import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';
import { auth } from '../firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Sign up with email and password
  async signUp(email: string, password: string): Promise<AuthUser> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return this.mapFirebaseUser(result.user);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return this.mapFirebaseUser(result.user);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<AuthUser> {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      const result = await signInWithPopup(auth, provider);
      return this.mapFirebaseUser(result.user);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw this.handleAuthError(error as AuthError);
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback(this.mapFirebaseUser(user));
      } else {
        callback(null);
      }
    });
  }

  // Map Firebase user to our AuthUser interface
  private mapFirebaseUser(user: User): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
  }

  // Handle Firebase auth errors
  private handleAuthError(error: AuthError): Error {
    let message = 'An unexpected error occurred';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign in was cancelled';
        break;
      case 'auth/popup-blocked':
        message = 'Popup was blocked by browser. Please allow popups and try again';
        break;
      default:
        message = error.message;
    }

    return new Error(message);
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();