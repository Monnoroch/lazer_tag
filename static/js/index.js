(function() {

var levels = {
	1: {
		lasers: [{
			color: 0xFF00FF,
			position: {x: 40, y: 200},
			direction: {x: 1, y: 0},
			enabled: true,
		}],
		targets: [{
			color: 0x00FFFF,
			position: {x: 400, y: 300/2},
		}],
		prismas: [{
			color: 0x00FF00,
			points: [
				{x: 0, y: -20, color: 0x0000FF},
				{x: -30, y: 20},
				{x: 30, y: 0},
			],
			position: {x: 640/2, y: 480/2},
		}, {
			color: 0x00FF00,
			points: [
				{x: 0, y: -20, color: 0x0000FF},
				{x: -30, y: 20},
				{x: 30, y: 0},
			],
			position: {x: 100, y: 100},
		}],
	}
};

function createLaser(data, stage, world) {
	var graphics = new PIXI.Graphics();
	graphics.position = new PIXI.Point(data.position.x, data.position.y);
	graphics.lineStyle(3, data.color, 1);
	graphics.beginFill(data.color, 0.5);

	var vec = Physics.vector(data.direction.x, data.direction.y).normalize();
	var p1 = vec.clone().mult(35);
	var p2 = vec.clone().rotate(150*Math.PI/180).normalize().mult(25);
	var p3 = vec.clone().rotate(210*Math.PI/180).normalize().mult(25);

	graphics.moveTo(p1.x, p1.y);
	graphics.lineTo(p2.x, p2.y);
	graphics.lineTo(p3.x, p3.y);
	graphics.lineTo(p1.x, p1.y);

	graphics.endFill();

	graphics.body = Physics.body('convex-polygon', {
		x: data.position.x,
		y: data.position.y,
		vertices: [p1, p2, p3],
	});
	graphics.body.treatment = "static";
	world.add(graphics.body);

	stage.addChild(graphics);
	data.lazer = graphics;
}

function createTarget(data, stage, world) {
	var radius = 20;
	var graphics = new PIXI.Graphics();
	graphics.position = new PIXI.Point(data.position.x, data.position.y);
	graphics.lineStyle(3, data.color, 1);
	graphics.beginFill(data.color, 0.5);
	graphics.drawCircle(0, 0, radius);
	graphics.endFill();
	graphics.shape = new PIXI.Circle(0, 0, radius);

	graphics.body = Physics.body('circle', {
		x: data.position.x,
		y: data.position.y,
		radius: radius,
	});
	graphics.body.treatment = "static";
	world.add(graphics.body);

	stage.addChild(graphics);
	data.target = graphics;
}

function createPoly(data) {
	// create a new graphics object
	var graphics = new PIXI.Graphics();

	graphics.lineStyle(3, data.color, 0);
	graphics.beginFill(data.color, 0.5);

	// draw a triangle using lines
	graphics.moveTo(data.points[0].x, data.points[0].y);
	for (var i = 1; i < data.points.length; ++i) {
		graphics.lineTo(data.points[i].x, data.points[i].y);
	}
	graphics.lineTo(data.points[0].x, data.points[0].y);

	// end the fill
	graphics.endFill();

	for (var i = 0; i < data.points.length; ++i) {
		graphics.lineStyle(3, data.points[i].color || data.color, 0.8);
		graphics.moveTo(data.points[i].x, data.points[i].y);
		var next = (i == data.points.length - 1) ? 0 : i + 1;
		graphics.lineTo(data.points[next].x, data.points[next].y);
	}

	return graphics;
}

function createPrismaGraphics(data, world) {
	var points = [];
	for (var i = 0; i < data.points.length; ++i) {
		points.push(data.points[i].x);
		points.push(data.points[i].y);
	}

	var graphics = createPoly(data);
	graphics.interactive = true;
	graphics.hitArea = new PIXI.Polygon(points);
	graphics.shape = graphics.hitArea.clone();

	graphics.mouseover = function(eventData) {
		this.parent.mouseIn = true;
		if (this.parent.rotate) {
			return;
		}
		enableDots(this.parent);
		world.interactive.options.type = "translate";
	};

	graphics.mouseout = function(eventData) {
		this.parent.mouseIn = false;
		if (this.parent.rotate) {
			return;
		}
		disableDots(this.parent);
	};

	return graphics;
}

function disableDots(displayObj) {
	for (var i = 0; i < displayObj.points.length; ++i) {
		displayObj.points[i].graphics.visible = false;
	}
}

function enableDots(displayObj) {
	for (var i = 0; i < displayObj.points.length; ++i) {
		displayObj.points[i].graphics.visible = true;
	}
}

function createPrisma(data, stage, world) {
	var displayObj = new PIXI.DisplayObjectContainer();
	displayObj.position = new PIXI.Point(data.position.x, data.position.y);
	displayObj.graphics = createPrismaGraphics(data, world);
	displayObj.addChild(displayObj.graphics);
	displayObj.points = [];
	displayObj.pointsInter = [];

	displayObj.body = Physics.body('convex-polygon', {
		x: data.position.x,
		y: data.position.y,
		vertices: data.points,
	});
	world.add(displayObj.body);
	world.interactive._targets.push(displayObj.body);

	for (var i = 0; i < data.points.length; ++i) {
		var pt = new PIXI.Graphics();
		pt.visible = false;
		pt.lineStyle(3, data.color, 1);
		pt.beginFill(data.color, 0.5);
		pt.drawCircle(0, 0, 5);
		pt.endFill();

		var ptInter = new PIXI.DisplayObjectContainer(); // TODO: DisplayObject
		ptInter.position = new PIXI.Point(data.points[i].x, data.points[i].y);
		ptInter.interactive = true;
		ptInter.hitArea = new PIXI.Circle(0, 0, 5);
		ptInter.graphics = pt;
		ptInter.addChild(pt);

		ptInter.mouseover = function(eventData) {
			this.mouseIn = true;
			this.graphics.visible = true;
			world.interactive.options.type = "rotate";
		};

		ptInter.mouseout = function(eventData) {
			this.mouseIn = false;
			if (!this.rotate) {
				this.graphics.visible = false;
			}
		};

		ptInter.mousedown = function(eventData) {
			displayObj.rotate = true;
			this.rotate = true;
			world.interactive.grabBody(eventData.global, displayObj.body);
		};

		ptInter.mouseup = function(eventData) {
			displayObj.rotate = false;
			this.rotate = false;
			if (!this.mouseIn) {
				this.graphics.visible = false;
			}
		};

		ptInter.mouseupoutside = function(eventData) {
			displayObj.rotate = false;
			this.rotate = false;
			if (!this.mouseIn) {
				this.graphics.visible = false;
			}
			if(displayObj.mouseIn) {
				enableDots(displayObj);
			}
		};

		ptInter.mousemove = function(eventData) {
			if (this.mouseIn) { // TODO: remove this hack
				this.graphics.visible = true;
				world.interactive.options.type = "rotate";
			}
		};

		displayObj.points.push(ptInter);
		displayObj.addChild(ptInter);
	}

	stage.addChild(displayObj);

	data.polygon = displayObj;
}

function loadLevel(data, stage, world) {
	for (var i = 0; i < data.lasers.length; ++i) {
		createLaser(data.lasers[i], stage, world);
	}
	for (var i = 0; i < data.targets.length; ++i) {
		createTarget(data.targets[i], stage, world);
	}
	for (var i = 0; i < data.prismas.length; ++i) {
		createPrisma(data.prismas[i], stage, world);
	}
}

$(document).ready(function() {
    $("#start-game").click(function() {
		$("#start-game").hide();
		$("#game-scene").show();
		runGame();
	});
});

function runGame() {
	Physics(function(world) {
		Physics.util.ticker.on(function(time, dt) {
			world.step(time);
		});

		Physics.util.ticker.start();

		world.add(Physics.behavior('body-impulse-response'));

		world.add(Physics.behavior('edge-collision-detection', {
			aabb: Physics.aabb(0, 0, 640, 480),
			restitution: 0.3,
			cof: 0.7,
		}));

		world.add(Physics.behavior('body-collision-detection'));
		world.add(Physics.behavior('sweep-prune'));

		world.interactive = Physics.behavior('interactive', {
			el: 'game-scene',
			type: "translate",
			inertion: false,
			specialTreatment: "dynamic",
		});
		world.interactive.applyTo([]);
		world.add(world.interactive);

		var stage = new PIXI.Stage(0x000000, true);
	    var renderer = new PIXI.CanvasRenderer(640, 480, document.getElementById("game-scene"));

	    world.on('step', function() {
	    	for (var i = 0; i < levels[1].prismas.length; ++i) {
	    		var prisma = levels[1].prismas[i].polygon;
	    		prisma.position.x = prisma.body.state.pos.x;
	    		prisma.position.y = prisma.body.state.pos.y;
	    		prisma.rotation = prisma.body.state.angular.pos;
	    	}
	    	for (var i = 0; i < levels[1].targets.length; ++i) {
	    		var target = levels[1].targets[i].target;
	    		target.position.x = target.body.state.pos.x;
	    		target.position.y = target.body.state.pos.y;
	    		target.rotation = target.body.state.angular.pos;
	    	}
	    	for (var i = 0; i < levels[1].lasers.length; ++i) {
	    		var lazer = levels[1].lasers[i].lazer;
	    		lazer.position.x = lazer.body.state.pos.x;
	    		lazer.position.y = lazer.body.state.pos.y;
	    		lazer.rotation = lazer.body.state.angular.pos;
	    	}
			renderer.render(stage);
		});

		loadLevel(levels[1], stage, world);

		// world.add(Physics.behavior('constant-acceleration'));
	});
}

})();
