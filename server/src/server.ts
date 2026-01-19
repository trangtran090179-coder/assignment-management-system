import express from 'express';
import cors from 'cors';
import path from 'path';
import setUserRoutes from './routes/userRoutes';
import { setAuthRoutes } from './routes/authRoutes';
import setClassRoutes from './routes/classRoutes';
import setEnrollmentRoutes from './routes/enrollmentRoutes';
import setAssignmentRoutes from './routes/assignmentRoutes';
import setSubmissionRoutes from './routes/submissionRoutes';
import setQuizRoutes from './routes/quizRoutes';
import setQuizImportRoutes from './routes/quizImportRoutes';
import { connectDatabase } from './config/database';
import { setAssignmentsCountGetter, setAssignmentsListGetter, getClassByCode } from './controllers/classController';
import { getAssignmentsCountByClass, getAssignmentsByClass } from './controllers/assignmentController';
import { setClassGetter, setAssignmentsListGetter as setEnrollmentAssignmentsListGetter, setSubmissionsListGetter } from './controllers/enrollmentController';
import { getSubmissionsByStudent } from './controllers/submissionController';
import * as fs from 'fs';

// Capture console.log to file
const logFile = path.join(__dirname, '../debug.log');
const originalLog = console.log;
const originalError = console.error;

function writeLog(type: string, ...args: any[]) {
    const timestamp = new Date().toISOString();
    const message = `[${timestamp}] [${type}] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}\n`;
    fs.appendFileSync(logFile, message);
    if (type === 'LOG') {
        originalLog(...args);
    } else {
        originalError(...args);
    }
}

console.log = (...args) => writeLog('LOG', ...args);
console.error = (...args) => writeLog('ERROR', ...args);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions)); // Enable CORS for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (images and uploads)
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Database connection
connectDatabase();

// Kết nối các controllers với nhau
setAssignmentsCountGetter(getAssignmentsCountByClass);
setAssignmentsListGetter(getAssignmentsByClass);
setClassGetter(getClassByCode);
setEnrollmentAssignmentsListGetter(getAssignmentsByClass);
setSubmissionsListGetter(getSubmissionsByStudent);

// Root route
app.get('/', (req: any, res: any) => {
    res.json({ 
        message: 'Backend API đang hoạt động!', 
        endpoints: [
            'POST /api/auth/login - Đăng nhập',
            'POST /api/auth/register - Đăng ký',
            'GET /api/users - Danh sách users',
            'POST /api/classes - Tạo lớp học mới',
            'GET /api/classes - Danh sách lớp học',
            'GET /api/classes/:id - Chi tiết lớp',
            'POST /api/assignments - Giao bài tập',
            'GET /api/classes/:classId/assignments - Bài tập của lớp',
            'POST /api/enrollments - Tham gia lớp',
            'GET /api/students/:studentId/classes - Lớp của học sinh',
            'GET /api/students/:studentId/assignments - Bài tập của học sinh'
        ],
        timestamp: new Date().toISOString()
    });
});

// Debug endpoint - view logs
app.get('/debug/logs', (req: any, res: any) => {
    try {
        if (fs.existsSync(logFile)) {
            const logs = fs.readFileSync(logFile, 'utf-8');
            res.json({ 
                message: 'Server logs',
                logs: logs.split('\n').slice(-100) // Last 100 lines
            });
        } else {
            res.json({ message: 'No logs yet' });
        }
    } catch (error) {
        res.status(500).json({ error });
    }
});

// Clear logs
app.get('/debug/clear-logs', (req: any, res: any) => {
    try {
        fs.writeFileSync(logFile, '');
        res.json({ message: 'Logs cleared' });
    } catch (error) {
        res.status(500).json({ error });
    }
});

// Routes
setUserRoutes(app);
setAuthRoutes(app);
setClassRoutes(app);
setEnrollmentRoutes(app);
setAssignmentRoutes(app);
setSubmissionRoutes(app);
setQuizRoutes(app);
setQuizImportRoutes(app);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});