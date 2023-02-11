const fs = require("fs");
const fetch = require("node-fetch")

let sheet = {};

(async function () {
  let urls = await cargarHojaGoogle("https://docs.google.com/spreadsheets/d/e/2PACX-1vQ9Vvo43gRD6T8HGuTfntJAa3p0uQjfz_T_O50bg--GxGOKphCTSTg0noQ42iBMgYDdRJ2GalmOWoOo/pub?gid=24747925&single=true&output=tsv");
  for (const url of urls) {
    sheet[url.Alias] = await cargarHojaGoogle(url.URL)
  }
  console.log("TODAS las hojas de cálculo cargadas")
})();

async function cargarHojaGoogle(url) {
  let respuesta = await fetch(url)
  let text = await respuesta.text()
  text = text.replaceAll("\r", "")
  let renglones = text.split("\n")
  let headers = renglones[0].split("\t")
  let retorno = []
  if (headers.length == 1) {
    retorno = renglones
  } else {
    for (let i = 1; i < renglones.length; i++) {
      const renglon = renglones[i];
      let obj = renglon.split("\t")
      let obj_renglon = {}
      for (const header of headers) {
        obj_renglon[header.trim()] = obj[headers.indexOf(header)].trim()
        let n = parseFloat(obj_renglon[header.trim()])
        if (!isNaN(n) && !obj_renglon[header.trim()].startsWith("0")  && !obj_renglon[header.trim()].includes("%")) {
          obj_renglon[header.trim()] = n
        } else if (["{", "["].some(e => obj_renglon[header.trim()].startsWith(e))) {
          try {
            obj_renglon[header.trim()] = JSON.stringify(obj_renglon[header.trim()])
          } catch (error) {
          }
        }
      }
      retorno.push(obj_renglon);
    }
  }
  retorno.find = function (columna, valor) {
    for (const elemento of this) {
      if (elemento[columna] == valor) {
        return elemento;
      }
    }
  }
  retorno.findAll = function (columna, valor) {
    let retorno = []
    for (const elemento of this) {
      if (elemento[columna] == valor) {
        retorno.push(elemento)
      }
    }
    return retorno
  }
  return retorno;
}


let mapa = {
  "/": (req, res) => {
    res.redirect("/home");
  },
  "/:view": async function (req, res, next) {
    let view = req.params.view;
    //lo que el servidor pasa al cliente
    let args = {
      sheet,
      user: req.user,
      view,
      folder: "root"
    };
    fs.exists(`views/${view}.ejs`, function (exists) {
      if (exists) {
        res.render(view, args);
      } else {
        res.render("404");
      }
    });
  },
  "/:folder/:view": async function (req, res, next) {
    let view = req.params.view;
    let folder = req.params.folder;
    let path = folder + "/" + view;
    //lo que el servidor pasa al cliente
    let args = {
      sheet,
      user: req.user,
      view,
      folder
    };
    fs.exists(`views/${path}.ejs`, function (exists) {
      if (exists) {
        res.render(path, args);
      } else {
        fs.exists(`views/${view}.ejs`, function (exists) {
          if (exists) {
            res.redirect(view);
          } else {
            res.render("404");
          }
        });
      }
    });
  },
};
module.exports = function (app_pack) {
  let { app, passport } = app_pack;
  //renderiza el get de la ruta
  app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
      res.redirect('/');
    });
  });
  for (const key in mapa) {
    app.get(key, mapa[key]);
  }
  app.post("/login", passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/auth/login",
  }));
};
