/*  This file contains all the mouse event handlers of ships'
    settings on the user own board
*/
function shipShuffle(e) {

    var ship = e.target;

    if (!ship.classList.contains('draggable')) return;

    var shiftX, shiftY;
    var starttime; // Timestamp of dragging start
    var shipyard = gui.shipyard;


    startDrag(e.clientX, e.clientY);

    document.onmousemove = function (e) {
        moveAt(e.clientX, e.clientY);
    };

    ship.onmouseup = function () {
        finishDrag();
    };

    function startDrag(clientX, clientY) {
        shiftX = clientX - ship.getBoundingClientRect().left;
        shiftY = clientY - ship.getBoundingClientRect().top;
        ship.style.position = 'fixed';
        document.body.appendChild(ship);
        moveAt(clientX, clientY);
        dockShip();
        starttime = Date.now();
    }

    // check if the ship fits in field and among other ships
    function checkShipPosition(x, y) {
        var maxx = 9 - ship.dx[ship.dx.length-1];
        var maxy = 9 - ship.dy[ship.dy.length-1];
        if (0>x || x>maxx || 0>y || y>maxy) { return false; }
        for (var i=0; i<ship.dx.length; i++) {
            if (ownFleet.sea[x+ship.dx[i]][y+ship.dy[i]] > 0) {
                return false;
            }
        }
        return true;
    }

    function finishDrag() {
        var box = gui.ownField.getBoundingClientRect();
        var x = parseInt(ship.style.left)-box.left - 2;
        var y = parseInt(ship.style.top)-box.top - 2;
        x = Math.round(x/CELL_SIZE - 1);
        y = Math.round(y/CELL_SIZE - 1);
        if (checkShipPosition(x, y)) {
            disposeShip(x, y); //ships.x0,y0 can be different from x,y after disposeShip
            // tie the element to the document, not to the viewport
            x = (ship.x0 + 1) * CELL_SIZE + 3;
            y = (ship.y0 + 1) * CELL_SIZE + 3;
            ship.style.position = 'absolute';
            ship.style.left = x + pageXOffset + box.left + 'px';
            ship.style.top  = y + pageYOffset + box.top + 'px';
        } else {
            // throw the ship back to the shipyard
            shipyard.appendChild(ship);
            ship.style.position = 'static';
            if (Date.now() - starttime < 500) { shipRotate(); }
        }
        document.onmousemove = null;
        ship.onmouseup = null;
    }

    // Move the dragged element to the mouse coordinates
    // If element shift outside the window, the function scroll it.
    function moveAt(clientX, clientY) {
        var newX = clientX - shiftX;
        var newY = clientY - shiftY;
        var scrollY;
        var newBottom = newY + ship.offsetHeight;
        if (newBottom > document.documentElement.clientHeight) {
            var docBottom = document.documentElement.getBoundingClientRect().bottom;
            scrollY = Math.min(docBottom - newBottom, 10);
            if (scrollY < 0) scrollY = 0;
            window.scrollBy(0, scrollY);
            newY = Math.min(newY, document.documentElement.clientHeight - ship.offsetHeight);
        }
        if (newY < 0) {
            scrollY = Math.min(-newY, 10);
            if (scrollY < 0) scrollY = 0;
            window.scrollBy(0, -scrollY);
            newY = Math.max(newY, 0);
        }
        if (newX < 0) newX = 0;
        if (newX > document.documentElement.clientWidth - ship.offsetWidth) {
            newX = document.documentElement.clientWidth - ship.offsetWidth;
        }
        ship.style.left = newX + 'px';
        ship.style.top = newY + 'px';
    }

    function shipRotate() {
        [ship.style.width, ship.style.height] = [ship.style.height, ship.style.width];
        [ship.dx, ship.dy] = [ship.dy, ship.dx];
    }

    //Try to rotate the placed on the board ship
    function placedShipRotate() {
        var dx = ship.dx[ship.dx.length-1];
        var dy = ship.dy[ship.dy.length-1];
        var shipLen = Math.max(dx, dy);
        var x0 = ship.x0 - shipLen + dx;
        var y0 = ship.y0 - shipLen + dy;
        shipRotate();
        for (let x=x0; x<=x0+shipLen; x++) {
            for (let y=y0; y<=y0+shipLen; y++) {
                if (checkShipPosition(x, y)) {
                    ship.x0 = x;
                    ship.y0 = y;
                    playSound.placed()
                    return;
                }

            }
        }
        shipRotate();
        playSound.cantplace()
    }

    function disposeShip(x, y) {
        if (ship.disposed) { return; }
        var inOldPlace = ship.x0 == x && ship.y0 == y;
        ship.x0 = x;
        ship.y0 = y;
        if (Date.now()-starttime < 333 && inOldPlace && ship.dx.length>1) {
            placedShipRotate();
        }
        ship.disposed = true;
        ownFleet.touchSea(ship);
        if (!inOldPlace) { playSound.placed() };
    }

    function dockShip() {
        if (!ship.disposed) { return; }
        ship.disposed = false;
        ownFleet.touchSea(ship, -1);
    }
    return false;
}