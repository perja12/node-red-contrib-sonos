// Sonos Current Track node
var sonos = require('sonos');

module.exports = function(RED) {
    'use strict';

    function Node(n) {
      
        RED.nodes.createNode(this, n);
		var node = this;
		
		var playnode = RED.nodes.getNode(n.playnode); 
		if (playnode === null || playnode === undefined) {
        	node.status({fill:"red", shape:"ring", text:"please select a config node"});
        	return;
        }

		node.client = new sonos.Sonos(playnode.ipaddress);
		if (node.client === null || node.client === undefined) {
        	node.status({fill:"red", shape:"dot", text:"node.client is null"});
        	return;
        }

        node.status({});
        this.on('input', function (msg) {            
            if (node.client === null || node.client === undefined) {
            	node.status({fill:"red", shape:"dot", text:"node.client is null"});
            	return;
            }

			node.client.currentTrack(function (err, trackObj) {
				if (err) {
					node.error(JSON.stringify(err));
					node.status({fill:"red", shape:"dot", text:"failed to retrieve current track"});
					return;
				}
				if (trackObj === null || trackObj === undefined) {
					node.status({fill:"red", shape:"dot", text:"invalid current track retrieved"});
					return;	
				}

				//inject additional properties
				if (trackObj.albumArtURI !== undefined && trackObj.albumArtURI !== null) {
					var port = playnode.port ? playnode.port : 1400;
					trackObj.albumArtURL = "http://" + playnode.ipaddress + ":" + port + trackObj.albumArtURI;
				}
				
				msg.payload = trackObj.title;
				msg.track = trackObj;
				node.send(msg);
				node.status({fill:"green", shape:"dot", text:"" + trackObj.title});
			});
		});
	}

    RED.nodes.registerType('sonos-currenttrack', Node);
};