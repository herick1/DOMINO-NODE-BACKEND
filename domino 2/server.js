require("./config/config");

const rp = require("request-promise");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const _ = require("lodash");
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const port = process.env.PORT;

var app = express();

app.use(
  cors({
    origin: true,
    exposedHeaders: "x-access-token"
  })
);
app.use(bodyParser.json());


//funcion global donde esta el usuario , TODO hacerlo con una base de datos
let YO= {
          name:"herick",
          numeroplayer:1,
          port: 10002,
          url:"localhost" // esto se actuliza segun el POST registrarusuario
        }; 

//ESte post funciona para registrar la informacion de manera local en el servidor 
//del nuevo usuario lo que se le pide es:
/*{
    "name":"herick",
    "port": 10001,
    "url":"localhost" //poner url privada en vez de localhost
  };*/
//TODO hacer que la ip de uno mismo sea automatico y no sea por parametro
app.post("/registrarusuario", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["name","port","url"]);
  console.log("4 :");
  console.log(body);
  YO.name = body.name;
  YO.port = body.port;
  YO.url = body.url;
  res.json({ status: "success", message: body});
});

//get para ver los status 
// el numero de player logre que se hiciera automatico , genial !
app.get("/probando", urlencodedParser, (req, res) => {
  console.log("Yo soy el jugador : "+YO.numeroplayer);

  res.json({ status: "success", message: usuariosLista });
});


//variable global donde estaran todas las partidas guardadas en el servidor
let partidas=[] //TODO crear clase partida y clase jugador para saber las fichas que tienen 

//clase partida TODO moverla de aqui
class Partida{
  constructor (){
    this.id = -1;
    this.ipjugadorCreadorDeLaPartida = "";  
    this.turno_jugador= 0;
    this.jugador1 = {ip : "" , fichas : [] };
    this.jugador2 = {ip : "" , fichas : [] };
    this.estatus= "ESPERA";
    this.jugadoresEnEstaPartida = 0;
    this.ganador = "";
    this.fichas_jugadas=[];
    this.fichas_partida=["0:0","0:1","0:2","0:3","0:4","0:5","0:6",
    "1:0","1:1","1:2","1:3","1:4","1:5","1:6",
    "2:0","2:1","2:2","2:3","2:4","2:5","2:6",
    "3:0","3:1","3:2","3:3","3:4","3:5","3:6",
    "4:0","4:1","4:2","4:3","4:4","4:5","4:6",
    "5:0","5:1","5:2","5:3","5:4","5:5","5:6",
    "6:0","6:1","6:2","6:3","6:4","6:5","6:6"]
  }
  llenarfichas(){
    let lista_fichasrandom=[]
    var ficha=-1
  while (this.fichas_partida.length>0 && lista_fichasrandom.length<14) { 
    ficha =(Math.floor(Math.random() * ((this.fichas_partida.length-1) - 0)) + 0);
    lista_fichasrandom.push(this.fichas_partida[ficha])
    this.fichas_partida.splice(ficha,1)
  }
    return lista_fichasrandom
  
}
}
//metodo post para crear la partida , este es el que se hace del angular al node para crear la partida
// cuando se crea una partida 
//TODO el que crea la partida va a repartir las fichas

//en el psotman mandar: 
/*{
  "id" : "localhost"
}*/
//TODO al agregar un jugador al juego tambien que se le traiga todas las partidas que esten
app.post("/crearpartida", urlencodedParser, (req, res) => {
  let partida = new Partida();
  //TODO llenar las fichas 
  partida.ipjugadorCreadorDeLaPartida = YO.url;
  partida.id = partidas.length;
  partida.jugador1.fichas=partida.llenarfichas()
  partida.jugador2.fichas=partida.llenarfichas()
  partida.fichas_partida=[]
  partidas.push(partida);
  for (var i = 0; i < usuariosLista.length ; i++) {
    let options = {
        method: "POST",
        uri: "http://"+ usuariosLista[i].url+":" + usuariosLista[i].port + "/crearpartidaBackend", 
        resolveWithFullResponse: true,
        json: true,
        body: {partida}
    }
    console.log("6: ");
    console.log(options.body);
    rp(options)
        .then(response => {
            console.log("pasamos la info para el siguiente");
        })
        .catch(e => {
          console.log("Error haciendo la creaciacion de la aprtida del domino" );
        });
  }
  res.json({ status: "success", message: partida});
});



//este metodo ocurre para que todos los node puedan tener este nueva partida guardada
app.post("/crearpartidaBackend", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["partida"]);
  var idExiste = false;
  for (var i = 0; i< partidas.length; i++){
    if(body.partida.id == partidas[i].id)  idExiste = true;
  }
  if(!idExiste) partidas.push(body.partida);
  res.json({ status: "success", message: body});
});

app.get("/partidas", urlencodedParser, (req, res) => {
  console.log(partidas);

  res.json({ status: "success", message: partidas });
});

//unirse a las partidas
app.post("/unirsepartida", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["partida"]);
  //ciclo encargado de actualizar localmente la partida con el nodo que se quiere unir a ella
  for (var i = 0; i< partidas.length; i++){
    if(partidas[i].estatus!="CERRADO"){
    if(body.partida.id == partidas[i].id)
      if(partidas[i].jugador1.ip== "")
        partidas[i].jugador1.ip=body.partida.port //TODO cambiar port por url
      else                                        //recorar que se pasa por el postman como port
        if(partidas[i].jugador2.ip== ""){
          if(partidas[i].jugador1.ip != body.partida.port){ //TODO cambiar port por url 
            partidas[i].jugador2.ip=body.partida.port
            partidas[i].estatus="CERRADO"
          }
        }
    }
  }
  //ciclo encargado de replicar la informacion a los demas nodos
  for (var i = 0; i < usuariosLista.length ; i++) {
    let options = {
        method: "PUT",
        uri: "http://"+ usuariosLista[i].url+":" + usuariosLista[i].port + "/unirsepartidaBackend", 
        resolveWithFullResponse: true,
        json: true,
        body: {
          "partida":{
            "id":body.partida.id,
            "port":body.partida.port  //TODO poner url aqui en vez de port 
          }
        }
    }
    console.log(options.body);
    rp(options)
        .then(response => {
            console.log("pasamos la info para el siguiente");
        })
        .catch(e => {
          console.log("Error uniendose a la partida del domino"+e );
        });
  }
  res.json({ status: "success", message: body});
});

//este metodo ocurre para que todos los node puedan tener este nueva partida guardada
app.put("/unirsepartidaBackend", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["partida"]);
  for (var i = 0; i< partidas.length; i++){
    if(partidas[i].estatus!="CERRADO"){
    if(body.partida.id == partidas[i].id)
      if(partidas[i].jugador1.ip== "")
        partidas[i].jugador1.ip=body.partida.port //TODO poner url en vez de port 
      else 
      if(partidas[i].jugador2.ip== ""){
        if(partidas[i].jugador1.ip != body.partida.port){ //TODO cambiar port por url
          partidas[i].jugador2.ip=body.partida.port      //TODO cambiar port por url
          partidas[i].estatus="CERRADO"               // TOdO interar el iniciarpartida aqui
        }
      }       
  }
 }
  res.json({ status: "success", message: body});
});


//esta es una funcion que se inicia automaticamente despues de hacerse un unir partida 
//y que el que se haya unido sea el jugador
//lo que hace es mandarle a todas a setear el valor del estatus 
//TODO acoplar esta funcion en el post unise a la partida 
function iniciarPartida(id_partida) {
  partidas[id_partida].estatus= "CERRADO";
  let idP = id_partida;
  for (var i = 0; i < usuariosLista.length ; i++) {
    let options = {
        method: "PUT",
        uri: "http://"+ usuariosLista[i].url+":" + usuariosLista[i].port + "/cambiarestatuspartida", 
        resolveWithFullResponse: true,
        json: true,
        body: { 
          id : idP,
          estatus : "CERRADO" 
        }
    }
    console.log("9: ");
    console.log(options.body);
    rp(options)
        .then(response => {
            console.log("pasamos la info para el siguiente");
        })
        .catch(e => {
          console.log("Error haciendo cambiar estatus de la aprtida del domino" );
        });
  } 
}

//esta funcion es ejecutada para que el nodo sepa que tiene que actualizar el estatus de la partida
app.put("/cambiarestatuspartida", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["id", "estatus"]);
  try {
    partidas[body.id].estatus= body.estatus;
    res.json({ status: "success", message: body});
  }
  catch(error) {
      console.error(error);
      res.json({ status: "error", message: "no se encontro esa id para cabiar el estatus"});
  }
});

function jugar(ip,id,ficha,puerto){
  function verificarigualdad(ficha,tablero){
    if(ficha== tablero)
    return true
    else
    return false
  }

  let existe=-1;
  let separarficha=[]
  let fichaizquierda=[]
  let fichaderecha= []
  let tablero= []
  //ciclo encargado de actualizar localmente la partida con las fichas jugadas
  for (var i = 0; i< partidas.length; i++){
    if(partidas[i].estatus =="CERRADO"){
      if(id == partidas[i].id){
        if(partidas[i].turno_jugador==1){
          if(partidas[i].jugador1.ip == ip){
            existe= partidas[i].jugador1.fichas.indexOf(ficha)
            if(existe != -1){
              separarficha=ficha.split(":")
              // validacion del tablaro vacio
              if(partidas[i].fichas_jugadas.length ==0 ){
                  //agrego en el tablero
                partidas[i].fichas_jugadas.push(ficha)
                //quito la pieza que agregue
                partidas[i].jugador1.fichas.splice(existe,1)
                partidas[i].turno_jugador=2
              }
            
            //validaciones en el caso de que el tablero tenga fiichas
            else{
              // si solo tiene una ficha
              tablero=partidas[i].fichas_jugadas[0].split(":")
              if (partidas[i].fichas_jugadas.length ==1){
                if (verificarigualdad(separarficha[1],tablero[0]) ){
                  partidas[i].fichas_jugadas.unshift(ficha)
                  partidas[i].jugador1.fichas.splice(existe,1)
                  partidas[i].turno_jugador=2
                }
                else 
                  if(verificarigualdad(separarficha[0],tablero[1])){
                    //agrego en el tablero
                    partidas[i].fichas_jugadas.push(ficha)
                    //quito la pieza que agregue
                    partidas[i].jugador1.fichas.splice(existe,1)
                    partidas[i].turno_jugador=2
                  }
              }
              // caso en el que el tablero tenga mas de una ficha colocada
              else{
                fichaizquierda=partidas[i].fichas_jugadas[0].split(":")
                fichaderecha=partidas[i].fichas_jugadas[partidas[i].fichas_jugadas.length-1].split(":")
                if (verificarigualdad(separarficha[1],fichaizquierda[0])){
                  partidas[i].fichas_jugadas.unshift(ficha)
                  partidas[i].jugador1.fichas.splice(existe,1)   
                  partidas[i].turno_jugador=2
                }
                else
                if(verificarigualdad(separarficha[0],fichaderecha[1])){
                  //agrego en el tablero
                  partidas[i].fichas_jugadas.push(ficha)
                  //quito la pieza que agregue
                  partidas[i].jugador1.fichas.splice(existe,1)
                  partidas[i].turno_jugador=2
                }

              }
              

            } 
        }
        
      }
    }
        }
        //MANEJO DE JUGADOR 2
        if(partidas[i].turno_jugador==2){
          if(partidas[i].jugador2.ip==ip){
            existe= partidas[i].jugador2.fichas.indexOf(ficha)
            if(existe != -1){
              separarficha=ficha.split(":")
              // validacion del tablaro vacio
              if(partidas[i].fichas_jugadas.length ==0 ){
                //agrego en el tablero
                partidas[i].fichas_jugadas.push(ficha)
                //quito la pieza que agregue
                partidas[i].jugador2.fichas.splice(existe,1)
                partidas[i].turno_jugador=1
              }
            
               //validaciones en el caso de que el tablero tenga fiichas
              else{
                // si solo tiene una ficha
                tablero=partidas[i].fichas_jugadas[0].split(":")
                if (partidas[i].fichas_jugadas.length ==1){
                  if (verificarigualdad(separarficha[1],tablero[0]) ){
                    partidas[i].fichas_jugadas.unshift(ficha)
                    partidas[i].jugador2.fichas.splice(existe,1)
                    partidas[i].turno_jugador=1
                  }
                  else 
                    if(verificarigualdad(separarficha[0],tablero[1])){
                      //agrego en el tablero
                      partidas[i].fichas_jugadas.push(ficha)
                      //quito la pieza que agregue
                      partidas[i].jugador2.fichas.splice(existe,1)
                      partidas[i].turno_jugador=1
                    }
                }
              // caso en el que el tablero tenga mas de una ficha colocada
              else{
                fichaizquierda=partidas[i].fichas_jugadas[0].split(":")
                fichaderecha=partidas[i].fichas_jugadas[partidas[i].fichas_jugadas.length-1].split(":")
                if (verificarigualdad(separarficha[1],fichaizquierda[0])){
                  partidas[i].fichas_jugadas.unshift(ficha)
                  partidas[i].jugador2.fichas.splice(existe,1)   
                  partidas[i].turno_jugador=1
                }
                else
                if(verificarigualdad(separarficha[0],fichaderecha[1])){
                  //agrego en el tablero
                  partidas[i].fichas_jugadas.push(ficha)
                  //quito la pieza que agregue
                  partidas[i].jugador2.fichas.splice(existe,1)
                  partidas[i].turno_jugador=1             
                 }

              }
              

            } 
          }
        }
        }  
      }
    }
  
}


app.post("/realizarJugada", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["ip","id","ficha","puerto"]);
  jugar(body.ip,body.id,body.ficha,body.puerto)
  //ciclo encargado de replicar la informacion a los demas nodos
  for (var i = 0; i < usuariosLista.length ; i++) {
    let options = {
        method: "PUT",
        uri: "http://"+ usuariosLista[i].url+":" + usuariosLista[i].port + "/realizarjugadaBackend", 
        resolveWithFullResponse: true,
        json: true,
        body: {
            "ip":body.ip,
            "id":body.id,
            "ficha":body.ficha,
            "puerto": body.puerto
        }
    }

    console.log(options.body);
    rp(options)
        .then(response => {
            console.log("pasamos la info para el siguiente");
        })
        .catch(e => {
          console.log("Error realizando jugada"+e );
        });
        
  }
  res.json({ status: "success", message: body});
});


app.put("/realizarjugadaBackend", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["ip","id","ficha","puerto"]);
 jugar(body.ip,body.id,body.ficha,body.puerto)
res.json({ status: "success", message: "correcto"});
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
      //y por ultimo a esa maquina hay que hacerlo que agregue todas las partidas que ya estaban en juego
      for (var i=0; i<partidas.length; i++){
        let partida = partidas[i]; //intente hacer un foreach pero no me deja
        let options = {
            method: "POST",
            uri: "http://"+ body.newplayer.url +":"+ body.newplayer.port + "/crearpartidaBackend", 
            resolveWithFullResponse: true,
            json: true,
            body: { partida}
        }
        console.log("77:");
        console.log(options.body);
        rp(options)
          .then(response => {
            console.log("pasamos la info para el siguiente");
          })
          .catch(e => {
            console.log("Error haciendo la creaciacion de la aprtida del domino" );
          });
      }

    }
  }else {
    //este es el caso que otra maquina le este mandando de vuelta la peticion del nuevo jugador
    if(YO.numeroplayer < body.newplayer.numeroplayer ) YO.numeroplayer = body.newplayer.numeroplayer;
  }

  res.json({ status: "success", message: "newplayer" });
  
});

//este post es para que el servidor node que se sta integrando en el sistema tenga las ip y los puertos
//de los servidores que ya estan conectados
app.post("/newplayerRetorno", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["newplayer"]);
  console.log("3 :");
  console.log(body);
  ExisteUsuario= false;
  for (var i = 0; i < usuariosLista.length ; i++) {
      if(usuariosLista[i] == body.newplayer )ExisteUsuario = true;
  }
  if(!ExisteUsuario)  usuariosLista.push(body.newplayer);  

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
