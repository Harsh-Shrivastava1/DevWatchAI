"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Mail, Lock, User, X, Loader2, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userSession: {
    uid: string;
    email: string;
    name: string;
    photoURL?: string;
    token?: string;
  }) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [unverifiedUser, setUnverifiedUser] = useState<any>(null);

  if (!isOpen) return null;

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    setUnverifiedUser(null);

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const fbUser = userCredential.user;
      const idToken = await fbUser.getIdToken();

      // Send the token & user details to the backend API server
      try {
        const response = await fetch("http://127.0.0.1:4000/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            idToken,
            uid: fbUser.uid,
            email: fbUser.email || undefined,
            name: fbUser.displayName || "DevWatch User",
            photoURL: fbUser.photoURL || undefined
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to authenticate session with backend API");
        }

        const data = await response.json();
        onSuccess({
          uid: data.user.uid,
          email: data.user.email,
          name: data.user.name,
          photoURL: data.user.photoURL,
          token: data.token
        });
      } catch (backendErr) {
        console.error("Backend authentication fallback to local for Google sign-in:", backendErr);
        onSuccess({
          uid: fbUser.uid,
          email: fbUser.email || "google-user@devwatch.ai",
          name: fbUser.displayName || "DevWatch User",
          photoURL: fbUser.photoURL || undefined
        });
      }
    } catch (err: any) {
      console.error("Google Auth error:", err);
      let friendlyMessage = err.message;
      if (err.code === "auth/popup-closed-by-user") {
        friendlyMessage = "Google sign-in popup was closed before completing.";
      } else if (err.code === "auth/blocked-by-popup-trigger") {
        friendlyMessage = "Popup was blocked by your browser. Please allow popups.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!unverifiedUser) return;
    setLoading(true);
    setError(null);
    try {
      await sendEmailVerification(unverifiedUser);
      setInfoMessage("Verification link resent! Check your inbox.");
    } catch (err: any) {
      console.error("Resend error:", err);
      setError(err.message || "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    setUnverifiedUser(null);

    try {
      let userCredential;
      if (mode === "signup") {
        if (!name.trim()) {
          throw new Error("Please enter your name");
        }
        // Register using Firebase Client SDK
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        // Update profile name
        await updateProfile(fbUser, {
          displayName: name
        });

        // Send Email Verification
        await sendEmailVerification(fbUser);
        
        // Block immediate sign-in until verified
        await signOut(auth);
        setMode("signin");
        setInfoMessage(`Verification email sent to ${email}. Please check your inbox and verify your email before logging in.`);
        setLoading(false);
        return;
      } else {
        // Sign in using Firebase Client SDK
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        // Enforce email verification
        if (!fbUser.emailVerified) {
          setUnverifiedUser(fbUser);
          await signOut(auth);
          throw new Error("Your email address is not verified. Please verify your email before logging in.");
        }

        const idToken = await fbUser.getIdToken();

        // Send the token & user details to the backend API server
        try {
          const response = await fetch("http://127.0.0.1:4000/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              idToken,
              uid: fbUser.uid,
              email: fbUser.email || undefined,
              name: fbUser.displayName || name || "DevWatch User",
              photoURL: fbUser.photoURL || undefined
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || "Failed to authenticate session with backend API");
          }

          const data = await response.json();
          onSuccess({
            uid: data.user.uid,
            email: data.user.email,
            name: data.user.name,
            photoURL: data.user.photoURL,
            token: data.token
          });
        } catch (backendErr) {
          console.error("Backend authentication fallback to local:", backendErr);
          // Fallback to local session on fetch error to ensure smooth dev UX
          onSuccess({
            uid: fbUser.uid,
            email: fbUser.email || email,
            name: fbUser.displayName || name || "DevWatch User",
            photoURL: fbUser.photoURL || undefined
          });
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let friendlyMessage = err.message;
      if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "This email is already in use.";
      } else if (err.code === "auth/invalid-credential") {
        friendlyMessage = "Invalid email or password.";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "Password should be at least 6 characters.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  }

  function handleDemoAccess() {
    setLoading(true);
    setTimeout(() => {
      onSuccess({
        uid: "demo-user",
        email: "demo@devwatch.ai",
        name: "Demo User",
        photoURL: ""
      });
      setLoading(false);
    }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        {/* Card wrapper */}
        <Card className="overflow-hidden border border-neutral-100 bg-white p-6 shadow-2xl rounded-2xl">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/10 mb-3">
              <svg className="h-6.5 w-6.5 text-white" viewBox="0 0 40 40" fill="none">
                <path d="M20 2L35 11V29L20 38L5 29V11L20 2Z" stroke="currentColor" strokeWidth="3.2" strokeLinejoin="round"/>
                <path d="M16 15L11 20L16 25" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M24 15L29 20L24 25" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-xs text-neutral-400 mt-1 font-medium">
              {mode === "signin"
                ? "Enter your credentials to access the workspace"
                : "Get started with your collaborative AI dev agent"}
            </p>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-neutral-50 p-1 rounded-xl mb-5">
            <button
              onClick={() => {
                setMode("signin");
                setError(null);
                setInfoMessage(null);
                setUnverifiedUser(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                mode === "signin"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode("signup");
                setError(null);
                setInfoMessage(null);
                setUnverifiedUser(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                mode === "signup"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Info Status Message */}
          {infoMessage && (
            <div className="flex gap-2 rounded-xl bg-indigo-50/50 border border-indigo-100 p-3 mb-4 text-xs font-semibold text-indigo-600">
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex flex-col gap-2 rounded-xl bg-rose-50/50 border border-rose-100 p-3 mb-4 text-xs font-semibold text-rose-600">
              <div className="flex gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              {unverifiedUser && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="mt-2 text-left text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Resend Verification Email
                </button>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-neutral-400" size={15} />
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-neutral-100 bg-neutral-50/50 focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500 transition font-medium"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-neutral-400" size={15} />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-neutral-100 bg-neutral-50/50 focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500 transition font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-neutral-400" size={15} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-neutral-100 bg-neutral-50/50 focus:bg-white outline-none focus:ring-1 focus:ring-indigo-500 transition font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-600/10 hover:shadow-lg transition hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Authenticating...
                </>
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-neutral-100"></div>
            <span className="flex-shrink mx-3 text-[10px] font-bold uppercase text-neutral-400 tracking-wider font-semibold">or</span>
            <div className="flex-grow border-t border-neutral-100"></div>
          </div>

          {/* Social Sign-In Buttons */}
          <div className="space-y-2.5">
            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-neutral-200 bg-white py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign In with Google
            </button>

            {/* Demo Access Button */}
            <button
              onClick={handleDemoAccess}
              disabled={loading}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-indigo-100 bg-indigo-50/20 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50/55 transition disabled:opacity-50"
            >
              <Sparkles size={13} />
              Continue as Guest (Demo Mode)
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
