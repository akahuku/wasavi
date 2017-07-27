'use strict';

const assert = require('assert');

require('../chrome/frontend/init.js');
require('../chrome/frontend/utils.js');
require('../chrome/frontend/qeema.js');
require('../chrome/frontend/classes.js');

describe('class MapManager', () => {
	function createMapManager () {
		const mm = new Wasavi.MapManager({
			keyManager: qeema,
			config: {
				vars: {
					remap: true
				}
			}
		});
		mm.maps.command.register('a', 'gg', true);
		mm.maps.command.register('b', 'B', true);
		mm.maps.command.register('bb', '^', true);
		mm.maps.command.register('h', 'l', true);
		mm.maps.command.register('Q', '1G', true);
		mm.maps.command.register('QQ', 'G', true);
		return mm;
	}

	it('should return an unmapped key as it is', done => {
		const mm = createMapManager();

		// z -> z
		const e1 = qeema.parseKeyDesc('z').prop;
		mm.process('command', e1)
		.then(e => {
			assert.equal(e.code, e1.code);
			assert.equal(mm.isWaiting, false);
			done();
		});
	});

	it('should resolve unique mache', done => {
		const mm = createMapManager();
		mm.onexpand = sequences => {
			assert.equal(sequences.length, 1);
			assert.equal(sequences[0].char, 'l');
			assert.equal(mm.isWaiting, false);
			done();
		};

		// h -> l
		const e1 = qeema.parseKeyDesc('h').prop;
		mm.process('command', e1)
		.then(e => {
			assert.equal(e, undefined);
		});
	});

	it('should resolve ambiguous matches by timeout', done => {
		const mm = createMapManager();
		mm.onexpand = sequences => {
			assert.equal(sequences.length, 1);
			assert.equal(sequences[0].char, 'B');
			assert.equal(mm.isWaiting, false);
			done();
		};

		// b -> B
		const e1 = qeema.parseKeyDesc('b').prop;
		mm.process('command', e1)
		.then(e => {
			assert.equal(e, undefined);
		});
	});

	it('should resolve ambiguous matches by subsequent input', done => {
		const mm = createMapManager();
		mm.onexpand = sequences => {
			assert.equal(sequences.length, 1);
			assert.equal(sequences[0].char, '^');
			assert.equal(mm.isWaiting, false);
			done();
		};

		// bb -> ^
		const e1 = qeema.parseKeyDesc('b').prop;
		mm.process('command', e1)
		.then(e => {
			assert.equal(e, undefined);
			return mm.process('command', e1);
		})
		.then(e => {
			assert.equal(e, undefined);
		});
	});

	it('should resolve ambiguous matches by subsequent input in different mode', done => {
		const mm = createMapManager();
		mm.onexpand = sequences => {
			assert.equal(sequences.length, 2);
			assert.equal(sequences[0].char, 'B');
			assert.equal(sequences[0].overrideMap, 'command');
			assert.equal(sequences[1].char, 'b');
			assert.equal(sequences[1].overrideMap, 'edit');
			assert.equal(mm.isWaiting, false);
			done();
		};

		// <command>b<edit>b -> <command>B<edit>b
		const e1 = qeema.parseKeyDesc('b').prop;
		mm.process('command', e1)
		.then(e => {
			assert.equal(e, undefined);
			return mm.process('edit', e1);
		})
		.then(e => {
			assert.equal(e, undefined);
		});
	});

	it('should resolve halfway input by timeout #1', done => {
		const mm = createMapManager();
		mm.maps.command.remove('b', 'bb');
		mm.maps.command.register('bbb', 'B');
		mm.maps.command.register('bbbb', '^');
		mm.onexpand = sequences => {
			assert.equal(sequences.length, 1);
			assert.equal(sequences[0].char, 'b');
			assert.equal(sequences[0].isNoremap, true);
			assert.equal(mm.isWaiting, false);
			done();
		};

		// b -> b
		const e1 = qeema.parseKeyDesc('b').prop;
		mm.process('command', e1)
		.then(e => {
			assert.equal(e, undefined);
		});
	});

	it('should resolve halfway input by timeout #2', done => {
		const mm = createMapManager();
		mm.maps.command.remove('b', 'bb');
		mm.maps.command.register('bbb', 'B');
		mm.maps.command.register('bbbb', '^');
		mm.onexpand = sequences => {
			assert.equal(sequences.length, 2);
			assert.equal(sequences[0].char, 'b');
			assert.equal(sequences[0].isNoremap, true);
			assert.equal(sequences[1].char, 'b');
			assert.equal(sequences[1].isNoremap, true);
			assert.equal(mm.isWaiting, false);
			done();
		};

		// bb -> bb
		const e1 = qeema.parseKeyDesc('b').prop;
		mm.process('command', e1)
		.then(e => {
			assert.equal(e, undefined);
			return mm.process('command', e1);
		})
		.then(e => {
			assert.equal(e, undefined);
		});
	});

	it('should resolve halfway input by unmapped key #1', done => {
		const mm = createMapManager();
		mm.maps.command.remove('b', 'bb');
		mm.maps.command.register('bbb', 'B');
		mm.maps.command.register('bbbb', '^');
		mm.onexpand = sequences => {
			assert.equal(sequences.length, 3, '#0');
			assert.equal(sequences[0].char, 'b', '#1');
			assert.equal(sequences[0].isNoremap, true, '#2');
			assert.equal(sequences[1].char, 'b', '#3');
			assert.equal(sequences[1].isNoremap, true, '#4');
			assert.equal(sequences[2].char, 'Z', '#5');
			assert.equal(sequences[2].isNoremap, true, '#6');
			assert.equal(mm.isWaiting, false);
			done();
		};

		// bbZ -> bbZ
		mm.process('command', qeema.parseKeyDesc('b').prop)
		.then(e => {
			assert.equal(e, undefined);
			return mm.process('command', qeema.parseKeyDesc('b').prop);
		})
		.then(e => {
			assert.equal(e, undefined);
			return mm.process('command', qeema.parseKeyDesc('Z').prop);
		})
		.then(e => {
			assert.equal(e, undefined);
		});
	});

	it('should resolve halfway input by unmapped key #2', done => {
		const mm = createMapManager();
		mm.onexpand = sequences => {
			assert.equal(sequences.length, 3);
			assert.equal(sequences[0].char, '1');
			assert.equal(sequences[1].char, 'G');
			assert.equal(sequences[2].char, 'j');
			done();
		};

		// Qj -> 1Gj
		mm.process('command', qeema.parseKeyDesc('Q').prop)
		.then(e => {
			assert.equal(e, undefined);
			return mm.process('command', qeema.parseKeyDesc('j').prop);
		})
		.then(e => {
			assert.equal(e, undefined);
		});
	});

	after(function (done) {
		this.timeout(1500);
		setTimeout(done, 1000);
	});
});
