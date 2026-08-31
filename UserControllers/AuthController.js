const db = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Users = db.Users;

module.exports = {

  // REGISTER USER
  async register(req, res) {
    try {
      const { Fname, Lname, Email, Phonenumber, password, role } = req.body;

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await Users.create({
        Fname,
        Lname,
        Email,
        Phonenumber,
        password: hashedPassword,
        role
      });

      res.json({
        message: "User created successfully",
        user
      });

    } catch (error) {
      res.status(500).json({
        message: "Registration failed",
        error: error.message
      });
    }
  },

  // LOGIN USER
  async login(req, res) {
    try {
      const { email, password } = req.body;

      const user = await Users.findOne({ where: { email:email } });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid password" });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role.toLowerCase() },
        "SECRET_KEY",
        { expiresIn: "1d" }
      );

      res.json({
        message: "Login successful",
        token,
        user
      });

    } catch (error) {
      res.status(500).json({
        message: "Login failed",
        error: error.message
      });
    }
  }

};