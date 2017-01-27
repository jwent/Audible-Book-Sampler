'use strict';

var Alexa = require('alexa-sdk');
var audioData = require('./audioAssets');
var constants = require('./constants');

var http = require('http');
var https = require('https');

var IMPRINTS = {
    'avonromance': 'AvonRomance',
    'avon romance': 'AvonRomance',
    'Avon romance': 'AvonRomance',
    'harperone': 'HarperOne',
    'harpercollins 360': 'HarperCollins 360',
    'harpercollins360': 'HarperCollins 360',
    'Galley Titles': 'GalleyTitles',
    'galleytitles': 'GalleyTitles',
    'galley titles': 'GalleyTitles'

};

var stateHandlers = {
    startModeIntentHandlers : Alexa.CreateStateHandler(constants.states.START_MODE, {
        /*
         *  All Intent Handlers for state : START_MODE
         */
        'LaunchRequest' : function () {
            // Initialize Attributes
            this.attributes['playOrder'] = Array.apply(null, {length: audioData.length}).map(Number.call, Number);
            this.attributes['index'] = 0;
            this.attributes['offsetInMilliseconds'] = 0;
            this.attributes['loop'] = true;
            this.attributes['shuffle'] = false;
            this.attributes['playbackIndexChanged'] = true;
            //  Change state to START_MODE
            this.handler.state = constants.states.START_MODE;

            var message = 'Welcome to the Harper Collins Podcast. You can say, play the audio to begin the podcast.';
            var reprompt = 'You can say, play the audio, to begin.';

            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'PlayAudio' : function () {
            if (!this.attributes['playOrder']) {
                // Initialize Attributes if undefined.
                this.attributes['playOrder'] = Array.apply(null, {length: audioData.length}).map(Number.call, Number);
                this.attributes['index'] = 0;
                this.attributes['offsetInMilliseconds'] = 0;
                this.attributes['loop'] = true;
                this.attributes['shuffle'] = false;
                this.attributes['playbackIndexChanged'] = true;
                //  Change state to START_MODE
                this.handler.state = constants.states.START_MODE;
            }
            controller.play.call(this);
        },
        'AMAZON.HelpIntent' : function () {
            var message = 'Welcome to the AWS Podcast. You can say, play the audio, to begin the podcast.';
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        },
        'AMAZON.StopIntent' : function () {
            var message = 'Good bye.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'AMAZON.CancelIntent' : function () {
            var message = 'Good bye.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'SessionEndedRequest' : function () {
            // No session ended logic
        },
        'Unhandled' : function () {
            var message = 'Sorry, I could not understand. Please say, play the audio, to begin the audio.';
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        }
    }),
    playModeIntentHandlers : Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
        /*
         *  All Intent Handlers for state : PLAY_MODE
         */
        'LaunchRequest' : function () {
            /*
             *  Session resumed in PLAY_MODE STATE.
             *  If playback had finished during last session :
             *      Give welcome message.
             *      Change state to START_STATE to restrict user inputs.
             *  Else :
             *      Ask user if he/she wants to resume from last position.
             *      Change state to RESUME_DECISION_MODE
             */
            var message;
            var reprompt;
            if (this.attributes['playbackFinished']) {
                this.handler.state = constants.states.START_MODE;
                message = 'Welcome to the AWS Podcast. You can say, play the audio to begin the podcast.';
                reprompt = 'You can say, play the audio, to begin.';
            } else {
                this.handler.state = constants.states.RESUME_DECISION_MODE;
                message = 'You were listening to ' + audioData[this.attributes['playOrder'][this.attributes['index']]].title +
                    ' Would you like to resume?';
                reprompt = 'You can say yes to resume or no to play from the top.';
            }

            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'OneshotBookIntent' : function () {
            var intent = this.event.request.intent;
            var session = this.event.session;
            var response = this.response;
            handleOneshotBookRequest(intent, session, response);
            controller.play.call(this)
        },
        'PlayAudio' : function () { controller.play.call(this) },
        'AMAZON.NextIntent' : function () { controller.playNext.call(this) },
        'AMAZON.PreviousIntent' : function () { controller.playPrevious.call(this) },
        'AMAZON.PauseIntent' : function () { controller.stop.call(this) },
        'AMAZON.StopIntent' : function () { controller.stop.call(this) },
        'AMAZON.CancelIntent' : function () { controller.stop.call(this) },
        'AMAZON.ResumeIntent' : function () { controller.play.call(this) },
        'AMAZON.LoopOnIntent' : function () { controller.loopOn.call(this) },
        'AMAZON.LoopOffIntent' : function () { controller.loopOff.call(this) },
        'AMAZON.ShuffleOnIntent' : function () { controller.shuffleOn.call(this) },
        'AMAZON.ShuffleOffIntent' : function () { controller.shuffleOff.call(this) },
        'AMAZON.StartOverIntent' : function () { controller.startOver.call(this) },
        'AMAZON.HelpIntent' : function () {
            // This will called while audio is playing and a user says "ask <invocation_name> for help"
            var message = 'You are listening to the AWS Podcast. You can say, Next or Previous to navigate through the playlist. ' +
                'At any time, you can say Pause to pause the audio and Resume to resume.';
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        },
        'SessionEndedRequest' : function () {
            // No session ended logic
        },
        'Unhandled' : function () {
            var message = 'Sorry, I could not understand. You can say, Next or Previous to navigate through the playlist.';
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        }
    }),
    remoteControllerHandlers : Alexa.CreateStateHandler(constants.states.PLAY_MODE, {
        /*
         *  All Requests are received using a Remote Control. Calling corresponding handlers for each of them.
         */
        'PlayCommandIssued' : function () { controller.play.call(this) },
        'PauseCommandIssued' : function () { controller.stop.call(this) },
        'NextCommandIssued' : function () { controller.playNext.call(this) },
        'PreviousCommandIssued' : function () { controller.playPrevious.call(this) }
    }),
    resumeDecisionModeIntentHandlers : Alexa.CreateStateHandler(constants.states.RESUME_DECISION_MODE, {
        /*
         *  All Intent Handlers for state : RESUME_DECISION_MODE
         */
        'LaunchRequest' : function () {
            var message = 'You were listening to ' + audioData[this.attributes['playOrder'][this.attributes['index']]].title +
                ' Would you like to resume?';
            var reprompt = 'You can say yes to resume or no to play from the top.';
            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'AMAZON.YesIntent' : function () { controller.play.call(this) },
        'AMAZON.NoIntent' : function () { controller.reset.call(this) },
        'AMAZON.HelpIntent' : function () {
            var message = 'You were listening to ' + audioData[this.attributes['index']].title +
                ' Would you like to resume?';
            var reprompt = 'You can say yes to resume or no to play from the top.';
            this.response.speak(message).listen(reprompt);
            this.emit(':responseReady');
        },
        'AMAZON.StopIntent' : function () {
            var message = 'Good bye.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'AMAZON.CancelIntent' : function () {
            var message = 'Good bye.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        'SessionEndedRequest' : function () {
            // No session ended logic
        },
        'Unhandled' : function () {
            var message = 'Sorry, this is not a valid command. Please say help to hear what you can say.';
            this.response.speak(message).listen(message);
            this.emit(':responseReady');
        }
    })
};

module.exports = stateHandlers;

var controller = function () {
    return {
        play: function () {
            /*
             *  Using the function to begin playing audio when:
             *      Play Audio intent invoked.
             *      Resuming audio when stopped/paused.
             *      Next/Previous commands issued.
             */
            this.handler.state = constants.states.PLAY_MODE;

            if (this.attributes['playbackFinished']) {
                // Reset to top of the playlist when reached end.
                this.attributes['index'] = 0;
                this.attributes['offsetInMilliseconds'] = 0;
                this.attributes['playbackIndexChanged'] = true;
                this.attributes['playbackFinished'] = false;
            }

            var token = String(this.attributes['playOrder'][this.attributes['index']]);
            var playBehavior = 'REPLACE_ALL';
            var podcast = audioData[this.attributes['playOrder'][this.attributes['index']]];
            var offsetInMilliseconds = this.attributes['offsetInMilliseconds'];
            // Since play behavior is REPLACE_ALL, enqueuedToken attribute need to be set to null.
            this.attributes['enqueuedToken'] = null;

            if (canThrowCard.call(this)) {
                var cardTitle = 'Playing ' + podcast.title;
                var cardContent = 'Playing ' + podcast.title;
                this.response.cardRenderer(cardTitle, cardContent, null);
            }

            this.response.audioPlayerPlay(playBehavior, podcast.url, token, null, offsetInMilliseconds);
            this.emit(':responseReady');
        },
        stop: function () {
            /*
             *  Issuing AudioPlayer.Stop directive to stop the audio.
             *  Attributes already stored when AudioPlayer.Stopped request received.
             */
            this.response.audioPlayerStop();
            this.emit(':responseReady');
        },
        playNext: function () {
            /*
             *  Called when AMAZON.NextIntent or PlaybackController.NextCommandIssued is invoked.
             *  Index is computed using token stored when AudioPlayer.PlaybackStopped command is received.
             *  If reached at the end of the playlist, choose behavior based on "loop" flag.
             */
            var index = this.attributes['index'];
            index += 1;
            // Check for last audio file.
            if (index === audioData.length) {
                if (this.attributes['loop']) {
                    index = 0;
                } else {
                    // Reached at the end. Thus reset state to start mode and stop playing.
                    this.handler.state = constants.states.START_MODE;

                    var message = 'You have reached at the end of the playlist.';
                    this.response.speak(message).audioPlayerStop();
                    return this.emit(':responseReady');
                }
            }
            // Set values to attributes.
            this.attributes['index'] = index;
            this.attributes['offsetInMilliseconds'] = 0;
            this.attributes['playbackIndexChanged'] = true;

            controller.play.call(this);
        },
        playPrevious: function () {
            /*
             *  Called when AMAZON.PreviousIntent or PlaybackController.PreviousCommandIssued is invoked.
             *  Index is computed using token stored when AudioPlayer.PlaybackStopped command is received.
             *  If reached at the end of the playlist, choose behavior based on "loop" flag.
             */
            var index = this.attributes['index'];
            index -= 1;
            // Check for last audio file.
            if (index === -1) {
                if (this.attributes['loop']) {
                    index = audioData.length - 1;
                } else {
                    // Reached at the end. Thus reset state to start mode and stop playing.
                    this.handler.state = constants.states.START_MODE;

                    var message = 'You have reached at the start of the playlist.';
                    this.response.speak(message).audioPlayerStop();
                    return this.emit(':responseReady');
                }
            }
            // Set values to attributes.
            this.attributes['index'] = index;
            this.attributes['offsetInMilliseconds'] = 0;
            this.attributes['playbackIndexChanged'] = true;

            controller.play.call(this);
        },
        loopOn: function () {
            // Turn on loop play.
            this.attributes['loop'] = true;
            var message = 'Loop turned on.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        loopOff: function () {
            // Turn off looping
            this.attributes['loop'] = false;
            var message = 'Loop turned off.';
            this.response.speak(message);
            this.emit(':responseReady');
        },
        shuffleOn: function () {
            // Turn on shuffle play.
            this.attributes['shuffle'] = true;
            shuffleOrder((newOrder) => {
                // Play order have been shuffled. Re-initializing indices and playing first song in shuffled order.
                this.attributes['playOrder'] = newOrder;
                this.attributes['index'] = 0;
                this.attributes['offsetInMilliseconds'] = 0;
                this.attributes['playbackIndexChanged'] = true;
                controller.play.call(this);
            });
        },
        shuffleOff: function () {
            // Turn off shuffle play. 
            if (this.attributes['shuffle']) {
                this.attributes['shuffle'] = false;
                // Although changing index, no change in audio file being played as the change is to account for reordering playOrder
                this.attributes['index'] = this.attributes['playOrder'][this.attributes['index']];
                this.attributes['playOrder'] = Array.apply(null, {length: audioData.length}).map(Number.call, Number);
            }
            controller.play.call(this);
        },
        startOver: function () {
            // Start over the current audio file.
            this.attributes['offsetInMilliseconds'] = 0;
            controller.play.call(this);
        },
        reset: function () {
            // Reset to top of the playlist.
            this.attributes['index'] = 0;
            this.attributes['offsetInMilliseconds'] = 0;
            this.attributes['playbackIndexChanged'] = true;
            controller.play.call(this);
        }
    }
}();

function canThrowCard() {
    /*
     * To determine when can a card should be inserted in the response.
     * In response to a PlaybackController Request (remote control events) we cannot issue a card,
     * Thus adding restriction of request type being "IntentRequest".
     */
    if (this.event.request.type === 'IntentRequest' && this.attributes['playbackIndexChanged']) {
        this.attributes['playbackIndexChanged'] = false;
        return true;
    } else {
        return false;
    }
}

function shuffleOrder(callback) {
    // Algorithm : Fisher-Yates shuffle
    var array = Array.apply(null, {length: audioData.length}).map(Number.call, Number);
    var currentIndex = array.length;
    var temp, randomIndex;

    while (currentIndex >= 1) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        temp = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temp;
    }
    callback(array);
}

function getImprintFromIntent(intent, assignDefault) {

    var imprintSlot = intent.slots.Imprint;
    // slots can be missing, or slots can be provided but with empty value.
    // must test for both.
    if (!imprintSlot || !imprintSlot.value) {
        if (!assignDefault) {
            return {
                error: true
            }
        } else {
            // For sample skill, default to Seattle.
            return {
                imprint: 'AvonRomance',
                error: false
            }
        }
    } else {
        var imprintName = IMPRINTS[imprintSlot.value];

        console.log('imprintName:'+imprintName);

        return {
            imprint: imprintName,
            error: false
        }
    }
}


function handleOneshotBookRequest(intent, session, response) {

    // Determine city, using default if none provided
    console.dir(intent);
    var Imprint = getImprintFromIntent(intent, true),
        repromptText,
        speechOutput;
    
    console.dir(Imprint);

    if (Imprint.error) {
        // invalid city. move to the dialog
        repromptText = "Currently, I have these publishers to choose from: " + getAllImprintsText()
            + "Which publisher would you like a book recommendation for?";
        // if we received a value for the incorrect city, repeat it to the user, otherwise we received an empty slot
        speechOutput = Imprint.imprint ? "I'm sorry, I don't have a book for " + Imprint.imprint + ". " + repromptText : repromptText;

        response.ask(speechOutput, repromptText);
        return;
    }

    // all slots filled, either from the user or by default values. Move to final request
    getFinalBookResponse(Imprint, response);
}

function getFinalBookResponse(Imprint, response) {

    // Issue the request, and respond to the user
    console.dir(Imprint);
    makeBookRequest(Imprint.imprint, function bookResponseCallback(err, bookResponse) {
        var speechOutput;

        speechOutput = bookResponse;

        if (err) {
            speechOutput = "Sorry, the Harper Collins book recommendation service is experiencing a problem. Please try again later";
        }

        var image = {
                "smallImageUrl": "https://s3.amazonaws.com/alexa-card-images/x480.png",
                "largeImageUrl": "https://s3.amazonaws.com/alexa-card-images/x800.png"
            }

        response.tellWithCard(speechOutput, "BookRecommendation", speechOutput, image)
    });
}

function makeBookRequest(station, date, tideResponseCallback) {

    var datum = "MLLW";
    var endpoint = 'http://api.harpercollins.com/titleservice/v1/products?catalog=AvonRomance&page=1&api_key=6t8fg4vxxcjxm3hhxuccq4fc&sig=2a97ec69cb0aa0c5bd742c95d6e20c67f4ebaccc4043a00384796a23c8468c9b';
    var queryString = '?' + date.requestDateParam;
    queryString += '&station=' + station;
    queryString += '&product=predictions&datum=' + datum + '&units=english&time_zone=lst_ldt&format=json';
    queryString = '';
    var book = 0;
    var title = 'Some title.';
    var author = 'Some author.';
    var noaaResponseString = '';

    http.get(endpoint + queryString, function (res) {

        /*books.search('Professional JavaScript for Web Developers', function(error, results) {
            if ( ! error ) {
                //console.log("results");
            } else {
                console.log(error);
            }
        });*/

        
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            tideResponseCallback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            noaaResponseString += data;
        });

        res.on('end', function () {
            
            var noaaResponseObject = JSON.parse(noaaResponseString);
            console.log(noaaResponseObject.data[0]);
            
            book = noaaResponseObject.data[0];
            title = book.title;
            author = book.contributors[0].name;
            var keynote = striptags(book.keynote);

            tideResponseCallback(null, "How about " + title + " by " + author + ';' + keynote);
        });
    }).on('error', function (e) {
        console.log("Communications error: " + e.message);
        tideResponseCallback(new Error(e.message));
    });
}
