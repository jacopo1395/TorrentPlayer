//require
var fs = require('fs');
var path = require('path');
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');

//variables
var api_key = '89b43c0850f63d51b9a2fde38e6db2f6';
const mdb = require('moviedb')(api_key);
var altadefinizione = "http://altadefinizione.cafe/";
// var address = "http://jacopo.westeurope.cloudapp.azure.com:8888";
var address = "http://localhost:8888";

//views
var index = fs.readFileSync('./public/views/index.html', "utf8");
var movies = index;
// var movie_info = fs.readFileSync('./public/views/movie_info.html', "utf8");
// var player = fs.readFileSync('./public/views/player.html', "utf8");


//init
var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'public/views'));
app.set('view engine', 'ejs');


//setup plublic dir
app.use(express.static(path.join(__dirname, 'public')));


// ------------------APIs-------------------------

app.get('/', function (req, res) {
    console.log('/');
    res.render('index', {'address': address});
});


//GET /index/:page?g=genere return info movies
app.get('/movies/:page', function (req, res) {
    console.log('/movies');
    var opt = {
        language: 'it-IT', sort_by: 'popularity.desc',
        include_adult: 'false', include_video: 'false',
        page: req.params.page, year: '2016'
    };
    if (req.query.g != null) opt.with_genres = req.query.g;
    mdb.discoverMovie(opt, function (err, data) {
        res.setHeader('Content-Type', 'application/json');
        res.json(data);
    });
});

//GET /info/:query Return
app.get('/movie_info/:id', function (req, res) {
    console.log('/movie_info ' + req.params.id);
    mdb.movieInfo({id: req.params.id, language: 'it-IT'}, function (err, info) {
        if (err) throw err;
        var data = {};
        data.title = info.title;
        data.year = info.release_date.substring(0, 4);
        data.poster = info.poster_path;
        data.plot = info.overview;
        data.rate = info.vote_average;
        data.genres = info.genres;
        mdb.movieCredits({id: req.params.id}, function (err, cred) {
            if (err) throw err;
            data.cred = cred;
            data.address = address;
            res.render('movie_info', {'data': data});
        });
    });
});

app.get('/genres', function (req, res) {
    mdb.genreMovieList({language: "it-IT"}, function (err, data) {
        if (err) throw err;
        res.setHeader('Content-Type', 'application/json');
        res.json(data);
    });
});

app.get('/play/:title', function (req, res) {
    var s = (req.params.title).replace("", "+");
    var url = altadefinizione + "?s=" + s;
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            url = $(".col-lg-3.col-md-3.col-xs-3").children().eq(0).attr("href");
            console.log(url);
            request(url, function (error, response, body) {
                $ = cheerio.load(body);
                url = $("#iframeVid").attr("src");
                console.log(url);
                request(url, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        $ = cheerio.load(body);
                        var regex = /http:\/\/hdpass\.net\/film\.php\?idFilm=.*">1080P/, indices = [];
                        var html = $('body').html().toString();
                        var re = "http://hdpass.net/film.php?idFilm=";
                        var idx = html.indexOf(re);
                        while (idx != -1) {
                            indices.push(idx);
                            idx = html.indexOf(re, idx + 1);
                        }
                        var re2 = ">1080P";
                        var stop = html.indexOf(re2);
                        var start;
                        for (var j = indices.length - 1; j >= 0; j--) {
                            if (indices[j] < stop) {
                                start = indices[j];
                                break;
                            }
                        }
                        url = html.substring(start, stop - 1);
                        url = url.replace("amp;", "");
                        url = url.replace("amp;", "");
                        url = url.replace("amp;", "");
                        console.log(url);
                        request(url, function (error, response, body) {
                            if (!error && response.statusCode == 200) {
                                $ = cheerio.load(body);
                                var urlEmbed = $('#urlEmbed').val();
                                urlEmbed = clearify(urlEmbed);
                                var iframe = '<iframe width="100%" height="100%" src="' + urlEmbed + '" frameborder="0" scrolling="no" allowfullscreen />';
                                console.log(urlEmbed);
                                request(urlEmbed, function (error, response, body) {
                                    if (!error && response.statusCode == 200) {
                                        $ = cheerio.load(body);
                                        var decode = $('#mediaspace_wrapper').children().eq(6).children().eq(0).text();
                                        console.log(decode);
                                        decode = get_url(decode);
                                        console.log(decode)
                                        var videourl = "https://openload.co/stream/" + decode + "?mime=true";
                                        var data = {};
                                        data.videourl = videourl;
                                        data.address = address;
                                        res.render('player', {'data': data});
                                    } else res.send('err');
                                });
                            } else res.send("err");
                        });
                    } else res.send("err");
                });
            });
        } else res.send("err");
    })
})

app.get('/play1/:title', function(req, res){
  console.log("/play")
  var s = (req.params.title).replace("", "-");
  var cineblog = "http://www.cb01.uno/";
  var url = cineblog + s;
  request(url, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body)
        var $ = cheerio.load(body);
        $('.post_content').children().eq(4).children()
        res.send(body)
      }else res.send(error);
    });
})

// function tools
function clearify(url) {
    var size = url.length;
    if (size % 2 == 0) {
        var halfIndex = size / 2;
        var firstHalf = url.substring(0, halfIndex);
        var secondHalf = url.substring(halfIndex, size);
        var url = secondHalf + firstHalf;
        var base = url.split("").reverse().join("");
        // var clearText = $.base64('decode', base);
        //return clearText
        var buf = Buffer.from(base, 'base64'); // Ta-da
        return buf.toString('utf8');
    } else {
        var lastChar = url[size - 1];
        url[size - 1] = ' ';
        url = $.trim(url);
        var newSize = url.length;
        var halfIndex = newSize / 2;
        var firstHalf = url.substring(0, halfIndex);
        var secondHalf = url.substring(halfIndex, newSize);
        url = secondHalf + firstHalf;
        var base = url.split("").reverse().join("");
        base = base + lastChar;
        console.log(base);
        //var clearText = $.base64('decode', base);
        var buf = Buffer.from(base, 'base64'); // Ta-da
        return buf.toString('utf8');
    }
}
//
// function get_url_old(encode) {
//     try {
//         first_two_chars = parseInt(parseFloat(encode[0] + encode[1]))
//
//         tab_code = {}
//         index = 2
//         while (index < (encode.length)) {
//             key = parseInt(parseFloat(encode[index + 3] + encode[index + 3 + 1]))
//             tab_code[key] = String.fromCharCode(parseInt(parseFloat(encode[index] + encode[index + 1] + encode[index + 2])) - first_two_chars)
//             index += 5
//         }
//         console.log(tab_code)
//         //sorted(tab_code, key)
//         var text_decode = '';
//         for (var key in tab_code) {
//             if (tab_code.hasOwnProperty(key))
//                 text_decode = text_decode + tab_code[key]
//         }
//         return text_decode;
//     } catch (e) {
//
//     }
//
// }

// encode="7k5405Q3168O1063g5275I1075D5555F6708Z3159d3159f6318h2266X7441n3267l2148i7644C4344V7448A1117j5630m4512R1056b1060S3165H3363E6684M7392U7399c1060L6798B2114Y6342N4236W4532J6726T1063o4436e3165p7819P6378G6444K5460"
// console.log(get_url(encode))
function get_url(encode){
  text_decode = {}
  v1 = parseInt(encode[0])
  index = 1
  while (index < (encode.length)){
      i = (encode[index]).charCodeAt(0)

      key = 0
      if (i <= 90){
          key = i - 65
      }
      else {
        if (i >= 97){
          key = 25 + i - 97
        }
      }
      // console.log(String.fromCharCode(parseInt(encode[index+2]+encode[index+3]+encode[index+4])))
      text_decode[key] = String.fromCharCode(Math.floor( parseInt(encode[index+2]+encode[index+3]+encode[index+4]) / parseInt(encode[index+1]) ) - v1 )
      index += 5
  }

  //sorted(text_decode, key=lambda key: text_decode[key])
  // console.log(text_decode)
  suffix = ""
  for (key in text_decode){
    // console.log(key+" = "+ text_decode[key])
    if (text_decode.hasOwnProperty(key))
      suffix += text_decode[key]
  }
  return suffix;

}

//start server on port 8888
console.log('listein on 8888');
app.listen(8888);
