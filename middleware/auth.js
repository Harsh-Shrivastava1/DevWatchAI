const jwt = require("jsonwebtoken");
const { User } = require("../models");

function signSession(user) {
  return jwt.sign(
    {
      userId: String(user._id),
      uid: user.firebaseUid,
      email: user.email
    },
    process.env.JWT_SECRET || "devwatch-local-secret",
    { expiresIn: "7d" }
  );
}

async function requireAuth(request, response, next) {
  try {
    const header = request.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      response.status(401).json({
        success: false,
        error: "Authentication required"
      });
      return;
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "devwatch-local-secret"
    );
    const user = await User.findById(payload.userId);

    if (!user) {
      response.status(401).json({
        success: false,
        error: "Session user no longer exists"
      });
      return;
    }

    request.user = user;
    next();
  } catch (error) {
    response.status(401).json({
      success: false,
      error: "Invalid or expired session"
    });
  }
}

module.exports = {
  requireAuth,
  signSession
};
