"use strict";

require("./app/tools")();

//configuracion del servidor
const http = require("http");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const passportLocal = require("passport-local").Strategy;
const socketio = require("socket.io");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const config = require("./app/config");
const mongo = require("./app/mongo");
const app = express();
const server = http.createServer(app);
const io = socketio.listen(server);
app.set("port", process.env.PORT || 3000);
app.use(express.static("public"));
app.use(urlencodedParser);
app.set("view engine", "ejs");

app.use(cookieParser("clave"));
app.use(
  session({
    secret: "clave",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

const google = require("./app/google");

const pack_app = {
  io,
  mongo,
  app,
  passport,
  config,
  google,
  urlencodedParser,
};


passport.use(
  new passportLocal({
    usernameField: 'celular',
    passwordField: 'clave'
  },
    async (celular, clave, done) => {
      let user = await google.users.getUser(celular);
      if (!user) {
        return done(null, false);
      }
      if (user.clave != clave) {
        return done(null, false);
      }
      return done(null, user);
    })
);

passport.serializeUser(function (user, done) {
  done(null, user.celular);
});

passport.deserializeUser(async function (celular, done) {
  let user = await google.users.getUser_TSV(celular);
  if (user) {
    done(null, user);
  } else {
    done(null, false);
  }
});

server.listen(app.get("port"), () => {
  console.log("corriendo en el puerto:", app.get("port"));
});

require("./app/socket.io")(pack_app);
require("./app/routes")(pack_app);
