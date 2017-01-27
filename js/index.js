'use strict';

var Alexa = require('alexa-sdk');
var constants = require('./constants');
var stateHandlers = require('./stateHandlers');
var audioEventHandlers = require('./audioEventHandlers');

exports.handler = function(event, context, callback){
    var alexa = Alexa.handler(event, context);
    alexa.appId = constants.appId;
    alexa.dynamoDBTableName = constants.dynamoDBTableName;
    alexa.registerHandlers(
        stateHandlers.startModeIntentHandlers,
        stateHandlers.playModeIntentHandlers,
        stateHandlers.remoteControllerHandlers,
        stateHandlers.resumeDecisionModeIntentHandlers,
        audioEventHandlers
    );

    alexa.execute();

    /*
    if (event.context.System.device.supportedInterfaces.AudioPlayer === undefined) {
        alexa.emit(':tell', 'Sorry, this skill is not supported on this device');
    }
    else {
        alexa.execute();
    }*/
};

/**
 * Formats the height, rounding to the nearest 1/2 foot. e.g.
 * 4.354 -> "four and a half feet".
 */
function getFormattedHeight(height) {
    var isNegative = false;
    if (height < 0) {
        height = Math.abs(height);
        isNegative = true;
    }

    var remainder = height % 1;
    var feet, remainderText;

    if (remainder < 0.25) {
        remainderText = '';
        feet = Math.floor(height);
    } else if (remainder < 0.75) {
        remainderText = " and a half";
        feet = Math.floor(height);
    } else {
        remainderText = '';
        feet = Math.ceil(height);
    }

    if (isNegative) {
        feet *= -1;
    }

    var formattedHeight = feet + remainderText + " feet";
    return formattedHeight;
}

function getGenreFromIntent(intent, assignDefault) {

    var genreSlot = intent.slots.Genre;

    if (!genreSlot || !genreSlot.value) {
        if (!assignDefault) {
            return {
                error: true
            }
        } else {
            return {
                genre: 'romance',
                error: false
            }
        }
    } else {
        var genre = genreSlot.value;
        
        if (GENRES.indexOf(genre.toLowerCase() != -1)) {
            return {
                genre: genre,
                error: false
            }
        } else {
            return {
                error: true
            }
        }
    }
}

/**
 * Gets the date from the intent, defaulting to today if none provided,
 * or returns an error
 */
function getDateFromIntent(intent) {

    var dateSlot = intent.slots.Date;
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    if (!dateSlot || !dateSlot.value) {
        // default to today
        return {
            displayDate: "Today",
            requestDateParam: "date=today"
        }
    } else {

        var date = new Date(dateSlot.value);

        // format the request date like YYYYMMDD
        var month = (date.getMonth() + 1);
        month = month < 10 ? '0' + month : month;
        var dayOfMonth = date.getDate();
        dayOfMonth = dayOfMonth < 10 ? '0' + dayOfMonth : dayOfMonth;
        var requestDay = "begin_date=" + date.getFullYear() + month + dayOfMonth
            + "&range=24";

        return {
            displayDate: alexaDateUtil.getFormattedDate(date),
            requestDateParam: requestDay
        }
    }
}

function getAllImprintsText() {
    var imprintList = '';
    for (var imprint in IMPRINTS) {
        imprintList += imprint + ", ";
    }

    return imprintList;
}

function getAllGenresText() {
    var genreList = '';
    GENRES.forEach (function(e) {
        genreList += e + ", ";
    });

    return genreList;
}



