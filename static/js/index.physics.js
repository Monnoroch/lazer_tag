(function() {

var levels = {
	1: {
		lasers: [{
			color: 0x00FFFF,
			position: {x: 400/2, y: 300/2},
			direction: {x: 1, y: 0},
			enabled: true,
		}],
		targets: [{
			color: 0x00FFFF,
			position: {x: 400/2, y: 300/2},
		}],
		prismas: [{
			color: 0x00FF00,
			points: [
				{x: 0, y: -20, color: 0x0000FF},
				{x: -30, y: 20},
				{x: 30, y: 0},
			],
			position: {x: 640/2, y: 480/2},
		}],
	}
};

$(document).ready(function() {
    $("#start-game").click(function() {
		$("#start-game").hide();
		$("#game-scene").show();
		runGame();
	});
});

function runGame() {
	Physics(function(world) {
		var renderer = Physics.renderer('canvas', {
			el: 'game-scene', // id of the canvas element
			width: 640,
			height: 480
		});

		world.add(renderer);

		Physics.util.ticker.on(function(time, dt) {
			world.step(time);
		});

		Physics.util.ticker.start();

		world.on('step', function(){
			world.render();
		});

		var square = Physics.body('rectangle', {
			x: 250,
			y: 250,
			width: 50,
			height: 50,
			vx: 0.01,
		});
		world.add(square);

		world.add(Physics.body('convex-polygon', {
			x: 250,
			y: 50,
			vx: 0.05,
			vertices: [
				{x: 0, y: 80},
				{x: 60, y: 40},
				{x: 60, y: -40},
				{x: 0, y: -80},
			],
		}));

		world.add(Physics.body('convex-polygon', {
			x: 400,
			y: 200,
			vx: -0.02,
			vertices: [
				{x: 0, y: 80},
				{x: 80, y: 0},
				{x: 0, y: -80},
				{x: -30, y: -30},
				{x: -30, y: 30},
			],
		}));

		world.add(Physics.behavior('constant-acceleration'));
		world.add(Physics.behavior('body-impulse-response'));

		world.add(Physics.behavior('edge-collision-detection', {
			aabb: Physics.aabb(0, 0, 640, 480),
			restitution: 0.3,
			cof: 0.7,
		}));

		world.add(Physics.behavior('body-collision-detection'));
		world.add(Physics.behavior('sweep-prune'));

		var interactive = Physics.behavior('interactive', {
			el: 'game-scene',
			type: "translate",
			inertion: false,
		});
		world.add(interactive);
		interactive.applyTo([square]);

		world.on("interact:poke", function(pos) {
			// TODO: anchors only
			interactive.grabBody(pos, square);
			interactive.options.type = "rotate";
		});

		world.on("interact:release", function(pos) {
			interactive.options.type = "translate";
		});
	});
}

})();




