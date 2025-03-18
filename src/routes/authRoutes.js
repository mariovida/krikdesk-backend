const express = require("express");
const {
  refreshTokenController,
  loginController,
  forgotPassword,
} = require("../controllers/authController");

const router = express.Router();

router.post("/refresh-token", refreshTokenController);
router.post("/login", loginController);
router.post("/forgot-password", forgotPassword);

module.exports = router;
