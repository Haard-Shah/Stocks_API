var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
const {
  secretKey
} = require("../config");

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
    return;
  }
};

/* Stocks Page */
router.get("/symbols", (req, res, next) => {
  // Check if the req has a industry attached
  const {
    industry
  } = req.query;

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
          return;
        })
        .catch((err) => {
          res.status(500).json({
            Error: true,
            Message: "Server Error - Error executing MySQL query",
          });
          return;
        });
    }
  } else {
    req.db
      .from("stocks")
      .distinct("name", "symbol", "industry")
      .then((rows) => {
        console.log(rows.length); // TODO: remove in production
        res.json(rows);
        return;
      })
      .catch((err) => {
        res.status(500).json({
          Error: true,
          Message: "Server Error - Error executing MySQL query",
        });
        return;
      });
  }
});

/* Unathenticated Specific Symbol Stock page */
router.get("/:symbol", (req, res, next) => {
  const {
    from,
    to
  } = req.query;

  console.log(to, from);
  // Check if 'from' and 'to' were specified
  if (from || to) {
    console.log("to and from were give for unathorised routes"); //TODO: remove in production
    res.status(400).json({
      error: true,
      message: "Date parameters only available on authenticated route /stocks/authed",
    });
    return;
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
            message: "No entry for symbol in stocks database - Symbol shold be 1 - 5 Characters long (all in uppercase)",
          });
          return;
        } else {
          res.status(200).json(rows[0]);
          return;
        }
      })
      .catch((err) => {
        res.status(500).json({
          Error: true,
          Message: "Server Error - Error executing MySQL query",
        });
        return;
      });
  }
});

/* Authenticated Specific Symbols Page */
router.get("/authed/:symbol", Authorised, (req, res, next) => {
  // Reterive the to and from dates
  const {
    from,
    to
  } = req.query;

  // Check if a query was defined
  if (JSON.stringify(req.query) !== "{}") {
    // if a query is defined, check if its defined with right parameters
    if (!from || !to) {
      res.status(400).json({
        error: true,
        message: "Parameters allowed are 'from' and 'to', example: /stocks/authed/AAL?from=2020-03-15",
      });
      return;
    }

    // if query is defined, with right parameters, check if the parameters are in valid dates format
    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (!isNaN(fromDate.getDate()) && (!isNaN(toDate.getDate()))) {
      // valid dates, reterive the data between dates
      req.db.from("stocks").select("*")
        .where("symbol", "=", req.params.symbol)
        .whereBetween("timestamp", [from, to])
        .then((rows) => {
          console.log(`${rows.length} Rows retertived`);

          // if query returns null, no data to send
          if (rows.length === 0) {
            res.status(404).json({
              error: true,
              message: "No entries available for query symbol for supplied date range",
            });
            return;
          }

          // else succesful data reterival
          res.status(200).json(rows);
          return;
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({
            error: true,
            message: "Server Error - cannot reterive data: no match",
          });
          return;
        });
    } else {
      // Date suplied is not in correct format
      res.status(404).json({
        error: true,
        message: "No entries available for query symbol for supplied date range - Check query dates",
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
        // if no data reterived, symbol is not recorded
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