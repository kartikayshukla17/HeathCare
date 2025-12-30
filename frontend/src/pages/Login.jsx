import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye, EyeOff, Stethoscope } from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';
import { loginUser, clearError } from '../redux/slices/authSlice';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('patient');
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { loading, error, user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (user) {
            navigate('/');
        }
        return () => {
            dispatch(clearError());
        }
    }, [user, navigate, dispatch]);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            await dispatch(loginUser({ email, password, role })).unwrap();
            // Navigation handled by useEffect on user state change
        } catch (err) {
            console.error("Login failed", err);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-zinc-900 transition-colors duration-300">
            {/* Left Side - Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-900">
                <img
                    src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
                    alt="Medical Team"
                    className="absolute inset-0 w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent"></div>
                <div className="relative z-10 p-12 flex flex-col justify-end text-white">
                    <h1 className="text-4xl font-bold mb-4">Welcome to MediCare+</h1>
                    <p className="text-lg text-gray-300">Streamlining healthcare management for better patient outcomes.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 relative">
                <div className="absolute top-6 right-6">
                    <ThemeToggle />
                </div>

                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Stethoscope className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">MediCare+</span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sign In</h2>
                    <p className="text-gray-500 dark:text-gray-400">Access your personalized dashboard.</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">I am a...</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['patient', 'doctor'].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    className={`py-2.5 px-2 text-sm font-medium rounded-xl capitalize transition-all duration-200 border ${role === r
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/25'
                                        : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-blue-600 hover:text-blue-500 font-semibold hover:underline">
                        Create account
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
