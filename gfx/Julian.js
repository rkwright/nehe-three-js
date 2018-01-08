/*
 * Simple Julian calendar utilities
 *
 * @author rkwright / www.geofx.com
 *
 * Copyright 2017, All rights reserved.
 */

/**
 * Constants
 */
var Julian = {
    revision: '1.0'
};

/**
 * @constructor
 */
Julian.Julian = function () {
};

Julian.Julian.prototype = {

    /**
     * get the month from a a Julian value
     */
    getMonth: function ( julianDay, year ) {
        var mois = Math.floor(julianDay / 30.42) + 1;
        if ((julianDay === 60)  &&  ((year % 4) !== 0))  mois++;
        if ((julianDay === 91) || (julianDay === 121) || (julianDay === 152) || (julianDay === 182))  mois++;
        if (julianDay === 31)   mois--;

        return mois;
    },

    /**
     *  get the day of the month from a Julian date
     */
    getDayOfMonth: function ( julianDay, year ) {
        var mois = 	this.getMonth( julianDay, year );

        return Math.floor(julianDay - this.getJulian(1, Math.floor(mois), year) + 1);
    },

    /**
     * get a Julian date from the dddmmyy value
     */
    getJulian: function ( jour, mois, annee ) {
        var   j = Math.floor( (30.42 * (mois - 1)) + jour);

        if (mois === 2)  j++;
        if ((mois > 2)  &&  (mois < 8))  j--;
        if ((mois > 2)  &&  ((annee % 4) === 0)  &&  (annee !== 0))  j++;

        return Math.floor(j);
    }
};