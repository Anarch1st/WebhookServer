const express = require('express');
const http = require('http');
const server = require('./updateServer');

const app = express();
const httpServer = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/webhook/post', function(req, res) {
	const payload = req.body;
	var tempArray = payload.ref.split('/');

	const branch = tempArray[tempArray.length - 1];

	if (branch != 'master') {
		res.send({status : "success",
				branch: branch,
				updated: "No"});
		return;
	}

	res.send({status : "success",
			branch: branch,
			updated: "Yes"});

	server.update(branch);

});

const notify = require('./notify');
app.use('/notify', notify);

httpServer.listen(process.env.PORT || 8010, function() {
	console.log("WebHookServer started on port: "+httpServer.address().port);
});
