'use babel';
import {CompositeDisposable, Emitter} from 'atom';
import MarmaAppApi from './marma-appapi';

export default class MarmaAtomView {
	constructor(serializedState) {
		this.subscriptions = new CompositeDisposable();
		this.subscriptions.add(
			atom.config.onDidChange('marma-atom.visible', ({newValue, oldValue}) => {
				if (newValue) {
					this.show();
				} else {
					this.hide();
				}
			})
		);
		this.subscriptions.add(
			atom.config.onDidChange('marma-atom.showMetrics', ({newValue, oldValue}) => {
				if (newValue) {
					this.showMetrics();
				} else {
					this.hideMetrics();
				}
			})
		);
		if (atom.config.get('marma-atom.visible')) {
			this.show();
		}
	}

	serialize() {}

	show() {
		var self = this;
		this.refreshServers = this.refreshServers.bind(this);
		this.run = this.run.bind(this);
		this.runWithReturn = this.runWithReturn.bind(this);
		this.streamLogs = this.streamLogs.bind(this);
		this.openConfig = this.openConfig.bind(this);

		this.element1 = document.createElement('div');
		this.element1.classList.add('marma-atom');

		const classNames = ['btn', 'btn-default', 'marma-atom-btn'];
		this.configButton = document.createElement('button');
		this.configButton.classList.add(...classNames);
		this.configButton.innerHTML = '<i class="fa fa-cog"></i>';
		this.configButton.addEventListener('click', this.openConfig);
		this.element1.appendChild(this.configButton);

		var title = document.createElement('span');
		title.classList.add('title');
		title.innerHTML = 'mARMA-ATOM';
		this.element1.appendChild(title);

		this.serversDropdown = document.createElement('select');
		this.serversDropdown.classList.add(...['form-control']);
		this.element1.appendChild(this.serversDropdown);

		var option = document.createElement('option');
		option.innerHTML = 'Select Server';
		option.selected = 'selected';
		option.value = 0;
		this.serversDropdown.appendChild(option);

		this.refreshButton = document.createElement('button');
		this.refreshButton.classList.add(...classNames);
		this.refreshButton.innerHTML = '<i class="fa fa-refresh"></i> Refresh';
		this.refreshButton.addEventListener('click', this.refreshServers);
		this.element1.appendChild(this.refreshButton);

		this.streamLogsButton = document.createElement('button');
		this.streamLogsButton.classList.add(...classNames);
		this.streamLogsButton.innerHTML = '<i class="fa fa-file-text-o"></i> Stream Logs';
		this.streamLogsButton.addEventListener('click', this.streamLogs);
		this.element1.appendChild(this.streamLogsButton);

		this.runButton = document.createElement('button');
		this.runButton.classList.add(...classNames);
		this.runButton.innerHTML = '<i class="fa fa-play"></i> Run';
		this.runButton.addEventListener('click', this.run);
		this.element1.appendChild(this.runButton);

		this.runWithReturnButton = document.createElement('button');
		this.runWithReturnButton.classList.add(...classNames);
		this.runWithReturnButton.innerHTML = '<i class="fa fa-play"></i> Run With Return';
		this.runWithReturnButton.addEventListener('click', this.runWithReturn);
		this.element1.appendChild(this.runWithReturnButton);

		this.statusText = document.createElement('span');
		this.statusText.classList.add('status');
		this.statusText.innerHTML = '';
		this.element1.appendChild(this.statusText);

		this.panel1 = atom.workspace.addHeaderPanel({item: this.element1});

		this.reloadServers();
		if (!atom.config.get('marma-atom.showMetrics')) return;
		this.showMetrics();
	}

	showMetrics() {
		var self = this;
		this.element2 = document.createElement('div');
		this.element2.classList.add('marma-atom-right');

		this.metricsText = document.createElement('span');
		this.metricsText.classList.add('metrics');
		this.metricsText.innerHTML = '';
		this.element2.appendChild(this.metricsText);

		this.panel2 = atom.workspace.addRightPanel({item: this.element2});
		this.metricTimeout = setTimeout(function () {self.updateMetrics()}, 1000);
	}

	hide() {
		if (this.panel1) {
			this.panel1.destroy();
			this.panel1 = null;
		}
		if (this.element1) {
			if (this.element1.parentNode) {
				this.element1.parentNode.removeChild(this.element1);
			}
			this.configButton.removeEventListener('click', this.openConfig);
			this.configButton = null;
			this.refreshButton.removeEventListener('click', this.connect);
			this.refreshButton = null;
			this.runButton.removeEventListener('click', this.connect);
			this.runButton = null;
			this.runWithReturnButton.removeEventListener('click', this.connect);
			this.runWithReturnButton = null;
			this.streamLogsButton.removeEventListener('click', this.streamLogs);
			this.streamLogsButton = null;
			this.serversDropdown = null;
			this.element1.remove();
			this.element1 = null;
		}
		this.hideMetrics();
	}

	hideMetrics() {
		if (this.metricTimeout)
			clearTimeout(this.metricTimeout);
		if (this.panel2) {
			this.panel2.destroy();
			this.panel2 = null;
		}
		if (this.element2) {
			if (this.element2.parentNode) {
				this.element2.parentNode.removeChild(this.element2);
			}
			this.element2.remove();
			this.element2 = null;
		}
	}

	destroy() {
		this.hide();
		this.subscriptions.dispose();
		this.subscriptions = null;
	}

	refreshServers(e) {
    	e.preventDefault();
    	e.stopPropagation();
    	this.reloadServers();
	}

	reloadServers() {
		var self = this;
		this.marmaAppApi = new MarmaAppApi(atom.config.get('marma-atom.apiToken'), atom.config.get('marma-atom.apiSecret'));
		this.marmaAppApi.servers(function (err, servers) {
			if (err)
				return atom.notifications.addError("mARMA-Atom: " + err);
			if (!Array.isArray(servers))
				return;
			self.serversDropdown.innerHTML = '';
			var option = document.createElement('option');
			option.innerHTML = 'Select Server';
			option.value = 0;
			option.selected = 'selected';
			self.serversDropdown.appendChild(option);
			servers.forEach(function (server) {
				var option = document.createElement('option');
				option.innerHTML = server.name;
				option.value = server.id;
				self.serversDropdown.appendChild(option);
			});
			atom.notifications.addSuccess("Connected to mARMA");
		});
	}

	run(e) {
    	e.preventDefault();
    	e.stopPropagation();
    	this._run(false);
	}

	runWithReturn(e) {
    	e.preventDefault();
    	e.stopPropagation();
    	this._run(true);
	}

	_run(withreturn) {
		var selectedServer = this.serversDropdown.options[this.serversDropdown.selectedIndex].value;
		if (selectedServer == 0) {
			atom.notifications.addWarning("No server has been selected");
			return;
		}
		var code = this.getCurrentTabText();
		if (!code || code == '')
		{
			atom.notifications.addWarning("File is either empty or invalid");
			return;
		}
		this.marmaAppApi.remoteexec(selectedServer, code, withreturn, function (err, result) {
			if (err) {
				return atom.notifications.addError("Run error: " + err);
			}
			if (withreturn) {
				atom.notifications.addSuccess("Code completed");
				atom.workspace.open().then(function (editor) {
					editor.setText(result);
				});
			} else {
				atom.notifications.addSuccess(result);
			}
		});
	}

	timeStamp(now) {
		var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];
		var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];
		var suffix = ( time[0] < 12 ) ? "AM" : "PM";
		time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;
		time[0] = time[0] || 12;
		for ( var i = 1; i < 3; i++ ) {
			if ( time[i] < 10 ) {
				time[i] = "0" + time[i];
			}
		}
		return date.join("/") + " " + time.join(":") + " " + suffix;
	}

	streamLogs(e) {
		var self = this;
    	e.preventDefault();
    	e.stopPropagation();
		var selectedServer = this.serversDropdown.options[this.serversDropdown.selectedIndex].value;
		var selectedServerName = this.serversDropdown.options[this.serversDropdown.selectedIndex].innerHTML;
		if (selectedServer == 0) {
			atom.notifications.addWarning("No server has been selected");
			return;
		}
		var loghashes = [];
		atom.workspace.open().then(function (editor) {
			var logTimeout;
			function getLogs() {
				self.marmaAppApi.logs(selectedServer, function (err, results) {
					if (err || !results || results.length == 0) {
						logTimeout = setTimeout(function () {}, 5000);
						return;
					}
					results.forEach(function (log) {
						if (loghashes.indexOf(log.hash) > -1)
							return;
						loghashes.push(log.hash);
						var message = (self.timeStamp(new Date(log.timestamp))) + ' [' + log.type + '] ' + log.log + '\n';
						editor.setText(editor.getText() + message);
					});
					editor.scrollToCursorPosition();
					logTimeout = setTimeout(function () {getLogs()}, 1000);
				});
			}
			editor.setText('Streaming logs for server: ' + selectedServerName + '\n');
			getLogs();
			editor.onDidDestroy(function () {
				clearTimeout(logTimeout);
			});
		});
	}

	updateMetrics() {
		var self = this;
		var selectedServer = this.serversDropdown.options[this.serversDropdown.selectedIndex].value;
		var selectedServerName = this.serversDropdown.options[this.serversDropdown.selectedIndex].innerHTML;
		if (selectedServer == 0) {
			this.metricsText.innerHTML = '';
			this.metricTimeout = setTimeout(function () {self.updateMetrics()}, 1000);
			return;
		}
		this.marmaAppApi.metrics(selectedServer, function (err, results) {
			if (err || !results) {
				self.metricsText.innerHTML = '';
				self.metricTimeout = setTimeout(function () {self.updateMetrics()}, 1000);
				return;
			}
			var output = ['<h3>' + selectedServerName + '</h3>', '<dl>'];
			Object.keys(results).forEach(function (key) {
				var val = results[key];
				output.push('<dt>' + key + '</dt> <dd>' + val + '</dd>');
			});
			output = output.join('\n');
			self.metricsText.innerHTML = output;
			self.metricTimeout = setTimeout(function () {self.updateMetrics()}, 1000);
		});
	}

	error(e) {
		console.log("error", e);
		atom.notifications.addError("mARMA-Atom: " + e);
	}

	getCurrentTabText() {
		var editor = atom.workspace.getActiveTextEditor();
		if (!editor)
			return false;
		return editor.getText();
	}

	openConfig(e) {
    	e.preventDefault();
    	e.stopPropagation();
    	atom.workspace.open("atom://config/packages/marma-atom");
	}
}
