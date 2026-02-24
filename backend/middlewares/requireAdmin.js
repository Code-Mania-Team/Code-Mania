import { supabase } from "../core/supabaseClient.js";

export default async function requireAdmin(req, res, next) {
    try {
        const tokenRole = req.user?.role || res.locals?.role;
        if (tokenRole === 'admin') {
            return next();
        }

        const userId = req.user?.user_id || res.locals?.user_id;
        if (!userId) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: admin access required',
            });
        }

        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle();

        if (error || data?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: admin access required',
            });
        }

        req.user = {
            ...(req.user || {}),
            user_id: userId,
            role: 'admin',
        };
        res.locals.role = 'admin';

        return next();
    } catch {
        return res.status(403).json({
            success: false,
            message: 'Forbidden: admin access required',
        });
    }
}

export { requireAdmin };
