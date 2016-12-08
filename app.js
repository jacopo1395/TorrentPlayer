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
// var player = fs.readFileSync('./views/player.html', "utf8");
var index = fs.readFileSync('./views/index.html', "utf8");
// var movie = fs.readFileSync('./views/movie.html', "utf8");

//variables
var api_key = '89b43c0850f63d51b9a2fde38e6db2f6';
const mdb = require('moviedb')(api_key);

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
        res.render('movie', {'data': data});
    });
});

//GET /link/:url Return
app.get('/link/', function (req, res) {
    console.log('/link' + req.query.q);
    var file_torrent;
    icn.getMagnet(req.query.q, function (err, data) {
        if (err) throw err;
        client.add(data, {path: './download'}, function (torrent) {
            file_torrent = torrent.files[0];
            res.render('player', {'data': file_torrent.path});
        });
        client.on('error', function (err) {
            console.log('errore client');
        });

    });
});

//GET /play return video-stream
app.get('/play/', function (req, res) {
    console.log('get');
    console.log(req.query.q);
    var file = path.resolve(__dirname + '/download', req.query.q);
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

        //TODO: cercare in torrents e in fles (non è detto che bisogni prendere sempre quello in posizione [0] )
        var stream = client.torrents[0].files[0].createReadStream({start: start, end: end})

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
