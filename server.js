const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const ExcelJS = require('exceljs');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Local storage for health data
const localDataStore = {
    sensorData: []
};

// Helper function to get IST date time
function getISTDateTime() {
    return new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');
}

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));
app.use(bodyParser.json());

// Root endpoint
app.get('/', (req, res) => {
    res.send('Welcome to Structural Health Monitoring System API');
});

// POST endpoint for sensor data
app.post('/api/sensor-data', async (req, res) => {
    console.log('Received data:', req.body);

    const {
        strain,
        vibration,
        displacement,
        acceleration
    } = req.body;

    // Updated validation to properly check for undefined/null
    if (strain === undefined || strain === null || 
        vibration === undefined || vibration === null || 
        displacement === undefined || displacement === null || 
        acceleration === undefined || acceleration === null) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: strain, vibration, displacement, or acceleration'
        });
    }

    const newData = {
        strain: Number(strain),
        vibration: Number(vibration),
        displacement: Number(displacement),
        acceleration: Number(acceleration),
        timestamp: getISTDateTime(),
        id: Date.now().toString()
    };

    try {
        // Store in local memory
        localDataStore.sensorData.unshift(newData);

        // Keep only latest 50 records in memory
        if (localDataStore.sensorData.length > 50) {
            localDataStore.sensorData = localDataStore.sensorData.slice(0, 50);
        }

        res.status(200).json({
            success: true,
            message: 'Data stored successfully in memory',
            latestData: newData
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// GET endpoint for sensor data
app.get('/api/sensor-data', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;

    try {
        const data = localDataStore.sensorData.slice(0, limit);
        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving data'
        });
    }
});

// GET endpoint for latest reading
app.get('/api/sensor-data/latest', (req, res) => {
    if (localDataStore.sensorData.length > 0) {
        res.status(200).json({
            success: true,
            data: localDataStore.sensorData[0]
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'No data available'
        });
    }
});

// Endpoint to download data file
app.get('/api/sensor-data/download', async (req, res) => {
    try {
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const filePath = path.join(dataDir, 'sensor_data.xlsx');
        
        // Create a new Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sensor Data');
        
        // Add headers
        worksheet.columns = [
            { header: 'Timestamp', key: 'timestamp', width: 25 },
            { header: 'Strain', key: 'strain', width: 15 },
            { header: 'Vibration', key: 'vibration', width: 15 },
            { header: 'Displacement', key: 'displacement', width: 15 },
            { header: 'Acceleration', key: 'acceleration', width: 15 },
            { header: 'ID', key: 'id', width: 25 }
        ];
        
        // Add data rows
        localDataStore.sensorData.forEach(data => {
            worksheet.addRow(data);
        });
        
        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        
        // Write to file
        await workbook.xlsx.writeFile(filePath);
        
        // Send the file
        res.download(filePath, 'sensor_data.xlsx', (err) => {
            if (err) {
                console.error('Error during file download:', err);
                res.status(500).json({
                    success: false,
                    message: 'Error downloading file'
                });
            }
        });
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating Excel file'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});