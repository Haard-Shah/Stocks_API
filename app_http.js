var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const cors = require("cors");
const helmet = require("helmet");

var app = express();

app.use(logger("common"));
app.use(helmet()); // Force HSTS header to only server on https

// Sets "Strict-Transport-Security: max-age=5184000; includeSubDomains".
const sixtyDaysInSeconds = 5184000
app.use(helmet.hsts({
    maxAge: sixtyDaysInSeconds
}))

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

logger.token("req", (req, res) => JSON.stringify(req.headers));
logger.token("res", (req, res) => {
    const headers = {};

    res.getHeaderNames().map((key) => (headers[key] = res.getHeader(key)));

    return JSON.stringify(headers);
});
app.use(cors()); // allow non domain website to access api
app.use(express.json());
app.use(
    express.urlencoded({
        extended: false,
    })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));



// Setup a route to redirect https
app.get('*', (req, res) => {
    console.log("\nredireciting")
    res.redirect('https://172.22.31.147' + req.url);
});

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