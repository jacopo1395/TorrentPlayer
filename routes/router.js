var express = require('express');
var router = express.Router();
var path = require('path');
var appDir = path.dirname(require.main.filename);
var app = require(appDir+'/app.js');
var fs = require('fs');
var player=fs.readFileSync('./views/player.html',"utf8");


var WebTorrent = require('webtorrent');
var client = new WebTorrent();
var magnetURI = 'magnet:?xt=urn:btih:6a9759bffd5c0af65319979fb7832189f4f3c35d&dn=sintel.mp4&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss%3A%2F%2Ftracker.webtorrent.io&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel-1024-surround.mp4';
//
//
// icn.search("Star Wars", "BDRiP", function(err, data) {
//   if (err) throw err;
//   console.log(data[0].link + " search");
// });
// icn.latest(function(err, data) {
//   if (err) throw err;
//   console.log(data.length + " latest")
// });


var file_torrent;
client.add(magnetURI, { path: './download' }, function (torrent) {

        file_torrent = torrent.files[0];
        exports.file_torrent = file_torrent;


 });
client.on('error', function (err) {
   console.log('errore client');
})


router.get('/',function(req,res){
  console.log('get');

  var file = path.resolve(__dirname, app.file_torrent.path);
  fs.stat(file, function(err, stats) {
    if (err) {
      if (err.code === 'ENOENT') {
        // 404 Error if file not found
        return res.sendStatus(404);
      }
    res.end(err);
    }
    var range = req.headers.range;
    if (!range) {
     // 416 Wrong range
     return res.sendStatus(416);
    }
    var positions = range.replace(/bytes=/, "").split("-");
    var start = parseInt(positions[0], 10);
    var total = stats.size;
    var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
    var chunksize = (end - start) + 1;

    res.writeHead(206, {
      "Content-Range": "bytes " + start + "-" + end + "/" + total,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4"
    });

    var stream = file_torrent.createReadStream({ start: start, end: end })

    stream.pipe(res);

  });

});



router.get('/player',function(req,res){
  res.send(player);
});


module.exports = router;
