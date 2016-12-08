var express = require('express');
var app = express();
var port = 8888;


//TODO: chiamate test da eliminare

//GET /test1 chiamata usata per test
app.get('/test1', function (req, res) {

});
//GET /test2 chiamata usata per test
app.get('/test2', function (req, res) {
    icn.search("Star Wars", "BDRiP", function (err, data) {
        if (err) throw err;
        console.log(data.length + " search");
        res.send(data)
    });

});

//GET /home chimata di test
app.get('/home', function (req, res) {
    console.log('home');
    icn.search("Star Wars", "BDRiP", function (err, data) {
        if (err) throw err;
        //console.log(data);

        var movies = [];
        var i = 0;
        console.log(data[0]);
        for (var item in data) {
            var m = new Movie(JSON.stringify(item.cat), JSON.stringify(item.name),
                JSON.stringify(item.link), JSON.stringify(item.size),
                JSON.stringify(item.date), JSON.stringify(item.seeds),
                JSON.stringify(item.peers));
            movies[i] = m.toJson();
            i++;
        }
        res.send(movies);
    });

});


var icn = function (query, res) {
    query = query.split(' ').join('+');
    request('http://ilcorsaronero.info/argh.php?search=' + query, function (error, response, body) {
        var result = [];
        var counter = 0;
        if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body);
            items = $('.odd, .odd2').filter(function () {
                return $(this).children('td').eq(0).children('a').text() === "BDRiP";
            });
            items = $('.odd, .odd2').filter(function () {
                var r = $(this).children('td').eq(2).text();
                var s = r;
                var str = s;
                s = s.substring(0, s.length - 2);
                b = str.substring(str.length - 2, str.length);
                s = parseFloat(s);
                if (b === "GB" && s > 1.5 && s < 10) {
                    return true;
                }
                else return false;
            });


            items.each(function (i, row) {
                var catScraped = $(row).children('td').eq(0).children('a').text(),
                    name = $(this).children('td').eq(1).children('a').text(),
                    link = '',
                    size = $(row).children('td').eq(2).text(),
                    date = $(row).children('td').eq(4).text(),
                    seeds = $(row).children('td').eq(5).text(),
                    peers = $(row).children('td').eq(6).text();
                //console.log(i);
                result.push({
                    "cat": catScraped,
                    "name": name,
                    "link": link,
                    "size": size,
                    "date": date,
                    "seeds": seeds,
                    "peers": peers
                });

                counter++;
                if (counter == items.length) {
                    //console.log(result)
                    res.send(result);
                }
            });


        }
        else {
            res.send('errore');
        }
    })
}
