/*
 * math-ext
 *
 * Add some missing methods to the Math object
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2018, All rights reserved.
 */

Math.QUARTER_PI = Math.PI / 4;
Math.HALF_PI    = Math.PI / 2;
Math.TWO_PI     = Math.PI*2;
Math.RAD2DEG    = 180 / Math.PI;

Math.sqr    = function (arg) { return arg*arg; };
Math.fmod   = function (a,b) { return Number((a - (Math.floor(a / b) * b)).toPrecision(8)); };
Math.toRad  = function (angle) { return angle * (Math.PI / 180); };
Math.toDeg  = function (angle) { return angle * (180 / Math.PI); };
Math.clamp  = function (cv, lo, hi) { return ((cv > hi) ? hi : ((cv < lo) ? lo : cv)); };
Math.hypot  = function (x, y) { return Math.sqrt(x * x + y * y); };
Math.roundi = function (a) { return (a < 0) ? Math.round(a - 0.5) : Math.round(a + 0.5); };

Math.wrapAng = function( arg, loLim, upLim, incr ){
    while (arg > upLim)
        arg -= incr;

    while (arg < loLim)
        arg += incr;

    return arg;
};