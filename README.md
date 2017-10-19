# node-red-contrib-better-sonos

A set of nodes to control SONOS via NodeRED. 

Uses the [**sonos Module**](https://github.com/bencevans/node-sonos).

Forked, renamed & improved from the [**node-red-contrib-sonos**](https://github.com/shbert/node-red-contrib-sonos) since the author seems to have stopped working on it.


## Installation

Install directly from your NodeRED's Setting Pallete

or

Change your working directory to your node red installation. Usually it's in ~/.node-red.

`npm install node-red-contrib-better-sonos`


## FAQ
**How is this different from node-red-contrib-sonos?**
Our set of Sonos nodes are much easier to use. 
 *  To start with, config-node comes with a simple selection rather than entering IP Address manually
 *  Sonos devices are identified by their serial number, not IP address. So you do not have to set static/reserved IP addresses for them.
 *  1 single node to report current status of device
 *  It is maintained by a team of experienced developers & hackers
 *  More convenient nodes are in development

**I have some suggestions, how do I get in touch?**
Please create an issue in [Github](https://github.com/originallyus/node-red-contrib-better-sonos/issues)

**How do I control my (non-smart) devices at home with NodeRED?**
Check out [RMPlugin app](https://play.google.com/store/apps/details?id=us.originally.tasker&hl=en) developed by us. Here's an [intro video](https://www.youtube.com/watch?v=QUKYKhK57sc) for the hardware.


## Other nodes developed by us
  * [Dead-simple Alexa integration](https://github.com/shbert/node-red-contrib-alexa-local)
  * [H801 RGBW Controller](https://github.com/shbert/node-red-contrib-h801)


## TODO
  * Getting playing/paused status in sonos-status node
  * Getting playlist
  * Text-to-speech


<a target='_blank' rel='nofollow' href='https://app.codesponsor.io/link/675K2XU83RpTxWJP4HRjD8mC/originallyus/node-red-contrib-better-sonos'>
  <img alt='Sponsor' width='888' height='68' src='https://app.codesponsor.io/embed/675K2XU83RpTxWJP4HRjD8mC/originallyus/node-red-contrib-better-sonos.svg' />
</a>