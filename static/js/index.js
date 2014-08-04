(function() {

$(document).ready(function() {
    $("#start-game").click(function() {
		$("#start-game").hide();
		$("#game-scene").show();
		runGame();
	});
});

var polygonData = {
	color: 0x00FF00,
	points: [
		{x: 0, y: 40-10, color: 0x0000FF},
		{x: 0, y: 40+10},
		{x: 30, y: 40},
	],
	position: {x: 400/2, y: 300/2},
};

function createPoly(data) {
	// create a new graphics object
	var graphics = new PIXI.Graphics();
	graphics.position = data.position;

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

function runGame() {
    var stage = new PIXI.Stage(0x000000);
    var renderer = PIXI.autoDetectRenderer(400, 300, document.getElementById("game-scene"));

    stage.addChild(createPoly(polygonData));

    requestAnimFrame(update);

    function update() {
		onUpdate();

	    // render the stage
	    renderer.render(stage);
	    requestAnimFrame(update);
	}

	function onUpdate() {
		console.log("onUpdate");
	}
}

})();
