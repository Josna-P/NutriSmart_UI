import React, { useState, useCallback } from 'react';
// IMPORT ONLY FUNCTIONS, NOT THE AUTH INSTANCE ITSELF
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    updateProfile as firebaseUpdateProfile, 
} from 'firebase/auth';

// Configuration constants from App.jsx
const APP_ID = "nutrismart"; 
// NOTE: auth is received as a prop from App.jsx, not imported here.

const AuthView = ({ setIsLoading, auth, signInAnonymous, isLoading }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);

    const buttonClass = "w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition duration-150 shadow-md";
    const inputClass = "w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500";
    
    // --- LOGIN FORM ---
    const LoginForm = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [error, setError] = useState(null);

        const handleLogin = useCallback(async (e) => {
            e.preventDefault();
            setError(null);
            setIsLoading(true);

            try {
                await signInWithEmailAndPassword(auth, email, password);
            } catch (err) {
                console.error("Login Error:", err);
                let errorMessage = "Login failed. Invalid credentials or network error.";
                if (err.code) {
                    errorMessage = err.code.includes('user-not-found') || err.code.includes('wrong-password') 
                        ? "Invalid email or password."
                        : err.message;
                }
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        }, [email, password, setIsLoading, auth]);

        return (
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl">
                <h2 className="text-3xl font-bold text-center text-green-700">Log In</h2>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="p-3 text-red-700 bg-red-100 border-l-4 border-red-500 rounded-lg">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            className={inputClass} placeholder="user@example.com" required disabled={isLoading} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            className={inputClass} placeholder="Minimum 6 characters" required disabled={isLoading} />
                    </div>
                    <button type="submit" className={buttonClass} disabled={isLoading}>
                        {isLoading ? 'Signing In...' : 'Log In'}
                    </button>
                </form>

                <div className="text-center pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => setIsLoginMode(false)}
                        className="text-sm text-blue-600 hover:text-blue-800 transition duration-150">
                        Need an account? Sign Up.
                    </button>
                    <button type="button" onClick={signInAnonymous} disabled={isLoading}
                        className="block mt-2 text-xs text-gray-500 hover:text-gray-700 transition duration-150 mx-auto">
                        Or continue anonymously
                    </button>
                </div>
            </div>
        );
    };

    // --- SIGNUP FORM ---
    const SignupForm = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState(''); 
        const [username, setUsername] = useState(''); 
        const [error, setError] = useState(null);

        const handleSignup = useCallback(async (e) => {
            e.preventDefault();
            setError(null);
            setIsLoading(true);

            if (password !== confirmPassword) {
                setError("Passwords do not match.");
                setIsLoading(false);
                return;
            }

            try {
                // 1. Firebase Sign Up (creates user)
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                // 2. Set Username (displayName)
                await firebaseUpdateProfile(userCredential.user, { 
                    displayName: username.trim() || email
                });

            } catch (err) {
                console.error("Signup Error:", err);
                let errorMessage = "Signup failed.";
                if (err.code) {
                    errorMessage = err.code.includes('email-already-in-use') 
                        ? "This email is already registered."
                        : err.code.includes('weak-password') 
                        ? "Password must be at least 6 characters."
                        : err.message;
                }
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        }, [email, password, confirmPassword, username, setIsLoading, auth]);

        return (
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-2xl">
                <h2 className="text-3xl font-bold text-center text-green-700">Sign Up</h2>
                
                <form onSubmit={handleSignup} className="space-y-4">
                    {error && (
                        <div className="p-3 text-red-700 bg-red-100 border-l-4 border-red-500 rounded-lg">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username (Optional)</label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                            className={inputClass} placeholder="Your Display Name" disabled={isLoading} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            className={inputClass} placeholder="user@example.com" required disabled={isLoading} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                            className={inputClass} placeholder="Minimum 6 characters" required disabled={isLoading} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            className={inputClass} placeholder="Re-enter password" required disabled={isLoading} />
                    </div>
                    <button type="submit" className={buttonClass} disabled={isLoading}>
                        {isLoading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>

                <div className="text-center pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => setIsLoginMode(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 transition duration-150">
                        Already have an account? Log In.
                    </button>
                    <button type="button" onClick={signInAnonymous} disabled={isLoading}
                        className="block mt-2 text-xs text-gray-500 hover:text-gray-700 transition duration-150 mx-auto">
                        Or continue anonymously
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex items-center justify-center min-h-full p-4">
            {isLoginMode ? <LoginForm /> : <SignupForm />}
        </div>
    );
};

export default AuthView;