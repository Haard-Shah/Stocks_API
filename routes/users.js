var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  secretKey
} = require("../config");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

/* Resigter route */
router.post("/register", (req, res, next) => {
  // Retrive email and password from req.body
  const email = req.body.email;
  const password = req.body.password;

  console.log(email);
  console.log(password);

  // Check if parameters were provided correctly
  if (!email || !password) {
    // TODO: add email validity check
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed",
    });
    return;
  } else {
    // if parameters were correct, check if user already exists
    const queryUsers = req.db("users").select("*").where("email", "=", email);
    queryUsers
      .then((users) => {
        if (users.length === 1) {
          res.status(409).json({
            error: true,
            message: "User already exists!",
          });
          return;
        } else {
          // if user does not exist, create user
          const saltRounds = 10; // TODO: ASK why we need to define the salt here? why can't it be reterived from .env file?
          const hash = bcrypt.hashSync(password, saltRounds);
          return req.db.from("users").insert({
            email,
            hash
          });
        }
      })
      .then((rows) => {
        if (rows.length === 1) {
          res.status(201).json({
            success: true,
            message: "User created",
          });
          console.log("User Created!");
          return;
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: true,
          message: "Server Error - Could not create user",
        });
      });
  }
});

/* Login route */
router.post("/login", (req, res, next) => {
  // 1. Retrive email and password from req.body
  const email = req.body.email;
  const password = req.body.password;

  // Check if parameters were provided correctly
  if (!email || !password) {
    // TODO: add email validity check
    res.status(400).json({
      error: true,
      message: "Request body incomplete - email and password needed",
    });
    return;
  } else {
    // 2. Determine if a user exists in the table
    const queryUsers = req.db
      .from("users")
      .select("*")
      .where("email", "=", email);
    queryUsers
      .then((users) => {
        // if not, respone with an error
        if (users.length === 0) {
          console.log("User does not exist");
          res.status(401).json({
            error: true,
            message: "Incorrect email or password.",
          });
          return;
        } else {
          // 2.1 if user exists check if they user provided correct password
          const user = users[0];
          return bcrypt.compare(password, user.hash);
        }
      })
      .then((match) => {
        // if user inputted wrong password
        if (!match) {
          console.log("Passwords do not match");
          res.status(401).json({
            error: true,
            message: "Incorrect email or password.",
          });
          return;
        } else {
          // 2.1.1 If correct password is provided, return JWT
          const expires_in = 60 * 60 * 24; // 1 Day expiry
          const exp = Date.now() + expires_in * 1000;
          const token = jwt.sign({
            email,
            exp
          }, secretKey);

          res.status(200).json({
            token_type: "Bearer",
            token,
            expires_in,
          });
        }
      })
      .catch((err) => {
        console.log(err); // TODO: remove in production
        res.status(500).json({
          error: true,
          message: "Authentication Error.",
        });
      });
  }
});

module.exports = router;