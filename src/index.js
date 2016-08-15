var express = require('express');
var bodyParser = require('body-parser');

var app = express();

console.log("Welcome to Frost API Server");

app.get('/', function(req, res) {
	res.json({message: "Frost API Server"});
});


var applicationRouter = express.Router();
app.use('/application', applicationRouter);

applicationRouter.post('/', function(req, res) {
	res.json({message: "successful"});
});

applicationRouter.get('/:id', function(req, res) {
	res.json({message: "successful"});
});

applicationRouter.post('/:id/application-key', function(req, res) {
	res.json({message: "successful"});
});

applicationRouter.get('/:id/application-key', function(req, res) {
	res.json({message: "successful"});
});


var userRouter = express.Router();
app.use('/user', userRouter);

userRouter.get('/:id', function(req, res) {
	res.json({message: "successful"});
});


app.listen(8000);
