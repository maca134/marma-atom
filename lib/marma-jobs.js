'use babel';

import request from 'request';
import async from 'async';

export default class MarmaJobs {
	constructor(url, token, secret) {
		this.baseurl = url;
		this.token = token;
		this.secret = secret;
	}

	run(id, cmd, args, complete) {
		var self = this;
		async.waterfall([
			function (next) {
				request.post(self.baseurl + '/appapi/addjob/' + id + '.json', {
					form: {
						token: self.token,
						secret: self.secret,
						command: cmd,
						args: args
					}
				}, function (err, res, body) {
					if (err || res.statusCode != 200)
						return next('Could not add job. This is not available to free users.');
					try {
						next(err, JSON.parse(body));
					} catch (e) {
						next("Error parsing json");
					}
				});
			},
			function (data, next) {
				if (!data.hash)
					return next('no hash');
				function getResponse(hash, tries) {
				    tries = tries || 0;
				    tries++;
					request.post(self.baseurl + '/appapi/jobresponse/' + id + '/' + hash + '.json', {
						form: {
							token: self.token,
							secret: self.secret
						}
					}, function (err, res, body) {
						if (err || res.statusCode != 200)
							return next('Could not get job response. This is not available to free users.');
						var data;
						try {
							 data = JSON.parse(body);
						} catch (e) {
							return next("Error parsing json");
						}
						if (data.status == 2)
							return next(null, data.response);
				        if (tries > 10) {
				            return next('timeout');
				        } else {
				            setTimeout(function () {
				                getResponse(hash, tries);
				            }, 1000);
				        }
					});
				}
				getResponse(data.hash);
			}
		], complete);
	}
}