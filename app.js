var fs = require('fs');
var player=fs.readFileSync('./views/player.html',"utf8");
var index=fs.readFileSync('./views/index.html',"utf8");
var express = require('express');
var app = express();
var path = require('path');
_ = require('lodash');
var api_key = '89b43c0850f63d51b9a2fde38e6db2f6';
const mdb = require('moviedb')(api_key);
var request = require('request');
var cheerio = require('cheerio');

var Movie = require("./models/movie.js");

var WebTorrent = require('webtorrent');
var client = new WebTorrent();
var magnetURI = 'magnet:?xt=urn:btih:0afc47cb8d2bdf7ed14b8ecea871540360a2a726&dn=Suicide+Squad+2016+Extended+Cut%5BBDRip+-+1080p+-+Ita+Eng+Ac3+-+Sub+Ita+Eng%5DSperanzah%5Bwww.icv-crew%5D&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce';
var icn = require("ilcorsaronero-api");


var file_torrent;
client.add(magnetURI, { path: './download' }, function (torrent) {

        file_torrent = torrent.files[0];


 });
client.on('error', function (err) {
   console.log('errore client');
})


app.get('/', function(req, res){
  res.send(index);
});

app.get('/play',function(req,res){
  console.log('get');
  console.log(__dirname);

  var file = path.resolve(__dirname+'/download', file_torrent.path);
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
      "Content-Type": "video/mkv"
    });

    var stream = file_torrent.createReadStream({ start: start, end: end })

    stream.pipe(res);

  });

});



app.get('/player',function(req,res){
  res.send(player);
});

app.get('/movies',function(req,res){
  console.log('/movies');
  mdb.discoverMovie({ language: 'it-IT', sort_by: 'popularity.desc',
                      include_adult: 'false', include_video: 'false',
                      page: '1', year: '2016'}, (err, data) => {
      //if(err) throw err;
      //console.log(data.results.length);
      var tot = data.results.length;
      // var finished = _.after(2, function(res,data){
      //   console.log('send');
      //   res.send(data);
      // });
      res.json(data);
      // var movies = {};
      // for(var i=0; i<tot; i++){
      //   console.log(i);
      //   icn.search("Star Wars", "BDRiP", function(err, data2){
      //     if(err) throw err;
      //     console.log('ok');
      //       movies[i] = {'link': data2.link};
      //       finished(res, movies);
      //   });
      // }

  });
});

app.get('/test1', function(req, res){
  request('http://ilcorsaronero.info/argh.php?search=suicide+squad', function (error, response, body) {
    var result=[];
    var counter=0;
    if (!error && response.statusCode == 200) {
          var $ = cheerio.load(body);
          items = $('.odd, .odd2').filter(function() {
            return $(this).children('td').eq(0).children('a').text() === "BDRiP";
          });
          items = $('.odd, .odd2').filter(function() {
            var r = $(this).children('td').eq(2).text();
            var s = r;
            var str = s;
            s = s.substring(0, s.length - 2);
            b = str.substring(str.length-2, str.length);
            s = parseFloat(s);
            if(b === "GB" && s>1.5 && s<10){
              return true;
            }
            else return false;
          });


          items.each(function(i, row) {
            var  catScraped = $(row).children('td').eq(0).children('a').text(),
                name = $(this).children('td').eq(1).children('a').text(),
                link = '',
                size = $(row).children('td').eq(2).text(),
                date = $(row).children('td').eq(4).text(),
                seeds = $(row).children('td').eq(5).text(),
                peers = $(row).children('td').eq(6).text();
                //console.log(i);
                result.push( { "cat": catScraped, "name": name, "link": link, "size": size, "date": date, "seeds": seeds, "peers": peers } );

                counter++;
                if(counter == items.length) {
                  //console.log(result)
                  res.send(result);
                }
          });


    }
    else{
      res.send('errore');
    }
  })
});


  app.get('/test2',function(req, res){
    icn.search("Star Wars", "BDRiP", function(err, data) {
      if (err) throw err;
      console.log(data.length + " search");
      res.send(data)
    });

  });





app.get('/home', function(req, res){
  console.log('home');
  icn.search("Star Wars", "BDRiP", function(err, data) {
    if (err) throw err;
    //console.log(data);

    var movies = [];
    var i=0;
    console.log(data[0]);
    for (var item in data) {
      var m=new Movie(JSON.stringify(item.cat), JSON.stringify(item.name),
                            JSON.stringify(item.link), JSON.stringify(item.size),
                            JSON.stringify(item.date), JSON.stringify(item.seeds),
                            JSON.stringify(item.peers));
        movies[i] = m.toJson();
        i++;
    }
    res.send(movies);
  });

});


console.log('listein on 8888');
app.listen(8888);
