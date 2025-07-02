// src/views/HelpView.js
import React from 'react';

// Icon for the help section (optional, but good for consistency)
const QuestionMarkCircleIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
    </svg>
);


const HelpView = () => {
    return (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center space-x-2">
                <QuestionMarkCircleIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                <span>Welcome to My Wine Cellar App!</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
                This app helps you manage your wine collection, track experienced wines, and find food pairings.
            </p>

            <div className="space-y-6">
                <div>
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">My Cellar</h3>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                        <li>View all wines currently in your collection.</li>
                        <li>Use the search bar to find specific wines by producer, region, year, etc.</li>
                        <li>Click "Add New Wine" to manually enter new bottles into your cellar.</li>
                        <li>Edit existing wine details by clicking on the wine card.</li>
                        <li>Move wines to "Experienced Wines" once consumed, adding tasting notes and a rating.</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Drink Soon</h3>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                        <li>See wines that are approaching or have passed their optimal drinking window based on the "Drinking Window" years you entered.</li>
                        <li>Helps you decide which wines to enjoy next before they lose their quality.</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Food Pairing</h3>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                        <li>Explore food pairing suggestions for your wines using AI.</li>
                        <li>Find wines from your cellar that pair well with a specific food item.</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Import/Export</h3>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                        <li>**Import Wines:** Upload a CSV file to add multiple wines to your cellar at once. Refer to the expected CSV headers for formatting.</li>
                        <li>**Export Wines:** Download your active cellar or experienced wines data as a CSV file for backup or external use.</li>
                        <li>**Danger Zone:** Permanently erase all wines from your active cellar (use with caution!).</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Experienced Wines</h3>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                        <li>View wines you have already consumed, along with your tasting notes and ratings.</li>
                        <li>Helps you keep a record of your tasting experiences.</li>
                        <li>You can permanently delete experienced wine entries here.</li>
                    </ul>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Login / Register</h3>
                    <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                        <li>Create an account or log in to save your wine cellar data securely.</li>
                        <li>Your data is linked to your user account, allowing you to access it from any device.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default HelpView;