const PORT = 8008;
const pollingInterval = 1000; 

var fs = require('fs')
    , connect = require('connect')
    , socketio = require('socket.io')
    , redis = require('redis'); 

var server = connect.createServer(connect.static(__dirname))
    .listen(PORT, function() { console.log('Listening at: http://localhost:' + PORT);}
    );
var io = socketio.listen(server);
    
var redisClient = redis.createClient();
redisClient.on("error", function (err) {
    console.log("Error " + err);
});

var polling = setInterval( function() {
    if( io.sockets.clients().length > 0) {
        //Send the current server time.
        io.sockets.emit('serverTime', new Date());
        //Todo: Collect all client data and send in bulk.        
    }
}, pollingInterval);

io.sockets.on('connection', function (socket) {    
    redisClient.set(strSocketAddress(socket), 0 /*[]*/);
    //Store the client's time in redis to be broadcast to other clients
    socket.on('message', setClientValue(socket, 'clientTime'));
    //Todo: Allow Clients to specify an alias
    //socket.on('clientName', setClientValue(socket, 'clientName'));
    socket.on('disconnect', function() { 
        redisClient.del(socket.handshake.address);
        if( io.sockets.clients().length > 0)
            socket.broadcast.emit('clientTime', strSocketAddress(socket) + ',' + 0);
    });
});

/* Returns a function that will take a socket.io event data and store it in the 
 * specified property for the corresponding client's redis data entry. */
function setClientValue(socket, property) {
    return function(data) {
        var strAddress = strSocketAddress(socket);
        redisClient.set(strAddress, data); 
        
        //Todo: instead of broadcasting to all clients right away, wait until next server time update
        socket.broadcast.emit(property, strAddress + ',' + data);
        
        /* Todo: To store multiple values, deserialize current value, change property, reserialize and store?
        redisClient.get(socket.handshake.address, function(err, reply) {
            if(reply) {
                reply[property] = objDate;
            } else {
                console.log("No data exists for " + socket.handshake.address);
            }
        });
        */
    }
}

function strSocketAddress(socket) {
    return socket.handshake.address.address + ":" + socket.handshake.address.port;
}