const express = require('express');
const http = require('http');
const { execSync } = require('child_process');

const app = express();
const httpServer = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/webhook/post', function(req, res) {
	const payload = req.body;
	var tempArray = payload.ref.split('/');

	const branch = tempArray[tempArray.length - 1];

	if ((branch != 'master') && (branch != 'dev') ) {
		res.send({status : "success",
				branch: branch,
				updated: "No"});
		return;
	}

	res.send({status : "success",
			branch: branch,
			updated: "Yes"});

	execSync('pm2 stop app');
	execSync('rm -rf ~/Documents/WaspServer');
	execSync('git clone git@github.com:Anarch1st/WaspServer.git',
	 {cwd: '/home/pi/Documents'});
	execSync('git checkout '+branch,
	 {cwd: '/home/pi/Documents/WaspServer'});
	execSync('echo Installing dependencies');
	execSync('npm install', {cwd: '/home/pi/Documents/WaspServer'});
	execSync('echo Starting Server');
	execSync('pm2 start server/app.js',
	 {cwd: '/home/pi/Documents/WaspServer'});
	execSync('echo saving config');
	execSync('pm2 save');
	execSync('echo done');

});

httpServer.listen(process.env.PORT || 8010, function() {
	console.log("WebHookServer started on port: "+httpServer.address().port);
});
