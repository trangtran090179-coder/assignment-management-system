import { Application, Router } from 'express';
import { startSession, recordEvents, endSession, getReport } from '../controllers/anticheatController';

function setAnticheatRoutes(app: Application) {
  const router = Router();
  router.post('/start', startSession);
  router.post('/event', recordEvents);
  router.post('/end', endSession);
  router.get('/report/:submissionId', getReport);
  app.use('/api/anticheat', router);
  console.log('[ROUTES] Anticheat routes initialized');
}

export default setAnticheatRoutes;
