require("./config/config");

const rp = require("request-promise");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const _ = require("lodash");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const port = process.env.PORT;


var nextplayer = process.env.NEXT;


var app = express();

app.use(
  cors({
    origin: true,
    exposedHeaders: "x-access-token"
  })
);

app.use(bodyParser.json());

//endpoints
var nodeinfo = { haspapa: false };

app.post("/catchball", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["ball"]);
  if (body.ball == "1") {
    nodeinfo.haspapa = true;
  } else {
    nodeinfo.haspapa = false;
  }

  let options = {
    method: "POST",
    uri: "http://localhost:" + nextplayer + "/catchball",
    resolveWithFullResponse: true,
    json: true,
    body: { ball: "1" }
  };

  setTimeout(function() {
    rp(options)
      .then(response => {
        nodeinfo.haspapa = false;
        console.log("La papa se ha  ido para " + nextplayer);
      })
      .catch(e => {
        console.log("Error pasando la papa a " + nextplayer);
      });
  }, 3000);

  res.json({ status: "success", message: "catchball" });
});

app.get("/endgame", urlencodedParser, (req, res) => {
  console.log(
    "El nodo: " +
      process.env.NAMENODE +
      ", " +
      (nodeinfo != null && nodeinfo.haspapa ? "" : "NO") +
      " tiene la papa"
  );

  res.json({ status: "success", message: "endgame" });
  process.exit(0);
});


//get para ver los status 
// el numero de player logre que se hiciera automatico , genial !
app.get("/probando", urlencodedParser, (req, res) => {
  console.log("Yo soy el jugador : "+YO.numeroplayer);

  res.json({ status: "success", message: usuariosLista });
});



//new player lo vamos a utilizar para que los demas node.js sepan cuando un usuario se conecta a la red
//esto va hacer despues del login en la aplicacion angular
/*JSON que vamos a mandar:
{
  "newplayer": {
          "name":"herick",
          "numeroplayer":1,
          "port": 10001,
          "url":"192.168.1.1"
        }
}*/
//endpoints
//esta variable es utilizada la primera vez que un nodo quiere comenzar a jugar
//y es para que todas las demas maquinas sepan que hay un nuevo jugador

//aqui van a estar todos los usuarios esto es una lista de usuarios 
var usuariosLista = [];
let YO= {
          name:"herick",
          numeroplayer:1,
          port: 10003,
          url:"localhost" //TODO poner url real
        }; //TODO hacer un post agregando los datos del mismo angular de la pc al inicio para depsues tener
          //esta variable contenida en un post

app.post("/newplayer", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["newplayer"]);

 // if (body.newplayer.url != YO.url ) { TODO cambiar por esta linea
  if(YO.port != body.newplayer.port){
    //comprobamos si el nuevo usuario esta en la lista de los usuarios
    ExisteUsuario= false;

    for (var i = 0; i < usuariosLista.length ; i++) {
        if(usuariosLista[i].port == body.newplayer.port )ExisteUsuario = true; //TODO cambiar port por url al final
    }
    if(!ExisteUsuario){
      usuariosLista.push(body.newplayer);  
      // le ponemos al jugador que numero pertenece segun la lista que hay de usuario

      body.newplayer.numeroplayer = usuariosLista.length + 1 ;
      //ahora todos lo que esten en esa lista le mandamos la url
      for (var i = 0; i < usuariosLista.length ; i++) {
          let options = {
              method: "POST",
              uri: "http://"+ usuariosLista[i].url+":" + usuariosLista[i].port + "/newplayer", 
              resolveWithFullResponse: true,
              json: true,
              body: body
          }
          console.log("1: ");
          console.log(options.body);
          rp(options)
              .then(response => {
                  console.log("pasamos la info para el siguiente");
              })
              .catch(e => {

                  console.log("Error haciendo el newplayer del domino" );
              });
      };
      //ahora le enviamos de nuevo al nodo que mando nuestra informacion la informacion de este nodo 
     let options = {
              method: "POST",
              uri: "http://" + body.newplayer.url +":"+ body.newplayer.port + "/newplayerRetorno", //ponemos este puerto porque es solo para que los otros nodos una sola vez
              resolveWithFullResponse: true,                                 //envien su informacion al nuevo nudo que esta ingresando 
              json: true,
              body: {   newplayer: {
                                  name:YO.name,
                                  numeroplayer: YO.numeroplayer,
                                  port: YO.port,
                                  url:YO.url 
                        } 
                    }
              }
              console.log("2: ");
              console.log(options.body);
          rp(options)
              .then(response => {
                  console.log("pasamos la info para el siguiente");
              })
              .catch(e => {
                  console.log("Error pasando el new user ");
              });

    }
  }else {
    //este es el caso que otra maquina le este mandando de vuelta la peticion del nuevo jugador
    if(YO.numeroplayer < body.newplayer.numeroplayer ) YO.numeroplayer = body.newplayer.numeroplayer;
  }

  res.json({ status: "success", message: "newplayer" });
  
});


app.post("/newplayerRetorno", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["newplayer"]);
          console.log("3 :");
console.log(body);
    ExisteUsuario= false;

    for (var i = 0; i < usuariosLista.length ; i++) {
        if(usuariosLista[i] == body.newplayer )ExisteUsuario = true;
    }
    if(!ExisteUsuario)
      usuariosLista.push(body.newplayer);  

  res.json({ status: "success", message: "newplayerRetorno" });
  
});

// not match endpoints
app.get("/*", (req, res) => {
  res.status(404).send();
});

app.post("/*", (req, res) => {
  res.status(404).send();
});

app.put("/*", (req, res) => {
  res.status(404).send();
});

app.delete("/*", (req, res) => {
  res.status(404).send();
});

app.listen(YO.port, () => {
  console.log(`Started on port ${YO.port}`);
});
