import { Router } from 'express';
import { QuizController } from '../controllers/quizController';
import { authenticateToken } from '../middleware/auth';

export default function setQuizRoutes(app: any) {
    const router = Router();
    const quizController = new QuizController();

    // Public routes (với authentication)
    router.get('/', authenticateToken, quizController.getQuizzes);
    router.get('/class/:classId', authenticateToken, quizController.getQuizzesByClassId);
    router.get('/:id', authenticateToken, quizController.getQuizById);
    router.get('/:id/student', authenticateToken, quizController.getQuizForStudent);
    router.get('/:id/result/:studentId', authenticateToken, quizController.getQuizResult);
    router.get('/:id/attempts', authenticateToken, quizController.getQuizAttempts);
    
    // Teacher routes
    router.post('/', authenticateToken, quizController.createQuiz);
    router.put('/:id', authenticateToken, quizController.updateQuiz);
    router.delete('/:id', authenticateToken, quizController.deleteQuiz);
    
    // Student routes
    router.post('/:id/submit', authenticateToken, quizController.submitQuiz);

    app.use('/api/quizzes', router);
    console.log('[ROUTES] Quiz routes initialized');
}
