$(document).ready( function() {
    var updateInterval = 1000; 
    var iosocket = io.connect();
    $('#clientTime').text((new Date()).toLocaleString());

    iosocket.on('connect', function () {
        $('#connectionStatus').text('Connected');
        
        
        var updateLoop = setInterval( function() {
            var localDate = new Date();
            $('#clientTime').text(localDate.toLocaleString());
            iosocket.emit('clientTime', localDate.getTime());
        }, updateInterval);

        iosocket.on('serverTime', function(objDate) {
            var d = new Date(objDate);
            $('#serverTime').text(d.toLocaleString());
        });
        iosocket.on('clientName', function(alias) {
            $('#clientAlias').val(alias);
        });

        iosocket.on('peerTime', function(delimitedData) {
            var peerIp = delimitedData.split(',')[0];
            var peerId = peerIp.replace(/\./g, "_").replace(/:/g, "__")
            var peerTime = new Date(0).setUTCMilliseconds(delimitedData.split(',')[1]);
            var peerElem = $('#' + peerId);
            
            if( peerTime == 0 ) //Hack: Server notifying that peer disconnected. Would normally use a seperate event for this
                peerElem.remove();
            else {
                if( peerElem.length == 0 )
                    peerElem = addNewPeer(peerId, peerIp);
                $('#' + peerId + ' .dateTime').text((new Date(peerTime)).toLocaleString());
            }
                  
        });
        iosocket.on('peerName', function(delimitedData) {
            var peerId = delimitedData.split(',')[0].replace(/\./g, "_").replace(/:/g, "__")
            var peerName = delimitedData.split(',')[1];
            if(peerName.length != 0)
                $('#' + peerId + ' .alias').text(peerName.substring(0,16));
        });
        iosocket.on('disconnect', function() {
            $('#connectionStatus').text('Disconnected');
            $('#peerTimes').empty();
        });
    });

    $('#clientAlias').keypress(function(event) {
        if(event.which == 13 /*Enter*/ ) {
            event.preventDefault();
            iosocket.emit('clientName', $('#clientAlias').val());
        }
    });

    function addNewPeer(peerId, peerIp)
    {
        $('#peerTimes').append($('<li id="' + peerId + '"></li>'));
        var newElem = $('#' + peerId);
        newElem.append($('<span class="alias" title="' + peerIp + '" ></span>').text(peerIp.split(':')[0]));
        newElem.append($('<span class="dateTime time"></span>'));
        iosocket.emit('whoIs', peerIp); //As the server for an alias
        return newElem;
    }  
});