//require
var fs = require('fs');
var path = require('path');
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var WebTorrent = require('webtorrent');
var icn = require('./lib/ilcorsaronero');
_ = require('lodash');
var Transcoder = require('stream-transcoder');


//models
var Movie = require("./models/movie.js");

//views
// var player = fs.readFileSync('./views/player.html', "utf8");
var index = fs.readFileSync('./views/index.html', "utf8");
// var movie = fs.readFileSync('./views/movie.html', "utf8");

//variables
var api_key = '89b43c0850f63d51b9a2fde38e6db2f6';
const mdb = require('moviedb')(api_key);
var magnet = 'magnet:?xt=urn:btih:6a9759bffd5c0af65319979fb7832189f4f3c35d&dn=sintel.mp4&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel-1024-surround.mp4';

//init
var client = new WebTorrent();
var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


//GET / return index page
app.get('/', function (req, res) {
    res.send(index);
});


//GET /movie/:query Return
app.get('/movie/:query', function (req, res) {
    console.log('/movie' + req.params.query);
    icn.search(req.params.query, "BDRiP", function (err, data) {
        if (err) throw err;
        res.render('movie', {'data': data});
    });
});

//GET /link Return
app.get('/link/', function (req, res) {
    console.log('/link ' + req.query.q);
    var file_torrent;
    icn.getMagnet(req.query.q, function (err, data) {
        if (err) throw err;
        console.log('magnet ottenuto')
        if (containsMagnet(data, client.torrents)) {
            console.log('già aggiunto');
            res.render('player', {'data': t.path});
        }
        else {
            client.add(data, {path: './download'}, function (torrent) {
                console.log('add magnet');
                file_torrent = torrent.files[0];

                file_torrent.on('ready', function () {
                    console.log('ready');
                });
                file_torrent.on('infoHash', function () {
                    console.log('infoHash');
                });
                file_torrent.on('metadata', function () {
                    console.log('metadata');
                });
                file_torrent.on('done', function () {
                    console.log('done');
                });
                file_torrent.on('download', function () {
                    console.log('download');
                });
                console.log('render');
                res.render('vlc', {'data': file_torrent.path});
            });
            client.on('torrent', function (torrent) {
                console.log("torrent");

            });

            client.on('error', function (err) {
                console.log(err);
                res.send('errore');
            });
        }
    });

});


//GET /play return video-stream
app.get('/play/', function (req, res) {
    console.log('get');
    //console.log(req.query.q);
    var p = req.query.q;
    var type = p.substring(p.length - 3, p.length);
    // console.log(type);
    var file = path.resolve(__dirname + '/download', p);
    fs.stat(file, function (err, stats) {
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


        res.writeHead(200, {
            "Content-Range": "bytes " + start + "-" + end + "/" + total,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": "video/" + type
        });


        //TODO: cercare in torrents e in files (non è detto che bisogni prendere sempre quello in posizione [0] )


        var stream = ((client.torrents[0].files[0]).createReadStream({start: start, end: end}));
        // var stream = fs.createReadStream(__dirname + '/download/' + p);
        // new Transcoder(stream)
        //     .maxSize(1280, 720)
        //     .videoCodec('h264')
        //     .videoBitrate(800 * 1000)
        //     .fps(25)
        //     .sampleRate(44100)
        //     .channels(2)
        //     .audioBitrate(128 * 1000)
        //     .format('mp4')
        //     .on('finish', function () {
        //         console.log("finished");
        //     })
        //     .stream().pipe(res);

        stream.pipe(res);


    });

});


app.get("/video", function (req, res) {
    res.writeHead(200, {'Content-Type': 'video/mp4'});
    var src = "./download/Captain America - Civil war 2016.avi";

    var Transcoder = require('stream-transcoder');
    var stream = fs.createReadStream(src);
    new Transcoder(stream)
        .maxSize(1280, 720)
        .videoCodec('h264')
        .videoBitrate(800 * 1000)
        .fps(25)
        .sampleRate(44100)
        .channels(2)
        .audioBitrate(128 * 1000)
        .format('mp4')
        .on('finish', function () {
            console.log("finished");
        })
        .stream().pipe(res);
});

// GET /player return player page
app.get('/player', function (req, res) {
    res.send(player);
});


//GET / return index page
app.get('/movie_info/:query', function (req, res) {
    icn.search(req.params.query, "BDRiP", function (err, data) {
        res.send(data);
    });
});


//GET /movies return info movies
app.get('/movies', function (req, res) {
    console.log('/movies');
    mdb.discoverMovie({
        language: 'it-IT', sort_by: 'popularity.desc',
        include_adult: 'false', include_video: 'false',
        page: '1', year: '2016'
    }, function (err, data) {
        var tot = data.results.length;
        res.json(data);
    });
});
//
// app.get('/vlc', function (req, res) {
//     res.render();
// });


app.get('/test', function (req, res) {
    console.log('get');
    console.log(req.query.q);
    var p = req.query.q;
    var type = p.substring(p.length - 3, p.length);
    console.log(type);
    var file = path.resolve(__dirname + '/download', p);
    fs.stat(file, function (err, stats) {
        if (err) {
            if (err.code === 'ENOENT') {
                // 404 Error if file not found
                return res.sendStatus(404);
            }
            res.end(err);
        }
        // var range = req.headers.range;
        // if (!range) {
        //     // 416 Wrong range
        //     return res.sendStatus(416);
        // }
        // var positions = range.replace(/bytes=/, "").split("-");
        // var start = parseInt(positions[0], 10);
        // var total = stats.size;
        // var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
        // var chunksize = (end - start) + 1;


        res.writeHead(206, {
            "Content-Range": "bytes " + start + "-" + end + "/" + total,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": "video/" + type  //TODO: adattare ai vari formati video
        });


        //TODO: cercare in torrents e in fles (non è detto che bisogni prendere sempre quello in posizione [0] )
        var stream = client.torrents[0].files[0].createReadStream()

        stream.pipe(res);

    });

});

var containsMagnet = function (elem, array) {
    for (var i in array) {
        if (i.magnetURI === elem) {
            return true;
        }
    }
    return false;
};

//start server
console.log('listein on 8888');
app.listen(8888);
