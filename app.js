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


app.get('/', function(req, res){

  res.sendFile(__dirname + '/public/html/index.html');
  
});

app.get('/logfile', function(req, res){
  var options = {flags:'r', bufferSize: 64*1024};
  var numLines = 0;

  async.eachSeries(
    ['/var/log/apache2/access_log'],
    function(fileName, cb){
      var regex = /([(\d\.)]+) - - \[(.*?)\] "(.*?)" (\d+) - "(.*?)" "(.*?)"/
      fs.readFile(fileName, "utf-8", function(err, content){
        var IPS = "";
        // var distinctIPRegex = /[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}/;
        // var IPS = content.match(distinctIPRegex);
        // console.log(IPS);
        // var iphtml = "";
        // if(IPS){
        //   for(var i=0;i<IPS.length-1;i++){
        //     iphtml+="<p>"+IPS[i+1]+"</p>";
        //   }
        // }
        var lines = content.split("\n");
        var html = "<table>";
        var lineLength = 0;
        if(lines){
          lineLength = lines.length;
          numLines+=lineLength;
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
            if(lines[i].search("122.171.124.95") < 0){
              html += "<td>"+lines[i]+"</td>";
            }
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
      var numLinesHTML = "<h3>"+"NUMBER OF HITS = "+numLines+"</h3>";
      res.write(numLinesHTML);
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
var port = 8080;
http.listen(port, function(){
  console.log('listening on *:'+port);
});
