Array.prototype.clone = function() {
	return this.slice(0);
};

(function() {

var levels = {
	1: {
		lasers: [{
			color: 0x00FF00,
			position: {x: 100, y: 300},
			direction: {x: Math.sqrt(2)/2, y: -Math.sqrt(2)/2},
			strength: 0.8,
			enabled: true,
		},
		// {
		// 	color: 0xFF00FF,
		// 	position: {x: 500, y: 400},
		// 	direction: {x: -Math.sqrt(2)/2, y: -Math.sqrt(2)/2},
		// 	strength: 0.8,
		// 	enabled: true,
		// }
		],
		targets: [{
			color: 0x00FF00,
			position: {x: 400, y: 300/2},
			radius: 20,
		}],
		prismas: [{
			color: 0x00FF00,
			points: [
				{x: 0, y: -20, color: 0x0000FF},
				{x: -30, y: 20, opacity: 0.1},
				{x: 30, y: 0},
			],
			position: {x: 640/2, y: 480/2-30},
			opacity : 0.5,
			coeff: 1.58,
		}, {
			color: 0x00FF00,
			points: [
				{x: 0, y: -20, color: 0x0000FF},
				{x: -30, y: 20, opacity: 0.1},
				{x: 30, y: 0},
			],
			position: {x: 100, y: 100},
			opacity : 0,
			coeff: 1.58,
		}],
	}
};

function getColor(num) {
	return [0xFF0000, 0xFF8800, 0xFFFF00, 0x00FF00, 0x00FFFF, 0x0000FF, 0xFF00FF, 0xFFFFFF][num];
}

function getColorNum(color) {
	for (var i = 0; i < 8; ++i) {
		if (getColor(i) == color) {
			return i;
		}
	}
	return -1;
}

function getLazerSpectrum(color, strength) {
	var res = [0, 0, 0, 0, 0, 0, 0, 0];
	res[getColorNum(color)] = strength;
	return res;
}

function getLazerColorStrength(spectrum) {
	var s = spectrum;
	var res = [
		s[0] + s[1]*3.0/4 + s[2]/2 + s[6]/2 + s[7]/3,
		s[1] + s[0]/2 + s[2]/2 + s[3]/4 + s[7]/3,
		s[2] + s[0]/2 + s[1]/2 + s[3]/2 + s[7]/3,
		s[3] + s[1]*1.0/4 + s[2]/2 + s[4]/2 + s[7]/3,
		s[4] + s[3]/2 + s[5]/2 + s[7]/3,
		s[5] + s[4]/2 + s[6]/2 + s[7]/3,
		s[6] + s[0]/2 + s[5]/2 + s[7]/3,
		s[7] + s[0]/3 + s[1]/3 + s[2]/3 + s[3]/3 + s[4]/3 + s[5]/3 + s[6]/3,
	];

	var sum = 0;
	var max = 0, maxi;
	for (var i = 0; i < spectrum.length; ++i) {
		var val = spectrum[i];
		sum += val;
		if (val > max) {
			max = val;
			maxi = i;
		}
	}
	return {
		col: getColor(maxi),
		str: sum < 1e-4 ? 0 : res[maxi]/Math.max(sum, 1),
	}
}

function getLazerStrength(spectrum, col) {
	var s = spectrum;
	var res = [
		s[0] + s[1]*3.0/4 + s[2]/2 + s[6]/2 + s[7]/3,
		s[1] + s[0]/2 + s[2]/2 + s[3]/4 + s[7]/3,
		s[2] + s[0]/2 + s[1]/2 + s[3]/2 + s[7]/3,
		s[3] + s[1]*1.0/4 + s[2]/2 + s[4]/2 + s[7]/3,
		s[4] + s[3]/2 + s[5]/2 + s[7]/3,
		s[5] + s[4]/2 + s[6]/2 + s[7]/3,
		s[6] + s[0]/2 + s[5]/2 + s[7]/3,
		s[7] + s[0]/3 + s[1]/3 + s[2]/3 + s[3]/3 + s[4]/3 + s[5]/3 + s[6]/3,
	];

	var sum = 0;
	for (var i = 0; i < spectrum.length; ++i) {
		sum += spectrum[i];
	}

	return sum < 1e-4 ? 0 : res[getColorNum(col)]/Math.max(sum, 1);
}

function weakenBeam(spectrum, color, opacity) {
	var res = [];
	var num = getColorNum(color);
	for (var i = 0; i < spectrum.length; ++i) {
		if (i == num) {
			res.push(spectrum[i] * (1 - opacity));
		} else {
			res.push(spectrum[i] * (1 - (1 + opacity)/2));
		}
	}
	return res;
}

function splitBeam(spectrum, color, opacity) {
	// через белую стенку все проходит
	if (color == 0xFFFFFF) {
		if (getLazerColorStrength(spectrum).str < 0.01) {
			spectrum = null;
		}
		return [null, spectrum];
	}

	var num = getColorNum(color);

	var st = [0, 0, 0, 0, 0, 0, 0, 0];
	st[num] = spectrum[num];
	st[7] = spectrum[7];

	// если совсем не можем пройти, то все отразится
	if (getLazerColorStrength(st).str < 0.01) {
		return [spectrum, null];
	}

	var s1 = spectrum.clone();
	s1[num] *= opacity;
	s1[7] *= opacity;

	var s2 = [0, 0, 0, 0, 0, 0, 0, 0];
	s2[num] = (1 - opacity) * spectrum[num];
	s2[7] = (1 - opacity) * spectrum[7];

	var str1 = getLazerColorStrength(s1).str;
	var str2 = getLazerColorStrength(s2).str;

	if (str1 < 0.01) {
		s1 = null;
	}

	if (str2 < 0.01) {
		s2 = null;
	}

	return [s1, s2];
}

var minOpacity = 0.3;

// графическая прозрачность -> физическая прозрачность
function physicsOpacity(op) {
	if (op === undefined) {
		return physicsOpacity(1);
	}

	if (op <= minOpacity) {
		return 0;
	}

	return (op - minOpacity) / (1 - minOpacity);
}

// физическая прозрачность -> графическая прозрачность
function graphicsOpacity(op) {
	if (op === undefined) {
		return graphicsOpacity(1);
	}

	if (op <= 1e-8) {
		return minOpacity;
	}

	return op * (1 - minOpacity) + minOpacity;
}

var laserPointDist = 35;

function createLaser(data, stage, world) {
	var graphics = new PIXI.Graphics();
	graphics.position = new PIXI.Point(data.position.x, data.position.y);
	graphics.lineStyle(3, data.color, 1);
	graphics.beginFill(data.color, 0.5);

	var vec = Physics.vector(data.direction.x, data.direction.y).normalize();
	var p1 = vec.clone().mult(laserPointDist);
	var p2 = vec.clone().rotate(150*Math.PI/180).mult(25);
	var p3 = vec.clone().rotate(210*Math.PI/180).mult(25);

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
	var graphics = new PIXI.Graphics();
	graphics.position = new PIXI.Point(data.position.x, data.position.y);
	graphics.lineStyle(3, data.color, 1);
	graphics.beginFill(data.color, minOpacity);
	graphics.drawCircle(0, 0, data.radius);
	graphics.endFill();
	graphics.shape = new PIXI.Circle(0, 0, data.radius);

	graphics.body = Physics.body('circle', {
		x: data.position.x,
		y: data.position.y,
		radius: data.radius,
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
	graphics.beginFill(data.color, graphicsOpacity(data.opacity));

	// draw a triangle using lines
	graphics.moveTo(data.points[0].x, data.points[0].y);
	for (var i = 1; i < data.points.length; ++i) {
		graphics.lineTo(data.points[i].x, data.points[i].y);
	}
	graphics.lineTo(data.points[0].x, data.points[0].y);

	// end the fill
	graphics.endFill();

	for (var i = 0; i < data.points.length; ++i) {
		graphics.lineStyle(3, data.points[i].color || data.color, graphicsOpacity(data.points[i].opacity));
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

function updateGraphics(obj) {
	obj.position.x = obj.body.state.pos.x;
	obj.position.y = obj.body.state.pos.y;
	obj.rotation = obj.body.state.angular.pos;
}

function buildRibs(data) {
	var res = [];

	// add border
	res.push({
		from: Physics.vector(0, 0),
		to: Physics.vector(0, 480),
		border: true,
	});
	res.push({
		from: Physics.vector(0, 480),
		to: Physics.vector(640, 480),
		border: true,
	});
	res.push({
		from: Physics.vector(640, 480),
		to: Physics.vector(640, 0),
		border: true,
	});
	res.push({
		from: Physics.vector(640, 0),
		to: Physics.vector(0, 0),
		border: true,
	});

	// add prismas
	for (var i = 0; i < data.prismas.length; ++i) {
		var pr = data.prismas[i];
		var prPos = pr.polygon.body.state.pos.clone();
		for (var j = 0; j < pr.points.length; ++j) {
			var pt = pr.points[j];
			var nextPt = pr.points[(j == pr.points.length - 1) ? 0 : j + 1];

			var ptPos = Physics.vector(pt.x, pt.y).rotate(pr.polygon.body.state.angular.pos);
			var nextPtPos = Physics.vector(nextPt.x, nextPt.y).rotate(pr.polygon.body.state.angular.pos);

			res.push({
				from: Physics.vector(prPos.x + ptPos.x, prPos.y + ptPos.y),
				to: Physics.vector(prPos.x + nextPtPos.x, prPos.y + nextPtPos.y),
				color: pt.color || pr.color,
				opacity: pt.opacity,
				prisma: pr,
				num: j,
			});
		}
	}
	return res;
}

function isRibsEqual(ribs, oldRibs) {
	if (!ribs || !oldRibs || ribs.length != oldRibs.length) {
		return false;
	}

	for (var i = 0; i < ribs.length; ++i) {
		var r = ribs[i];
		var or = oldRibs[i];
		if (r.num != or.num || r.prisma != or.prisma) {
			return false;
		}
		if (!r.from.equals(or.from) || !r.to.equals(or.to)) {
			return false;
		}
	}
	return true;
}


function intersection(beam, rib) {
	var p0 = beam.pos;
	var p1 = rib.from;
	var p2 = rib.to;
	var a, b;
	if (beam.dir.x == 0) {
		a = (p0.x - p1.x) / (p2.x - p1.x);
		b = ((p1.y - p0.y) + a * (p2.y - p1.y)) / beam.dir.y;
	}
	else if (beam.dir.y == 0) {
		a = (p0.y - p1.y) / (p2.y - p1.y);
		b = ((p1.x - p0.x) + a * (p2.x - p1.x)) / beam.dir.x;
	}
	else {
		var tg = beam.dir.y / beam.dir.x;
		a = ((p1.y - p0.y) - tg * (p1.x - p0.x)) / ( -(p2.y - p1.y) + tg * (p2.x - p1.x));
		b = ((p1.x - p0.x) + a * (p2.x - p1.x)) / beam.dir.x;
	}
	if (b >= 0 && a >= 0 && a <= 1) { // intersects!
		return Physics.vector(p0.x + b * beam.dir.x, p0.y + b * beam.dir.y);
	}
	return undefined;
}

function beamPointDist(beam, pt) {
	var b = pt.clone().vsub(beam.pos).dot(beam.dir);
	if (b < 0) {
		return beam.pos.clone().vsub(pt).norm();
	}
	var a = ((beam.pos.x - pt.x) + b*beam.dir.x)/beam.dir.y;
	var inters = beam.pos.clone().vadd(beam.dir.clone().mult(b));
	return inters.vsub(pt).norm();
}

function beamCircleIntersection(beam, pt, rad) {
	var d = beam.pos.clone().vsub(pt);
	var b = beam.dir;
	var dot = b.dot(d);
	var s = rad*rad + dot*dot - d.normSq();
	if (s < 0) {
		return undefined;
	}
	if (s < 1e-4) {
		return beam.pos.clone().vadd(beam.dir.clone().mult(-dot));
	}

	var sq = Math.sqrt(s);
	var a1 = sq - dot;
	var a2 = -sq - dot;

	if (a1 < 0 && a2 < 0) {
		return undefined;
	}

	if (a1 < 0) {
		return beam.pos.clone().vadd(beam.dir.clone().mult(a2));
	}

	if (a2 < 0) {
		return beam.pos.clone().vadd(beam.dir.clone().mult(a1));
	}

	var v1 = beam.dir.clone().mult(a1);
	var v2 = beam.dir.clone().mult(a2);
	if (v1.norm() < v2.norm()) {
		return beam.pos.clone().vadd(v1);
	} else {
		return beam.pos.clone().vadd(v2);
	}
}

function traceBeam(beam, ribs, world, res, depth, isInside, data) {
	if (depth > 100) {
		return;
	}

	var dist = 9999999;
	var intersec = null;
	var num = -1;
	var gotTarget = null;
	var numTarget = -1;

	for (var i = 0; i < data.targets.length; ++i) {
		var target = data.targets[i];
		var is = beamCircleIntersection(beam, Physics.vector(target.position.x, target.position.y), target.radius);
		if (is === undefined) {
			continue;
		}

		var ds = beam.pos.clone().vsub(is).norm();
		if (ds < dist) {
			dist = ds;
			gotTarget = is;
			numTarget = i;
		}
	}

	// get closest intersection
	for (var i = 0; i < ribs.length; ++i) {
		var is = intersection(beam, ribs[i]);
		if (is === undefined) {
			continue;
		}

		var ds = beam.pos.clone().vsub(is).norm();
		if (ds < dist) {
			dist = ds;
			intersec = is;
			num = i;
			gotTarget = null;
		}
	}

	if (gotTarget != null) {
		res.push({
			from: beam.pos.clone(),
			to: gotTarget.clone(),
			color: beam.color,
		});
		data.targets[numTarget].filled += getLazerStrength(beam.color, target.color);
		return;
	}

	if (intersec == null) {
		return;
	}

	res.push({
		from: beam.pos.clone(),
		to: intersec.clone(),
		color: beam.color,
	});

	if (ribs[num].border) {
		return;
	}

	// TODO: start traceBeam with new reflected beam
	var rib = ribs[num];
	var vec2 = rib.to.clone().vsub(rib.from);
	var angle = Math.atan2(beam.dir.y, beam.dir.x) - Math.atan2(vec2.y, vec2.x);
	var angleWithNorm = -(Math.PI/2 + angle);

	var pop = rib.prisma.opacity;
	if (pop == undefined) {
		pop = 1;
	}

	var reflectAngle = Math.PI + 2 * angleWithNorm; // отражение
	var reflectOffset = beam.dir.clone().mult(-0.1);
	var reflectBeam = {
		pos: intersec.clone().vadd(reflectOffset),
		dir: beam.dir.clone().rotate(reflectAngle).normalize(),
		color: isInside ? weakenBeam(beam.color, rib.prisma.color, pop) : beam.color,
	};

	// n1*sin t1 == n2*sin t2
	// внутрь n1 == 1
	// наружу n2 == 1
	var n = isInside ? rib.prisma.coeff / 1 : 1 / rib.prisma.coeff; // == n1/n2
	var sint2 = n * Math.sin(Math.abs(angleWithNorm));

	if (isInside && sint2 < -1 || sint2 > 1) {
		traceBeam(reflectBeam, ribs, world, res, depth + 1, isInside, data);
		return;
	}

	var op = rib.prisma.points[rib.num].opacity;
	if (op == undefined) {
		op = 1;
	}
	var beams = splitBeam(beam.color, rib.prisma.points[rib.num].color || rib.prisma.color, op);
	if (beams[0] != null) {
		reflectBeam.color = beams[0];
		traceBeam(reflectBeam, ribs, world, res, depth + 1, isInside, data);
	}

	if (beams[1] != null) {
		var refractAngle = Math.asin(sint2); // преломление
		var refractOffset = beam.dir.clone().mult(0.1);
		var refractBeam = {
			pos: intersec.clone().vadd(refractOffset),
			dir: beam.dir.clone().rotate(refractAngle).normalize(),
			color: !isInside ? weakenBeam(beams[1], rib.prisma.color, pop) : beams[1],
		};
		traceBeam(refractBeam, ribs, world, res, depth + 1, !isInside, data);
	}

	// console.log(depth, angle / Math.PI * 180, angleWithNorm / Math.PI * 180, reflectAngle / Math.PI * 180, refractAngle / Math.PI * 180, n);
}

function calculateBeams(data, world) {
	var ribs = buildRibs(data);
	if (isRibsEqual(ribs, world.oldRibs)) {
		return false;
	}

	var res = [];
	for (var i = 0; i < levels[1].lasers.length; ++i) {
		var lazer = levels[1].lasers[i];
		if (!lazer.enabled) {
			continue;
		}

		var dir = Physics.vector(lazer.direction.x, lazer.direction.y).normalize();
		var beam = {
			pos: Physics.vector(lazer.position.x, lazer.position.y).vadd(dir.clone().mult(laserPointDist)),
			dir: dir,
			color: getLazerSpectrum(lazer.color, lazer.strength),
		};
		traceBeam(beam, ribs, world, res, 1, false, data);
	}
	world.oldRibs = res;
	return res;
}

function renderBeams(beams, stage) {
	for (var i = 0; i < beams.length; ++i) {
		var beam = beams[i];
		var bg = new PIXI.Graphics();
		var cs = getLazerColorStrength(beam.color);
		bg.lineStyle(3, cs.col, graphicsOpacity(cs.str));
		bg.moveTo(beam.from.x, beam.from.y);
		bg.lineTo(beam.to.x, beam.to.y);
		stage.beams.push(bg);
		stage.addChild(bg);
	}
}

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

	    stage.beams = [];
	    stage.dots = [];

	    var levelData = levels[1];

	    world.on('step', function() {
	    	// update world
	    	for (var i = 0; i < levels[1].prismas.length; ++i) {
	    		updateGraphics(levels[1].prismas[i].polygon);
	    	}
	    	for (var i = 0; i < levels[1].targets.length; ++i) {
	    		var obj = levels[1].targets[i];
	    		updateGraphics(obj.target);
	    		obj.filled = 0;
	    	}
	    	for (var i = 0; i < levels[1].lasers.length; ++i) {
	    		updateGraphics(levels[1].lasers[i].lazer);
	    	}

	    	// clear beams
	    	for (var i = 0; i < stage.beams.length; ++i) {
	    		stage.removeChild(stage.beams[i]);
	    	}
	    	stage.beams = [];

	    	var beams = calculateBeams(levelData, world);
	    	if (beams !== false) {
	    		renderBeams(beams, stage);
	    	}

	    	// clear beams
	    	for (var i = 0; i < stage.dots.length; ++i) {
	    		stage.removeChild(stage.dots[i]);
	    	}
	    	stage.dots = [];
	    	for (var i = 0; i < levels[1].targets.length; ++i) {
	    		var obj = levels[1].targets[i];
	    		if (obj.filled == 0) {
	    			continue;
	    		}

	    		var graphics = new PIXI.Graphics();
				graphics.position = new PIXI.Point(obj.position.x, obj.position.y);
				graphics.lineStyle(0, obj.color, 1);
				graphics.beginFill(obj.color, 1);
				graphics.drawCircle(0, 0, (obj.radius - 1) * (obj.filled > 1 ? 1 : obj.filled));
				graphics.endFill();
				stage.addChild(graphics);
				stage.dots.push(graphics);
	    	}

	    	renderer.render(stage);
			world.anyChanges = false;
		});

		loadLevel(levelData, stage, world);

		// world.add(Physics.behavior('constant-acceleration'));
	});
}

})();
