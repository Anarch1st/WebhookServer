const {
  exec
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

  let notify = getNotifyFor(repo);
  if (repo === "WaspServer") {
    notify("Stopping all servers");
    exec('pm2 stop all', (err, stdOut, stdErr) => {
      if (err) {
        console.error(err);
      }
      copyPrivateToTemp(repo, branch, notify)
    })
  } else if (repo !== 'WebhookServer') {
    notify("Stopping " + repo);
    exec('pm2 stop ' + repo.toLowerCase(), (err, stdOut, stdErr) => {
      if (err) {
        console.error(err);
      }
      copyPrivateToTemp(repo, branch, notify)
    });
  } else {
    removeOldServer(repo, branch, notify);
  }
}

function copyPrivateToTemp(repo, branch, notify) {
  notify("Copying private to temp");
  exec('cp -RT ' + privateDir(repo) + ' ' + tempDir(repo), (err, stdOut, stdErr) => {
    if (err) {
      console.error(err);
    }
    removeOldServer(repo, branch, notify);
  });
}

function removeOldServer(repo, branch, notify) {
  notify("Removing old Server");
  exec('rm -rf ' + repoDir(repo), (err, stdOut, stdErr) => {
    if (err) {
      console.error(err);
      notify("Unable to remove ");
      return;
    }
    getNewServer(repo, branch, notify);
  });
}

function getNewServer(repo, branch, notify) {
  notify("Cloning new server");
  exec('git clone git@github.com:Saii626/' + repo + '.git', {
    cwd: serverDir
  }, (err, stdOut, stdErr) => {
    if (err) {
      console.error(err);
      return;
    }

    exec('git checkout ' + branch, {
      cwd: repoDir(repo)
    }, (err, stdOut, stdErr) => {
      if (err) {
        console.err(err);
      }
      installServerDependencies(repo, branch, notify);
    })
  });
}

function installServerDependencies(repo, branch, notify) {
  notify("Installing server dependencies");
  exec('npm install', {
    cwd: repoDir(repo)
  }, (err, stdOut, stdErr) => {
    if (err) {
      notify("Server dependency installation failed");
      return;
    }
    installClientDependencies(repo, branch, notify);
  });
}

function installClientDependencies(repo, branch, notify) {
  notify("Installing public dependencies")
  exec('npm install', {
    cwd: publicDir(repo)
  }, (err, stdOut, stdErr) => {
    if (err) {
      console.error(err);
    }
    copyTempToPrivate(repo, branch, notify);
  });
}

function copyTempToPrivate(repo, branch, notify) {
  notify("Copying temp to private")
  exec('cp -RT ' + tempDir(repo) + ' ' + privateDir(repo), (err, stdOut, stdErr) => {
    if (err) {
      console.error(err);
    }
    startNewServer(repo, branch, notify);
  });
}

function startNewServer(repo, branch, notify) {
  notify("Starting servers and saving config");
  if (repo === 'WebhookServer') {
    exec('pm2 save', (err, stdOut, stdErr) => {
      if (err) {
        console.error(err);
      }

      exec('pm2 restart webhookserver', (err, stdOut, stdErr) => {
        if (err) {
          notify("Unable to start WebhookServer")
          console.error(err);
          return;
        }
        notify("Server updated");
      });
    });
  } else {
    exec('pm2 start all', (err, stdOut, stdErr) => {
      if (err) {
        notify("Unable to start servers")
      }
      exec('pm2 start ' + app(repo), (err, stdOut, stdErr) => {
        if (err) {
          notify("Unable to start " + repo);
        }

        exec('pm2 save', (err, stdOut, stdErr) => {
          if (err) {
            console.error(err);
          }
          notify("Server updated");
        });
      });
    });
  }

}

function execute(cmd, options, cb, args) {
  try {
    execSync(cmd, options, (err, stdOut, stdErr) => {
      if (err) {
        console.error(err);
      }
    });
  } catch (err) {
    console.error(err);
  }
}

function getNotifyFor(repo) {
  return (msg) => {
    let postData = {
      title: "WebHookServer: " + repo,
      body: msg
    }
    request.post({
      url: 'http://localhost:8020/zuk',
      json: postData
    }, function(err, res, body) {
      if (err) {
        console.error(err);
      }
    });
    request.post({
      url: 'http://localhost:8020/thinkpad',
      json: postData
    }, function(err, res, body) {
      if (err) {
        console.error(err);
      }
    });
  }
}

module.exports.update = update;