const express = require('express');
const http = require('http');

const app = express();
const httpServer = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/post', function(req, res) {
	console.log(req.body);
	res.send("Success");
})
httpServer.listen(process.env.PORT || 8010, function() {
	console.log("WebHookServer started on port: "+httpServer.address().port);
});
