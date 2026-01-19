import { Router, Application } from 'express';
import multer from 'multer';
import path from 'path';
import { AssignmentController } from '../controllers/assignmentController';

const assignmentController = new AssignmentController();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.join(__dirname, '../../uploads');
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Định dạng file không được hỗ trợ'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export default function setAssignmentRoutes(app: Application) {
    // Routes for /api/assignments
    app.get('/api/assignments', assignmentController.getAssignments.bind(assignmentController));
    app.post('/api/assignments', upload.array('files', 5), assignmentController.createAssignment.bind(assignmentController));
    app.get('/api/assignments/:id', assignmentController.getAssignmentById.bind(assignmentController));
    app.get('/api/assignments/:id/preview', assignmentController.getDocxPreview.bind(assignmentController));
    app.put('/api/assignments/:id', assignmentController.updateAssignment.bind(assignmentController));
    app.delete('/api/assignments/:id', assignmentController.deleteAssignment.bind(assignmentController));
    
    // Routes for /api/classes/:classId/assignments - MUST come before /api/classes/:id
    app.get('/api/classes/:classId/assignments', assignmentController.getClassAssignments.bind(assignmentController));
}
