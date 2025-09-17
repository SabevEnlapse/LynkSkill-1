// /pages/api/check-user.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { clerkClient } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const dbUser = await prisma.user.findUnique({
            where: { clerkId: userId },
        });

        if (!dbUser) return res.status(403).json({ error: 'User not found in DB' });

        res.status(200).json({ ok: true, user: dbUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}
