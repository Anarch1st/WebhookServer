
const { execSync } = require('child_process');
const fs = require('fs');

const serverDir = '/home/pi/Servers';
function repoDir(repo) {
	return serverDir+'/'+repo;
}
function publicDir(repo) {
	return repoDir(repo)+'/public';
}
function privateDir(repo) {
	return repoDir(repo)+'/private';
}
function tempDir(repo) {
	return serverDir+'/temp/'+repo;
}
function app(repo) {
	return repoDir(repo)+'/server/'+repo.toLowerCase()+'.js';
}


function update(repo, branch) {

	console.log("Repository: "+repo);
	var serverList = [];
	if (repo === "WaspServer") {
		try {
			var temp = execSync('pm2 jlist');
			var json = JSON.parse(temp);
			for (var ser of json) {
				serverList.push(ser.name);
			}
			execSync('pm2 stop all');
		} catch (err) {}
	} else if (repo !== 'WebhookServer') {
		serverList.push(repo.toLowerCase());
		try {
			execSync('pm2 stop '+repo.toLowerCase());
		} catch(err) {}
	}
	console.log("Server list: "+serverList);

	try {
		execSync('cp -R '+privateDir(repo)+' '+tempDir(repo));
		console.log("Copy private folder to temp");
	} catch (err) {}
	try {
		execSync('rm -rf '+repoDir(repo));
		console.log("Remove private folder");
	} catch (err) {}

	console.log('Cloning');
	execSync('git clone git@github.com:Saii626/'+repo+'.git', {cwd: serverDir});
	console.log('Checking out');
	execSync('git checkout '+branch, {cwd: repoDir(repo)});
	console.log('Installing dependencies');
	execSync('npm install', {cwd: repoDir(repo)});
	try {
		execSync('npm install', {cwd: publicDir(repo)});
		console.log('Installing public dependencies');
	} catch(err) {}
	try {
		execSync('cp -R '+tempDir(repo)+' '+privateDir(repo));
		console.log("Copy temp private folder to private");
	} catch(err) {}

	if (repo === 'WebhookServer') {
		execSync('pm2 save');
		execSync('pm2 restart webhookserver');
		console.log("Updated");
	} else {
		for (var server of serverList) {
			console.log('Starting server: ' + repo);
			execSync('pm2 start '+app(repo));
		}
		execSync('pm2 save');
		console.log("Updated");
	}
}

module.exports.update = update;
