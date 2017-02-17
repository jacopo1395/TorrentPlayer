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
                data.cred = cred;
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
app.get('/player/', function (req, res) {
    console.log('/player ' + req.query.q);
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
                file_torrent.on('download', function (bytes) {
                    console.log('download');
                });
                console.log('render');
                res.render('player', {'data': file_torrent.path});
            });
            client.on('torrent', function (torrent) {
                console.log("torrent");

            });

            client.on('error', function (err) {
                console.log(err);
                res.send('error');
            });
        }
    });

});

app.get('/play3', function (req, res) {
    console.log('/play');
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


        // res.writeHead(200, {
        //     "Content-Range": "bytes " + start + "-" + end + "/" + total,
        //     "Accept-Ranges": "bytes",
        //     "Content-Length": chunksize,
        //     "Content-Type": "video/" + type
        // });
        res.contentType('mp4');

        var stream = ((client.torrents[0].files[0]).createReadStream({start: start, end: end}));

        var input_file = stream;
        var process = child_process.spawn('ffmpeg', ['-i', 'pipe:0', '-f', 'mp4', '-movflags', 'frag_keyframe', 'pipe:1']);
        input_file.pipe(process.stdin);
        process.stdout.pipe(res);
        console.log('fine test');


    });


});

app.get('/play2', function (req, res) {
    res.contentType('/play2');
    // make sure you set the correct path to your video file storage
    var p = req.query.q;
    var type = p.substring(p.length - 3, p.length);
    // console.log(type);
    var file = path.resolve(__dirname + '/download', p);
    var input_file = fs.createReadStream(file);
    var process = child_process.spawn('ffmpeg', ['-i', 'pipe:0', '-f', 'mp4', '-movflags', 'frag_keyframe', 'pipe:1']);
    input_file.pipe(process.stdin);
    process.stdout.pipe(res);
});

app.get('/play', function(req,res){
    var p = req.query.q;
    var type = p.substring(p.length - 3, p.length);
    // console.log(type);
    var file = path.resolve(__dirname + '/download', p);
    var stream = ((client.torrents[0].files[0]).createReadStream());
    var command = ffmpeg(file);
    res.contentType('mp4');
    command.output(__dirname +'/download/outputfile.mp4').run();
    var out = ffmpeg(__dirname +'/download/outputfile.mp4');
    out.output(res).run();


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
