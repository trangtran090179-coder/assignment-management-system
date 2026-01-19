import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { QuizImportController } from '../controllers/quizImportController';
import { authenticateToken } from '../middleware/auth';

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'quiz-import-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept only .doc and .docx files
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.doc' || ext === '.docx') {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file Word (.doc, .docx)'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

export default function setQuizImportRoutes(app: any) {
    const router = Router();
    const controller = new QuizImportController();

    // Upload and parse Word file (public endpoint - no auth required)
    router.post('/parse-word', upload.single('file'), controller.parseWordFile);
    
    // Download template file
    router.get('/template', controller.downloadTemplate);

    app.use('/api/quiz-import', router);
    console.log('[ROUTES] Quiz import routes initialized');
}
