import jwt from "jsonwebtoken";
function commonVerificationForAuthenticuser(req, res, next, userCode) {
  const token = req.headers["authorization"];
  let tokenWithoutBearer = null;
  if (!token) {
    return res.status(401).json({ message: "Authentication token missing" });
  }
  if (token && token.startsWith("Bearer ")) {
    // Remove the "Bearer " keyword and extract the token
    tokenWithoutBearer = token.split(" ")[1];
  }
  jwt.verify(tokenWithoutBearer, process.env.JWT_SECRTE, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    if (Array.isArray(userCode) && userCode.includes(decoded.userType)) {
      req.user = decoded;
      next();
    } else if (decoded?.userType === userCode) {
      req.user = decoded;
      next();
    } else {
      return res.status(401).json({ message: "Permission denied" });
    }
  });
}

export function authenticateToken(req, res, next) {
  return commonVerificationForAuthenticuser(req, res, next, [1, 2]);
}

export function authenticateUser(req, res, next) {
  return commonVerificationForAuthenticuser(req, res, next, 2);
}

export function authenticateSuperAdmin(req, res, next) {
  return commonVerificationForAuthenticuser(req, res, next, 1);
}
