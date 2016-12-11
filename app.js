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
                res.render('vlc');
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

        stream.pipe(res);
        console.log('fine play');

    });

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
        // var range = req.headers.range;
        // if (!range) {
        //     // 416 Wrong range
        //     return res.sendStatus(416);
        // }
        // var positions = range.replace(/bytes=/, "").split("-");
        var positions = "0";
        var start = parseInt(positions[0], 10);
        var total = stats.size;
        var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
        var chunksize = (end - start) + 1;


        res.writeHead({
            "Content-Range": "bytes " + start + "-" + end + "/" + total,
            "Accept-Ranges": "bytes",
            "Content-Length": chunksize,
            "Content-Type": "video/" + type
        });
        // res.contentType('mp4');

        var stream = ((client.torrents[0].files[0]).createReadStream({start: start, end: end}));

        var input_file = stream;
        var process = child_process.spawn('ffmpeg', ['-i', 'pipe:0', '-f', 'mp4', '-movflags', 'frag_keyframe', 'pipe:1']);
        input_file.pipe(process.stdin);
        process.stdout.pipe(res);


        console.log('fine test');


    });


});

app.get('/test2', function(req, res){
    res.contentType('mp4');
    // make sure you set the correct path to your video file storage
    var path = __dirname + '/download/Suicide Squad (2016).EXTENDED.H264.ita.eng.iCV-MIRCrew.mkv';
    var input_file = fs.createReadStream(path);
    var process = child_process.spawn('ffmpeg', ['-i', 'pipe:0', '-f', 'mp4', '-movflags', 'frag_keyframe', 'pipe:1']);
    input_file.pipe(process.stdin);
    process.stdout.pipe(res);
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
