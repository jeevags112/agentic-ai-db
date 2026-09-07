import React, { useState } from "react";
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInAnonymously 
} from "../lib/firebase";
import { Database, LogIn, Sparkles, UserPlus, ShieldAlert, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

interface AuthScreenProps {
  onLocalSignIn: () => void;
}

export default function AuthScreen({ onLocalSignIn }: AuthScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRestrictedFirebase, setIsRestrictedFirebase] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setIsRestrictedFirebase(false);
    setLoading(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered.");
      } else if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "auth/operation-not-allowed" || err.message?.includes("operation-not-allowed")) {
        setError("Firebase Sign-In is not enabled. Go to your Firebase Console > Authentication > Sign-in method, and enable 'Email/Password' & 'Anonymous'. Alternatively, click 'Launch Local Sandbox Mode' below to run without Firebase.");
        setIsRestrictedFirebase(true);
      } else if (err.code === "auth/admin-restricted-operation" || err.message?.includes("admin-restricted-operation")) {
        setError("Firebase Guest sign-in is restricted or not enabled. Please enable 'Anonymous' authentication in the Firebase Console, or click 'Launch Local Sandbox Mode' below.");
        setIsRestrictedFirebase(true);
      } else {
        setError(err.message || "Authentication failed.");
        if (err.code?.includes("restricted") || err.message?.includes("restricted") || err.code?.includes("not-allowed") || err.message?.includes("not-allowed")) {
          setIsRestrictedFirebase(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setError("");
    setIsRestrictedFirebase(false);
    setLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/operation-not-allowed" || err.message?.includes("operation-not-allowed") || err.code === "auth/admin-restricted-operation") {
        setError("Firebase Guest Sign-In is disabled or restricted on this Firebase project. To run offline/locally without database configuration, click the 'Launch Local Sandbox Mode' button below.");
        setIsRestrictedFirebase(true);
      } else {
        setError("Guest login failed: " + err.message);
        if (err.code?.includes("restricted") || err.message?.includes("restricted") || err.code?.includes("not-allowed") || err.message?.includes("not-allowed")) {
          setIsRestrictedFirebase(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative ambient background elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center mb-8 z-10"
      >
        <div className="inline-flex items-center justify-center p-3 bg-indigo-600/10 border border-indigo-500/35 rounded-2xl mb-4 text-indigo-400">
          <Database className="w-10 h-10" />
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight">
          Stitch Schema <span className="text-indigo-400 font-extrabold">Agent</span>
        </h1>
        <p className="text-slate-400 mt-2 text-sm md:text-base max-w-sm mx-auto">
          Agentic Platform for Automatic Database Schema Design, 3NF Normalization & Schema Evolution
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl p-8 z-10"
      >
        <div className="flex justify-center space-x-6 border-b border-slate-800 pb-4 mb-6">
          <button
            onClick={() => { setIsRegistering(false); setError(""); }}
            className={`font-medium pb-2 text-sm uppercase tracking-wider transition-colors relative ${
              !isRegistering ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Sign In
            {!isRegistering && (
              <motion.div layoutId="active-tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />
            )}
          </button>
          <button
            onClick={() => { setIsRegistering(true); setError(""); }}
            className={`font-medium pb-2 text-sm uppercase tracking-wider transition-colors relative ${
              isRegistering ? "text-indigo-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            Register
            {isRegistering && (
              <motion.div layoutId="active-tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400" />
            )}
          </button>
        </div>

        {error && (
          <div className="flex flex-col bg-red-950/40 border border-red-800/65 text-red-300 p-3 rounded-lg text-xs mb-4">
            <div className="flex items-start">
              <ShieldAlert className="w-4 h-4 shrink-0 mr-2 text-red-400 mt-0.5" />
              <span className="flex-1">{error}</span>
            </div>
            {typeof error === "string" && error.includes("already registered") && (
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError("");
                }}
                className="mt-2 text-indigo-400 hover:text-indigo-300 font-semibold underline text-left pl-6 cursor-pointer"
              >
                Switch to Sign In
              </button>
            )}
            {isRestrictedFirebase && (
              <button
                type="button"
                onClick={onLocalSignIn}
                className="mt-3 w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold py-2 px-3 rounded-md text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-amber-500/10"
              >
                <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                <span>Launch Local Sandbox Mode Instantly</span>
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-sm transition-all flex items-center justify-center space-x-2 mt-6 shadow-lg shadow-indigo-600/10 cursor-pointer"
          >
            {isRegistering ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-2 text-slate-500 font-semibold tracking-wider">Or</span>
          </div>
        </div>

        <button
          onClick={handleGuestSignIn}
          disabled={loading}
          className="w-full bg-slate-950 hover:bg-slate-800 active:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium py-2 px-4 rounded-lg text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer mb-4"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Explore as Guest</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
        </button>

        <div className="border-t border-slate-800/60 pt-4 mt-4 text-center">
          <p className="text-xs text-slate-500 mb-2">Experiencing Firebase setup issues?</p>
          <button
            type="button"
            onClick={onLocalSignIn}
            className="w-full bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-900/50 hover:border-indigo-800 text-indigo-300 font-medium py-2 px-4 rounded-lg text-xs transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Launch Local Sandbox Mode (No Setup Required)</span>
          </button>
        </div>
      </motion.div>

      <div className="text-center mt-12 text-xs text-slate-600 tracking-wide max-w-sm">
        Authorized server keys kept secure. Backed by Firebase Auth & Google Cloud Firestore.
      </div>
    </div>
  );
}
