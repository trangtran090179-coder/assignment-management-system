import { Router, Application } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));
router.get('/logout', authController.logout.bind(authController));

export const setAuthRoutes = (app: Application) => {
    app.use('/api/auth', router);
};