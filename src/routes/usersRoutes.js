const express = require("express");
const {
  getUsers,
  getUserId,
  createUser,
  setPassword,
  updateUser,
  changePassword,
  toggleUserVerification,
} = require("../controllers/usersController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/users", authMiddleware, getUsers);
router.get("/users/user-id", authMiddleware, getUserId);
router.post("/users", authMiddleware, createUser);
router.put("/users/update-user", authMiddleware, updateUser);
router.post("/users/set-password", setPassword);
router.put("/users/change-password", authMiddleware, changePassword);
router.put(
  "/users/:id/toggle-verification",
  authMiddleware,
  toggleUserVerification
);

module.exports = router;
