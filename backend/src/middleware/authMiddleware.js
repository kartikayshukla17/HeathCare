import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.cookies.token) {
        token = req.cookies.token;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            // Verify token
            const secret = process.env.JWT_SECRET || 'default_secret_for_dev';
            const decoded = jwt.verify(token, secret);

            // Get user from the token based on role
            let user;
            if (decoded.role === 'patient') {
                user = await Patient.findById(decoded.id).select('-password');
            } else if (decoded.role === 'doctor') {
                user = await Doctor.findById(decoded.id).select('-password');
            }

            if (!user) {
                res.status(401);
                throw new Error('Not authorized, user not found');
            }

            req.user = user;
            req.user.role = decoded.role;

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            next(new Error('Not authorized, token failed'));
        }
    } else {
        res.status(401);
        next(new Error('Not authorized, no token'));
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            res.status(403);
            return next(new Error(`User role ${req.user.role} is not authorized to access this route`));
        }
        next();
    };
};
