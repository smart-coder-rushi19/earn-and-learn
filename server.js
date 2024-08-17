
const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = 7000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json()); // Middleware to parse JSON bodies

// Endpoint to get student names
app.get('/students', (req, res) => {
    const workbook = xlsx.readFile(path.join(__dirname, 'public', 'students.xlsx'));
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const students = [];
    let row = 2; // Assuming the first row is headers
    while (worksheet[`B${row}`]) {
        students.push(worksheet[`B${row}`].v); // Column B contains the names
        row++;
    }

    res.json(students); // Send the names as JSON to the client
});

// Endpoint to save data to records.xlsx
app.post('/save', (req, res) => {
    const { studentName, date, inTime, outTime, totalHours } = req.body;

    // Path to the records file
    const filePath = path.join(__dirname, 'public', 'records.xlsx');

    let workbook;

    try {
        // Check if the file exists and read it; otherwise, create a new workbook
        if (fs.existsSync(filePath)) {
            workbook = xlsx.readFile(filePath);
        } else {
            workbook = xlsx.utils.book_new();
            const sheet = xlsx.utils.aoa_to_sheet([['Sr.no', 'Date', 'InTime', 'OutTime', 'TotalHours']]);
            xlsx.utils.book_append_sheet(workbook, sheet);
        }
    } catch (error) {
        console.error('Error reading or creating workbook:', error);
        return res.status(500).send('Error reading or creating the workbook');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Find the next empty row
    let row = 2; // Start from row 2 to skip headers
    while (worksheet[`A${row}`]) {
        row++;
    }

    // Add new data to the worksheet
    worksheet[`A${row}`] = { v: row - 1 }; // Sr.no
    worksheet[`B${row}`] = { v: date };
    worksheet[`C${row}`] = { v: inTime };
    worksheet[`D${row}`] = { v: outTime };
    worksheet[`E${row}`] = { v: totalHours };

    try {
        // Write workbook to file
        xlsx.writeFile(filePath, workbook);
        res.send('Record saved successfully!');
    } catch (writeError) {
        console.error('Error writing file:', writeError);
        res.status(500).send('Error saving record');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
