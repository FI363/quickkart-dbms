/**
 * QuickKart: Quick-Commerce Management System
 * Role-Based Access Control (RBAC) Guard Middleware
 */

function roleGuard(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: User authentication required.'
            });
        }

        const userRole = req.user.roleName;

        if (!allowedRoles.includes(userRole) && userRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: `Forbidden: Access requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${userRole}`
            });
        }

        next();
    };
}

module.exports = {
    roleGuard
};
