
const { execSync } = require('child_process');
const fs = require('fs');

const serverDir = '/home/pi/Servers';
function serviceDir(service) {
	return serverDir+'/'+service;
}
function publicDir(service) {
	return serviceDir(service)+'/public';
}
function privateDir(service) {
	return serviceDir(service)+'/private';
}
function tempDir(service) {
	return serverDir+'/temp/'+service;
}
function app(service) {
	return serviceDir(service)+'/server/'+service.toLowerCase();
}


function update(service, branch) {

	var serverList = [];
	if (service === "WaspServer") {
		var temp = execSync('pm2 jlist');
		var json = JSON.parse(temp);
		for (var ser of json) {
			serverList.push(ser.name);
		}
		execSync('pm2 stop all');
	} else if (service !== 'WebhookServer') {
		serverList.push(service.toLowerCase());
		execSync('pm2 stop '+service.toLowerCase());
	}

	execSync('cp -R '+privateDir(service)+' '+tempDir(service));
	execSync('rm -rf '+serviceDir(service));
	execSync('git clone git@github.com:Anarch1st/'+service+'.git', {cwd: serverDir});
	execSync('git checkout '+branch, {cwd: serviceDir(service)});
	execSync('npm install', {cwd: serviceDir(service)});
	execSync('npm install', {cwd: publicDir(service)});
	execSync('cp -R '+tempDir(service)+' '+privateDir(service));

	if (service === 'WebhookServer') {
		execSync('pm2 save');
		execSync('pm2 restart webhookserver');
	} else {
		for (var server of serverList) {
			execSync('pm2 start '+app(server));
		}
		execSync('pm2 save');
	}
}

module.exports.update = update;
