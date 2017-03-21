'use babel';

import request from 'request';
import MarmaJobs from './marma-jobs';

export default class MarmaAppApi {
	constructor(token, secret) {
		this.token = token;
		this.secret = secret;
		this.servers = {};
		this.baseurl = atom.config.get('marma-atom.endpoint');
	}

	servers(complete) {
		request.post(this.baseurl + '/appapi/servers.json', {
			form: {
				token: this.token,
				secret: this.secret
			}
		}, function (err, res, body) {
			if (err || res.statusCode != 200)
				return complete('Invalid token/secret');
			try {
				var data = JSON.parse(body);
				self.servers = {};
				data.forEach(function (server) {
					self.servers[server.id] = server;
				});
				console.log(self.servers);
				complete(err, data);
			} catch (e) {
				complete(e.Message);
			}
		});
	}

	metrics(id, complete) {
		request.post(this.baseurl + '/appapi/livemetrics/' + id + '.json', {
			form: {
				token: this.token,
				secret: this.secret
			}
		}, function (err, res, body) {
			if (err || res.statusCode != 200)
				return complete();
			try {
				complete(err, JSON.parse(body));
			} catch (e) {
				complete();
			}
		});
	}

	logs(id, complete) {
		request.post(this.baseurl + '/appapi/livelogs/' + id + '.json', {
			form: {
				token: this.token,
				secret: this.secret
			}
		}, function (err, res, body) {
			if (err || res.statusCode != 200)
				return complete();
			try {
				complete(err, JSON.parse(body));
			} catch (e) {
				complete();
			}
		});
	}

	remoteexec(id, code, returnResults, complete) {
		if (!this.marmajobs)
			this.marmajobs = new MarmaJobs(this.baseurl, this.token, this.secret);
		this.marmajobs.run(id, (returnResults) ? 'reReturn' : 're', '[{' + code + '},[]]', complete);
	}
};