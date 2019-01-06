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
  if (repo === "WaspServer") {
    notify("Stopping all servers");
    exec('pm2 stop all', (err, stdOut, stdErr) => {
      if (err) {
        console.error(err);
      }
      copyPrivateToTemp(repo, branch)
    })
  } else if (repo !== 'WebhookServer') {
    try {
      notify("Stopping " + repo);
      exec('pm2 stop ' + repo.toLowerCase(), (err, stdOut, stdErr) => {
        if (err) {
          console.error(err);
        }
        copyPrivateToTemp(repo, branch)
      });
    } catch (err) {
      console.error(err);
      copyPrivateToTemp(repo, branch)
    }
  }
}

function copyPrivateToTemp(repo, branch) {
  try {
    notify("Copying private to temp");
    exec('cp -R ' + privateDir(repo) + ' ' + tempDir(repo), (err, stdOut, stdErr) => {
      if (err) {
        console.error(err);
      }
      removeOldServer(repo, branch);
    });
  } catch (err) {
    console.error(err);
    removeOldServer(repo, branch);
  }
}

function removeOldServer(repo, branch) {
  try {
    notify("Removing old Server");
    exec('rm -rf ' + repoDir(repo), (err, stdOut, stdErr) => {
      if (err) {
        console.error(err);
        notify("Unable to remove ");
        return;
      }
      getNewServer(repo, branch);
    });
  } catch (err) {
    console.error(err);
  }
}

function getNewServer(repo, branch) {
  notify("Cloning new server");
  exec('git clone git@github.com:Saii626/' + repo + '.git', {
    cwd: serverDir
  }, (err, stdOut, stdErr) => {
    if (err) {
      return;
    }

    exec('git checkout ' + branch, {
      cwd: repoDir(repo)
    }, (err, stdOut, stdErr) => {
      if (err) {
        console.err(err);
      }
      installServerDependencies(repo, branch);
    })
  });
}

function installServerDependencies(repo, branch) {
  notify("Installing server dependencies");
  exec('npm install', {
    cwd: repoDir(repo)
  }, (err, stdOut, stdErr) => {
    if (err) {
      notify("Server dependency installation failed");
      return;
    }
    installClientDependencies(repo, branch);
  });
}

function installClientDependencies(repo, branch) {
  try {
    notify("Installing public dependencies")
    exec('npm install', {
      cwd: publicDir(repo)
    }, (err, stdOut, stdErr) => {
      if (err) {
        console.error(err);
      }
      copyTempToPrivate(repo, branch);
    });
  } catch (err) {
    copyTempToPrivate(repo, branch);
  }
}

function copyTempToPrivate(repo, branch) {
  try {
    notify("Copying temp to private")
    exec('cp -R ' + tempDir(repo) + ' ' + privateDir(repo), (err, stdOut, stdErr) => {
      if (err) {
        console.error(err);
      }
      startNewServer(repo, branch);
    });
  } catch (err) {
    startNewServer(repo, branch);
  }
}

function startNewServer(repo, branch) {
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

      exec('pm2 save', (err, stdOut, stdErr) => {
        if (err) {
          console.error(err);
        }
        notify("Server updated");
      })
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

function notify(msg) {
  let postData = {
    title: "WebHookServer",
    body: msg
  }
  request.post({
    url: 'http://localhost:8020/zuk',
    form: postData
  }, function(err, res, body) {
    if (err) {
      console.error(err);
    }
  });
  request.post({
    url: 'http://localhost:8020/thinkpad',
    form: postData
  }, function(err, res, body) {
    if (err) {
      console.error(err);
    }
  });
}

module.exports.update = update;