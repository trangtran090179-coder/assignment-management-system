import { Router, Application } from 'express';
import multer from 'multer';
import path from 'path';
import { SubmissionController } from '../controllers/submissionController';

const router = Router();
const submissionController = new SubmissionController();

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

export default function setSubmissionRoutes(app: Application) {
    app.use('/api/submissions', router);
    
    // Routes with specific paths MUST come before /:id
    router.get('/assignment/:assignmentId', submissionController.getAssignmentSubmissions.bind(submissionController));
    // Preview file (e.g., DOCX -> HTML)
    router.get('/file/preview/:filename', submissionController.previewFile.bind(submissionController));
    router.put('/:id/grade', submissionController.gradeSubmission.bind(submissionController));
    
    // General routes
    router.get('/', submissionController.getStudentSubmissions.bind(submissionController));
    router.post('/', upload.single('file'), submissionController.createSubmission.bind(submissionController));
    router.get('/:id', submissionController.getSubmissionById.bind(submissionController));
}
