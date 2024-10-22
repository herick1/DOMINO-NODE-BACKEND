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

//funcione globales
//
//TODO hacerlo con una base de datos
let YO= {
          name:"Invitado",
          numeroplayer:1,
          port: 10001,
          url: "localhost"
        }; 

let partidas=[] 

//clase partida 
//TODO moverla de aqui
class Partida{
  constructor (){
    this.id = -1;
    this.ipjugadorCreadorDeLaPartida = "";  
    this.portjugadorCreadorDeLaPartida;  
    this.turno_jugador= 1;
    this.jugador1 = {ip : "", fichas : [] };
    this.jugador2 = {ip : "" , fichas : [] };
    this.estatus= "ESPERA";
    this.ganador = "";
    this.fichas_jugadas=[];
    this.fichas_partida=["0:0","0:1","0:2","0:3","0:4","0:5","0:6",
    "1:1","1:2","1:3","1:4","1:5","1:6",
    "2:2","2:3","2:4","2:5","2:6",
    "3:3","3:4","3:5","3:6",
    "4:4","4:5","4:6",
    "5:5","5:6",
    "6:6"];
    this.jugadas_jugador1=[];    
    this.jugadas_jugador2=[];
  }
  //funcion que te permite llenar las fichas del jugador 1 y del jugador 2 
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


// -----------------------clase archivo---------------------------------------
var fs = require('fs');
 yoParametros = 'YoParametros.json';
 //usuariosLista = 'usuariosLista.json';
 partidasJ = 'partidas.json';

function writeYo(data){
  if(YO.url != "localhost"){
    var datos = JSON.stringify(YO);
    fs.writeFile(yoParametros, datos, function(err) {
        if(err) {
          console.log("El archivo YO NO se guardo con exito!");
        }
        console.log("El archivo YO se guardo con exito!");
    });    
  }

}

function replicar(){
console.log("repliqueeeeeeee ")
 //por si hay modificaciones en las partidas en los momentos que este nodo esta caido 
  //entonces le mandamos a que replique las partidas de alguno a los que el antes estuvo conectado
 if(usuariosLista)
  for (var i = 0; i < usuariosLista.length ; i++) {
     if(usuariosLista[i]){
    let options = {
        method: "GET",
        uri: "http://"+ usuariosLista[i].url+":" + usuariosLista[i].port + "/partidas", 
        resolveWithFullResponse: true,
        json: true
    }
    rp(options)
        .then(response => {
            //console.log(options.uri) 
            console.log("tratamos que nos envien las partidas");
            //console.log(response.body.message);
              partidas=response.body.message;
              writepartidas(partidas)

        })
        .catch(e => {

            console.log("Error haciendo el newplayer del domino" );
        });
     }
    };
}

function ReadYo(){
 
  fs.readFile(yoParametros, (err, data) => {
    if (err){ 
      console.log("El archivo YO NO se leyo con exito!");
    }else{
    YO = JSON.parse(data);
      ReadusuariosLista()
    }
  }
  );
}


function writeusuariosLista(data){
  var datos = JSON.stringify(usuariosLista);
  fs.writeFile('usuariosLista.json', datos, function(err) {
      if(err) {
      console.log("El archivo usuarioLista NOO se guardo con exito!");
      }else{
        console.log("El archivo usuarioLista se guardo con exito!"); 
      }
  });
}
function ReadusuariosLista(){
  fs.readFile('usuariosLista.json', (err, data) => {
    if (err){ 
      console.log("El archivo no se leyo");
      return usuariosLista;
    }else{
    usuariosLista = JSON.parse(data);    
      Readpartidas() 
    }
  });
}


function writepartidas(data){
  var datos = JSON.stringify(partidas);
  fs.writeFile('partidas.json', datos, function(err) {
      if(err) {
          console.log("El archivo  partidas NOO se guardo con exito!");
      }
      else
        console.log("El archivo partidas se guardo con exito!");
  });
}
function Readpartidas(){
  fs.readFile('partidas.json', (err, data) => {
    if (err){ 
      return partidas;
    }else{
     partidas = JSON.parse(data);
     replicar()  
    }
  });
}

//-----------------------------fin de clase archvio jajajja es que me ladille





// ENDPOINT:

//funcion para verificar que todos los demas existan
app.get("/verificar-existencia", urlencodedParser, (req, res) => {  
  //escribo en los archivos para una posible recuperacion
  if(usuariosLista.length > 0 )writeusuariosLista(usuariosLista);
  if(partidas.length > 0 )writepartidas(partidas);

  //ahora procedo a verifificar si los demas existen 
  console.log("GET /verificar-existencia: entre por aqui");
  for (var i = 0; i < usuariosLista.length ; i++) {
    if(usuariosLista[i]){
    let options = {
        method: "GET",
        uri: "http://"+ usuariosLista[i].url+":" + usuariosLista[i].port + "/Yoexisto", 
        resolveWithFullResponse: true,
        json: true,
        body: {   
          existir: {
            name:YO.name,
            numeroplayer: YO.numeroplayer,
            port: YO.port,
            url:YO.url 
          } 
        }
              
    }
    let hi= i;
    rp(options)
        .then(response => {
            console.log("el otro existe");
        })
        .catch(e => {
          console.log("Error el otro no responde" );
          usuariosLista.splice(hi,1);

        });
  }
  }

  res.json({ status: "success", message: "ok" });
});

//funcion para cuando alguien me pregunta si yo existo
app.get("/Yoexisto", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["existir"]);
  ExisteUsuario= false;
  for (var i = 0; i < usuariosLista.length ; i++) {
      if(usuariosLista[i] == body.newplayer )ExisteUsuario = true;
  }
  if(!ExisteUsuario)  usuariosLista.push(body.newplayer);  
  res.json({ status: "success", message: "ok"});
});

app.get("/jugadoreslista", urlencodedParser, (req, res) => {
  console.log(" GET /jugadoreslista:");
  res.json({ status: "success", message: usuariosLista });
});


app.post("/eliminar", urlencodedParser, (req, res) => {
  
fs.unlink("partidas.json", (err) => {
  if (err) {
      console.log("failed to delete partidas.json:"+err);
  } else {
      console.log('successfully deleted partidas.json');                                
  }
});
fs.unlink("usuariosLista.json", (err) => {
  if (err) {
      console.log("failed to delete usuarioLista.json:"+err);
  } else {
      console.log('successfully deleted usuarioLista.json');                                
  }
});

fs.unlink("YoParametros.json", (err) => {
  if (err) {
      console.log("failed to delete YoParametros.json:"+err);
  } else {
      console.log('successfully deleted YoParametros.json');                                
  }
});
this.partidas=[];
this.YO={}
res.json({ status: "success", message:"elimine" });
});
//ESte post funciona para registrar la informacion de manera local en el servidor 
//del nuevo usuario lo que se le pide es:
app.post("/registrarusuario", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["name","url"]);
  console.log("POST /registrarusuario:");
  YO.name = body.name;
  YO.url = body.url;
  res.json({ status: "success", message: body});
});

//get para ver los status 
// el numero de player logre que se hiciera automatico , genial !
app.get("/jugador", urlencodedParser, (req, res) => {
  console.log(" GET /jugador:");
  writeYo(YO);
  res.json({ status: "success", message: YO });
});
// post para crear la partida, lo ejecuta angular
app.post("/crearpartida", urlencodedParser, (req, res) => {
  let partida = new Partida();
  partida.ipjugadorCreadorDeLaPartida = YO.url;
  partida.portjugadorCreadorDeLaPartida = YO.port;
  partida.id = partidas.length;
  partida.jugador1.fichas=partida.llenarfichas()
  partida.jugador2.fichas=partida.llenarfichas()
  partida.fichas_partida=[]
  partidas.push(partida);
  console.log("POST /crearpartida");
  for (var i = 0; i < usuariosLista.length ; i++) {
    let options = {
        method: "POST",
        uri: "http://"+ usuariosLista[i].url+":" + usuariosLista[i].port + "/crearpartidaBackend", 
        resolveWithFullResponse: true,
        json: true,
        body: {partida}
    }
    
    rp(options)
        .then(response => {
            console.log("pasamos la info a los demas");
        })
        .catch(e => {
          console.log("Error haciendo la creacion de la aprtida del domino" );
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

//metodo que pinta todo en el angular
app.get("/partidas", urlencodedParser, (req, res) => {
  res.json({ status: "success", message: partidas });
});

//unirse a las partidas
app.post("/unirsepartida", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["partida"]);
  //ciclo encargado de actualizar localmente la partida con el nodo que se quiere unir a ella
  //en el caso que yo la haya creado
  let seUnio = false ;
  if(YO.url == body.partida.url){ 
    for (var i = 0; i< partidas.length; i++){
      if((body.partida.id == partidas[i].id) && (partidas[i].estatus=="ESPERA")){
        if(partidas[i].jugador1.ip== ""){
          partidas[i].jugador1.ip=body.partida.url 
          seUnio = true;
        }else                                        //recorar que se pasa por el postman como port
          if(partidas[i].jugador2.ip== ""){
            if(partidas[i].jugador1.ip != body.partida.url){ 
              partidas[i].jugador2.ip=body.partida.url  
              partidas[i].estatus="JUGANDO"
              seUnio = true ;
            }
          }
      }
    }
    if(seUnio){
        //ciclo encargado de replicar la informacion a los demas nodos
        for (var i = 0; i < usuariosLista.length ; i++) {
           if(usuariosLista[i]){
          let options = {
              method: "PUT",
              uri: "http://"+ usuariosLista[i].url+":" + usuariosLista[i].port + "/unirsepartidaBackend", 
              resolveWithFullResponse: true,
              json: true,
              body: {
                "partida":{
                  "id":body.partida.id,
                  "url":body.partida.url,  
                  "port":body.partida.port   
                }
              }
          }
     
          rp(options)
              .then(response => {
                  console.log("pasamos la info para el siguiente");
              })
              .catch(e => {
                console.log("Error uniendose a la partida del domino"+e );
              });
        }
        }
        res.json({ status: "success", message: "correcto"});
    }
    //caso de que la partida no cumpla las condiciones
    else{
      res.json({ status: "success", message: "no se unio a la partida"});
    }
  //caso de que yo no sea el nodo que cree la partida
  }else{
    //busco la id de la partida para que el que creo la partida haga que los jugadores se unan 
    for (var i = 0; i< partidas.length; i++){
      if((body.partida.id == partidas[i].id) &&(partidas[i].estatus=="ESPERA")){
        Seunio = true;
        let options = {
            method: "PUT",
            uri: "http://"+ partidas[i].ipjugadorCreadorDeLaPartida+":" + partida[i].portjugadorCreadorDeLaPartida + "/unirsepartida", 
            resolveWithFullResponse: true,
            json: true,
            body: {
              "partida":{
                "id":body.partida.id,
                "url":body.partida.url,  
                "port":body.partida.port  
              }
            }
          }
          rp(options)
              .then(response => {
                  console.log("pasamos la info para el siguiente");
              })
              .catch(e => {
                console.log("Error uniendose a la partida del domino"+e );
              });
          res.json({ status: "success", message: "correcto"});              
      }
    }
    if(!Seunio)res.json({ status: "success", message: "no se pudo unir a la partida verifique los datos a la partida"});
  }
});

//este metodo ocurre para que todos los node puedan tener este nueva partida guardada
app.put("/unirsepartidaBackend", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["partida"]);
  for (var i = 0; i< partidas.length; i++){
    if((body.partida.id == partidas[i].id) && (partidas[i].estatus=="ESPERA")){
      if(partidas[i].jugador1.ip== "")
        partidas[i].jugador1.ip=body.partida.url 
      else 
      if(partidas[i].jugador2.ip== ""){
        if(partidas[i].jugador1.ip != body.partida.url){ 
          partidas[i].jugador2.ip=body.partida.url      
          partidas[i].estatus="JUGANDO"              
        }
      }       
    }
  }
  res.json({ status: "success", message: body});
});


//esta es una funcion que se inicia automaticamente despues de hacerse un unir partida 
//y que el que se haya unido sea el jugador
//lo que hace es mandarle a todas a setear el valor del estatus 
//TODO acoplar esta funcion en el post unise a la partida o borrarla
function Abandonar(id_partida, estatus) {
  for(var i=0; i< partidas.length; i++){
    if(partidas[i].id == id_partida){
        partidas[i].estatus = "FINALIZO";
        for (var i = 0; i < usuariosLista.length ; i++) {
          let options = {
              method: "PUT",
              uri: "http://"+ usuariosLista[i].url+":" + usuariosLista[i].port + "/cambiarestatuspartida", 
              resolveWithFullResponse: true,
              json: true,
              body: {
                  "id":id_partida,
                  "estatus":estatus
              }
          }
          rp(options)
              .then(response => {
                  console.log("pasamos la info para el siguiente");
              })
              .catch(e => {
                console.log("Error uniendose a la partida del domino"+e );
              });
        }
        break;
    }
  }
}

//esta funcion es ejecutada para que el nodo sepa que tiene que actualizar el estatus de la partida
app.put("/cambiarestatuspartida", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["id", "estatus"]);
  for(var i=0; i< partidas.length; i++)
    if(partidas[i].id == body.id){ 
      partidas[i].estatus = body.estatus;
      break;
    }
  res.json({ status: "ok", message: "ok"});
});


//esta funcion es ejecutada para que el nodo sepa que tiene que actualizar el estatus de la partida
app.put("/JugadorAbandonaPartida", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["id", "estatus"]);
  try {
    Abandonar(body.id, body.estatus);
    res.json({ status: "correcto", message: "finalizado la partida"});
  }
  catch(error) {
      console.error(error);
      res.json({ status: "error", message: "no se encontro esa id para cabiar el estatus"});
  }
});

//manejar juego
//devuelvo true si el jugador pasa y falso si no pasa
// se le debe pasar el numero de jugador a analizar y el id de la partida 
function pasoturno(jugador, id_partida){
  let separar_ficha_tablero=[]
  let separar_ficha_tablero2=[]
  let separar_ficha_jugador=[]
  for (var i = 0; i< partidas.length; i++){
    if(partidas[i].id ==id_partida){
      if(partidas[i].fichas_jugadas.length ==1){//si hay una sola ficha solo se analiza si se puede colocar en esa
        separar_ficha_tablero=partidas[i].fichas_jugadas[0].split(":")
        // en caso de que sea jugador 1 el jugador a analizar 
        if(jugador ==1){
          for(var y=0; y<partidas[i].jugador1.fichas.length; y++){
            separar_ficha_jugador=partidas[i].jugador1.fichas[y].split(":")
            //validacion  ver si es posible que juegue
            if(separar_ficha_jugador[0]==separar_ficha_tablero[0] || separar_ficha_jugador[0]==separar_ficha_tablero[1] )
              return false
            else 
              if( separar_ficha_jugador[1]==separar_ficha_tablero[0] || separar_ficha_jugador[1]==separar_ficha_tablero[1])
                return false
          }  
        }
        // en caso de que sea jugador 2 el jugador a analizar 
        else{
          for(var y=0; y<partidas[i].jugador2.fichas.length; y++){
            separar_ficha_jugador=partidas[i].jugador2.fichas[y].split(":")
            if(separar_ficha_jugador[0]==separar_ficha_tablero[0] || separar_ficha_jugador[0]==separar_ficha_tablero[1] )
              return false
            else 
              if( separar_ficha_jugador[1]==separar_ficha_tablero[0] || separar_ficha_jugador[1]==separar_ficha_tablero[1])
                return false
          } 

        }
          
        
      }
      else{ //validacion a ver si en el tablero hay mas de 1 ficha lo que implica analizar 2 lados
        if(partidas[i].fichas_jugadas.length >1){
          separar_ficha_tablero=partidas[i].fichas_jugadas[0].split(":")
          separar_ficha_tablero2=partidas[i].fichas_jugadas[partidas[i].fichas_jugadas.length-1].split(":")
          if(jugador ==1){
            for(var y=0; y<partidas[i].jugador1.fichas.length; y++){
              separar_ficha_jugador=partidas[i].jugador1.fichas[y].split(":")
              if(separar_ficha_jugador[0]==separar_ficha_tablero[0] || separar_ficha_jugador[1]==separar_ficha_tablero[0] )
                return false
              else 
                if( separar_ficha_jugador[0]==separar_ficha_tablero2[1] || separar_ficha_jugador[1]==separar_ficha_tablero2[1])
                  return false 
            }
          }
          else{
            for(var y=0; y<partidas[i].jugador2.fichas.length; y++){
              separar_ficha_jugador=partidas[i].jugador2.fichas[y].split(":")
              if(separar_ficha_jugador[0]==separar_ficha_tablero[0] || separar_ficha_jugador[1]==separar_ficha_tablero[0] )
                return false
              else 
                if( separar_ficha_jugador[0]==separar_ficha_tablero2[1] || separar_ficha_jugador[1]==separar_ficha_tablero2[1])
                 return false 
            }
          }
            
        
        }
      }
        return true;
    }

  }
}

function jugar(ip,id,ficha,puerto){
  function verificarigualdad(ficha,tablero){
    return (ficha == tablero) ? true : false ;
  }

  let existe=-1;
  let separarficha=[]
  let fichaizquierda=[]
  let fichaderecha= []
  let tablero= []
  let volteada=""
  let comparacion_volteada= false
  //ciclo encargado de actualizar localmente la partida con las fichas jugadas
  for (var i = 0; i< partidas.length; i++){
    if(partidas[i].estatus =="JUGANDO"){
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
                //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(ficha)
                if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(ficha)

                //quito la pieza que agregue
                partidas[i].jugador1.fichas.splice(existe,1)
                if (partidas[i].jugador1.fichas.length ==0){
                  partidas[i].estatus="FINALIZO"
                  partidas[i].ganador=ip
                  throw 'GANO'
                }
                if(!pasoturno(2,id))
                  partidas[i].turno_jugador=2
                else //condicion de partida trancada si el otro pasa debo ver si yo paso
                  if(pasoturno(1,id))
                    partidas[i].estatus="FINALIZO"
              }
            
            //validaciones en el caso de que el tablero tenga fiichas
            else{
              // si solo tiene una ficha
              tablero=partidas[i].fichas_jugadas[0].split(":")
              volteada=separarficha[1]+":"+separarficha[0]
              if (partidas[i].fichas_jugadas.length ==1){
                comparacion_volteada=verificarigualdad(separarficha[0],tablero[0])
                if (verificarigualdad(separarficha[1],tablero[0]) || (comparacion_volteada )){
                  if(comparacion_volteada ){
                    partidas[i].fichas_jugadas.unshift(volteada);
                    //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                    if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(volteada)
                    if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(volteada)
                  }
                  else{
                    partidas[i].fichas_jugadas.unshift(ficha);
                    //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                    if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(ficha)
                    if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(ficha)

                  }
                  partidas[i].jugador1.fichas.splice(existe,1)
                  if (partidas[i].jugador1.fichas.length ==0){
                    partidas[i].estatus="FINALIZO"
                    partidas[i].ganador=ip
                    throw 'GANO'
                  }
                  if(!pasoturno(2,id))
                    partidas[i].turno_jugador=2
                  else //condicion de partida trancada si el otro pasa debo ver si yo paso
                    if(pasoturno(1,id))
                      partidas[i].estatus="FINALIZO"
                }
                else {
                  comparacion_volteada=verificarigualdad(separarficha[1],tablero[1])
                  if(verificarigualdad(separarficha[0],tablero[1]) || (comparacion_volteada)){
                    //agrego en el tablero
                    if(comparacion_volteada ){
                      partidas[i].fichas_jugadas.push(volteada);
                      //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                      if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(volteada)
                      if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(volteada)
                    }else{
                      partidas[i].fichas_jugadas.push(ficha);
                      //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                      if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(ficha)
                      if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(ficha)
                    }
                    //quito la pieza que agregue
                    partidas[i].jugador1.fichas.splice(existe,1)
                    if (partidas[i].jugador1.fichas.length ==0){
                      partidas[i].estatus="FINALIZO"
                      partidas[i].ganador=ip
                      throw 'GANO'
                    }
                    if(!pasoturno(2,id))
                      partidas[i].turno_jugador=2
                    else //condicion de partida trancada si el otro pasa debo ver si yo paso
                      if(pasoturno(1,id))
                        partidas[i].estatus="FINALIZO"
                  }
                }
              }
              // caso en el que el tablero tenga mas de una ficha colocada
              else{
                fichaizquierda=partidas[i].fichas_jugadas[0].split(":")
                fichaderecha=partidas[i].fichas_jugadas[partidas[i].fichas_jugadas.length-1].split(":")
                comparacion_volteada=verificarigualdad(separarficha[0],fichaizquierda[0])
                if (verificarigualdad(separarficha[1],fichaizquierda[0])|| comparacion_volteada ){
                  if(comparacion_volteada){
                    partidas[i].fichas_jugadas.unshift(volteada);
                    //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                    if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(volteada)
                    if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(volteada)
                  }
                  else{
                    partidas[i].fichas_jugadas.unshift(ficha);
                    //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                    if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(ficha)
                    if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(ficha)
                  }
                  partidas[i].jugador1.fichas.splice(existe,1)
                  if (partidas[i].jugador1.fichas.length ==0){
                    partidas[i].estatus="FINALIZO"
                    partidas[i].ganador=ip
                    throw 'GANO'
                  }
                  if(!pasoturno(2,id))   
                    partidas[i].turno_jugador=2
                  else //condicion de partida trancada si el otro pasa debo ver si yo paso
                    if(pasoturno(1,id))
                      partidas[i].estatus="FINALIZO"
                }
                else{
                  comparacion_volteada=verificarigualdad(separarficha[1],fichaderecha[1])
                  if(verificarigualdad(separarficha[0],fichaderecha[1])|| comparacion_volteada){
                    //agrego en el tablero
                    if(comparacion_volteada){
                      partidas[i].fichas_jugadas.push(volteada);
                      //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                      if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(volteada)
                      if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(volteada)

                    }
                    else{
                      partidas[i].fichas_jugadas.push(ficha);
                      //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                      if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(ficha)
                      if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(ficha)
                    }
                    //quito la pieza que agregue
                    partidas[i].jugador1.fichas.splice(existe,1)
                    if (partidas[i].jugador1.fichas.length ==0){
                      partidas[i].estatus="FINALIZO"
                      partidas[i].ganador=ip
                      throw 'GANO'
                    }
                    if(!pasoturno(2,id))
                      partidas[i].turno_jugador=2
                    else //condicion de partida trancada si el otro pasa debo ver si yo paso
                      if(pasoturno(1,id))
                        partidas[i].estatus="FINALIZO"
                  }

                }
                

              }
              

            } 
        }
        
      }
      else  throw 'IpNovalido'
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

            //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
            if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(ficha)
            if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(ficha)
            //quito la pieza que agregue
            partidas[i].jugador2.fichas.splice(existe,1)
            if (partidas[i].jugador2.fichas.length ==0){
              partidas[i].estatus="FINALIZO"
              partidas[i].ganador=ip
              throw 'GANO'
            }
            if(!pasoturno(1,id))
              partidas[i].turno_jugador=1
            else //condicion de partida trancada si el otro pasa debo ver si yo paso
              if(pasoturno(2,id))
                partidas[i].estatus="FINALIZO"
          }
        
           //validaciones en el caso de que el tablero tenga fiichas
          else{
            // si solo tiene una ficha
            tablero=partidas[i].fichas_jugadas[0].split(":")
            volteada=separarficha[1]+":"+separarficha[0]
            if (partidas[i].fichas_jugadas.length ==1){
              comparacion_volteada=verificarigualdad(separarficha[0],tablero[0])
              if (verificarigualdad(separarficha[1],tablero[0]) ||( comparacion_volteada )){
                if(comparacion_volteada){
                  partidas[i].fichas_jugadas.unshift(volteada);
                                      //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                    if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(volteada)
                    if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(volteada)
                }
                else{
                  partidas[i].fichas_jugadas.unshift(ficha);
                                      //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                    if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(ficha)
                    if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(ficha)
                }
                partidas[i].jugador2.fichas.splice(existe,1)
                if (partidas[i].jugador2.fichas.length ==0){
                  partidas[i].estatus="FINALIZO"
                  partidas[i].ganador=ip
                  throw 'GANO'
                }
                if(!pasoturno(1,id))
                  partidas[i].turno_jugador=1
                else //condicion de partida trancada si el otro pasa debo ver si yo paso
                  if(pasoturno(2,id))
                    partidas[i].estatus="FINALIZO"
              }
              else{
                comparacion_volteada=verificarigualdad(separarficha[1],tablero[1])
                if(verificarigualdad(separarficha[0],tablero[1]) || (comparacion_volteada )){
                  //agrego en el tablero
                  if(comparacion_volteada ){
                    partidas[i].fichas_jugadas.push(volteada);
                      //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                      if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(volteada)
                      if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(volteada)
                  }
                  else{
                    partidas[i].fichas_jugadas.push(ficha);
                      //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                      if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(ficha)
                      if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(ficha)
                  }
                  //quito la pieza que agregue
                  partidas[i].jugador2.fichas.splice(existe,1)
                  if (partidas[i].jugador2.fichas.length ==0){
                    partidas[i].estatus="FINALIZO"
                    partidas[i].ganador=ip
                    throw 'GANO'
                  }
                  if(!pasoturno(1,id))
                    partidas[i].turno_jugador=1
                  else //condicion de partida trancada si el otro pasa debo ver si yo paso
                    if(pasoturno(2,id))
                      partidas[i].estatus="FINALIZO"
                }
              }
              
            }
          // caso en el que el tablero tenga mas de una ficha colocada
          else{
            fichaizquierda=partidas[i].fichas_jugadas[0].split(":")
            fichaderecha=partidas[i].fichas_jugadas[partidas[i].fichas_jugadas.length-1].split(":")
            comparacion_volteada=verificarigualdad(separarficha[0],fichaizquierda[0])
            if (verificarigualdad(separarficha[1],fichaizquierda[0])|| comparacion_volteada){
              if(comparacion_volteada){
                partidas[i].fichas_jugadas.unshift(volteada);
                                                      //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                    if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(volteada)
                    if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(volteada)
              }
              else{ 
                partidas[i].fichas_jugadas.unshift(ficha);
                    //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                    if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(ficha)
                    if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(ficha)
              }
              partidas[i].jugador2.fichas.splice(existe,1)   
              if (partidas[i].jugador2.fichas.length ==0){
                partidas[i].estatus="FINALIZO"
                partidas[i].ganador=ip
                throw 'GANO'
              }
              if(!pasoturno(1,id))
                partidas[i].turno_jugador=1
              else //condicion de partida trancada si el otro pasa debo ver si yo paso
                if(pasoturno(2,id))
                  partidas[i].estatus="FINALIZO"
            }
            else{
              comparacion_volteada=verificarigualdad(separarficha[1],fichaderecha[1])
              if(verificarigualdad(separarficha[0],fichaderecha[1]) || comparacion_volteada){
                 //agrego en el tablero
                if(comparacion_volteada){
                  partidas[i].fichas_jugadas.push(volteada);

                    //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                      if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(volteada)
                      if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(volteada)

                }
                else{
                  partidas[i].fichas_jugadas.push(ficha);

                      //en donde vea un push de fichas_jugadas estoy agregando el historial de partida
                      if(partidas[i].jugador1.ip == ip) partidas[i].jugadas_jugador1.push(ficha)
                      if(partidas[i].jugador2.ip == ip) partidas[i].jugadas_jugador2.push(ficha)
                }
                //quito la pieza que agregue 
                partidas[i].jugador2.fichas.splice(existe,1);
                if(!pasoturno(1,id))
                  partidas[i].turno_jugador=1
                else //condicion de partida trancada si el otro pasa debo ver si yo paso
                  if(pasoturno(2,id))
                    partidas[i].estatus="FINALIZO"              
               }
            }
           

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
  let body = _.pick(req.body, ["ip","id","ficha"]);
  let mensaje = "correcto";
  try {
    jugar(body.ip,body.id,body.ficha) //TODO para que si algo no lo hace ya no lo hagan los demas
  } 
  catch(err){
    if(err=="PartidaNoValida")
      mensaje ="PARTIDA NO EXISTE";
    if(err=="IpNovalido")
      mensaje=  "IP NO VALIDO";
    if(err== "GANO")
      mensaje= "GANO";
  }
  //ciclo encargado de replicar la informacion a los demas nodos
  for (var i = 0; i < usuariosLista.length ; i++) {
    if(usuariosLista[i]){
    let options = {
        method: "PUT",
        uri: "http://"+ usuariosLista[i].url+":" + usuariosLista[i].port + "/realizarjugadaBackend", 
        resolveWithFullResponse: true,
        json: true,
        body: {
            "ip":body.ip,
            "id":body.id,
            "ficha":body.ficha
        }
    }
    rp(options)
        .then(response => {
            console.log("pasamos la info para el siguiente");
        })
        .catch(e => {
          console.log("Error realizando jugada"+e );
        });
        
  }
  }
  if(mensaje == "correcto")
    res.json({ status: "success", message: body});
  else
    res.json({ status: "success", message: mensaje});    
});

app.put("/realizarjugadaBackend", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["ip","id","ficha"]);
  try {
    jugar(body.ip,body.id,body.ficha) //TODO para que si algo no lo hace ya no lo hagan los demas
  } 
  catch(err){
  }
  res.json({ status: "success", message: "correcto"});
});

//new player lo vamos a utilizar para que los demas node.js sepan cuando un usuario se conecta a la red
//esto va hacer despues del login en la aplicacion angular
//esta variable es utilizada la primera vez que un nodo quiere comenzar a jugar
//y es para que todas las demas maquinas sepan que hay un nuevo jugador

//aqui van a estar todos los usuarios esto es una lista de usuarios 
var usuariosLista = [];
app.post("/newplayer", urlencodedParser, (req, res) => {
  let body = _.pick(req.body, ["newplayer"]);

  if (body.newplayer.url != YO.url ) { 
    //comprobamos si el nuevo usuario esta en la lista de los usuarios
    ExisteUsuario= false;

    for (var i = 0; i < usuariosLista.length ; i++) {
        if(usuariosLista[i].url == body.newplayer.url )ExisteUsuario = true;
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
        rp(options)
          .then(response => {
            console.log("pasamos la info para el siguiente");
          })
          .catch(e => {
            console.log("Error haciendo la creaciacion de la partida del domino" );
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
  ReadYo()
 
});
