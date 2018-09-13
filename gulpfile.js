const gulp = require('gulp');
const nodemon = require('nodemon');
const gulpssh  = require('gulp-ssh');
const scp = require('gulp-scp');

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
		passphrase: '6SaNdY2',
		dest: '/home/pi/Documents/node-server'
	};

gulp.task('push', function() {
	return gulp.src('../WebhookServer/**/*.*')
	.pipe(scp(config))
	.on('error', function (err) {
		console.log(err);
	});
});

var ssh = new gulpssh({sshConfig: config});
gulp.task('run', function() {
	return ssh.exec('node /home/pi/Documents/node-server/server/app.js >> /home/pi/Documents/node-server/server.log 2>&1 &');
});
