function mousedown(event) {
  canvas.addEventListener('mouseup', mouseup);
  if (event.buttons == 1) {
    dragswitch = true;
  }

  if (event.button == 2) {
    if (activestar != null) {
      activestar = null;
    } else {
      var todelete = [];
      connections = connections.filter(function(connection) {
        var center1 = worldToScreen(coords, connection.center1[0], connection.center1[1]);
        var center2 = worldToScreen(coords, connection.center2[0], connection.center2[1]);

        if (connectionDist(center1, center2, event.clientX, event.clientY) < 6) {
          todelete.push(connection);
          return false;
        }

        return true;
      });
      connectionsDelete(todelete);
    }
  }
}

function mouseup(event) {
  canvas.removeEventListener('mouseup', mouseup);
  dragswitch = false;
}

function mousemove(event) {
  if (dragswitch) {
    coords.x -= event.movementX * coords.scale;
    coords.y -= event.movementY * coords.scale;
  }
  mousecoords = [event.clientX, event.clientY];
}

function scroll(event) {
  if (event.deltaY >= 0) {
    if (coords.scale < 25){
      coords.x += mousecoords[0] * coords.scale * -0.1;
      coords.y += mousecoords[1] * coords.scale * -0.1;
      coords.scale *= 1.1;
    }
  } else {
    if (coords.scale > 0.5) {
      coords.x += mousecoords[0] * coords.scale / 11;
      coords.y += mousecoords[1] * coords.scale / 11;
      coords.scale /= 1.1;
    }
  }
}

function click(event) {
  var worldcoords = screenToWorld(coords, event.clientX, event.clientY);

  if (event.button == 0) {
    for (var i = 0; i < starlist.length; i++) {
      var star = starlist[i];
      var distSquared = (star[0] + 8 - worldcoords[0]) * (star[0] + 8 - worldcoords[0]) +
                        (star[1] + 8 - worldcoords[1]) * (star[1] + 8 - worldcoords[1]);
      if (distSquared <= 484) {
        if (activestar == null) {
          var noise1 = document.getElementById("noise1");
          var noise2 = document.getElementById("noise2");
          var noise3 = document.getElementById("noise3");
          var noise4 = document.getElementById("noise4");
          var noise5 = document.getElementById("noise5");

          activestar = star;
          return;
        } else {
          var connection = new StarConnection(activestar, star);
          connections.push(connection);
          activestar = null;
          connectionsPost(connection);
          return;
        }
      }
    }
  }
}

function contextmenu(event) {
  event.preventDefault();
  return false;
}

function randonum(max, min) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function connectionDist(star1, star2, pointx, pointy) {
  var vx = star2[0] - star1[0];
  var vy = star2[1] - star1[1];

  var bx = star1[0] - vx;
  var by = star1[1] - vy;

  var cx = pointx - bx;
  var cy = pointy - by;

  var mag = (cx * vx + cy * vy) / (vx * vx + vy * vy);
  var projx = mag * vx;
  var projy = mag * vy;

  var projv = projx / vx;
  var s1v = (star1[0] - bx) / vx;
  var s2v = (star2[0] - bx) / vx;

  if (projv < Math.min(s1v, s2v) || projv > Math.max(s1v, s2v)) {
    return Math.min(Math.hypot(star1[0] - pointx, star1[1] - pointy),
                    Math.hypot(star2[0] - pointx, star2[1] - pointy));
  } else {
    var dx = cx - projx;
    var dy = cy - projy;

    return Math.sqrt(dx * dx + dy * dy);
  }
}

function worldToScreen(coords, x, y) {
  return [(x - coords.x)/coords.scale,
          (y - coords.y)/coords.scale];
}

function screenToWorld(coords, x, y) {
  return [(x * coords.scale) + coords.x,
          (y * coords.scale) + coords.y];
}

function draw(starlist, ctx, coords) {
  var starimg = new Image();
  starimg.src = "singlestar.svg";
  ctx.strokeStyle = 'white';
  if (activestar != null) {
    ctx.beginPath();
    var screenstar = worldToScreen(coords, activestar[0], activestar[1]);
    ctx.moveTo(screenstar[0] + 8/coords.scale, screenstar[1] + 8/coords.scale);
    ctx.lineTo(mousecoords[0], mousecoords[1]);
    ctx.stroke();
  }

  for (var i = 0; i < connections.length; i++) {
    var lines = connections[i];
    var fromstar = lines.center1;
    var tostar = lines.center2;
    var screenfromstar = worldToScreen(coords, fromstar[0], fromstar[1]);
    var screentostar = worldToScreen(coords, tostar[0], tostar[1]);
    ctx.beginPath();
    ctx.moveTo(screenfromstar[0], screenfromstar[1]);
    ctx.lineTo(screentostar[0], screentostar[1]);
    ctx.stroke();
  }

  for (var i = 0; i < starlist.length; i++) {
    var star = starlist[i];
    var screencoords = worldToScreen(coords, star[0], star[1]);
    ctx.drawImage(starimg, screencoords[0], screencoords[1], 16/coords.scale, 16/coords.scale);
  }
}

function starFetch() {
  fetch('https://constellations.pseudosu.com/stars').then(function(response) {
    return response.json();
  }).then(function(json) {
    for (var i = 0; i < json.length; i++) {
      starlist.push([json[i].x, json[i].y]);
    }
  });
}

function connectionsFetch() {
  fetch('https://constellations.pseudosu.com/connections').then(function(response) {
    return response.json();
  }).then(function(json) {
    connections = [];
    for (var i = 0; i < json.length; i++) {
      var star1 = json[i].star1;
      var star2 = json[i].star2;
      var connection = new StarConnection([star1.x, star1.y], [star2.x, star2.y]);
      connections.push(connection);
    }
  });
}

function connectionsPost(connection) {
  fetch('https://constellations.pseudosu.com/connections', {
    method: "POST",
    body: JSON.stringify([connection])
  });
}

function connectionsDelete(connections) {
  fetch('https://constellations.pseudosu.com/connections', {
    method: "DELETE",
    body: JSON.stringify(connections)
  });
}

function ViewportCoords(x, y, width, height, scale) {
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.scale = scale;
}

function StarConnection(star1, star2) {
  this.star1 = star1;
  this.star2 = star2;
  this.center1 = [star1[0] + 8, star1[1] + 8];
  this.center2 = [star2[0] + 8, star2[1] + 8];
}

StarConnection.prototype.equals = function(other) {
  return this.star1[0] == other.star1[0] &&
         this.star1[1] == other.star1[1] &&
         this.star2[0] == other.star2[0] &&
         this.star2[1] == other.star2[1];
}

var starlist = [];
var connections = [];

starFetch();
connectionsFetch();

var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var coords = new ViewportCoords(0, 0, 800, 800, 1);
var activestar = null;
var dragswitch = false;
var mousecoords = [0, 0]; 

canvas.addEventListener('mousedown', mousedown);
canvas.addEventListener('mousewheel', scroll);
canvas.addEventListener('wheel', scroll);
canvas.addEventListener('click', click);
canvas.addEventListener('mousemove', mousemove);
canvas.addEventListener('contextmenu', contextmenu);

window.setInterval(function(){
  coords.width = window.innerWidth;
  coords.height = window.innerHeight;
  canvas.width = coords.width;
  canvas.height = coords.height;
  draw(starlist, ctx, coords);
}, 16);

window.setInterval(connectionsFetch, 500);
