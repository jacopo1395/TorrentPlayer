//require
var fs = require('fs');
var path = require('path');
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var WebTorrent = require('webtorrent');
var icn = require('./lib/ilcorsaronero');
_ = require('lodash');

//models
var Movie = require("./models/movie.js");

//views
var player = fs.readFileSync('./views/player.html', "utf8");
var index = fs.readFileSync('./views/index.html', "utf8");
var movie = fs.readFileSync('./views/movie.html', "utf8");

//variables
var api_key = '89b43c0850f63d51b9a2fde38e6db2f6';
const mdb = require('moviedb')(api_key);
var magnetURI = 'magnet:?xt=urn:btih:0afc47cb8d2bdf7ed14b8ecea871540360a2a726&dn=Suicide+Squad+2016+Extended+Cut%5BBDRip+-+1080p+-+Ita+Eng+Ac3+-+Sub+Ita+Eng%5DSperanzah%5Bwww.icv-crew%5D&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce';

//init
var client = new WebTorrent();
var app = express();

// view engine ejs

// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');
app.set('view engine', 'ejs');


//INIZIO script momentaneo--------------------------

// var file_torrent;
// client.add(magnetURI, {path: './download'}, function (torrent) {
//
//     file_torrent = torrent.files[0];
//
//
// });
// client.on('error', function (err) {
//     console.log('errore client');
// })
//FINE script momentaneo---------------------


//GET / return index page
app.get('/', function (req, res) {
    res.send(index);
});

//GET / return index page
app.get('/movie_info/:query', function (req, res) {
    icn.search(req.params.query, "BDRiP", function (err, data) {
        res.send(data);
    });
});

//GET /movie/:query Return
app.get('/movie/:query', function (req, res) {
    console.log('/movie' + req.params.query);
    icn.search(req.params.query, "BDRiP", function (err, data) {
        if (err) throw err;
        res.render('movie', {'title': 'titolo di prova'});
    });
});

//GET /link/:url Return
app.get('/link/:url', function (req, res) {
    console.log('/link' + req.params.url);
    icn.getMagnet(req.params.url, function (err, data) {
        if (err) throw err;
        res.send(data);
    });
});

//GET /play return video-stream
app.get('/play', function (req, res) {
    console.log('get');
    console.log(__dirname);

    var file = path.resolve(__dirname + '/download', file_torrent.path);
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

        res.writeHead(206, {
            "Content-Range": "bytes " + start + "-" + end + "/" + total,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": "video/mkv"  //TODO: adattare ai vari formati video
        });

        var stream = file_torrent.createReadStream({start: start, end: end})

        stream.pipe(res);

    });

});

// GET /player return player page
app.get('/player', function (req, res) {
    res.send(player);
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


//start server
console.log('listein on 8888');
app.listen(8888);
