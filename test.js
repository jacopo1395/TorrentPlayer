var wjs = require("wcjs-player");

var player = new wjs("#player1").addPlayer({ autoplay: true });
player.addPlaylist("http://archive.org/download/CrayonDragonAnAnimatedShortFilmByTonikoPantoja/Crayon%20Dragon%20-%20An%20animated%20short%20film%20by%20Toniko%20Pantoja.mp4");

var player2 = new wjs("#player2").addPlayer({ autoplay: true });
player2.addPlaylist("http://archive.org/download/CartoonClassics/Krazy_Kat_-_Keeping_Up_With_Krazy.mp4");