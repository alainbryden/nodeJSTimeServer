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
    //Store the client's time in redis to be broadcast to other clients
    client.on('message', setClientValue(client, 'clientTime'));
    //Todo: Allow Clients to specify an alias
    //client.on('clientName', setClientValue(client, 'clientName'));
    client.on('disconnect', function() { 
        redisClient.del('clients:' + strSocketAddress(client));
        if( io.sockets.clients().length > 0)
            client.broadcast.emit('clientTime', strSocketAddress(client) + ',' + 0);
    });
});

/* Returns a function that will take a socket.io event data and store it in the 
 * specified property for the corresponding client's redis data entry. */
function setClientValue(client, property) {
    return function(data) {
        var strAddress = strSocketAddress(client);
        redisClient.hset('clients:' + strAddress, property, data); 
        redisClient.expire('clients:' + strAddress, redisDataExpiration); 
        
        //Todo: instead of broadcasting to all clients right away, wait until next server time update
        client.broadcast.emit(property, strAddress + ',' + data);
        
        /* Todo: To store multiple values, deserialize current value, change property, reserialize and store?
        redisClient.get(client.handshake.address, function(err, reply) {
            if(reply) {
                reply[property] = objDate;
            } else {
                console.log("No data exists for " + client.handshake.address);
            }
        });
        */
    }
}

function strSocketAddress(socket) {
    return socket.handshake.address.address + ":" + socket.handshake.address.port;
}