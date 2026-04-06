import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware/auth';

export const getSummary = async (req: AuthRequest, res: Response) => {
    try {
        // Total income and expenses
        const totalsResult = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses
      FROM financial_records
    `);

        const { total_income, total_expenses } = totalsResult.rows[0];
        const net_balance = total_income - total_expenses;

        // Category breakdown
        const categoryResult = await pool.query(`
      SELECT category,
        SUM(amount) AS total,
        type
      FROM financial_records
      GROUP BY category, type
      ORDER BY total DESC
    `);

        // Monthly trends
        const monthlyResult = await pool.query(`
      SELECT
        TO_CHAR(date, 'YYYY-MM') AS month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
      FROM financial_records
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month DESC
    `);

        // Recent activity
        const recentResult = await pool.query(`
      SELECT id, amount, type, category, date, notes
      FROM financial_records
      ORDER BY created_at DESC
      LIMIT 5
    `);

        res.json({
            total_income: Number(total_income),
            total_expenses: Number(total_expenses),
            net_balance: Number(net_balance),
            category_breakdown: categoryResult.rows,
            monthly_trends: monthlyResult.rows,
            recent_activity: recentResult.rows
        });

    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};