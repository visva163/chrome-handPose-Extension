let c = createCustomCursor();
isToggle = false;

function createCustomCursor() {
    console.log("Custom cursor initialized");

    if (!document.getElementById("customCursor")) {
        const c = document.createElement("div");
        c.id = "customCursor";
        c.style = `
            width: 20px;
            height: 20px;
            background-color: red;
            border-radius: 50%;
            position: absolute;
            pointer-events: none;
            z-index: 9999;
            display: none;
        `;
        document.body.appendChild(c);




        return c;
    }
}


function moveCursor(x, y) {
    c.style.left = x + "px";
    c.style.top = y + "px";
    if (isToggle) {
        c.style.display = "none";
    }
    else {
        c.style.display="block";
    }
}

moveCursor(window.innerWidth/2, window.innerHeight/2);
