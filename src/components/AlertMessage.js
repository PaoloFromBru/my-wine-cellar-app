import React from 'react';

const AlertMessage = ({ message, type, onDismiss, isHtml = false }) => {
    if (!message) return null;
    const baseClasses = "p-4 rounded-md mb-4 text-sm";
    const typeClasses = {
        success: "bg-green-100 border border-green-400 text-green-700 dark:bg-green-900 dark:border-green-700 dark:text-green-300",
        error: "bg-red-100 border border-red-400 text-red-700 dark:bg-red-900 dark:border-red-700 dark:text-red-300",
        info: "bg-blue-100 border border-blue-400 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300",
        warning: "bg-yellow-100 border border-yellow-400 text-yellow-700 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-300",
    };
    return (
        <div className={`${baseClasses} ${typeClasses[type] || typeClasses.info} flex justify-between items-center`}>
            {isHtml ? <span dangerouslySetInnerHTML={{ __html: message }} /> : <span>{message}</span>}
            {onDismiss && (
                 <button onClick={onDismiss} className="ml-4 text-lg font-semibold">&times;</button>
            )}
        </div>
    );
};

export default AlertMessage;