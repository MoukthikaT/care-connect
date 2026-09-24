import jwt from 'jsonwebtoken';

const getSecret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters.');
  }
  return process.env.JWT_SECRET;
};

export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    getSecret(),
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(
    token,
    getSecret()
  );
};
