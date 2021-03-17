import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';

import Transactions from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
    title: string;
    type: 'income' | 'outcome';
    value: number;
    category: string;
}

class CreateTransactionService {
    public async execute({
        title,
        type,
        value,
        category,
    }: Request): Promise<Transactions> {
        const transactionRepository = getCustomRepository(
            TransactionRepository,
        );
        const categorieRepository = getRepository(Category);
        const { total } = await transactionRepository.getBalance();

        if (type === 'outcome' && total < value) {
            throw new AppError('you do not have enough balance');
        }

        let transactionCategory = await categorieRepository.findOne({
            where: { title: category },
        });

        if (!transactionCategory) {
            transactionCategory = categorieRepository.create({
                title: category,
            });

            await categorieRepository.save(transactionCategory);
        }
        const transaction = transactionRepository.create({
            title,
            type,
            value,
            category: transactionCategory,
        });
        await transactionRepository.save(transaction);
        return transaction;
    }
}

export default CreateTransactionService;
