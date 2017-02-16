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
