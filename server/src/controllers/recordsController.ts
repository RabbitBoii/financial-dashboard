import { Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware/auth';

// POST /api/records - admin only
export const createRecord = async (req: AuthRequest, res: Response) => {
    const { amount, type, category, date, notes } = req.body;

    if (!amount || !type || !category || !date) {
        res.status(400).json({ error: 'Amount, type, category and date are required' });
        return;
    }

    if (!['income', 'expense'].includes(type)) {
        res.status(400).json({ error: 'Type must be income or expense' });
        return;
    }

    try {
        const result = await pool.query(
            `INSERT INTO financial_records (user_id, amount, type, category, date, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [req.user!.id, amount, type, category, date, notes || null]
        );
        res.status(201).json({ record: result.rows[0] });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/records - viewer, analyst, admin
export const getRecords = async (req: AuthRequest, res: Response) => {
    const { type, category, start_date, end_date } = req.query;

    let query = 'SELECT * FROM financial_records WHERE 1=1';
    const params: any[] = [];

    if (type) {
        params.push(type);
        query += ` AND type = $${params.length}`;
    }
    if (category) {
        params.push(category);
        query += ` AND category = $${params.length}`;
    }
    if (start_date) {
        params.push(start_date);
        query += ` AND date >= $${params.length}`;
    }
    if (end_date) {
        params.push(end_date);
        query += ` AND date <= $${params.length}`;
    }

    query += ' ORDER BY date DESC';

    try {
        const result = await pool.query(query, params);
        res.json({ records: result.rows });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /api/records/:id - viewer, analyst, admin
export const getRecordById = async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT * FROM financial_records WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Record not found' });
            return;
        }
        res.json({ record: result.rows[0] });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
};

// PATCH /api/records/:id - admin only
export const updateRecord = async (req: AuthRequest, res: Response) => {
    const { amount, type, category, date, notes } = req.body;

    if (type && !['income', 'expense'].includes(type)) {
        res.status(400).json({ error: 'Type must be income or expense' });
        return;
    }

    try {
        const result = await pool.query(
            `UPDATE financial_records
       SET amount = COALESCE($1, amount),
           type = COALESCE($2, type),
           category = COALESCE($3, category),
           date = COALESCE($4, date),
           notes = COALESCE($5, notes),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
            [amount, type, category, date, notes, req.params.id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Record not found' });
            return;
        }
        res.json({ record: result.rows[0] });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
};

// DELETE /api/records/:id - admin only
export const deleteRecord = async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            'DELETE FROM financial_records WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Record not found' });
            return;
        }
        res.json({ message: 'Record deleted successfully' });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
};