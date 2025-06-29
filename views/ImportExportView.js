import React from 'react';
import AlertMessage from '../components/AlertMessage'; // Import AlertMessage

// --- Icons (local for this component for now, as in App.js) ---
const UploadIcon = ({ className="w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);
const TrashIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
);


const ImportExportView = ({
    csvFile,
    handleCsvFileChange,
    handleImportCsv,
    isImportingCsv,
    csvImportStatus,
    handleExportCsv,
    wines,
    handleExportExperiencedCsv,
    experiencedWines,
    confirmEraseAllWines
}) => {
    return (
        <>
            {/* CSV Import Section */}
            <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">Import Wines from CSV</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                    Expected CSV headers: <code>name</code> (optional), <code>producer</code>, <code>year</code>, <code>region</code>, <code>color</code>, <code>location</code>, <code>drinkingwindowstartyear</code>, <code>drinkingwindowendyear</code>.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                    Ensure locations are unique. Semicolons within fields should be enclosed in double quotes (e.g., "Napa Valley; California").
                </p>
                <div className="flex flex-col sm:flex-row items-end gap-3">
                    <div className="flex-grow w-full">
                        <label htmlFor="csvFileInput" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Select CSV File</label>
                        <input
                            id="csvFileInput"
                            type="file"
                            accept=".csv"
                            onChange={handleCsvFileChange}
                            className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-800 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-700"
                        />
                    </div>
                    <button
                        onClick={handleImportCsv}
                        disabled={!csvFile || isImportingCsv}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <UploadIcon />
                        <span>{isImportingCsv ? 'Importing...' : 'Import CSV'}</span>
                    </button>
                </div>
                {csvImportStatus.message && (
                    <div className="mt-4">
                        <AlertMessage 
                            message={csvImportStatus.message + (csvImportStatus.errors.length > 0 ? "<br/><strong>Errors:</strong><ul>" + csvImportStatus.errors.map(e => `<li>- ${e}</li>`).join('') + "</ul>" : "")} 
                            type={csvImportStatus.type} 
                            onDismiss={() => setCsvImportStatus({ message: '', type: '', errors: [] })}
                            isHtml={csvImportStatus.errors.length > 0}
                        />
                    </div>
                )}
            </div>
            <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">Export Wines to CSV</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Download your current wine cellar data as a CSV file.
                </p>
                <button
                    onClick={handleExportCsv}
                    disabled={wines.length === 0}
                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-md shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <UploadIcon className="rotate-180" /> {/* Rotate upload icon for download */}
                    <span>Export Wines</span>
                </button>
            </div>

            <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3">Export Experienced Wines to CSV</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    Download your experienced wines data as a CSV file (includes notes and ratings).
                </p>
                <button
                    onClick={handleExportExperiencedCsv}
                    disabled={experiencedWines.length === 0}
                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-md shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <UploadIcon className="rotate-180" />
                    <span>Export Experienced Wines</span>
                </button>
            </div>

            <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-lg shadow border border-red-300 dark:border-red-700">
                <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-3">Danger Zone: Erase All Wines</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                    This action will permanently delete ALL wines from your cellar. This cannot be undone.
                </p>
                <button
                    onClick={confirmEraseAllWines}
                    disabled={wines.length === 0}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-md shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <TrashIcon />
                    <span>Erase All Wines</span>
                </button>
            </div>
        </>
    );
};

export default ImportExportView;
