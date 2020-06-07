var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", {
    title: "Express",
  });
});

/* Stocks Page */
router.get("/symbols", (req, res, next) => {
  // Check if the req has a industry attached
  if (req.body.industry !== undefined) {
    console.log(req.body.industry); // TODO: remove in production
    console.log(/^[a-z]+$/i.test(req.body.industry)); // TODO: remove in production

    if (!/^[a-z]+$/i.test(req.body.industry)) {
      res.status(400).json({
        error: true,
        message: "Invalid query parameter: only 'industry' is permitted",
      });
    } else {
      req.db
        .from("stocks")
        .distinct("name", "symbol", "industry")
        .where("industry", "LIKE", `%${req.body.industry}%`)
        .then((rows) => {
          console.log(rows.length); //TODO: Remove in production

          if (rows.length === 0) {
            res.status(404).json({
              error: true,
              message: "Industry sector not found",
            });
          }

          res.json({
            //TODO: Need to updated the response to have rows as an array of objects.
            rows,
          });
        })
        .catch((err) => {
          res.status(500).json({
            Error: true,
            Message: "Server Error - Error executing MySQL query",
          });
        });
    }
  } else {
    req.db
      .from("stocks")
      .distinct("name", "symbol", "industry")
      .then((rows) => {
        console.log(rows.length); // TODO: remove in production
        res.json({
          //TODO: Need to updated the response to have rows as an array of objects instead of returning a object of array, where array is an array of objects.
          rows,
        });
      })
      .catch((err) => {
        res.status(500).json({
          Error: true,
          Message: "Server Error - Error executing MySQL query",
        });
      });
  }
});

/* Unathenticated Specific Symbol Stock page */
router.get("/:symbol", (req, res, next) => {
  // Check if 'from' and 'to' were specified
  if (req.body.from || req.body.to) {
    console.log("to and from were give for unathorised routes");
    res.status(400).json({
      error: true,
      message:
        "Date parameters only available on authenticated route /stocks/authed",
    });
  } else {
    // Simple Unauthed Specific symbol stock query
    req.db
      .from("stocks")
      .select("*")
      .where("symbol", "=", req.params.symbol)
      .then((rows) => {
        if (rows.length === 0) {
          // unrecorded Symbol
          res.status(404).json({
            error: true,
            message: "No entry for symbol in stocks database",
          });
        } else {
          res.status(200).json(rows[0]);
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

/**
 * Checks the validity of the user token.
 * @summary If the description is long, write your summary here. Otherwise, feel free to remove this.
 * @param {object} token - JWT token object to autherise the request.
 * @return {boolean} Return if the token is valid, if NOT handles the excpetions as well.
 */
const tokenIsValid = (token) => {
  console.log(token); // TODO: Remove in production
  // Check token is valid and not expired
  // FIXME: Add token validation logic.
  return true;
};

/* Authenticated Specific Symbols Page */
router.get("/authed/:symbol", (req, res, next) => {
  if (!req.body.token) {
    // No token provided
    res.status(403).json({
      error: true,
      message: "Authorization header not found",
    });
  } else {
    if (tokenIsValid(req.body.token)) {
      if (req.body.from || req.body.to) {
        // check if there are from and to dates supplied
        console.log("from and to defeind"); // TODO: Remove in production
        console.log(req.body.from); // TODO: Remove in production
        req.db
          .from("stocks")
          .select("*")
          .where(
            "symbol",
            "=",
            req.params.symbol,
            "AND",
            "timestamp",
            ">=",
            req.body.from
          ) // FIXME: The date comparison is broken the date seem to not be in the right format
          .then((row) => {
            console.log(`${rows.length} Rows retertived`);
            res.json(rows);
          })
          .catch((err) => {
            res.status(500).json({
              Error: true,
              Message: "Server Error - Error executing MySQL query",
            });
          });
      } else {
        req.db
          .from("stocks")
          .select("*")
          .where("symbol", "=", req.params.symbol)
          .then((rows) => {
            if (rows.length === 0) {
              res.status(404).json({
                error: true,
                message: "No entry for symbol in stocks database",
              });
            } else {
              res.status(200).json(rows);
            }
          })
          .catch((err) => {
            res.status(500).json({
              Error: true,
              Message: "Server Error - Error executing MySQL query",
            });
          });
      }
    }
  }
});

module.exports = router;

// TODO: ASK
/*
 * - if the date is beyond the start and end date of the database do we limit the dates to actual dates or do we return a error?
 * - can user only supply a start date and not an end date? and vice vera?
 * - Is it okay to have a long index.js file? are we expect to break our route handeling into smaller functions
 * - How to response with an array of objects? currently res.json returns an object of array with array being array of objects.
 * - Is there a smater way of formulating the queries especially for the where clause?
 * - Should we sort data before sending back to the user?
 * - Is response code 500 okay for database errors?
 * - Can edit the swagger docs to have more response codes? like 500 for server errors
 * - Any tips for date querying? how to match the dates in the database?
 */
