import 'reflect-metadata';
import express, { Application } from 'express';
import mainRouter from './routers/mainRouter';

const app: Application = express();
const port = 8000;

app.listen(port, () => {
	console.log(`Server is on fire at http://localhost:${port}`);
});

app.use(express.json());

app.use('/api', mainRouter);
