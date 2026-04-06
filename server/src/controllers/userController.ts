import { Request, Response } from 'express';
import pool from '../db';
import { AuthRequest } from '../middleware/auth';

// GET /users - admin only
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({ users: result.rows });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
};

// GET /users/me - authenticated user
export const getCurrentUser = async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = $1',
            [req.user?.id]
        );
        res.json({ user: result.rows[0] });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
};


// PATCH /users/:id/role - admin only
export const updateUserRole = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['viewer', 'analyst', 'admin'].includes(role)) {
        res.status(400).json({ error: 'Invalid role' });
        return;
    }

    try {
        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
            [role, id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ user: result.rows[0] });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
};

// PATCH /users/:id/status - admin only
export const updateUserStatus = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
        res.status(400).json({ error: 'is_active must be a boolean' });
        return;
    }

    try {
        const result = await pool.query(
            'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, email, is_active',
            [is_active, id]
        );
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ user: result.rows[0] });
    } catch {
        res.status(500).json({ error: 'Server error' });
    }
};