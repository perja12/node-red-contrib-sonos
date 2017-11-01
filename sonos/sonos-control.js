module.exports = function(RED) {
	'use strict';

	var SonosHelper = require('./SonosHelper.js');
	var helper = new SonosHelper();

	function Node(n) {
	  
		RED.nodes.createNode(this, n);
		var node = this;
		var configNode = RED.nodes.getNode(n.confignode);

		var isValid = helper.validateConfigNode(node, configNode);
		if (!isValid)
			return;

		//clear node status
		node.status({});

		//Hmmm?
		node.mode = n.mode;
		node.track = n.track;
		node.volume = n.volume;
		if (node.volume === "empty")
			node.volume = "";
		node.volume_value = n.volume_value;
		
		//handle input message
		node.on('input', function (msg) {
			helper.preprocessInputMsg(node, configNode, msg, function(device) {
				handleInputMsg(node, configNode, msg, device.ipaddress);
			});
		});
	}

	//------------------------------------------------------------------------------------

	function handleInputMsg(node, configNode, msg, ipaddress)
	{
		var sonos = require('sonos');
		var client = new sonos.Sonos(ipaddress);
		if (client === null || client === undefined) {
			node.status({fill:"red", shape:"dot", text:"sonos client is null"});
			return;
		}

		var payload = typeof msg.payload === 'object' ? msg.payload : {};

		if (payload.mode || node.mode)
			setMode(node, configNode, msg, client, payload);

		// evaluate requested track setting
		if (payload.track || node.track) {
			setTrack(node, configNode, msg, client, payload);
		}

		// evaluate volume setting
		if (payload.volume || node.volume)
			setVolume(node, configNode, msg, client, payload);

		node.send(msg);
	}

	//------------------------------------------------------------------------------------

	// (TBD: discuss if automatic play with track and volume 
	// settings, maybe depending on a node setting "enforce automatic play")
	function setMode(node, configNode, msg, client, payload)
	{
		var _mode = node.mode;
		if (payload.mode) {
			node.log("Node setting overwritten by input: " + payload.mode);
			_mode = payload.mode;
		}

		switch (_mode) 
		{
			case "pause":
				client.pause(function(err, result) {
					helper.handleSonosApiRequest(node, err, result, msg, "paused", null);
				});
				break;
			case "stop":
				client.stop(function(err, result) {
					helper.handleSonosApiRequest(node, err, result, msg, "stopped", null);
				});
				break;
			default:
				client.play(function(err, result) {
					helper.handleSonosApiRequest(node, err, result, msg, "playing", null);
				});
				break;
		}
	}

	function setVolume(node, configNode, msg, client, payload)
	{
		var _volfkt;
		var _volume;
		if (payload.volume) {
			if (payload.volume === "vol_up") {
			 _volfkt = "vol_up";
			 _volume = payload.volstep;
			 
			} else if (payload.volume === "vol_down") {
			 _volfkt = "vol_down";
			 _volume = payload.volstep;
			 	
			} else if (payload.volume === "mute") {
			 _volfkt = "mute";
			 	
			} else if (payload.volume === "unmute") {
			 _volfkt = "unmute";
			 	
			} else {
			 _volfkt = "vol_set";
			 _volume = payload.volume;
			}
		
		} else if (node.volume === "volume") {
			_volfkt = "vol_set";
			_volume = node.volume_value;
		} else if (node.volume === "vol_up") {
			_volfkt = "vol_up";
			_volume = node.volume_value;
			 
		} else if (node.volume === "vol_down") {
			_volfkt = "vol_up";
			_volume = node.volume_value;
			
		} else if (node.volume === "mute") {
			_volfkt = "mute";
			
		} else if (node.volume === "unmute") {
			_volfkt = "unmute";
			
		}
		
		switch (_volfkt) 
		{
			case "vol_set":
				var volume_val = parseInt(_volume);
				if (isNaN(volume_val) || volume_val < 0 || volume_val > 100) {
					node.status({fill:"red", shape:"dot", text:"invalid value for volume"});
					break;
				}
				client.setVolume(String(_volume), function(err, result) {
					helper.handleSonosApiRequest(node, err, result, msg, "vol: " + String(_volume), null);
				});
				break;

			case "mute":
				client.setMuted(true, function(err, result) {
					helper.handleSonosApiRequest(node, err, result, msg, "muted", null);
				});
				break;
			case "unmute":
				client.setMuted(false, function(err, result) {
					helper.handleSonosApiRequest(node, err, result, msg, "unmuted", null);
				});
				break;
			case "vol_up":
				var volume_step = parseInt(_volume);
				if (isNaN(volume_step) || volume_step > 100 || volume_step <= 0)
					volume_step = 5;
				client.getVolume(function (err, result) {
					if (err) {
						node.error(JSON.stringify(err));
						node.status({fill:"red", shape:"dot", text:"failed to execute request"});
						return;
					}
				 	var volume_val = parseInt(result) + volume_step;
				 	volume_val = Math.min(100, volume_val);
				 	volume_val = Math.max(0, volume_val);
				 	client.setVolume(volume_val, function (err, result) {
				 		helper.handleSonosApiRequest(node, err, result, msg, "vol: " + String(volume_val), null);
				 	});
				});
				break;
			case "vol_down":
				var volume_step = parseInt(_volume);
				if (isNaN(volume_step) || volume_step > 100 || volume_step <= 0)
					volume_step = 5;
				client.getVolume(function (err, result) {
					if (err) {
						node.error(JSON.stringify(err));
						node.status({fill:"red", shape:"dot", text:"failed to execute request"});
						return;
					}
				 	var volume_val = parseInt(result) - volume_step;
				 	volume_val = Math.min(100, volume_val);
				 	volume_val = Math.max(0, volume_val);
				 	client.setVolume(volume_val, function (err, result) {
				 		helper.handleSonosApiRequest(node, err, result, msg, "vol: " + String(volume_val), null);
				 	});
				});
				break;
		}
	}

	function setTrack(node, configNode, msg, client, payload)
	{
		var _track = node.track;
		if (payload.track)
			_track = payload.track;

		if (_track == "next") {
			client.next(function(err, result) {
				helper.handleSonosApiRequest(node, err, result, msg, "next", null);
			});
			return;
		}

		if (_track == "previous") {
			client.previous(function(err, result) {
				helper.handleSonosApiRequest(node, err, result, msg, "previous", null);
			});
			return;
		}
	}
	
	RED.nodes.registerType('better-sonos-control', Node);
};