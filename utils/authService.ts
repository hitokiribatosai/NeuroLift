import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  sendEmailVerification,
  User,
  AuthError
} from 'firebase/auth';
import { auth } from '../firebase';
import { securityMonitor } from './securityMonitor';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;
  private sessionStartTime: number | null = null;
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() { }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Sign up with email and password
  async signUp(email: string, password: string): Promise<AuthUser> {
    // Validate input
    if (!this.isValidEmail(email)) {
      throw new Error('Please enter a valid email address');
    }

    if (!this.isValidPassword(password)) {
      throw new Error('Password must be at least 8 characters long and contain uppercase, lowercase, and number');
    }

    try {
      securityMonitor.logEvent('auth_attempt', { action: 'signup', email });
      const result = await createUserWithEmailAndPassword(auth, email, password);
      this.sessionStartTime = Date.now();

      // Send email verification
      await this.sendVerificationEmail(result.user);

      securityMonitor.logEvent('auth_success', {
        action: 'signup',
        userId: result.user.uid,
        email: result.user.email
      });

      return this.mapFirebaseUser(result.user);
    } catch (error) {
      securityMonitor.logEvent('auth_failure', {
        action: 'signup',
        email,
        error: (error as AuthError).code
      });
      throw this.handleAuthError(error as AuthError);
    }
  }

   // Send verification email
   async sendVerificationEmail(user: User): Promise<void> {
     try {
       await sendEmailVerification(user);
     } catch (error) {
       console.error("Error sending verification email:", error);
       throw this.handleAuthError(error as AuthError);
     }
   }

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      securityMonitor.logEvent('auth_attempt', { action: 'signin', email });
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Check if email is verified
      if (!result.user.emailVerified) {
        throw new Error('Please verify your email address before signing in. Check your email for the verification link.');
      }

      this.sessionStartTime = Date.now();

      securityMonitor.logEvent('auth_success', {
        action: 'signin',
        userId: result.user.uid,
        email: result.user.email
      });

      return this.mapFirebaseUser(result.user);
    } catch (error) {
      securityMonitor.logEvent('auth_failure', {
        action: 'signin',
        email,
        error: (error as AuthError).code
      });
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

  // Input validation methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  private isValidPassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password) && password.length <= 128;
  }

  // Session management
  isSessionValid(): boolean {
    if (!this.sessionStartTime) return false;
    return Date.now() - this.sessionStartTime < this.SESSION_TIMEOUT;
  }

  refreshSession(): void {
    this.sessionStartTime = Date.now();
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

  // Enhanced error handling with security measures
  private handleAuthError(error: AuthError): Error {
    let message = 'An unexpected error occurred';
    let shouldLogSecurityEvent = false;

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered. Please sign in instead.';
        break;
      case 'auth/weak-password':
        message = 'Password must be at least 8 characters with uppercase, lowercase, and numbers.';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email address.';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password. Please check and try again.';
        shouldLogSecurityEvent = true;
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address.';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled. Please contact support.';
        shouldLogSecurityEvent = true;
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Account temporarily locked. Try again later.';
        shouldLogSecurityEvent = true;
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign in was cancelled.';
        break;
      case 'auth/popup-blocked':
        message = 'Popup was blocked. Please allow popups and try again.';
        break;
      case 'auth/requires-recent-login':
        message = 'Please sign in again for security reasons.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection.';
        break;
      default:
        message = 'Authentication failed. Please try again.';
        console.warn('Unhandled auth error:', error.code, error.message);
    }

    // Log security events (in production, send to monitoring service)
    if (shouldLogSecurityEvent) {
      console.warn('Security event:', error.code, {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }

    return new Error(message);
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();