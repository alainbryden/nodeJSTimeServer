//Consts
var PORT = 8008;
var pollingInterval = 1000; 
var redisDataExpiration = 60*60;

//Libraries
var connect = require('connect')        //HTTP Server
    , socketio = require('socket.io')   //SocketIO
    , redis = require('redis');         //Redis data storage

var server = connect.createServer(connect.static(__dirname + '/web'))
                    .listen(PORT, function() { console.log("Server's up at: http://localhost:" + PORT);} );
var io = socketio.listen(server);
    
var redisClient = redis.createClient();
redisClient.on("error", function (err) { console.log("Redis Error " + err); });

var polling = setInterval( function() {
    if( io.sockets.clients().length > 0) {
        //Send the current server time.
        io.sockets.emit('serverTime', new Date().getTime());
        //Todo: Collect all client data and send in bulk.        
    }
}, pollingInterval);

io.sockets.on('connection', function (client) { 
    var strAddress = strSocketAddress(client); 
    redisClient.hget('clients:' + strAddress, 'clientName', function(err, obj) {
        //If we have this client's alias stored, send it to them.
        client.emit('clientName', err || obj == null ? client.handshake.address.address : obj);
    });
  
    //Store the client's time in redis to be broadcast to other clients
    client.on('clientTime', setClientValue(client, 'Time'));
    //Allow Clients to specify an alias
    client.on('clientName', setClientValue(client, 'Name'));
    //Allow late arriving clients to get the names of active peers
    client.on('whoIs', function(ipQuery) { 
        redisClient.hget('clients:' + ipQuery, 'Name', function(err, obj) {
            //If we have this client's alias stored, send it to them.
            client.emit('peerName', ipQuery + ',' + (err || obj == null ? "" : obj));
        });
    });
    
    client.on('disconnect', function() { 
        redisClient.del('clients:' + strAddress);
        if( io.sockets.clients().length > 0)
            client.broadcast.emit('peerTime', strAddress + ',' + 0);
    });
});

/* Returns a function that will take a socket.io event data and store it in the 
 * specified property for the corresponding client's redis data entry. */
function setClientValue(client, property) {
    return function(data) {
        var strAddress = strSocketAddress(client);
        redisClient.hset('clients:' + strAddress, property, data); 
        redisClient.expire('clients:' + strAddress, redisDataExpiration); 
        
        //Todo: instead of broadcasting to all clients right away, wait until next server time update?
        client.broadcast.emit('peer' + property, strAddress + ',' + data);
    }
}

function strSocketAddress(socket) {
    return socket.handshake.address.address + ":" + socket.handshake.address.port;
}