const gulp = require('gulp');
const nodemon = require('nodemon');
const gulpssh  = require('gulp-ssh');
const scp = require('gulp-scp2');

gulp.task('default', function(){
	nodemon({
		script: 'server/webhook.js',
		ignore: ['public/*', 'node_modules/*']
	})
	.on('restart', function() {
		console.log("server restarted");
	})
});

var config = {
		host: '192.168.100.2',
		username: 'pi',
		privateKey: require('fs').readFileSync('/home/saii/.ssh/id_rsa'),
		// passphrase: '6SaNdY2',
		dest: '/home/pi/Documents/WebhookServer'
	};

gulp.task('push', function() {
	return gulp.src(['server/**/*.*', '*.*'])
	.pipe(scp(config))
	.on('error', function (err) {
		console.log(err);
	});
});

var ssh = new gulpssh({sshConfig: config});
gulp.task('run', function() {
	return ssh.exec('node /home/pi/Documents/WebhookServer/webhook.js >> /home/pi/Documents/node-server/server.log 2>&1 &');
});
