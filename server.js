'use strict'

var express = require('express');
var morgan = require('morgan');
var app = express();

// lets put stuff in to log in the console//
app.use(morgan('combined'));

// serve a static file from public //
app.use( express.static(__dirname+'/public') );

//default route //
app.get('/', (req, res)=>
  res.sendFile(__dirname+'/public/index.html')
);

// listen on this port //
app.listen(7777,()=>
  console.log("listening on 7777, dude")
);
