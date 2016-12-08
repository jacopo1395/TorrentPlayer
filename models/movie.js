// Constructor
function Movie(cat, name, link, size, date, seeds, peers) {
  // always initialize all instance properties
  this.cat = cat;
  this.name = name;
  this.link = link;
  this.size = size;
  this.date = date;
  this.seeds = seeds;
  this.peers = peers;
};
// class methods
Movie.prototype.toJson = function() {
  var json={};
  json.cat = this.cat;
  json.name = this.name;
  console.log('name= '+this.name);
  json.link = this.link;
  json.size = this.size;
  json.date = this.date;
  json.seeds = this.seeds;
  json.peers = this.peers;
  return json;
};
// export the class
module.exports = Movie;
