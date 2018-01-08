/*
 * Cartographic projection Utilities.  Very simplistic at this point
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 */

/**
 * Constants
 */
var Carto = {
    revision: '1.0',

    METERPERDEG: 111195.0,  // based on circumference at equator, https://solarsystem.nasa.gov/planets/earth/facts
    EARTH_DIAMETER: 12742.0,// per NASA

    radius_major:6378137.0,         // Equatorial Radius, WGS84
    radius_minor:6356752.314245179, // defined as constant
    f:298.257223563                 // 1/f=(a-b)/a , a=r_major, b=r_minor
};

/**
 * Pseudo constructor
 * @constructor
 */
Carto.Carto = function () {

};

Carto.Carto.prototype = {

    /**
     * transform from lat/lon to 3D x,y,z in meters relative to the centre of the earth.
     * Assumes Earth is a perfect sphere, but close enough for most uses.
     * @param lat
     * @param lon
     * @param elev
     * @returns {Vector3|*}
     */
    transform: function (lat, lon, elev ) {
        var radius = Carto.EARTH_DIAMETER;

        // this trasform from https://stackoverflow.com/questions/28365948/javascript-\
        // latitude-longitude-to-xyz-position-on-earth-threejs
        var phi   = Math.PI/2 - lat;
        var theta = Math.PI + lon;
        var x = -(radius * Math.sin(phi) * Math.cos(theta));
        var z = (radius * Math.sin(phi) * Math.sin(theta));
        var y = (radius * Math.cos(phi));

        return new THREE.Vector3(x,y,z);
    },

    /**
     * Routine to convert the cartesian coordinates (x1,y1) - with origin
     *	(x0,y0) - to Polar coordinates. The angle theta is returned in the
     *	range 0 to 2 PI measured clockwise from the y axis (North).
     *
     * @param x0    origin
     * @param y0
     * @param x1    current point
     * @param y1
     *
     * @return polar -  radial distance
     *                  theta - angle CW from north (in radians)
     */
    cartesianToPolarNorth: function ( x0, y0, x1, y1 ) {
        var polar = new THREE.Spherical(0,0,0);

        polar.dist  = this.degreesToMeters( x0, y0, x1, y1 );
        polar.theta = this.findHeading( x0, y0, x1, y1 );

        return polar;
    },

    /**
     * Given two coordinates in degrees, find the heading from the first to the
     * second by the shortest great circle distance
     * location
     *
     * Parameters:   lat0,lon0  - in degrees
     * lat1,lon1  - in degrees
     *
     * Return:			heading in degrees where N = 0, NW = 45 and so on
     */

    findHeading: function ( lon1Deg, lat1Deg, lon2Deg, lat2Deg ) {
        var	lat1,lon1;
        var	lat2,lon2;
        var	heading;
        var	headingDeg;

        lon1Deg = Math.wrapAng( lon1Deg, -180.0, 180.0, 360.0 );
        lat1Deg = Math.wrapAng( lat1Deg, -90.0, 90.0, 180.0 );
        lon2Deg = Math.wrapAng( lon2Deg, -180.0, 180.0, 360.0 );
        lat2Deg = Math.wrapAng( lat2Deg, -90.0, 90.0, 180.0 );

        // convert it all to radians
        lat2    = Math.toRad(lat2Deg);
        lon2    = Math.toRad(lon2Deg);
        lat1    = Math.toRad(lat1Deg);
        lon1    = Math.toRad(lon1Deg);

        heading = Math.fmod( Math.atan2( Math.sin(lon1 - lon2) * Math.cos(lat2),
            Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2)), Math.PI*2);

        headingDeg = Math.toDeg( heading );

        return headingDeg;
    },

    /**
     * Return the distance in meters between two points in lat/lon.
     *
     * @param lon1Deg
     * @param lat1Deg
     * @param lon2Deg
     * @param lat2Deg
     * @returns {*}
     */
    degreesToMeters: function ( lon1Deg, lat1Deg, lon2Deg, lat2Deg ) {
        if ( lat1Deg === lat2Deg && lon1Deg === lon2Deg )
            return 0.0;

        lon1Deg = Math.wrapAng( lon1Deg, -180.0, 180.0, 360.0 );
        lat1Deg = Math.wrapAng( lat1Deg, -90.0, 90.0, 180.0 );
        lon2Deg = Math.wrapAng( lon2Deg, -180.0, 180.0, 360.0 );
        lat2Deg = Math.wrapAng( lat2Deg, -90.0, 90.0, 180.0 );

        var	lat1 = Math.toRad( lat1Deg );
        var	lon1 = Math.toRad( lon1Deg );
        var	lat2 = Math.toRad( lat2Deg );
        var	lon2 = Math.toRad( lon2Deg );

        var	distRad = Math.acos(Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon1-lon2));

        return this.degToMeters( Math.toDeg(distRad) );
    },

    /**
     *   Given a coordinate, heading and distance travelled, finds the new coordinates
     *   Parameters:   lat,lon  - in degrees
     *				  heading  - in degrees, where 0 is north, 45 NW, and so on
     *				  distance - in meters
     *			  newLat, newLon - resulting coordinate, in degrees
     */

    metersToDegrees: function ( lonDeg,	latDeg,	heading, dist )  {

        var	lat,lon;
        var	newLat,newLon;
        var	dLon;
        var	distRad;

        lonDeg = Math.wrapAng( lonDeg, -180.0, 180.0, 360.0 );
        latDeg = Math.wrapAng( latDeg, -90.0, 90.0, 180.0 );

        // convert it all to radians
        lat = Math.toRad(latDeg);
        lon = Math.toRad(lonDeg);

        // note that this is calculated as a function of a nautical circumference where the ratio of
        // nautical mile to statute mile is (5280.0/6076.1149), which is based on the average of the
        // major and minor axes of WGS80
        distRad = Math.toRad( this.metersToDeg(dist) );
        heading = Math.toRad(heading);

        newLat = Math.asin( Math.sin(lat) * Math.cos(distRad) + Math.cos(lat) * Math.sin(distRad) * Math.cos(heading) );
        dLon   = Math.atan2( Math.sin(heading) * Math.sin(distRad) * Math.cos(lat), Math.cos(distRad) - Math.sin(lat) * Math.sin(newLat) );
        newLon = Math.fmod( lon - dLon + Math.PI, Math.TWO_PI ) - Math.PI;

        var newLatDeg = Math.toDeg(newLat);
        var newLonDeg = Math.toDeg(newLon);

        newLonDeg = Math.wrapAng( newLonDeg, -180.0, 180.0, 360.0 );
        newLatDeg = Math.wrapAng( newLatDeg, -90.0, 90.0, 180.0 );

        return new THREE.Vector2( newLatDeg, newLonDeg );

        /*
            // just a check to make sure we got the right value
            double newDist = acos( sin(lat) * sin(newLat) + cos(lat) * cos(newLat) * cos(lon-newLon) );
            newDist = DEG_TO_METERS(RAD2DEG(newDist));
            ASSERT(fabs(newDist-dist) < 100.0);
        */
    },


    /**
     * These methods assume a perfectly spherical earth
     */
    metersToDeg: function (m) {
        return m / Carto.METERPERDEG;
    },

    degToMeters: function (d) {
        return d * Carto.METERPERDEG;
    },

    // AZIM2MATHR(azim) ((PI+HALF_PI)-azim)
    azimuthToRadians: function ( azim ) {
        return (Math.PI * 1.5) - azim;
    },

    // AZIM2MATHD(azim) ((450.0)-azim)
    azimuthToDegrees: function ( azim ) {
        return 450.0 - azimuth;
    },


    /*
     * The following functions take args in degrees and return in meters (or vice versa)
     * From: http://wiki.openstreetmap.org/wiki/Mercator
     */

     // lat lon to mercator
     latlonToMerc: function(lon,lat)
        {
            //lat, lon in rad
            var x = Carto.radius_major * Math.toRad(lon);

            if (lat > 89.5) lat = 89.5;
            if (lat < -89.5) lat = -89.5;


            var temp = Carto.radius_minor / Carto.radius_major;
            var es = 1.0 - Math.sqr(temp);
            var eccent = Math.sqrt(es);

            var phi = Math.toRad(lat);

            var sinphi = Math.sin(phi);

            var con = eccent * sinphi;
            var com = 0.5 * eccent;
            var con2 = Math.pow( (1.0 - con) / (1.0 + con), com);
            var ts = Math.tan(0.5 * (Math.PI * 0.5 - phi)) / con2;
            var y = 0 - Carto.radius_major * Math.log(ts);

           return { 'x' : x, 'y': y };
        },

        mercToLatLon: function(x,y) //mercator to lat lon
        {
            var lon = Math.toDeg((x / Carto.radius_major));

            var temp = Carto.radius_minor / Carto.radius_major;
            var e = Math.sqrt(1.0 - (temp * temp));
            var lat = Math.toDeg( this.pj_phi2( Math.exp( 0 - (y / Carto.radius_major)), e));

            return { 'lon' : lon, 'lat' : lat };
        },

        pj_phi2:function(ts, e)
        {
            var N_ITER = 15;
            var HALFPI = Math.PI/2;


            var TOL = 0.0000000001;
            var Phi, con, dphi;
            var i;
            var eccnth = 0.5 * e;
            Phi = HALFPI - 2. * Math.atan (ts);
            i = N_ITER;
            do
            {
                con = e * Math.sin (Phi);
                dphi = HALFPI - 2. * Math.atan (ts * Math.pow((1.0 - con) / (1.0 + con), eccnth)) - Phi;
                Phi += dphi;

            }
            while ( Math.abs(dphi)> TOL && --i);

            return Phi;
        }

    //usage
    // var merc = this.latlonToMerc(47.6035525, 9.770602);         // output mercator.x, mercator.y
    // var latlon = this.mercToLatLon(5299424.36041, 1085840.05328);  // output latlon.lat, latlon.lon

};
