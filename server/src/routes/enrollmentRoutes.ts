import { Router, Application } from 'express';
import { EnrollmentController } from '../controllers/enrollmentController';

const router = Router();
const enrollmentController = new EnrollmentController();

export default function setEnrollmentRoutes(app: Application) {
    app.use('/api/enrollments', router);
    app.use('/api/students', router);
    app.use('/api/classes', router);
    
    router.post('/', enrollmentController.joinClass.bind(enrollmentController));
    router.get('/:studentId/classes', enrollmentController.getStudentClasses.bind(enrollmentController));
    router.get('/:studentId/assignments', enrollmentController.getStudentAssignments.bind(enrollmentController));
    router.get('/:classId/students', enrollmentController.getClassStudents.bind(enrollmentController));
}
