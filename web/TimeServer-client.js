var updateInterval = 1000; 
var iosocket = io.connect();
$('#clientTime').text((new Date()).toLocaleString());

iosocket.on('connect', function () {
    $('#connectionStatus').text('Connected');
    
    var updateLoop = setInterval( function() {
        var localDate = new Date();
        $('#clientTime').text(localDate.toLocaleString());
        iosocket.send(localDate.getTime());
    }, updateInterval);

    iosocket.on('serverTime', function(objDate) {
        var d = new Date(objDate);
        $('#serverTime').text(d.toLocaleString());
    });
    iosocket.on('clientTime', function(clientTimeDelimited) {
        var client = clientTimeDelimited.split(',')[0];
        var clientId = client.replace(/\./g, "_").replace(/:/g, "__")
        var clientTime = new Date(0).setUTCMilliseconds(clientTimeDelimited.split(',')[1]);
        var clientElem = $('#' + clientId);
        
        if( clientTime == 0 )
            clientElem.remove();
        else
        {
            if( clientElem.length == 0 )
            {
                $('#peerTimes').append($('<li id="' + clientId + '"></li>'));
                clientElem = $('#' + clientId);
            }
            clientElem.empty();
            clientElem.append($('<span class="ip" title="' + client + '" ></span>').text(client.split(':')[0]));
            clientElem.append($('<span class="dateTime time"></span>').text((new Date(clientTime)).toLocaleString()));
        }
    });                        
    iosocket.on('disconnect', function() {
        $('#connectionStatus').text('Disconnected');
        $('#peerTimes').empty();
    });
});