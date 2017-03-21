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
					next(err, JSON.parse(body));
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
						var data = JSON.parse(body);
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