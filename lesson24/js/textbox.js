GFX.TextBox = function() {
    var DESCENDER_ADJUST = 1.28;
};

GFX.TextBox.prototype = {

    /**
     * Build a text sprite.  We use canvas to write the label in 2D then create a texture
     * from the canvas.  Three.js extracts the raster from the canvas and composites that
     * into the center of the texture.
     */
    makeTextSprite: function (message, x, y, z, parameters) {
        if (parameters === undefined) parameters = {};

        var fontface = parameters.hasOwnProperty("fontface") ?
            parameters["fontface"] : "Arial";

        var fontsize = parameters.hasOwnProperty("fontsize") ?
            parameters["fontsize"] : 18;

        var borderThickness = parameters.hasOwnProperty("borderThickness") ?
            parameters["borderThickness"] : 4;

        var borderColor = parameters.hasOwnProperty("borderColor") ?
            parameters["borderColor"] : {r: 0, g: 0, b: 0, a: 1.0};

        var fillColor = parameters.hasOwnProperty("fillColor") ?
            parameters["fillColor"] : undefined;

        var textColor = parameters.hasOwnProperty("textColor") ?
            parameters["textColor"] : {r: 0, g: 0, b: 255, a: 1.0};

        var radius = parameters.hasOwnProperty("radius") ?
            parameters["radius"] : 6;

        var vAlign = parameters.hasOwnProperty("vAlign") ?
            parameters["vAlign"] : "center";

        var hAlign = parameters.hasOwnProperty("hAlign") ?
            parameters["hAlign"] : "center";

        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');

        // set a large-enough fixed-size canvas.  Both dimensions should be powers of 2.
        canvas.width = 2048;
        canvas.height = 1024;

        context.font = fontsize + "px " + fontface;
        context.textBaseline = "alphabetic";
        context.textAlign = "left";

        // get size data (height depends only on font size)
        var metrics = context.measureText(message);
        var textWidth = metrics.width;

        /*
         // need to ensure that our canvas is always large enough
         // to support the borders and justification, if any
         // Note that this will fail for vertical text (e.g. Japanese)
         // The other problem with this approach is that the size of the canvas
         // varies with the length of the text, so 72-point text is different
         // sizes for different text strings.  There are ways around this
         // by dynamically adjust the sprite scale etc. but not in this demo...
         var larger = textWidth > fontsize ? textWidth : fontsize;
         canvas.width = larger * 4;
         canvas.height = larger * 2;
         // need to re-fetch and refresh the context after resizing the canvas
         context = canvas.getContext('2d');
         context.font = fontsize + "px " + fontface;
         context.textBaseline = "alphabetic";
         context.textAlign = "left";
         metrics = context.measureText( message );
         textWidth = metrics.width;

         console.log("canvas: " + canvas.width + ", " + canvas.height + ", texW: " + textWidth);
         */

        // find the center of the canvas and the half of the font width and height
        // we do it this way because the sprite's position is the CENTER of the sprite
        var cx = canvas.width / 2;
        var cy = canvas.height / 2;
        var tx = textWidth / 2.0;
        var ty = fontsize / 2.0;

        // then adjust for the justification
        if (vAlign === "bottom")
            ty = 0;
        else if (vAlign === "top")
            ty = fontsize;

        if (hAlign === "left")
            tx = 0;
        else if (hAlign === "right")
            tx = textWidth;

        // the DESCENDER_ADJUST is extra height factor for text below baseline: g,j,p,q. since we don't know the true bbox
        roundRect(context, cx - tx, cy + ty + 0.28 * fontsize,
            textWidth, fontsize * DESCENDER_ADJUST, radius, borderThickness, borderColor, fillColor);

        // text color.  Note that we have to do this AFTER the round-rect as it also uses the "fillstyle" of the canvas
        context.fillStyle = getCanvasColor(textColor);

        context.fillText(message, cx - tx, cy + ty);

        // draw some visual references - debug only
        drawCrossHairs(context, cx, cy);
        outlineCanvas(context, canvas);
        addSphere(x, y, z);

        // canvas contents will be used for a texture
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial({map: texture});
        var sprite = new THREE.Sprite(spriteMaterial);

        // we MUST set the scale to 2:1.  The canvas is already at a 2:1 scale,
        // but the sprite itself is square: 1.0 by 1.0
        // Note also that the size of the scale factors controls the actual size of the text-label
        sprite.scale.set(4, 2, 1);

        // set the sprite's position.  Note that this position is in the CENTER of the sprite
        sprite.position.set(x, y, z);

        return sprite;
    },

    /**
     *  function for drawing rounded rectangles
     */
    roundRect: function (ctx, x, y, w, h, r, borderThickness, borderColor, fillColor) {
        // no point in drawing it if it isn't going to be rendered
        if (fillColor === undefined && borderColor === undefined)
            return;

        x -= borderThickness + r;
        y += borderThickness + r;
        w += borderThickness * 2 + r * 2;
        h += borderThickness * 2 + r * 2;

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y - r);
        ctx.lineTo(x + w, y - h + r);
        ctx.quadraticCurveTo(x + w, y - h, x + w - r, y - h);
        ctx.lineTo(x + r, y - h);
        ctx.quadraticCurveTo(x, y - h, x, y - h + r);
        ctx.lineTo(x, y - r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();

        ctx.lineWidth = borderThickness;

        // background color
        // border color

        // if the fill color is defined, then fill it
        if (fillColor !== undefined) {
            ctx.fillStyle = getCanvasColor(fillColor);
            ctx.fill();
        }

        if (borderThickness > 0 && borderColor !== undefined) {
            ctx.strokeStyle = getCanvasColor(borderColor);
            ctx.stroke();
        }
    },

    /**
     * Just add a little sphere for visual reference
     */
    addSphere: function (x, y, z, size) {
        if (size === undefined)
            size = 0.01;

        var sphere = new THREE.Mesh(new THREE.SphereGeometry(size, 32, 32), new THREE.MeshNormalMaterial());
        sphere.position.set(x, y, z);
        gfxScene.add(sphere);
    },

    /**
     * Just a debug feature to draw cross-hair for visual reference
     */
    drawCrossHairs: function (context, cx, cy) {

        context.strokeStyle = "rgba(0,255,0,1)";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(cx - 150, cy);
        context.lineTo(cx + 150, cy);
        context.stroke();

        context.strokeStyle = "rgba(0,255,0,1)";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(cx, cy - 150);
        context.lineTo(cx, cy + 150);
        context.stroke();
        context.strokeStyle = "rgba(0,255,0,1)";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(cx - 150, cy);
        context.lineTo(cx + 150, cy);
        context.stroke();

        context.strokeStyle = "rgba(0,255,0,1)";
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(cx, cy - 150);
        context.lineTo(cx, cy + 150);
        context.stroke();
    },

    /**
     * Just a debug feature to outline and cross the canvas for visual reference
     */
    outlineCanvas: function (context, canvas) {

        context.strokeStyle = "rgba(255,0,0,1)";
        context.lineWidth = 5;

        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(canvas.width, canvas.height);
        context.stroke();

        context.beginPath();
        context.moveTo(0, canvas.height);
        context.lineTo(canvas.width, 0);
        context.stroke();

        context.strokeRect(0, 0, canvas.width, canvas.height);
    },

    /**
     * convenience for converting JSON color to rgba that canvas wants
     * Be nice to handle different forms (e.g. no alpha, CSS style, etc.)
     */
    getCanvasColor: function (color) {
        return "rgba(" + color.r + "," + color.g + "," + color.b + "," + color.a + ")";
    }

}
