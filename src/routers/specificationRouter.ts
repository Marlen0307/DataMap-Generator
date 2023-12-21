import { Router } from 'express';
import { container } from 'tsyringe';
import { SpecificationService } from '../services/specificationService';
import 'reflect-metadata';

const router = Router();

const specificationService = container.resolve(SpecificationService);

router.get('/', (req, res) => {
	res.send('Hello Specification');
});

router.post('/generate', (req, res) => {
	const { body } = req;
	console.log({ body });

	const { urls } = body;
	return specificationService.generateSpecification(res, urls);
});

export default router;
