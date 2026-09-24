import User from '../models/User.js';
import ProviderProfile from '../models/ProviderProfile.js';
import { generateToken } from '../utils/jwt.js';
import { ROLES, PUBLIC_REGISTER_ROLES } from '../config/constants.js';

// @desc    Register a Customer or Service Provider
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, phone number, and role.'
      });
    }

    if (!PUBLIC_REGISTER_ROLES.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Only Customer and Service Provider accounts can be created through public registration.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone.trim(),
      role,
      address: address || {}
    });

    // Every newly registered provider starts in Pending verification state.
    if (role === ROLES.SERVICE_PROVIDER) {
      await ProviderProfile.create({
        user: user._id,
        businessName: name.trim(),
        verificationStatus: 'Pending',
        serviceAreas: address?.city
          ? [{ cityName: address.city, radiusInKm: 25 }]
          : []
      });
    }

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: `${role} account registered successfully.`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & issue JWT
// @route   POST /api/v1/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.status === 'Suspended') {
      return res.status(403).json({ success: false, message: 'Your account is suspended. Contact administrator.' });
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        address: user.address,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
};
