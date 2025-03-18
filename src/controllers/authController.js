const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const db = require("../config/database");

const generateRandomToken = () => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return token;
};

const refreshTokenController = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ newAccessToken });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

const loginController = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    const [users] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);
    if (users.length === 0) {
      return res.status(200).json({ error: "User not found" });
    }

    const user = users[0];
    if (user.is_verified !== 1 && (user.password === "" || !user.password)) {
      return res.status(200).json({ error: "Account not verified" });
    }
    if (user.is_verified !== 1) {
      return res.status(200).json({ error: "Account disabled" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(200).json({ error: "Invalid" });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Error logging in" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const krikemDefaultMail = process.env.KRIKWATCH_DEFAULT_MAIL;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (user.length === 0) {
      return res.status(200).json({ message: `Email not found` });
    }

    const passwordRequestToken = generateRandomToken(24);

    const tokenQuery = `
      UPDATE users
      SET password_request_token = ?
      WHERE id = ?
    `;
    await db.query(tokenQuery, [passwordRequestToken, user[0].id]);

    const emailTemplatePath = path.join(
      __dirname,
      "../templates/resetPassword.html"
    );
    const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");

    const environment = process.env.ENVIRONMENT || "development";
    let appUrl = process.env.TEST_FRONTEND_URL;
    if (environment === "production") {
      appUrl = process.env.FRONTEND_URL;
    }

    const resetLink = `${appUrl}/password-reset?token=${passwordRequestToken}`;
    const populatedTemplate = emailTemplate.replace(
      /{{resetLink}}/g,
      resetLink
    );

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `"KrikWatch" <${krikemDefaultMail}>`,
      to: email,
      subject: "Password reset link",
      html: populatedTemplate,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Internal server error" });
      }

      console.log("Email sent: " + info.response);
      res.status(200).json({
        message: "Password reset email sent successfully.",
      });
    });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = { refreshTokenController, loginController, forgotPassword };
