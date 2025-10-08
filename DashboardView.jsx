import React, { useState, useCallback } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Configuration constants from App.jsx
const APP_ID = "nutrismart"; 


// Component for managing Nutritional Goals
// db is now passed as a prop
const ProfileManager = ({ userId, profileInput, setProfileInput, db }) => {
    const updateProfile = useCallback(async () => {
        if (!userId) {
            alert('Please sign in first to update your nutritional profile.');
            return;
        }
        try {
            let parsedProfile = JSON.parse(profileInput);
            
            const profileDocRef = doc(db, `artifacts/${APP_ID}/users/${userId}/profile/nutritional_goals`);
            await setDoc(profileDocRef, parsedProfile, { merge: true });
            
            alert('Nutritional Profile Updated Successfully!');
        } catch (e) {
            alert('Invalid JSON format for profile! Please check your input.');
            console.error("Profile update failed:", e);
        }
    }, [userId, profileInput, db]); // Add db to dependencies

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="font-bold text-xl mb-3 text-green-700">1. Nutritional Goals (JSON)</h3>
            <p className="text-sm text-gray-600 mb-2">Define deficiencies or goals (e.g., {"{ \"Iron\": \"high\", \"Protein\": \"low\" } "}).</p>
            <textarea
                value={profileInput}
                onChange={(e) => setProfileInput(e.target.value)}
                className="w-full h-32 p-3 text-sm border border-gray-300 rounded-lg resize-none font-mono"
                placeholder='{"Iron": "high", "Protein": "low"}'
                disabled={!userId}
            />
            <button
                onClick={updateProfile}
                className={`w-full mt-3 py-2 text-white font-semibold rounded-lg transition duration-150 ${
                    userId ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'
                }`}
                disabled={!userId}
            >
                {userId ? 'Update Profile' : 'Sign In to Edit'}
            </button>
        </div>
    );
};

// Component for adding and displaying Inventory
// db is now passed as a prop
const InventoryManager = ({ userId, inventoryList, db }) => {
    const [manualItemName, setManualItemName] = useState('');
    const [manualItemQuantity, setManualItemQuantity] = useState('');
    const [inventoryError, setInventoryError] = useState(null);

    const addManualInventoryItem = useCallback(async (e) => {
        e.preventDefault();
        if (!userId) {
            alert('Please sign in first to track inventory.');
            return;
        }
        if (!manualItemName.trim() || !manualItemQuantity.trim()) {
            setInventoryError('Item name and quantity are required.');
            return;
        }
        setInventoryError(null);
        try {
            const itemDocRef = doc(db, `artifacts/${APP_ID}/users/${userId}/inventory/${manualItemName.trim().toLowerCase()}`);
            await setDoc(itemDocRef, {
                quantity: manualItemQuantity.trim(),
                last_updated: serverTimestamp()
            }, { merge: true });
            
            setManualItemName('');
            setManualItemQuantity('');
        } catch (e) {
            console.error("Manual inventory update failed:", e);
            setInventoryError('Failed to save item. Check console.');
        }
    }, [userId, manualItemName, manualItemQuantity, db]); // Add db to dependencies
    
    // Function to delete/mark as used
    const removeItem = useCallback(async (itemName) => {
        if (!userId || !confirm(`Are you sure you want to remove ${itemName}?`)) return;
        try {
            const itemDocRef = doc(db, `artifacts/${APP_ID}/users/${userId}/inventory/${itemName}`);
            await setDoc(itemDocRef, { quantity: '0' }, { merge: true });
        } catch (e) {
            console.error("Item removal failed:", e);
        }
    }, [userId, db]); // Add db to dependencies


    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="font-bold text-xl mb-4 text-green-700">2. Manage Current Inventory</h3>
            
            {/* Manual Add Form */}
            <form onSubmit={addManualInventoryItem} className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold text-gray-700 mb-2">Quick Add Item</h4>
                <div className="flex space-x-2 mb-2">
                    <input
                        type="text"
                        value={manualItemName}
                        onChange={(e) => setManualItemName(e.target.value)}
                        className="flex-1 p-2 border rounded-lg"
                        placeholder="Item Name (e.g., spinach)"
                        disabled={!userId}
                    />
                    <input
                        type="text"
                        value={manualItemQuantity}
                        onChange={(e) => setManualItemQuantity(e.target.value)}
                        className="w-28 p-2 border rounded-lg"
                        placeholder="Quantity (e.g., 2 kg)"
                        disabled={!userId}
                    />
                </div>
                {inventoryError && <p className="text-red-500 text-sm mb-2">{inventoryError}</p>}
                <button
                    type="submit"
                    className={`w-full py-2 text-white font-semibold rounded-lg transition duration-150 ${
                        userId ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!userId}
                >
                    {userId ? 'Add/Update Item' : 'Sign In to Add'}
                </button>
            </form>

            {/* Inventory List */}
            <h4 className="font-semibold text-lg mb-3">Inventory List ({inventoryList.length} items)</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {userId ? (
                    inventoryList.length > 0 ? (
                        inventoryList.map(item => (
                            <div key={item.name} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <div className="flex-1">
                                    <span className="font-medium text-gray-800 capitalize">{item.name}</span>
                                    <span className="text-sm font-semibold text-green-600 ml-3">{item.quantity}</span>
                                </div>
                                <button
                                    onClick={() => removeItem(item.name)}
                                    className="text-red-500 hover:text-red-700 text-sm p-1 rounded transition duration-150"
                                >
                                    Remove
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 italic p-3 text-center">Your tracked inventory is empty.</p>
                    )
                ) : (
                    <p className="text-sm text-gray-500 italic p-3 text-center">Sign in to view your inventory.</p>
                )}
            </div>
        </div>
    );
};


const DashboardView = ({ userId, inventory, inventoryList, profileInput, setProfileInput, db }) => {
    return (
        <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 p-6">
            <ProfileManager 
                userId={userId} 
                profileInput={profileInput} 
                setProfileInput={setProfileInput}
                db={db} // Passing db
            />
            <InventoryManager 
                userId={userId} 
                inventoryList={inventoryList} 
                db={db} // Passing db
            />
        </div>
    );
};

export default DashboardView;