export default function authorization(req, res, next) {
  const apikey = req.headers.apikey;
  // const authHeader = req.headers.authorization; // read Authorization header
  // const apikey = authHeader && authHeader.split(" ")[1]; // extract token

  if (!apikey || (apikey && apikey !== process.env.API_KEY)) {
    res.send({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  next();
}
export { authorization };
