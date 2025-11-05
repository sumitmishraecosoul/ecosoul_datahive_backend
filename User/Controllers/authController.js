import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../../Models/user.js';
import Department from '../../Models/department.js';

dotenv.config();

const authController = {};

authController.register = async (req, res) => {
  try {
    const { name, email, password, department } = req.body || {};

    if (!name || !email || !password || !department) {
      return res.status(400).json({ message: "All fields (name, email, password, department) are required" });
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const dept = await Department.findByPk(department);
    if (!dept) {
      return res.status(400).json({ message: "Department not found" });
    }

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      department
    });

    const userSafe = { ...newUser.toJSON() };
    delete userSafe.password;

    return res.status(201).json({ message: "User registered successfully", user: userSafe });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

authController.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }


    const payload = { id: user.id, email: user.email, department: user.department };

    const accessTokenHRMS = jwt.sign(
      payload,
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '7d' }
    );

    const refreshTokenHRMS = jwt.sign(
      payload,
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie(
      'accessTokenHRMS',
      accessTokenHRMS,
      {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      }
    );

    res.cookie(
      'refreshTokenHRMS',
      refreshTokenHRMS,
      {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000
      }
    );

    const { password: _ignored, ...safeUser } = user.get({ plain: true });

    return res.status(200).json({
      message: 'User logged in successfully',
      user: safeUser,
      accessTokenHRMS,
      refreshTokenHRMS
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

authController.logout = (req, res) => {
  try {
    res.clearCookie('accessTokenHRMS');
    res.clearCookie('refreshTokenHRMS');
    res.status(200).json({ message: 'User logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

authController.addUser = async (req, res) => {
  try {
    const { name, email, password, department } = req.body || {};
    if (!email || !password || !name || !department) {
      return res.status(400).json({ message: 'name, email, password, department are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await User.create({ name, email, password: hashedPassword, department });
    const { password: _ignored, ...safeUser } = created.get({ plain: true });
    return res.status(201).json({ message: 'User created successfully', user: safeUser });
  } catch (err) {
    console.error('Add user error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

authController.addDepartment = async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const exists = await Department.findOne({ where: { name } });
    if (exists) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    const dept = await Department.create({ name });
    return res.status(201).json({ message: 'Department created successfully', department: dept });
  } catch (err) {
    console.error('Add department error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

authController.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll();
    return res.status(200).json({ departments });
  } catch (err) {
    console.error('Get departments error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export default authController;

