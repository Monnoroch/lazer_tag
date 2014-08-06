PIXI.Rectangle.prototype.collides = function(shape) {
	if (shape instanceof PIXI.Rectangle) {
		return
			this.x < shape.x + shape.width &&
			this.x + this.width > shape.x &&
			this.y < shape.y + shape.height &&
			this.height + this.y > shape.y;
	}

	if (shape instanceof PIXI.Polygon) {
		return shape.collides(new PIXI.Polygon(this.x, thix.y, thix.x + this.width, this.y, this.x + this.width, this.y + this.height, this.x, this.y + this.height));
	}

	if (shape instanceof PIXI.Ellipse) {
		return undefined;
	}

	if (shape instanceof PIXI.Circle) {
		return undefined;
	}

	return undefined;
};

PIXI.Point.prototype.distSquare = function(point) {
	var dx = this.x - point.x;
	var dy = this.y - point.y;
	return dx*dx + dy*dy;
};

PIXI.Point.prototype.dist = function(point) {
	return Math.sqrt(this.distSquare(point));
};

function distancePointToEdge(px, py, x1, y1, x2, y2) {
	var pt = new PIXI.Point(px, py);
	var p1 = new PIXI.Point(x1, y1);
	var p2 = new PIXI.Point(x2, y2);

	var r1 = pt.distSquare(p1);
	var r2 = pt.distSquare(p2);
	var r12 = p1.distSquare(p2);

    if(r1 >= r2 + r12) {
    	return Math.sqrt(r2);
    }
    else if(r2 >= r1 + r12) {
    	return Math.sqrt(r1);
    }

    var a1 = x1 - px;
    var a2 = y1 - py;
    var b1 = x2 - px;
    var b2 = y2 - py;

    var d = a1*b2 - b1*a2;

    return Math.sqrt(d*d/r12);
}

PIXI.Polygon.prototype.collides = function(shape) {
	if (shape instanceof PIXI.Rectangle) {
		return shape.collides(this);
	}

	if (shape instanceof PIXI.Polygon) {
		for (var i = 0; i < this.points.length; ++i) {
			if (shape.contains(this.points[i].x, this.points[i].y)) {
				return true;
			}
		}
		for (var i = 0; i < shape.points.length; ++i) {
			if (this.contains(shape.points[i].x, shape.points[i].y)) {
				return true;
			}
		}
		return false;
	}

	if (shape instanceof PIXI.Ellipse) {
		return undefined;
	}

	if (shape instanceof PIXI.Circle) {
		if (this.contains(shape.x, shape.y)) {
			return true;
		}

		for (var i = 0; i < this.points.length; ++i) {
			var next = (i == this.points.length - 1) ? 0 : i + 1;
			var x1 = this.points[i].x;
			var y1 = this.points[i].y;
			var x2 = this.points[next].x;
			var y2 = this.points[next].y;

			if (distancePointToEdge(shape.x, shape.y, x1, y1, x2, y2) < shape.radius) {
				return true;
			}
		}
		return false;
	}

	return undefined;
};

PIXI.Circle.prototype.collides = function(shape) {
	if (shape instanceof PIXI.Circle) {
		var dx = this.x - shape.x;
		var dy = this.y - shape.y;
		var distance = Math.sqrt(dx * dx + dy * dy);
		return distance < this.radius + shape.radius;
	}

	if (shape instanceof PIXI.Polygon) {
		return shape.collides(this);
	}

	if (shape instanceof PIXI.Ellipse) {
		return undefined;
	}

	if (shape instanceof PIXI.Rectangle) {
		return shape.collides(this);
	}

	return undefined;
};

PIXI.Ellipse.prototype.collides = function(shape) {
	if (shape instanceof PIXI.Circle) {
		return shape.collides(this);
	}

	if (shape instanceof PIXI.Polygon) {
		return shape.collides(this);
	}

	if (shape instanceof PIXI.Ellipse) {
		return undefined;
	}

	if (shape instanceof PIXI.Rectangle) {
		return shape.collides(this);
	}

	return undefined;
};


PIXI.Point.prototype.mulBy = function(matrix) {
	return new PIXI.Point(matrix.tx + matrix.a*this.x + matrix.b*this.y, matrix.ty + matrix.c*this.x + matrix.d*this.y);
};

PIXI.Point.prototype.toGlobal = function(displayObject) {
	return this.mulBy(displayObject.worldTransform);
};

PIXI.Rectangle.prototype.toGlobal = function(displayObject) {
	var gpoint = (new PIXI.Point(this.x, this.y)).toGlobal(displayObject);
	return new PIXI.Rectangle(gpoint.x, gpoint.y, this.width, this.height);
};

PIXI.Polygon.prototype.toGlobal = function(displayObject) {
	var points = [];
	for (var i = 0; i < this.points.length; ++i) {
		var gpoint = (new PIXI.Point(this.points[i].x, this.points[i].y)).toGlobal(displayObject);
		points.push(gpoint.x);
		points.push(gpoint.y);
	}
	return new PIXI.Polygon(points);
};

PIXI.Circle.prototype.toGlobal = function(displayObject) {
	var gpoint = (new PIXI.Point(this.x, this.y)).toGlobal(displayObject);
	return new PIXI.Circle(gpoint.x, gpoint.y, this.radius);
};

PIXI.Ellipse.prototype.toGlobal = function(displayObject) {
	return undefined;
};

PIXI.Matrix.prototype.inverse = function() {
	var res = new PIXI.Matrix();
	var del = this.a*this.d - this.b*this.c;
	res.a = this.d / del;
	res.b = this.b / -del;
	res.c = this.c / -del;
	res.d = this.a / del;
	res.tx = (this.d*this.tx - this.b*this.ty) / -del;
	res.ty = (this.c*this.tx - this.a*this.ty) / del;
	return res;
};


(function() {

$(document).ready(function() {
    $("#start-game").click(function() {
		$("#start-game").hide();
		$("#game-scene").show();
		runGame();
	});
});

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

function createLaser(data, stage) {
	// var graphics = new PIXI.Graphics();
	// graphics.position = new PIXI.Point(data.position.x, data.position.y);
	// graphics.lineStyle(3, data.color, 1);
	// graphics.beginFill(data.color, 1);
	// graphics.drawCircle(0, 0, 20);
	// graphics.endFill();

	// stage.addChild(graphics);
}

function createTarget(data, stage) {
	var graphics = new PIXI.Graphics();
	graphics.position = new PIXI.Point(data.position.x, data.position.y);
	graphics.lineStyle(3, data.color, 1);
	graphics.beginFill(data.color, 1);
	graphics.drawCircle(0, 0, 20);
	graphics.endFill();
	graphics.shape = new PIXI.Circle(0, 0, 20);

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

function createPrismaGraphics(data) {
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
	};

	graphics.mouseout = function(eventData) {
		this.parent.mouseIn = false;
		if (this.parent.rotate) {
			return;
		}
		disableDots(this.parent);
	};

	graphics.mousedown = function(eventData) {
		this.drag = true;
		this.dragPoint = eventData.getLocalPosition(this.parent);
	};

	graphics.mouseup = function(eventData) {
		this.drag = false;
		this.dragPoint = null;
	};

	graphics.mouseupoutside = function(eventData) {
		this.drag = false;
		this.dragPoint = null;
	};

	graphics.mousemove = function(eventData) {
		if (!this.drag) {
			return;
		}

		this.parent.lastNotCollide = this.parent.position.clone();
		this.parent.position = eventData.global.clone();
		this.parent.position.x -= this.dragPoint.x;
		this.parent.position.y -= this.dragPoint.y;
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

function createPrisma(data, stage) {
	var displayObj = new PIXI.DisplayObjectContainer();
	displayObj.position =  new PIXI.Point(data.position.x, data.position.y);
	displayObj.graphics = createPrismaGraphics(data);
	displayObj.addChild(displayObj.graphics);
	displayObj.points = [];
	displayObj.pointsInter = [];

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
			}

			if (!this.rotate) {
				return;
			}

			// NOTE: eventData.getLocalPosition(this.parent); does not work in this case
			// should be eventData.getLocalPosition(this.parent) but w/o rotations
			// TODO: fix for multiple parents
			var localPos = new PIXI.Point(eventData.global.x - this.parent.x, eventData.global.y - this.parent.y);

			var x1 = this.position.x;
			var y1 = this.position.y;
			var x2 = localPos.x;
			var y2 = localPos.y;

			var angle = Math.atan2(y2, x2) - Math.atan2(y1, x1);
			displayObj.rotation = angle;
		};

		displayObj.points.push(ptInter);
		displayObj.addChild(ptInter);
	}

	stage.addChild(displayObj);

	data.polygon = displayObj;
}

function loadLevel(data, stage) {
	for (var i = 0; i < data.lasers.length; ++i) {
		createLaser(data.lasers[i], stage);
	}
	for (var i = 0; i < data.targets.length; ++i) {
		createTarget(data.targets[i], stage);
	}
	for (var i = 0; i < data.prismas.length; ++i) {
		createPrisma(data.prismas[i], stage);
	}
}

function runGame() {
    var stage = new PIXI.Stage(0x000000, true);
    var renderer = new PIXI.CanvasRenderer(640, 480, document.getElementById("game-scene"));

    (new PIXI.Rectangle(0, 1, 2, 3)).collides(new PIXI.Circle(0, 1, 2));

    loadLevel(levels[1], stage);

    requestAnimFrame(update);

    function update() {
	    // render the stage
	    renderer.render(stage);
	    onUpdate();
	    requestAnimFrame(update);
	}

	function onUpdate() {
		var target = levels[1].targets[0].target;
		var graphics = levels[1].prismas[0].polygon.graphics;
		var collides = target.shape.toGlobal(target).collides(graphics.shape.toGlobal(graphics));
		if (collides) {
			graphics.parent.position = graphics.parent.lastNotCollide.clone();
		}
		// console.log(collides);
	}
}

})();
