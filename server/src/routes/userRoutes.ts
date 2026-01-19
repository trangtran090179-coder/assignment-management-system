import { Router, Application } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();
const userController = new UserController();

export default function setUserRoutes(app: Application) {
    app.use('/api/users', router);
    
    router.get('/', userController.getUsers.bind(userController));
    router.get('/:id', userController.getUserById.bind(userController));
    router.post('/', userController.createUser.bind(userController));
    router.put('/:id', userController.updateUser.bind(userController));
    router.delete('/:id', userController.deleteUser.bind(userController));
}