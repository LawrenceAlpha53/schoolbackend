const db = require('../models');
const bcrypt = require('bcrypt');

const User = db.schoolManagement;

const UserServices = {

  // REGISTER
  async createUser(data) {

    const { fullName, Email, username, password, role } = data;

    const existingUser = await User.findOne({
      where: { Email }
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      Email,
      username,
      password: hashedPassword,
      role
    });

    return user;
  },

  // LOGIN
  async loginUser(username, password) {

    const user = await User.findOne({
      where: { username }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new Error('Invalid password');
    }

    return user;
  }

};

module.exports = UserServices;