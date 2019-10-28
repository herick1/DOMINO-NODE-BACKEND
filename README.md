# DOMINO-NODE-ANGULAR

##para probar

* Correr el domino 1 , domino 2 , y domino 3 (con node.js)

* en el postman escribir : localhost:10001/newplayer (POST)

* en el body poner :

{
  "newplayer": {
          "name":"herick",
          "numeroplayer":1,
          "port": 10002,
          "url":"localhost"
        }
}

-> esto lo que va a simular es que estando en el angular del domino 2 (del jugador 2) el va a decirle al node del domino 1 (para eso necesitamos la ip y el puerto del domino 1) , que hay un nuevo jugador en este caso el domino 2.

si todo sale bien en si hacemos un GET del tipo : localhost:10001/probando
tendremos una lista con los datos del jugador 2

si hacemos ese mismo get pero para el jugador dos , es decir localhost:10002/probando 
obtendremos una lista donde  estara el domino 1 , es decir el jugador 1


Ahora si vemos en pantalla cada uno tendra su numero de jugador (en consola de cada node), esto porque automaticamente se actualiza el numero de jugar dependnddeido su lugar en la lista


* para agregar el tercer jugador o n jugador lo que debemos es hacer un newplayer a cualquiera de los dos jugadores que ya esten conectados por ejemplo :

 localhost:10001/newplayer (POST) , NOTA : tambien podriamos ponerel puerto de 10002 es indifrente

* en el body poner :

{
  "newplayer": {
          "name":"herick",
          "numeroplayer":1,
          "port": 10003,
          "url":"localhost"
        }
}


y si volvemos hacer el GET de : localhost:10001/probando nos daremos cuenta que en cada maquina se a actualizado



para el crearpartida 

para probarlo primero hacemos un newplayer de 10001 a 10002 , despues de esto , en cualquiera de las dos maquinas hacemos el POST /crearpartida , sin ningun parameto, podemos inclusive crear partidas en 10001 y en 10002 

despues de creadas las partidas , haremos el newplayer de 10003 , y si despues de hacer el newplayer
hacemos el GET /partidas , veremos las partidas creadas , y si en el 10003 ejecutamos de nuevo el post de crear partida , se actualizaran en los otros dos nodos

para el unirse partida
 localhost:10001/unirsepartida
luego de que la partida este creada se hace un Post a cualquier nodo indicandole por body lo siguiente
{
	"partida":{
	"id": 0,
	"port": 10002
	}
}
luego con el get de partidas podemos comprobar que se unio