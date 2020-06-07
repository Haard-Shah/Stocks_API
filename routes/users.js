var express = require("express");
var router = express.Router();

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

/* Resigter route */
router.post("/register", (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed",
    });
  } else {
    const filter = {
      email: req.body.email,
      password: req.body.password, //TODO: add logic to encode the password using JWT
    };

    req
      .db("users")
      .select("*")
      .where(filter)
      .then((rows) => {
        if (rows.length === 1) {
          // Check if users already exists
          res.status(409).json({
            error: true,
            message: "User already exists!",
          });
        } else {
          req
            .db("users")
            .insert(filter)
            .then((rows) => {
              if (rows.length === 1) {
                res.status(201).json({
                  success: true,
                  message: "User created",
                });
                console.log("User Created!");
              }
            })
            .catch((err) => {
              res.status(500).json({
                Error: true,
                Message:
                  "Server Error - Error executing MySQL query user not created",
              });
            });
        }
      })
      .catch((err) => {
        res.status(500).json({
          Error: true,
          Message: "Server Error - Error executing MySQL query",
        });
      });
  }
});

/* Login route */
router.post("/login", (req, res, next) => {
  res.send("Login route");
});

module.exports = router;
