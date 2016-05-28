var express = require('express'),
  bodyParser = require('body-parser'),
  fs = require('fs'),
  fsr = require('fs-reverse'),
  regex = require('regex'),
  async = require('async');


// setup middleware
var app = express();
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
var http = require('http').Server(app);
var io = require('socket.io')(http);
/*
// var outstream = new stream;
// outstream.readable = true;
// outstream.writable = true;


app.get('/', function(req, res){
  var options = { flags: 'r', mode: 0666, bufferSize: 64 * 1024, matcher: /([(\d\.)]+) - - \[(.*?)\] "(.*?)" (\d+) - "(.*?)" "(.*?)"/ };
  fsr('/var/log/apache2/access_log', options).pipe(res);
});

// function parseLogFile(outputs){
//   var rd = readLine.createInterface({
//     input: fs.createReadStream('/var/log/apache2/access_log'),
//     output: outstream
//   });

//   var regex = /([(\d\.)]+) - - \[(.*?)\] "(.*?)" (\d+) - "(.*?)" "(.*?)"/

//   rd.on('line', function(line) {
//     rd.write(line);
//     outputs();
//   });
// }
*/

app.get('/', function(req, res){

  res.sendFile(__dirname + '/public/html/index.html');
  
});

app.get('/logfile', function(req, res){
  var options = {flags:'r', bufferSize: 64*1024};

  async.eachSeries(
    ['/var/log/apache2/access_log'],
    function(fileName, cb){
      var regex = /([(\d\.)]+) - - \[(.*?)\] "(.*?)" (\d+) - "(.*?)" "(.*?)"/
      fs.readFile(fileName, "utf-8", function(err, content){

        var lines = content.split("\n");
        var html = "<table>";
        var lineLength = 0;
        if(lines){
          lineLength = lines.length;
        }
        else{
          html += lines;
        }
        
        for(var i=0;i<lineLength;i++){
          var txt = lines[i].match(regex);
          var txtLength = 0;
          html += "<tr>";
          if(txt){
            txtLength = txt.length;
          }
          else{
            html += "<td>"+lines[i]+"</td>";
          }


          for(var j=0; j<txtLength-1; j++){
            html += "<td>"+txt[j+1]+"</td>";
          }
          html += "/<tr>";
        }
        html += "</table>";
        if(err){
        }
        else{
          res.write(html);
        }
        cb(err);
      });
    },
    function(err) {
      res.end();
    }
  )
});

io.on('connection', function(socket){
    console.log("socket connected");
    fs.watch('/var/log/apache2/access_log', {encoding: 'buffer'}, function(eventString, fileName){
      socket.emit(eventString, {});
      console.log(fileName);
    });

    socket.on("disconnect", function(){

    });

});

var host = 'localhost';
var port = 8000;
http.listen(port, function(){
  console.log('listening on *:'+port);
});
