import jwt from 'jsonwebtoken';
import Patient from '../models/Patient.js';
import Admin from '../models/Admin.js';
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
            // Use config default if process.env isn't set yet (though it should be)
            const secret = process.env.JWT_SECRET || 'default_secret_for_dev'; 
            const decoded = jwt.verify(token, secret);

            // Get user from the token based on role
            // We need to look up in the correct collection
            let user;
            if (decoded.role === 'patient') {
                user = await Patient.findById(decoded.id).select('-password');
            } else if (decoded.role === 'admin') {
                user = await Admin.findById(decoded.id).select('-password');
            } else if (decoded.role === 'doctor') {
                user = await Doctor.findById(decoded.id).select('-password');
            }

            if (!user) {
                // If role was missing or invalid, or user deleted
                 res.status(401);
                 throw new Error('Not authorized, user not found');
            }

            req.user = user;
            // Attach role to req.user for easier access if needed, or use decoded.role
            req.user.role = decoded.role; 

            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            // Pass error to error handler instead of sending json directly to match errorHandler usage
            // But for now, user snippet used next(new ErrorResponse...). 
            // I'll stick to basic express error throwing or res.status
            // The snippet returned next(new ErrorResponse). I'll use throw/next pattern if I had ErrorResponse class.
            // I'll just set status and throw to be caught by errorHandler or next(error).
            next(new Error('Not authorized, token failed'));
        }
    } else {
        res.status(401);
        next(new Error('Not authorized, no token'));
    }
};

export const leadOnly = (req, res, next) => {
    // Adapted for Admin role since "Lead" isn't in our schema
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403);
        next(new Error('Not authorized, Admin access only'));
    }
};
