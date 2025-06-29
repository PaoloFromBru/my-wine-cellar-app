import { Timestamp } from 'firebase/firestore'; // Import Timestamp for date handling

export const parseCsv = (csvText) => {
    // Remove Byte Order Mark (BOM) if present
    if (csvText.charCodeAt(0) === 0xFEFF) {
        csvText = csvText.substring(1);
    }

    const lines = csvText.split(/\r\n|\n/); 
    if (lines.length < 2) return { headers: [], data: [] }; 

    // Modified parseLine to handle semicolon delimiter
    const parseLine = (line) => {
        const result = [];
        let currentField = '';
        let inQuotes = false;
        // Iterate through the line character by character
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') { // Handle quotes for fields containing delimiters
                inQuotes = !inQuotes;
            } else if (char === ';' && !inQuotes) { // Use semicolon as delimiter
                result.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        result.push(currentField.trim()); // Add the last field
        return result;
    };
    
    const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) { 
        if (lines[i].trim() === '') continue; 
        const values = parseLine(lines[i]);
        const rowObject = {};
        headers.forEach((header, index) => {
            rowObject[header] = values[index] ? values[index].trim() : ''; 
        });
        data.push(rowObject);
    }
    return { headers, data };
};

export const exportToCsv = (data, fileName, headers, isExperienced = false) => {
    if (data.length === 0) {
        // In a real app, you might want to show a UI message here
        console.warn("No data to export.");
        return;
    }

    const csvHeaders = headers || (isExperienced 
        ? ["Name", "Producer", "Year", "Region", "Color", "Location", "DrinkingWindowStartYear", "DrinkingWindowEndYear", "ConsumedAt", "Rating", "TastingNotes"]
        : ["Name", "Producer", "Year", "Region", "Color", "Location", "DrinkingWindowStartYear", "DrinkingWindowEndYear"]);
    
    // Escape content with double quotes and handle semicolons
    const escapeCsvField = (field) => {
        if (field === null || field === undefined) return '';
        let value = String(field);
        if (value.includes(';') || value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    };

    const csvRows = [
        csvHeaders.join(';') // Use semicolon as delimiter
    ];

    data.forEach(item => {
        const row = isExperienced ? [
            escapeCsvField(item.name),
            escapeCsvField(item.producer),
            escapeCsvField(item.year),
            escapeCsvField(item.region),
            escapeCsvField(item.color),
            escapeCsvField(item.location),
            escapeCsvField(item.drinkingWindowStartYear),
            escapeCsvField(item.drinkingWindowEndYear),
            escapeCsvField(item.consumedAt ? (item.consumedAt instanceof Timestamp ? item.consumedAt.toDate().toISOString().slice(0, 10) : new Date(item.consumedAt).toISOString().slice(0, 10)) : ''),
            escapeCsvField(item.rating),
            escapeCsvField(item.tastingNotes)
        ] : [
            escapeCsvField(item.name),
            escapeCsvField(item.producer),
            escapeCsvField(item.year),
            escapeCsvField(item.region),
            escapeCsvField(item.color),
            escapeCsvField(item.location),
            escapeCsvField(item.drinkingWindowStartYear),
            escapeCsvField(item.drinkingWindowEndYear)
        ];
        csvRows.push(row.join(';'));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
};