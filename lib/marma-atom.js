'use babel';

import MarmaAtomView from './marma-atom-view';
import { CompositeDisposable } from 'atom';
let toolBar = null;

export function activate (state) {
	console.log('marma-atom activate');
	toolBar = new MarmaAtomView();
}

export function deactivate () {
	console.log('marma-atom deactivate');
	toolBar.destroy();
	toolBar = null;
}

export const config = {
	visible: {
		type: 'boolean',
		default: true,
		order: 1
	},
	showMetrics: {
		title: 'Show Metric Panel',
		type: 'boolean',
		default: true,
		order: 2
	},
	apiToken: {
		title: 'mARMA API Token',
		description: 'Get an API Token/Secret from here: https://cp.marma.io/profile',
		type: 'string',
		default: '',
		order: 3
	},
	apiSecret: {
		title: 'mARMA API Secret',
		description: 'Get an API Token/Secret from here: https://cp.marma.io/profile',
		type: 'string',
		default: '',
		order: 4
	},
	endpoint: {
		title: 'mARMA Endpoint',
		description: 'Don\'t change this unless you know what you are doing',
		type: 'string',
		default: 'https://cp.marma.io',
		order: 5
	}
};