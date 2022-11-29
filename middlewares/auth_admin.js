

const admin = (req, res, next) => {

    if (req.user.type=='admin') return next();
    // const token =
    //     req.body.token || req.query.token || req.headers["x-access-token"];

    // if (!token) {
    return res.status(403).send("Admin is required for authentication");
    // }
    // try {
    //     const decoded = jwt.verify(token, "process.env.TOKEN_KEY");
    //     req.user = decoded;
    // } catch (err) {
    //     return res.status(401).send("Invalid Token");
    // }
    
};

module.exports = admin;