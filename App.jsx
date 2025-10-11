import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, onSnapshot, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

// Import the view components
import ChatView from './ChatView.jsx';
import DashboardView from './DashboardView.jsx';
import AuthView from './AuthView.jsx'; 

// --- CONFIGURATION START ---

// 1. Paste Your Public Firebase Config Here
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBluoW7fNJZ388cWGDIHBbn6jrjpddWt4s",
    authDomain: "nutrismart-c9160.firebaseapp.com",
    projectId: "nutrismart-c9160",
    storageBucket: "nutrismart-c9160.firebasestorage.app",
    messagingSenderId: "562951149243",
    appId: "1:562951149243:web:5f185900eaaaebd701fb9e",
    measurementId: "G-8VXK3GX340"
};

// 2. Set Your Django API URL
const DJANGO_API_BASE_URL = "http://localhost:8000/api/v1/";

// Application ID (Must match the APP_ID in Django settings.py)
const APP_ID = "nutrismart"; 

// --- CONFIGURATION END ---


// Initialize Firebase App ONCE
const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db = getFirestore(app); 

const App = () => {
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [inventory, setInventory] = useState({});
    const [profileInput, setProfileInput] = useState('{"Iron": "high", "Protein": "low"}');
    const [currentPage, setCurrentPage] = useState('chat');
    
    const [authPage, setAuthPage] = useState('prompt'); 


    // --- Authentication and Initialization ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
                if (user.isAnonymous === false) {
                    setAuthPage('email');
                } else {
                    setAuthPage('anonymous');
                }
                setCurrentPage('chat');
            } else {
                setUserId(null);
                setAuthPage('prompt'); 
            }
            setIsAuthReady(true); 
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Function to handle anonymous sign-in (now called from AuthView fallback)
    const signInAnonymous = useCallback(() => {
        setIsLoading(true);
        signInAnonymously(auth).then(() => {
            setAuthPage('anonymous');
            setCurrentPage('chat');
            setIsLoading(false);
        }).catch(err => {
            console.error("Anonymous Sign-in Failed:", err);
            setError("Failed to sign in. Check Firebase configuration.");
            setIsLoading(false);
        });
    }, []);

    // --- Firestore Data Listeners (Only active if userId exists) ---
    useEffect(() => {
        if (!userId) {
            setMessages([]);
            setInventory({});
            setProfileInput('{"Iron": "high", "Protein": "low"}');
            return;
        }
        
        // 1. Chat History Listener
        const messagesRef = collection(db, `artifacts/${APP_ID}/users/${userId}/messages`);
        const unsubscribeMessages = onSnapshot(messagesRef, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => doc.data()).sort((a, b) => a.timestamp - b.timestamp);
            setMessages(fetchedMessages);
        }, (err) => console.error("Error listening to messages:", err));

        // 2. Inventory Listener
        const inventoryRef = collection(db, `artifacts/${APP_ID}/users/${userId}/inventory`);
        const unsubscribeInventory = onSnapshot(inventoryRef, (snapshot) => {
            const fetchedInventory = {};
            snapshot.forEach(doc => {
                if (doc.data().quantity !== '0') { 
                    fetchedInventory[doc.id] = doc.data();
                }
            });
            setInventory(fetchedInventory);
        }, (err) => console.error("Error listening to inventory:", err));

        // 3. Profile Listener
        const profileRef = doc(db, `artifacts/${APP_ID}/users/${userId}/profile/nutritional_goals`);
        const unsubscribeProfile = onSnapshot(profileRef, (docSnap) => {
            if (docSnap.exists()) {
                setProfileInput(JSON.stringify(docSnap.data(), null, 2));
            } else {
                setProfileInput('{"Iron": "high", "Protein": "low"}');
            }
        }, (err) => console.error("Error listening to profile:", err));

        return () => {
            unsubscribeMessages();
            unsubscribeInventory();
            unsubscribeProfile();
        };
    }, [userId]);

    // Format chat history for the API call
    const chatHistorySummary = useMemo(() => {
        if (!userId) return "";

        return messages
            .slice(-10) 
            .map(m => `${m.role}: ${m.text}`)
            .join('\n');
    }, [messages, userId]);


    // --- MUTATION FUNCTIONS (Profile and Inventory) ---

    // 1. Unified function to update the entire profile object (used for add/remove goals)
    // FIX: Function now correctly accepts profileData as argument.
    const updateProfile = useCallback(async (profileData) => { 
        if (!userId) {
            alert('Please sign in first to update your nutritional profile.');
            return;
        }
        
        try {
            const token = await auth.currentUser.getIdToken();
            
            // Call Django API
            const response = await axios.post(`${DJANGO_API_BASE_URL}profile/`, {
                profile: profileData, // Correctly sends the profileData object
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                 return true;
            }

        } catch (e) {
            console.error("Profile update failed:", e.response ? e.response.data : e);
            alert(`Failed to save profile: ${e.response?.data?.error || 'Invalid JSON format or server error.'}`);
            return false;
        }
    }, [userId]);

    
    const addManualInventoryItem = useCallback(async (itemName, itemQuantity, setManualItemName, setManualItemQuantity, setInventoryError) => {
        if (!userId) {
            alert('Please sign in first to track inventory.');
            return;
        }
        if (!itemName.trim() || !itemQuantity.trim()) {
            setInventoryError('Item name and quantity are required.');
            return;
        }
        setInventoryError(null);
        try {
            const itemDocRef = doc(db, `artifacts/${APP_ID}/users/${userId}/inventory/${itemName.trim().toLowerCase()}`);
            await setDoc(itemDocRef, {
                quantity: itemQuantity.trim(),
                last_updated: serverTimestamp()
            }, { merge: true });
            
            setManualItemName('');
            setManualItemQuantity('');
        } catch (e) {
            console.error("Manual inventory update failed:", e);
            setInventoryError('Failed to save item. Check console.');
        }
    }, [userId]);

    const removeItem = useCallback(async (itemName) => {
        if (!userId || !window.confirm(`Are you sure you want to remove ${itemName}?`)) return; 
        try {
            const itemDocRef = doc(db, `artifacts/${APP_ID}/users/${userId}/inventory/${itemName}`);
            await setDoc(itemDocRef, { quantity: '0' }, { merge: true });
        } catch (e) {
            console.error("Item removal failed:", e);
        }
    }, [userId]);


    // 4. Submit Grocery Bill (Placeholder - actual logic added later)
    const submitGroceryBill = useCallback(async (billData) => {
        if (!userId) {
            alert('Please sign in first to submit grocery bills.');
            return false;
        }
        
        try {
            const token = await auth.currentUser.getIdToken();
            
            const response = await axios.post(`${DJANGO_API_BASE_URL}bills/`, billData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                alert('Grocery bill recorded successfully!');
                return true;
            }

        } catch (e) {
            console.error("Bill submission failed:", e.response ? e.response.data : e);
            alert(`Failed to submit bill: ${e.response?.data?.error || 'Server error.'}`);
            return false;
        }
    }, [userId]);


    // --- Core API Interaction (Chat) ---
    const sendMessage = useCallback(async (text) => {
        if (isLoading || !text.trim()) return;

        setIsLoading(true);
        setError(null);
        
        const userMessage = text.trim();
        const msgId = Date.now();
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

        // 1. Add User Message to local state
        const userMsg = { role: 'user', text: userMessage, timestamp: msgId };
        setMessages(prev => [...prev, userMsg]);

        if (userId) {
             const userMsgDocRef = doc(db, `artifacts/${APP_ID}/users/${userId}/messages/${msgId}`);
             await setDoc(userMsgDocRef, userMsg);
        }

        // 2. Call Django API
        try {
            const response = await axios.post(`${DJANGO_API_BASE_URL}chat/`, {
                message: userMessage,
                history: chatHistorySummary,
            }, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            });

            const aiResponse = response.data.response;
            const requiresAuth = response.data.requires_auth;
            
            const aiMsgId = Date.now() + 1;
            const aiMsg = { 
                role: 'assistant', 
                text: aiResponse, 
                timestamp: aiMsgId,
                requiresAuth: requiresAuth
            };

            // 3. Update local state with AI response
            setMessages(prev => [...prev, aiMsg]);

            if (userId) {
                const aiMsgDocRef = doc(db, `artifacts/${APP_ID}/users/${userId}/messages/${aiMsgId}`);
                await setDoc(aiMsgDocRef, aiMsg);
            }

        } catch (err) {
            console.error("API Call Failed:", err.response ? err.response.data : err);
            setError("Error communicating with the Django API. Check server logs.");
            
            setMessages(prev => prev.filter(msg => msg.timestamp !== msgId));
        } finally {
            setIsLoading(false);
            setCurrentMessage('');
        }
    }, [userId, isLoading, chatHistorySummary]);
    

    if (!isAuthReady) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <p className="text-xl">Loading application...</p>
            </div>
        );
    }

    const inventoryList = Object.keys(inventory).map(key => ({
        name: key,
        ...inventory[key]
    }));
    
    // --- Render Logic ---
    const renderPage = () => {
        // If user is NOT authenticated and is explicitly on the auth page
        if (!userId && currentPage === 'auth') {
            return (
                <AuthView 
                    setAuthPage={setAuthPage} 
                    setIsLoading={setIsLoading} 
                    signInAnonymous={signInAnonymous} 
                    auth={auth} 
                    isLoading={isLoading} 
                />
            );
        }
        
        switch (currentPage) {
            case 'dashboard':
                return (
                    <DashboardView 
                        userId={userId}
                        inventory={inventory} 
                        inventoryList={inventoryList} 
                        profileInput={profileInput} 
                        setProfileInput={setProfileInput}
                        updateProfile={updateProfile} 
                        addManualInventoryItem={addManualInventoryItem} 
                        removeItem={removeItem} 
                        submitGroceryBill={submitGroceryBill}
                    />
                );
            case 'auth':
                // Handled above for unauthenticated state
                return null;
            case 'chat':
            default:
                return (
                    <div className="lg:w-2/3 mx-auto flex flex-col h-full">
                        <ChatView 
                            messages={messages} 
                            currentMessage={currentMessage} 
                            setCurrentMessage={setCurrentMessage} 
                            sendMessage={sendMessage} 
                            isLoading={isLoading} 
                            error={error} 
                        />
                    </div>
                );
        }
    };
    
    const navItemClass = (page) => `py-2 px-4 rounded-lg font-medium transition duration-150 cursor-pointer ${
        currentPage === page ? 'bg-green-500 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`;
    
    const isAuthenticated = userId && auth.currentUser && !auth.currentUser.isAnonymous;
    const userName = auth.currentUser?.displayName || auth.currentUser?.email; 


    return (
        <div className="flex flex-col h-screen antialiased bg-gray-50">
            {/* Header and Navigation */}
            <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-green-700">NutriSmart</h1>
                <nav className="flex space-x-4">
                    <button className={navItemClass('chat')} onClick={() => setCurrentPage('chat')}>
                        Chat
                    </button>
                    <button className={navItemClass('dashboard')} onClick={() => setCurrentPage('dashboard')}>
                        Dashboard
                    </button>
                </nav>
                
                {/* Auth Status */}
                <div className="flex items-center space-x-3">
                    {!userId ? (
                        <button 
                            onClick={() => setCurrentPage('auth')} 
                            className="py-2 px-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-150"
                            disabled={isLoading}
                        >
                            Log In / Sign Up
                        </button>
                    ) : (
                        <>
                            <span className="text-sm font-medium text-gray-600">
                                {isAuthenticated ? 'Welcome, ' : 'Anonymous: '} 
                                <span className="font-semibold text-gray-800">
                                    {isAuthenticated ? (userName || 'User') : userId.substring(0, 8) + '...'}
                                </span>
                            </span>
                            <button 
                                onClick={() => signOut(auth)}
                                className="text-sm text-red-500 hover:text-red-700"
                            >
                                Sign Out
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow overflow-y-auto pt-4 pb-8">
                {renderPage()}
            </main>
        </div>
    );
};

export default App;