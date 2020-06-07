var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const knex_options = require("./knexfile");
const knex = require("knex")(knex_options); // setup databse connection options
const swaggerUI = require("swagger-ui-express");
const yaml = require("yamljs");
const swaggerDocumentation = yaml.load("./docs/swagger.yaml");
const cors = require("cors");
const helmet = require("helmet");

var stocksRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

logger.token("req", (req, res) => JSON.stringify(req.headers));
logger.token("res", (req, res) => {
  const headers = {};

  res.getHeaderNames().map((key) => (headers[key] = res.getHeader(key)));

  return JSON.stringify(headers);
});
app.use(logger("common"));
app.use(helmet()); // allow non domain website to access api
app.use(cors()); // allow non domain website to access api
app.use(express.json());
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// ---- Middleware -----
// db conneciton
app.use((req, res, next) => {
  req.db = knex;
  next();
});

app.use("/stocks", stocksRouter);
app.use("/users", usersRouter);
app.use("/", swaggerUI.serve, swaggerUI.setup(swaggerDocumentation));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
