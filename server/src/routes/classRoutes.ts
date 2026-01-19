import { Router, Application } from 'express';
import { ClassController } from '../controllers/classController';
import { AssignmentController } from '../controllers/assignmentController';

const router = Router();
const classController = new ClassController();
const assignmentController = new AssignmentController();

export default function setClassRoutes(app: Application) {
    app.use('/api/classes', router);
    
    router.get('/', classController.getClasses.bind(classController));
    // Assignment routes MUST come before /:id route
    router.get('/:classId/assignments', assignmentController.getClassAssignments.bind(assignmentController));
    // General class routes
    router.get('/:id', classController.getClassById.bind(classController));
    router.post('/', classController.createClass.bind(classController));
    router.put('/:id', classController.updateClass.bind(classController));
    router.delete('/:id', classController.deleteClass.bind(classController));
}
