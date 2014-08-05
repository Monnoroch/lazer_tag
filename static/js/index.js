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
			color: 0x00FF00,
			position: {x: 400/2, y: 300/2},		
		}],
		targets: [{
			color: 0x00FF00,
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

}

function createTarget(data, stage) {

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

function createPrisma(data, stage) {
	var points = [];
	for (var i = 0; i < data.points.length; ++i) {
		points.push(data.points[i].x);
		points.push(data.points[i].y);
	}

	var graphics = createPoly(data);
	graphics.interactive = true;
	graphics.hitArea = new PIXI.Polygon(points);

	var displayObj = new PIXI.DisplayObjectContainer();
	displayObj.position =  new PIXI.Point(data.position.x, data.position.y);

	function onMouseleave() {
		for (var i = 0; i < displayObj.points.length; ++i) {
			displayObj.points[i].visible = false;
		}
	}

	graphics.mouseover = function(eventData) {
		for (var i = 0; i < displayObj.points.length; ++i) {
			displayObj.points[i].visible = true;
		}
	};

	graphics.mouseout = function(eventData) {
		if (this.rotate) {
			return;
		}
		onMouseleave();
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
		onMouseleave();
	};

	graphics.mousemove = function(eventData) {
		if (!this.drag) {
			return;
		}

		this.parent.position = eventData.global.clone();
		this.parent.position.x -= this.dragPoint.x;
		this.parent.position.y -= this.dragPoint.y;
	};

	displayObj.addChild(graphics);
	displayObj.points = [];
	displayObj.pointsInter = [];

	{
		var pt = new PIXI.Graphics();
		pt.lineStyle(1, 0xFF0000, 1);
		pt.beginFill(0xFF0000, 1);
		pt.drawCircle(0, 0, 3);
		pt.endFill();
		displayObj.addChild(pt);
	}

	for (var i = 0; i < data.points.length; ++i) {
		var pt = new PIXI.Graphics();
		pt.position = new PIXI.Point(data.points[i].x, data.points[i].y);
		pt.visible = false;
		pt.lineStyle(3, data.color, 1);
		pt.beginFill(data.color, 0.5);
		pt.drawCircle(0, 0, 5);
		pt.endFill();

		var ptInter = new PIXI.DisplayObjectContainer(); // TODO: DisplayObject
		ptInter.position = new PIXI.Point(data.points[i].x, data.points[i].y);
		ptInter.interactive = true;
		ptInter.hitArea = new PIXI.Circle(0, 0, 5);
		ptInter.mouseover = graphics.mouseover;
		ptInter.mouseout = graphics.mouseout;
		ptInter.graphics = pt;

		ptInter.mousedown = function(eventData) {
			graphics.rotate = true;
			this.rotate = true;
			onMouseleave();
			this.graphics.visible = true;
		};

		ptInter.mouseup = function(eventData) {
			graphics.rotate = false;
			this.rotate = false;
		};

		ptInter.mouseupoutside = function(eventData) {
			graphics.rotate = false;
			this.rotate = false;
			onMouseleave();
		};

		ptInter.mousemove = function(eventData) {
			if (!this.rotate) {
				return;
			}

			// NOTE: eventData.getLocalPosition(this.parent); does not work in this case
			var localPos = new PIXI.Point(eventData.global.x - this.parent.x, eventData.global.y - this.parent.y);

			var x1 = this.position.x;
			var y1 = this.position.y;
			var x2 = localPos.x;
			var y2 = localPos.y;

			var val = (x1*x2 + y1*y2) / Math.sqrt(x1*x1*x2*x2 + x2*x2*y1*y1 + x1*x1*y2*y2 + y1*y1*y2*y2);
			var angle = Math.acos(val);
			displayObj.rotation = angle;
		};

		displayObj.points.push(pt);
		displayObj.pointsInter.push(ptInter);
		displayObj.addChild(pt);
		displayObj.addChild(ptInter);
	}

	stage.addChild(displayObj);

	data.polygon = displayObj;
	data.graphics = graphics;
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
    var renderer = PIXI.autoDetectRenderer(640, 480, document.getElementById("game-scene"));

    loadLevel(levels[1], stage);

    requestAnimFrame(update);

    function update() {
		onUpdate();

	    // render the stage
	    renderer.render(stage);
	    requestAnimFrame(update);
	}

	function onUpdate() {
		// console.log("onUpdate");
	}
}

})();
