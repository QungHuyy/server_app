const jwt = require('jsonwebtoken');

module.exports.verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Không có token xác thực' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gfdgfd');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};



