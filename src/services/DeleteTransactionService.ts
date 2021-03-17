import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
    public async execute(id: string): Promise<void> {
        const transactonRepository = getCustomRepository(
            TransactionsRepository,
        );

        const transaction = await transactonRepository.findOne(id);

        if (!transaction) {
            throw new AppError('not exist');
        }

        await transactonRepository.remove(transaction);
    }
}

export default DeleteTransactionService;
