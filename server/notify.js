const express = require('express');
const jsonfile = require('jsonfile');
const path = require('path');
const admin = require('firebase-admin');
const router = express.Router();
const serviceAccount = require('./private/waspserver-firebase.json');

admin.initializeApp( {
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://waspserver-saii.firebaseio.com"
});

const tokens = path.resolve(__dirname, "./private/tokens.json");

router.post('/register', function(req, res) {
	jsonfile.readFile(tokens, function(err, obj) {
		const source = req.body.source;
		const token = req.body.token;

		console.log(req.body);
		var temp = null;
		if (obj.length > 0) {
			for (var item in obj) {
				if (obj[item].source === source) {
					temp = obj[item];
					break;
				}
			}
		}
		if (temp) {
			temp.token = token;
		} else {
			obj.push({source: source,
								token: token});
		}

		jsonfile.writeFile(tokens, obj, function(err) {
			if (err) {
				console.trace(err);
			}
		});
	});
});

router.post('/*', function(req, res) {
	const target = decodeURI(req.url.substring(1));

	jsonfile.readFile(tokens, function(err, obj) {
		var token;
		for (var item of obj) {
			if (item.source === target) {
				token = item.token;
			}
		}

		const message = {
  		notification: {
    		title: req.body.title,
    		body: req.body.body
  		},
  		token: token
		};

		admin.messaging().send(message)
  	.then((response) => {
			res.send("Success");
  	})
  	.catch((error) => {
			res.status(500);
			res.send({error: error})
  	});
	});
})

module.exports = router;
