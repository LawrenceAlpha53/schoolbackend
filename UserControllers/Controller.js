// UserControllers/Controller.js
const db = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Users = db.Users;

module.exports = {

  // ================= REGISTER =================
  async register(req, res) {
    try {

      const {
        Fname,
        Lname,
        Email,
        Phonenumber,
        password,
        role = "student"
      } = req.body;

      if (!Email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required"
        });
      }

      const existing = await Users.findOne({
        where: { Email }
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email already exists"
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await Users.create({
        Fname,
        Lname,
        Email,
        Phonenumber,
        password: hashedPassword,
        role
      });

      // Remove password from response
      const userResponse = {
        id: user.id,
        Fname: user.Fname,
        Lname: user.Lname,
        Email: user.Email,
        Phonenumber: user.Phonenumber,
        role: user.role,
        createdAt: user.createdAt
      };

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        user: userResponse
      });

    } catch (error) {
      console.error("REGISTER ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Registration failed",
        error: error.message
      });
    }
  },

  // ================= LOGIN =================
  // async login(req, res) {
  //   try {
  //     const { Email, password } = req.body;

  //     console.log('📌 Login attempt for:', Email);

  //     // Validate input
  //     if (!Email || !password) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Email and password are required"
  //       });
  //     }

  //     // Find user
  //     const user = await Users.findOne({
  //       where: { Email }
  //     });

  //     if (!user) {
  //       console.log('❌ User not found:', Email);
  //       return res.status(401).json({
  //         success: false,
  //         message: "Invalid email or password"
  //       });
  //     }

  //     // Check password
  //     const isMatch = await bcrypt.compare(password, user.password);

  //     if (!isMatch) {
  //       console.log('❌ Password mismatch for:', Email);
  //       return res.status(401).json({
  //         success: false,
  //         message: "Invalid email or password"
  //       });
  //     }

  //     // Generate token
  //     const token = jwt.sign(
  //       {
  //         id: user.id,
  //         email: user.Email,
  //         role: user.role
  //       },
  //       process.env.JWT_SECRET || "SECRET_KEY",
  //       {
  //         expiresIn: "24h"
  //       }
  //     );

  //     console.log('✅ Login successful for:', Email);
  //     console.log('🔍 Token generated:', token.substring(0, 30) + '...');

  //     // Remove password from response
  //     const userData = {
  //       id: user.id,
  //       Fname: user.Fname,
  //       Lname: user.Lname,
  //       Email: user.Email,
  //       Phonenumber: user.Phonenumber,
  //       role: user.role
  //     };

  //     return res.status(200).json({
  //       success: true,
  //       message: "Login successful",
  //       token: token,
  //       user: userData
  //     });

  //   } catch (error) {
  //     console.error("LOGIN ERROR:", error);

  //     return res.status(500).json({
  //       success: false,
  //       message: "Login failed",
  //       error: error.message
  //     });
  //   }
  // },

// UserControllers/Controller.js – login with blocked check

async login(req, res) {
  try {
    const { Email, password } = req.body;

    if (!Email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    const user = await Users.findOne({ where: { Email } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // -------------------------------
    // 🚫 BLOCKED USER CHECK
    // -------------------------------
  // Check if user is blocked
if (user.isBlocked) {
  console.warn(`⚠️ Blocked login attempt for ${Email}`);
  return res.status(403).json({
    success: false,
    message: "Your account has been blocked. Please contact the system ADMINISTRATOR(Director) or the DEVELOPER(0787332384).",
  });
}


// Check if user is blocked
if (user.status === 'blocked') {
  return res.status(403).json({
    success: false,
    message: "Your account has been blocked. Please contact the system ADMINISTRATOR(Director) or the DEVELOPER(0787332384).",
  });
}

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.Email,
        role: user.role
      },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "24h" }
    );

    const userData = {
      id: user.id,
      Fname: user.Fname,
      Lname: user.Lname,
      Email: user.Email,
      Phonenumber: user.Phonenumber,
      role: user.role,
      status: user.status  // include status for frontend
    };

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userData
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message
    });
  }
},




  // ================= VERIFY TOKEN =================
  async verifyToken(req, res) {
    try {
      const user = await Users.findByPk(req.user.id, {
        attributes: ['id', 'Fname', 'Lname', 'Email', 'Phonenumber', 'role', 'createdAt']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      return res.status(200).json({
        success: true,
        message: "Token is valid",
        user: user
      });

    } catch (error) {
      console.error("VERIFY TOKEN ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to verify token",
        error: error.message
      });
    }
  },

  // ================= GET CURRENT USER =================
  async getCurrentUser(req, res) {
    try {
      const user = await Users.findByPk(req.user.id, {
        attributes: ['id', 'Fname', 'Lname', 'Email', 'Phonenumber', 'role', 'createdAt']
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }







      return res.status(200).json({
        success: true,
        user
      });

    } catch (error) {
      console.error("GET USER ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get user",
        error: error.message
      });
    }
  },

  // ================= GET ALL USERS =================
  async getUsers(req, res) {
    try {
      const users = await Users.findAll({
        attributes: ['id', 'Fname', 'Lname', 'Email', 'Phonenumber', 'role', 'createdAt']
      });

      return res.status(200).json({
        success: true,
        users
      });

    } catch (error) {
      console.error("GET USERS ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to get users",
        error: error.message
      });
    }
  },

  // ================= UPDATE USER =================
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { Fname, Lname, Phonenumber, role } = req.body;

      const user = await Users.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      await user.update({
        Fname: Fname || user.Fname,
        Lname: Lname || user.Lname,
        Phonenumber: Phonenumber || user.Phonenumber,
        role: role || user.role
      });

      const userData = {
        id: user.id,
        Fname: user.Fname,
        Lname: user.Lname,
        Email: user.Email,
        Phonenumber: user.Phonenumber,
        role: user.role
      };

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: userData
      });

    } catch (error) {
      console.error("UPDATE USER ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update user",
        error: error.message
      });
    }
  },

  // ================= DELETE USER =================
  async deleteUser(req, res) {
    try {
      const { id } = req.params;

      const user = await Users.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      await user.destroy();

      return res.status(200).json({
        success: true,
        message: "User deleted successfully"
      });

    } catch (error) {
      console.error("DELETE USER ERROR:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to delete user",
        error: error.message
      });
    }
  }
};