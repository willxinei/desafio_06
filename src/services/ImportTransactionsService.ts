import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, getRepository, In } from 'typeorm';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface CSVTransaction {
    title: string;
    type: 'income' | 'outcome';
    value: number;
    category: string;
}

class ImportTransactionsService {
    async execute(filePath: string): Promise<Transaction[]> {
        const categorieRepository = getRepository(Category);
        const transactionRepository = getCustomRepository(
            TransactionsRepository,
        );
        const contacts = fs.createReadStream(filePath);

        const parsers = csvParse({
            from_line: 2,
        });

        const farseCS = contacts.pipe(parsers);
        const transaction: CSVTransaction[] = [];
        const categories: string[] = [];

        farseCS.on('data', async line => {
            const [title, type, value, category] = line.map((cell: string) =>
                cell.trim(),
            );

            if (!title || !type || !value) return;

            categories.push(category);

            transaction.push({ title, type, value, category });
        });
        await new Promise(resolve => farseCS.on('end', resolve));

        const existenCategories = await categorieRepository.find({
            where: { title: In(categories) },
        });

        const existemTitles = existenCategories.map(
            (category: Category) => category.title,
        );

        const addCategory = categories
            .filter(category => !existemTitles.includes(category))
            .filter((value, index, self) => self.indexOf(value) === index);

        const newCategory = categorieRepository.create(
            addCategory.map(title => ({
                title,
            })),
        );

        await categorieRepository.save(newCategory);

        const finalCatefories = [...newCategory, ...existenCategories];

        const transactions = transactionRepository.create(
            transaction.map(transaction => ({
                title: transaction.title,
                type: transaction.type,
                value: transaction.value,
                category: finalCatefories.find(
                    categoy => categoy.title === transaction.category,
                ),
            })),
        );

        await transactionRepository.save(transactions);
        await fs.promises.unlink(filePath);

        return transactions;
    }
}

export default ImportTransactionsService;
