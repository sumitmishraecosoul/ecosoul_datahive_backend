import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const tokenVerify = (req, res, next) => {
  try {
    // Try to get token from cookies first, then fallback to Authorization header
    let accessToken = req.cookies?.accessTokenHRMS;
    const refreshToken = req.cookies?.refreshTokenHRMS;

    // Fallback: Check Authorization header if cookie is missing
    if (!accessToken) {
      const authHeader = req.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7); // Extract token after "Bearer "
      }
    }

    if (!accessToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
      if (!err) {
        if (!decoded || decoded.id === undefined || decoded.email === undefined || decoded.department === undefined) {
          return res.status(401).json({ error: 'Invalid Access Token payload' });
        }
        req.user = decoded;
        req.userId = decoded.id;
        req.departmentId = Number(decoded.department);
        return next();
      }

      if (err.name !== 'TokenExpiredError') {
        return res.status(401).json({ error: 'Invalid Access Token' });
      }

      res.clearCookie('accessTokenHRMS');

      if (!refreshToken) {
        return res.status(401).json({ error: 'Missing Refresh Token' });
      }

      jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (rErr, rDecoded) => {
        if (rErr) {
          res.clearCookie('refreshTokenHRMS');
          return res.status(401).json({ error: 'Invalid Refresh Token' });
        }

        if (!rDecoded || rDecoded.id === undefined || rDecoded.email === undefined || rDecoded.department === undefined) {
          return res.status(401).json({ error: 'Invalid Refresh Token payload' });
        }

        const newAccessToken = jwt.sign(
          { id: rDecoded.id, email: rDecoded.email, department: rDecoded.department },
          process.env.JWT_ACCESS_SECRET,
          { expiresIn: '7d' }
        );

        res.cookie('accessTokenHRMS', newAccessToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        req.user = { id: rDecoded.id, email: rDecoded.email, department: rDecoded.department };
        req.userId = rDecoded.id;
        req.departmentId = Number(rDecoded.department);
        return next();
      });
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default tokenVerify;


