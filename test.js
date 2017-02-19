
app.get('/hd', function (req, res) {
    request("http://altadefinizione.cafe/oceania/", function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            var link = $("#iframeVid").attr("src");
            request(link, function (error, response, body2) {
                if (!error && response.statusCode == 200) {
                    $ = cheerio.load(body2);
                    var urlEmbed = $('#urlEmbed').val();
                    urlEmbed = clearify(urlEmbed);
                    var iframe = '<iframe width="100%" height="100%" src="' + urlEmbed + '" frameborder="0" scrolling="no" allowfullscreen />';
                    // console.log(urlEmbed);
                    // res.send(iframe);
                    request(urlEmbed, function (error, response, body3) {
                        if (!error && response.statusCode == 200) {
                            $ = cheerio.load(body3);
                            // var decode = $('#streamurl').text();
                            var decode = $('#mediaspace_wrapper').children().eq(6).children().eq(0).text();
                            decode = get_utl(decode);
                            var videourl = "https://openload.co/stream/" + decode + "?mime=true";
                            res.send(videourl);
                        }
                        else res.send('err');
                    });
                }
            });
        }
    });
});


// -------------------- OLD APIs --------------------------------
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

app.get('/play', function (req, res) {
    var p = req.query.q;
    var type = p.substring(p.length - 3, p.length);
    // console.log(type);
    var file = path.resolve(__dirname + '/download', p);
    var stream = ((client.torrents[0].files[0]).createReadStream());
    var command = ffmpeg(file);
    res.contentType('mp4');
    command.output(__dirname + '/download/outputfile.mp4').run();
    var out = ffmpeg(__dirname + '/download/outputfile.mp4');
    out.output(res).run();


});


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

var containsMagnet = function (elem, array) {
    for (var i in array) {
        if (i.magnetURI === elem) {
            return true;
        }
    }
    return false;
};