var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
const { secretKey } = require("../config");

/**
 * validates the authorisation header and thus, the JWT token as well.
 * @param {object} req - reqest object from the browser.
 * @param {object} res - response object that will be sent to the browser.
 * @param {function} next - next callBack function to call after successful authorisation.
 * @return {callback} calls the next() function if authorisation is successful.
 * @return {error} - If authorisation fails returns with appropriate error code and error message.
 */
const Authorised = (req, res, next) => {
  const authorization = req.headers.authorization;
  let token = null;

  // Check if token was provided, and if provided, it is in correct format
  if (authorization && authorization.split(" ").length === 2) {
    token = authorization.split(" ")[1];
  } else {
    // No token provided, respond with error
    res.status(403).json({
      error: true,
      message: "Authorization header not found",
    });
    return;
  }

  try {
    // if token exists, check its validity
    const decodedToken = jwt.verify(token, secretKey);

    if (decodedToken.exp < Date.now()) {
      console.log("Token has expired");
      res.status(403).json({
        error: true,
        message: "Token Expired",
      });
      return;
    }

    // Permit user to advance to route
    next();
  } catch (e) {
    console.log(e);
    res.status(403).json({
      error: true,
      message: "You are not authorised to perform this action",
    });
  }
};

/* Stocks Page */
router.get("/symbols", (req, res, next) => {
  // Check if the req has a industry attached
  const { industry } = req.query;

  // Check if a query was defined
  if (JSON.stringify(req.query) !== "{}") {
    // if a query was defined, determine if query is valid // industry string test: !/^[a-z]+$/i.test(industry)
    if (!industry) {
      res.status(400).json({
        error: true,
        message: "Invalid query parameter: only 'industry' is permitted",
      });
      return;
    } else {
      // if a query is defined and is valid, reterive data with define industry
      req.db
        .from("stocks")
        .distinct("name", "symbol", "industry")
        .where("industry", "LIKE", `%${industry}%`)
        .then((rows) => {
          console.log("Rows reterived:", rows.length); //TODO: Remove in production
          // If database has no data on user specified industry responsd with an appropriate error
          if (rows.length === 0) {
            res.status(404).json({
              error: true,
              message: "Industry sector not found",
            });
            return;
          }

          res.json(rows);
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
        res.json(rows);
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
  const { from, to } = req.query;

  console.log(to, from);
  // Check if 'from' and 'to' were specified
  if (from || to) {
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

/* Authenticated Specific Symbols Page */
router.get("/authed/:symbol", Authorised, (req, res, next) => {
  const { from, to } = req.query;

  // Check if a query was defined
  if (JSON.stringify(req.query) !== "{}") {
    // if a query is defined, check if its defined with right parameters
    if (!from || !to) {
      res.status(400).json({
        error: true,
        message:
          "Parameters allowed are 'from' and 'to', example: /stocks/authed/AAL?from=2020-03-15",
      });
      return;
    }
    // if query is difined correctly, check if its valid
    // FIXME: need to send a 404 error if dates are out of bond
    console.log("from and to defeind"); // TODO: Remove in production
    console.log("From: ", from); // TODO: Remove in production
    // FIXME: check if the From and To are more than one values
    console.log("To:", to); // TODO: Remove in production

    // TODO: Add date contrainting code
    // if (from) {
    //   const minDate = req.db('stocks').min("timestamp").where("symbol", "=", req.params.symbol);
    //   from = (from < minDate ? minDate : from); //TODO: add check so that its still below max date
    // }

    // if (to) {
    //   const maxDate = req.db('stocks').max("timestamp").where("symbol", "=", req.params.symbol);
    //   to = (to > maxDate ? maxDate : to);
    // }

    // if query is defined, with right parameters, check if the paramerts are valid dates
    const fromDate = new Date(from); //TODO: remove all this
    const toDate = new Date(to);
    // console.log(from instanceof Date);
    // console.log(typeof (from));
    // console.log(fromDate.getDate());
    // console.log(fromDate.getDate() !== NaN);

    // console.log(to instanceof Date);
    // console.log(typeof (to));
    // console.log(toDate);

    console.log("From date in date form: ", fromDate.getDate());
    console.log("\n", typeof fromDate.getDate());
    console.log(" \n From is a NaN:", toDate.getDate() === NaN);
    console.log(" \n To is a NaN:", toDate.getDate() === NaN);

    // if ((fromDate.getDate() !== NaN) && (toDate.getDate() !== NaN)) { //TODO: Do a proper date test
    if (typeof from === "string" && typeof to === "string") {
      console.log("db query");
      // valid dates, reterive the data between dates
      req.db
        .from("stocks")
        .select("*")
        .where("symbol", "=", req.params.symbol)
        .whereBetween("timestamp", [from, to]) // FIXME: Need to constraint the date
        .then((rows) => {
          console.log(`${rows.length} Rows retertived`);

          // if query returns null, no data to send
          if (rows.length === 0) {
            res.status(404).json({
              error: true,
              message:
                "No entries available for query symbol for supplied date range",
            });
            return;
          }

          // else succesful data reterival
          res.json(rows);
          return;
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({
            error: true,
            message: "Server Error - cannot reterive data no match", //TODO: might want to add a error for to and from dates
          });
        });
    } else {
      // Date suplied not in correct formate
      res.status(404).json({
        error: true,
        message:
          "No entries available for query symbol for supplied date range",
      });
      return;
    }
  } else {
    // if query is not defined, reterive all the data
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
          return;
        } else {
          res.status(200).json(rows);
          return;
        }
      })
      .catch((err) => {
        res.status(500).json({
          Error: true,
          Message: "Server Error - cannot reterive data",
        });
        return;
      });
  }
});

module.exports = router;

// TODO: ASK
/*
 * - if the date is beyond the start and end date of the database do we limit the dates to actual dates or do we return a error?
 * - can user only supply a start date and not an end date? and vice vera?
 * - Is it okay to have a long index.js file? are we expected to break our route handeling into smaller functions
 * - How to response with an array of objects? currently res.json returns an object of array with array being array of objects.
 * - Is there a smater way of formulating the queries especially for the where clause?
 * - Should we sort data before sending back to the user?
 * - Is response code 500 okay for database errors?
 * - Can edit the swagger docs to have more response codes? like 500 for server errors
 * - Any tips for date querying? how to match the dates in the database?
 */
