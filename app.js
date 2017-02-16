//require
var fs = require('fs');
var path = require('path');
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var WebTorrent = require('webtorrent');
var icn = require('./lib/ilcorsaronero');
_ = require('lodash');
var ffmpeg = require('fluent-ffmpeg');
var child_process = require('child_process');


//models
var Movie = require("./models/movie.js");

//views
// var player = fs.readFileSync('./views/player.html', "utf8");
var index = fs.readFileSync('./public/views/index.html', "utf8");
// var movie = fs.readFileSync('./views/movie.html', "utf8");

//variables
var api_key = '89b43c0850f63d51b9a2fde38e6db2f6';
const mdb = require('moviedb')(api_key);
var magnet = 'magnet:?xt=urn:btih:6a9759bffd5c0af65319979fb7832189f4f3c35d&dn=sintel.mp4&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel-1024-surround.mp4';


//init
var client = new WebTorrent();
var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));


//GET / return index page
app.get('/', function (req, res) {
    console.log('/');
    res.send(index);
});


//GET /index/:page?g=genere return info movies
app.get('/film/:page', function (req, res) {
    console.log('/movies');
    var opt = {
        language: 'it-IT', sort_by: 'popularity.desc',
        include_adult: 'false', include_video: 'false',
        page: req.params.page, year: '2016'
    };
    if (req.query.g != null) opt.with_genres = req.query.g;
    mdb.discoverMovie(opt, function (err, data) {
        res.json(data);
    });
});

//GET /movie/:query Return
app.get('/info/:id', function (req, res) {
    console.log('/movie ' + req.params.id);
    mdb.movieInfo({id: req.params.id, language: 'it-IT'}, function (err, info) {
        if (err) throw err;
        icn.search(info.title, "BDRiP", function (err, data) {
            if (err) throw err;
            data.title = info.title;
            data.year = info.release_date.substring(0, 4);
            data.poster = info.poster_path;
            data.plot = info.overview;
            data.rate = info.vote_average;
            data.genres = info.genres;
            mdb.movieCredits({id: req.params.id}, function (err, cred) {
                if (err) throw err;
                data.cred=cred;
                console.log(data.cred.cast);
                res.render('movie', {'data': data});
            });
        });
    });
});

app.get('/genres', function (req, res) {
    mdb.genreMovieList({language: "it-IT"}, function (err, data) {
        if (err) throw err;
        res.json(data);
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
                res.render('vlc');
            });
        }
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
