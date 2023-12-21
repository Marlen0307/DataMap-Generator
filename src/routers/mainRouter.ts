import specificationRouter from './specificationRouter';
import { Router } from 'express';

const mainRouter = Router();

mainRouter.use('/specification', specificationRouter);

export default mainRouter;
