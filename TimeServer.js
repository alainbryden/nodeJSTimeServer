const PORT = 8008;
const pollingInterval = 1000; 

var fs = require('fs')
    , connect = require('connect')
    , socketio = require('socket.io');
 

var server = connect.createServer(connect.static(__dirname))
    .listen(PORT, function() { console.log('Listening at: http://localhost:' + PORT);}
    );

var io = socketio.listen(server)

var polling = setInterval( function() {
    if( io.sockets.clients().length > 0)
        io.sockets.emit('serverTime', new Date());
}, pollingInterval);

io.sockets.on('connection', function (socket) {
    //Nothing to do
    socket.on('disconnect', function() {
        //Nothing to do
    });
});