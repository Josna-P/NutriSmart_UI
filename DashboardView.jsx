import React, { useState, useCallback } from 'react';
import axios from 'axios'; 

// Configuration constants from App.jsx
const APP_ID = "nutrismart"; 
const DJANGO_API_BASE_URL = "http://localhost:8000/api/v1/"; 


// Component for managing Nutritional Goals
const ProfileManager = ({ userId, profileInput, setProfileInput, updateProfile }) => {
    const [newNutrient, setNewNutrient] = useState('');
    const [newLevel, setNewLevel] = useState('low');
    const [profileError, setProfileError] = useState(null);
    
    const nutrientOptions = ['Protein', 'Iron', 'Vitamin C', 'Calcium', 'Fiber', 'B12', 'Folate', 'Omega-3', 'Zinc'];
    const levelOptions = ['Very Low', 'Low', 'Moderate', 'Good', 'High', 'Avoid'];

    // Function to handle adding a new nutrient to the profile
    const addNutrientGoal = useCallback((e) => {
        e.preventDefault();
        setProfileError(null);

        if (!userId) {
            alert('Please sign in to add goals.');
            return;
        }

        const nutrientKey = newNutrient.trim();
        if (!nutrientKey) {
            setProfileError("Please select a nutrient.");
            return;
        }

        try {
            // Parse existing profile from the JSON string state
            const currentProfile = JSON.parse(profileInput);
            
            // Update profile with new nutrient goal
            const updatedProfile = {
                ...currentProfile,
                [nutrientKey]: newLevel
            };

            // Call the prop function defined in App.jsx to handle the API update
            updateProfile(updatedProfile);

            // Clear inputs
            setNewNutrient('');
            setNewLevel('low');

        } catch (e) {
             setProfileError('Error processing profile data.');
             console.error("Error adding nutrient goal:", e);
        }
    }, [newNutrient, newLevel, profileInput, userId, updateProfile]);

    // Function to handle removing a nutrient goal (calls updateProfile prop)
    const removeNutrientGoal = useCallback((keyToRemove) => {
        if (!window.confirm(`Are you sure you want to remove the goal for ${keyToRemove}?`)) return;

        try {
            const currentProfile = JSON.parse(profileInput);
            const updatedProfile = { ...currentProfile };
            delete updatedProfile[keyToRemove];
            
            // Call the prop function to save the removal
            updateProfile(updatedProfile);

        } catch (e) {
            console.error("Error removing nutrient goal:", e);
        }
    }, [profileInput, updateProfile]);
    
    const currentGoals = React.useMemo(() => {
        try {
            // Use profileInput which is passed down from App.jsx state
            return JSON.parse(profileInput);
        } catch {
            return {};
        }
    }, [profileInput]);


    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="font-bold text-xl mb-4 text-green-700">1. Nutritional Goals</h3>
            
            <form onSubmit={addNutrientGoal} className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold text-gray-700 mb-3">Add Deficiency/Goal</h4>
                <div className="flex space-x-3 mb-3">
                    <select
                        value={newNutrient}
                        onChange={(e) => setNewNutrient(e.target.value)}
                        className="flex-1 p-2 border rounded-lg"
                        disabled={!userId}
                    >
                        <option value="" disabled>Select Nutrient</option>
                        {nutrientOptions.map(n => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                    <select
                        value={newLevel}
                        onChange={(e) => setNewLevel(e.target.value)}
                        className="flex-1 p-2 border rounded-lg"
                        disabled={!userId}
                    >
                        {levelOptions.map(l => (
                            <option key={l} value={l}>{l}</option>
                        ))}
                    </select>
                </div>
                {profileError && <p className="text-red-500 text-sm mb-2">{profileError}</p>}
                <button
                    type="submit"
                    className={`w-full py-2 text-white font-semibold rounded-lg transition duration-150 ${
                        userId ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!userId || !newNutrient}
                >
                    {userId ? 'Add Goal' : 'Sign In to Add Goals'}
                </button>
            </form>

            <h4 className="font-semibold text-lg mb-3">Current Goals</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {userId ? (
                    Object.keys(currentGoals).length > 0 ? (
                        Object.keys(currentGoals).map(key => (
                            <div key={key} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <span className="font-medium text-gray-800">{key}</span>
                                <div className="flex items-center space-x-3">
                                    <span className={`text-sm font-semibold ${
                                        currentGoals[key]?.toLowerCase()?.includes('low') ? 'text-red-500' : 
                                        currentGoals[key]?.toLowerCase()?.includes('high') ? 'text-blue-500' : 
                                        'text-green-600'
                                    }`}>{currentGoals[key]}</span>
                                    <button
                                        onClick={() => removeNutrientGoal(key)}
                                        className="text-red-400 hover:text-red-600 text-sm"
                                    >
                                        &times;
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 italic p-3 text-center">No goals set. Add one above!</p>
                    )
                ) : (
                    <p className="text-sm text-gray-500 italic p-3 text-center">Sign in to view your goals.</p>
                )}
            </div>
        </div>
    );
};

// Component for adding and displaying Inventory
const InventoryManager = ({ userId, inventoryList, addManualInventoryItem, removeItem }) => {
    const [manualItemName, setManualItemName] = useState('');
    const [manualItemQuantity, setManualItemQuantity] = useState('');
    const [manualItemUnit, setManualItemUnit] = useState('units'); 
    const [inventoryError, setInventoryError] = useState(null);

    const commonUnits = ['units', 'g', 'kg', 'ml', 'L', 'oz', 'lbs', 'cups', 'pieces'];

    const handleAddItem = (e) => {
        e.preventDefault();
        
        const combinedQuantity = `${manualItemQuantity.trim()} ${manualItemUnit}`;
        
        addManualInventoryItem(
            manualItemName, 
            combinedQuantity, 
            setManualItemName, 
            setManualItemQuantity, 
            setInventoryError
        );
        setInventoryError(null);
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg">
            <h3 className="font-bold text-xl mb-4 text-green-700">2. Manage Current Inventory</h3>
            
            {/* Manual Add Form */}
            <form onSubmit={handleAddItem} className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-semibold text-gray-700 mb-2">Quick Add Item</h4>
                <div className="flex space-x-2 mb-2">
                    <input
                        type="text"
                        value={manualItemName}
                        onChange={(e) => setManualItemName(e.target.value)}
                        className="flex-1 p-2 border rounded-l-lg"
                        placeholder="Item Name (e.g., spinach)"
                        disabled={!userId}
                    />
                </div>
                <div className="flex space-x-2 mb-2">
                    <input
                        type="number"
                        value={manualItemQuantity}
                        onChange={(e) => setManualItemQuantity(e.target.value)}
                        className="w-1/2 p-2 border rounded-l-lg"
                        placeholder="Quantity"
                        disabled={!userId}
                        min="0"
                    />
                    <select
                        value={manualItemUnit}
                        onChange={(e) => setManualItemUnit(e.target.value)}
                        className="w-1/2 p-2 border rounded-r-lg"
                        disabled={!userId}
                    >
                        {commonUnits.map(unit => (
                            <option key={unit} value={unit}>{unit}</option>
                        ))}
                    </select>
                </div>
                {inventoryError && <p className="text-red-500 text-sm mb-2">{inventoryError}</p>}
                <button
                    type="submit"
                    className={`w-full py-2 text-white font-semibold rounded-lg transition duration-150 ${
                        userId ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    disabled={!userId || manualItemQuantity.trim() === '' || manualItemName.trim() === ''}
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


const DashboardView = ({ userId, inventory, inventoryList, profileInput, setProfileInput, updateProfile, addManualInventoryItem, removeItem }) => {
    return (
        <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 p-6">
            <ProfileManager 
                userId={userId} 
                profileInput={profileInput} 
                setProfileInput={setProfileInput} 
                updateProfile={updateProfile}
            />
            <InventoryManager 
                userId={userId} 
                inventoryList={inventoryList} 
                addManualInventoryItem={addManualInventoryItem}
                removeItem={removeItem}
            />
        </div>
    );
};

export default DashboardView;