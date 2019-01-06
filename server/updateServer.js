const {
  execSync
} = require('child_process');
const fs = require('fs');
const request = require('request');

const serverDir = '/home/pi/Servers';

function repoDir(repo) {
  return serverDir + '/' + repo;
}

function publicDir(repo) {
  return repoDir(repo) + '/public';
}

function privateDir(repo) {
  return repoDir(repo) + '/private';
}

function tempDir(repo) {
  return serverDir + '/temp/' + repo;
}

function app(repo) {
  return repoDir(repo) + '/server/' + repo.toLowerCase() + '.js';
}


function update(repo, branch) {

  console.log("Repository: " + repo);
  let repoNotifier = notifyZuk(repo);
  var serverList = [];
  if (repo === "WaspServer") {
    try {
      var temp = execSync('pm2 jlist');
      var json = JSON.parse(temp);
      for (var ser of json) {
        serverList.push(ser.name);
      }
      repoNotifier("Stopping all servers");
      execSync('pm2 stop all');
    } catch (err) {}
  } else if (repo !== 'WebhookServer') {
    serverList.push(repo.toLowerCase());
    try {
      repoNotifier("Stopping " + repo);
      execSync('pm2 stop ' + repo.toLowerCase());
    } catch (err) {}
  }

  try {
    repoNotifier("Copying private to temp");
    execSync('cp -R ' + privateDir(repo) + ' ' + tempDir(repo));
  } catch (err) {}
  try {
    repoNotifier("Removing old Server");
    execSync('rm -rf ' + repoDir(repo));
  } catch (err) {}

  repoNotifier("Cloning new server");
  execSync('git clone git@github.com:Saii626/' + repo + '.git', {
    cwd: serverDir
  });
  execSync('git checkout ' + branch, {
    cwd: repoDir(repo)
  });

  repoNotifier("Installing server dependencies");
  execSync('npm install', {
    cwd: repoDir(repo)
  });
  try {
    repoNotifier("Installing public dependencies")
    execSync('npm install', {
      cwd: publicDir(repo)
    });
  } catch (err) {}
  try {
    repoNotifier("Copying temp to private")
    execSync('cp -R ' + tempDir(repo) + ' ' + privateDir(repo));
  } catch (err) {}

  if (repo === 'WebhookServer') {
    execSync('pm2 save');
    repoNotifier("Restarting WebHookServer");
    execSync('pm2 restart webhookserver');
  } else {
    repoNotifier("Starting all servers");
    execSync('pm2 start all');
    execSync('pm2 save');
  }

  repoNotifier("Update Complete");
}


function notifyZuk(repo) {
  return (msg) => {
    let postData = {
      title: "WebHookServer updating " + repo,
      body: msg
    }
    request.post('https://saikat.app/notify/zuk', {
      form: postData
    }, function(err, res, body) {
      if (err) {
        console.error(err);
      }
    });
  }
}

module.exports.update = update;