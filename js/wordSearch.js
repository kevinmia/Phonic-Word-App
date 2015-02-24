/*
 * Created by Miao on 3/29/14.
 */
var txtlines3 = [];              // array for every line in text files
var soundCodes = [];             // array for sound code phonemes
var ipa = [];                    // array for IPA phonemes
var wordList = [];               // all existing words in the database
var phonics = [];                // array for selected sound spellings
var phonics2 = [];
var phonics3 = [];
var wordMatch = [];              // array for words that are found in the word search
var words = [];
var numLimitSyl;
var numLimitLet;
var badWords = ["anal", "anus", "ass", "asshole", "assholes", "bastard", "bastards", "bitch", "bitches", "boner", "boners", "boob", "boobs", "breast", "breasts", "bullshit", "chink", "clitoris", "cocaine", "cock", "cocks", "cunt", "dick", "dicks", "dike", "dildo", "douche", "drunk", "drunks", "dyke", "erection", "erections", "faggot", "faggots", "fag", "fags", "fuck", "genitalia", "heroin", "jackass", "marijuana", "nigger", "penis", "piss", "pussy", "scrotum", "semen", "shit", "testicle", "testicles", "tit", "tits", "vagina", "whore", "whore"];

$(document).ready(function() {
    // load AmericanWordDataList.txt and create the list for all words when document is ready
    $.get('AmericanWordDataList.txt', function(data) {
        txtlines3 = data.split('\n');
        txtlines3.forEach(function(value) {
            var split = value.split("\t");
            if (split[2].length > 1) {
                wordList.push({word:split[0], fullPhonic:split[1], phonic:split[2], phonNum:split[4], sylNum:split[5], freq:split[7]});
            }
        });
    }, 'text');

    // max syllable limit
    numLimitSyl = 4;

    $("#sylgroup").find(".syl").click(function(){
        $("#sylgroup").find(".syl").removeClass("active");
        $(this).addClass("active");
        numLimitSyl = parseInt($(this).attr("value"));
    });

    // max letter limit
    numLimitLet = 10;

    $("#letgroup").find(".let").click(function(){
        $("#letgroup").find(".let").removeClass("active");
        $(this).addClass("active");
        numLimitLet = parseInt($(this).attr("value"));
    });

    // frequency slider
    initializeFreqSlider();
});

/*
 * search through word list
 */
function searchWordList(selected1, selected2, selected3) {
    if (advancedSearch) {
        searchWordListAdvAux(selected1, selected2, selected3);
    } else {
        searchWordListAux(selected1);
    }
}

/*
 * auxiliary function for search with one list
 */
function searchWordListAux(selected) {
    phonics = [];
    wordMatch = [];

    var frequency = $("#slider").val();

    // add selected phonics
    selected.forEach(function(value) {
        phonics.push(value.gpc);
    });

    // flag to determine if word does not match selected sound spellings and other criteria
    var shouldBeAdded = true;

    // make sure sound spellings list is not empty
    if (selected.length != 0) {
        for (i = 0; i < wordList.length; i++) {
            var k = 0;

            shouldBeAdded = true;
            while (k < selected.length && shouldBeAdded) {
                phonics.forEach(function(val) {
                    // don't add words over syllable limit
                    if (numLimitSyl != 0) {
                        if (wordList[i].sylNum > numLimitSyl) {
                            shouldBeAdded = false;
                            return;
                        }
                    }

                    // don't add words over letter limit
                    if (numLimitLet != 0) {
                        if (wordList[i].word.length > numLimitLet) {
                            shouldBeAdded = false;
                            return;
                        }
                    }

                    // don't add words with no corresponding phonemes
                    if (wordList[i].phonic.indexOf(val) == -1) {
                        shouldBeAdded = false;
                        return;
                    }

                    // avoid adding words if sound spelling is a subset of another (e.g. aa = /ə/ is not the same as aa = /ə/, but are processed as the same)
                    if (wordList[i].phonic[wordList[i].phonic.indexOf(val)-1] != " " && wordList[i].phonic.indexOf(val) != 0) {
                        shouldBeAdded = false;
                        return;
                    }
                });

                // don't add if does not between frequency min and max
                if (wordList[i].freq < parseInt(frequency[0])-1 || wordList[i].freq > parseInt(frequency[1])) {
                    shouldBeAdded = false;
                }

                // don't add if word is in the bad word list
                if (badFilter) {
                    if (binaryIndexOf.call(badWords, wordList[i].word) != -1) {
                        shouldBeAdded = false;
                    }
                }

                k++;
            }

            if (shouldBeAdded) {
                // push entire value
                wordMatch.push({word:wordList[i].word, phonic:wordList[i].phonic, fullPhonic:wordList[i].fullPhonic, freq:wordList[i].freq});
            }
        }

        if (wordMatch.length > 0) {
            $('#alert').html('<div id="alert"><div id="fade" class="alert alert-success alert-dismissable fade in" style="font-size:small"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>Done!</div></div>');
            setTimeout(function() {
                $("#fade").fadeTo(1000, 0).slideUp(1000, function(){
                    $(this).remove();
                });
            }, 2000);
        } else if (wordMatch.length == 0) {
            $('#alert').html('<div id="alert"><div id="fade" class="alert alert-danger alert-dismissable fade in" style="font-size:small"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>No results found</div></div>');
            setTimeout(function() {
                $("#fade").fadeTo(1000, 0).slideUp(1000, function(){
                    $(this).remove();
                });
            }, 2000);
        }
    } else {
        $('#alert').html('<div id="alert"><div id="fade" class="alert alert-danger alert-dismissable fade in" style="font-size:small"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>Select one or more phonemes</div></div>');
        setTimeout(function() {
            $("#fade").fadeTo(1000, 0).slideUp(1000, function(){
                $(this).remove();
            });
        }, 2000);
    }

    // set up processed word list to display
    for (var i = 0; i < wordMatch.length; i++) {
        if (wordMatch[i].word == "Select one or more phonemes" || wordMatch[i].word == "No results found") {
            return;
        } else {
            var split = wordMatch[i].phonic.split(' ');
            var phonics = "";

            split.forEach(function(val, index) {
                if (ipaFlag) {
                    ipa.forEach(function(v) {
                        if (val.substring(val.indexOf("[")+1, val.indexOf("]")) == v.code && val.substring(val.indexOf("[")+1, val.indexOf("]")) != "") {
                            split[index] = val.substring(0, val.indexOf("[")) + " = /" + String.fromCharCode(parseInt(v.one, 16)) + String.fromCharCode(parseInt(v.two, 16)) + String.fromCharCode(parseInt(v.three, 16)) + "/";
                        }

                        if (val.substring(val.indexOf("[")+1, val.indexOf("]")) == "") {
                            split[index] = val.substring(0, val.indexOf("[")) + " = / /";
                        }
                    });

                    phonics += " " + split[index] + " ";
                } else {
                    soundCodes.forEach(function(v) {
                        if (val.substring(val.indexOf("[")+1, val.indexOf("]")) == v.code && val.substring(val.indexOf("[")+1, val.indexOf("]")) != "") {
                            split[index] = val.substring(0, val.indexOf("[")) + " = /" + String.fromCharCode(parseInt(v.one, 16)) + String.fromCharCode(parseInt(v.two, 16)) + String.fromCharCode(parseInt(v.three, 16)) + String.fromCharCode(parseInt(v.four, 16)) + String.fromCharCode(parseInt(v.five, 16)) + "/";
                        }

                        if (val.substring(val.indexOf("[")+1, val.indexOf("]")) == "") {
                            split[index] = val.substring(0, val.indexOf("[")) + " = / /";
                        }
                    });

                    phonics += " " + split[index] + " ";
                }
            });

            wordMatch[i].phonic = phonics;
        }
    }

    // sort list by frequency
    if (freqDes) {
        wordMatch.sort(compareFreqDes);
    } else if (document.getElementById("freqsort").className == "glyphicon glyphicon-arrow-up") {
        wordMatch.sort(compareFreqAsc);
    } else if (alphaDes) {
        wordMatch.sort(compareWordDes);
    } else if (document.getElementById("alphasort").className == "glyphicon glyphicon-arrow-up") {
        wordMatch.sort(compareWordAsc);
    }
}

function searchWordListAdvAux(selected1, selected2, selected3) {
    phonics = [];
    phonics2 = [];
    phonics3 = [];
    wordMatch = [];
    var wordMatchAux = [];
    var wordMatchAux2 = [];
    var frequency = $("#slider").val();

    selected1.forEach(function(value) {
        phonics.push(value.gpc);
    });

    selected2.forEach(function(value) {
        phonics2.push(value.gpc);
    });

    selected3.forEach(function(value) {
        phonics3.push(value.gpc);
    });

    var shouldBeAdded = true;
    var existOr = false;
    if (selected1.length != 0) {
        for (var i = 0; i < wordList.length; i++) {
            var k = 0;
            shouldBeAdded = true;
            existOr = false;
            while (k < selected1.length && shouldBeAdded) {
                if (document.getElementById("only").checked) {
                    for (var j = 0; j < phonics.length; j++) {
                        if (wordList[i].phonic.indexOf(phonics[j]) == -1 || wordList[j].phonNum > phonics.length) {
                            shouldBeAdded = false;
                            return;
                        }
                    }
                }

                phonics.forEach(function(val, ind) {
                    // don't add words over syllable limit
                    if (numLimitSyl != 0) {
                        if (wordList[ind].sylNum > numLimitSyl) {
                            shouldBeAdded = false;
                            return;
                        }
                    }

                    // don't add words over letter limit
                    if (numLimitLet != 0) {
                        if (wordList[i].word.length > numLimitLet) {
                            shouldBeAdded = false;
                            return;
                        }
                    }

                    // don't add words with no corresponding phonemes
                    if (wordList[i].phonic.indexOf(val) == -1) {
                        shouldBeAdded = false;
                        return;
                    } else {
                        existOr = true;
                    }

                    if (wordList[i].phonic[wordList[i].phonic.indexOf(val)-1] != " " && wordList[i].phonic.indexOf(val) != 0) {
                        shouldBeAdded = false;
                        return;
                    }
                });

                if (!existOr) {
                    shouldBeAdded = false;
                }

                if (wordList[i].freq < parseInt(frequency[0])-1 || wordList[i].freq > parseInt(frequency[1])) {
                    shouldBeAdded = false;
                }

                if (badFilter) {
                    if (binaryIndexOf.call(badWords, wordList[i].word) != -1) {
                        shouldBeAdded = false;
                    }
                }

                k++;
            }

            if (shouldBeAdded) {
                // push entire value
                wordMatchAux.push({word:wordList[i].word, phonic:wordList[i].phonic, fullPhonic:wordList[i].fullPhonic, freq:wordList[i].freq});
            }
        }

        if (phonics2.length > 0) {
            wordMatch = [];

            wordMatchAux.forEach(function(value) {
                existOr = false;
                phonics2.forEach(function(val) {
                    if (value.phonic.indexOf(val) != -1) {
                        existOr = true;
                    }
                });

                if (existOr) {
                    wordMatchAux2.push({word:value.word, phonic:value.phonic, fullPhonic:value.fullPhonic, freq:value.freq});
                }
            });

            wordMatch = wordMatchAux2;
        } else {
            wordMatch = wordMatchAux;
        }

        if (phonics3.length > 0) {
            wordMatch = [];
            wordMatchAux2.forEach(function(value) {
                existOr = false;
                phonics3.forEach(function(val) {
                    if (value.phonic.indexOf(val) != -1) {
                        existOr = true;
                    }
                });

                if (existOr) {
                    wordMatch.push({word:value.word, phonic:value.phonic, fullPhonic:value.fullPhonic, freq:value.freq});
                }
            });
        }

        if (wordMatch.length > 0) {
            $('#alert').html('<div id="alert"><div id="fade" class="alert alert-success alert-dismissable fade in" style="font-size:small"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>Done!</div></div>');
            setTimeout(function() {
                $("#fade").fadeTo(1000, 0).slideUp(1000, function(){
                    $(this).remove();
                });
            }, 2000);
        } else if (wordMatch.length == 0) {
            $('#alert').html('<div id="alert"><div id="fade" class="alert alert-danger alert-dismissable fade in" style="font-size:small"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>No results found</div></div>');
            setTimeout(function() {
                $("#fade").fadeTo(1000, 0).slideUp(1000, function(){
                    $(this).remove();
                });
            }, 2000);
        }
    } else {
        $('#alert').html('<div id="alert"><div id="fade" class="alert alert-danger alert-dismissable fade in" style="font-size:small"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>Select one or more phonemes</div></div>');
        setTimeout(function() {
            $("#fade").fadeTo(1000, 0).slideUp(1000, function(){
                $(this).remove();
            });
        }, 2000);
    }

    // set up processed word list to display
    wordMatch.forEach(function(value) {
        if (value.word == "Select one or more phonemes" || value.word == "No results found") {
            return;
        } else {
            var split = value.phonic.split(' ');
            var phonics = "";

            split.forEach(function(val, index) {
                if (ipaFlag) {
                    ipa.forEach(function(v) {
                        if (val.substring(val.indexOf("[")+1, val.indexOf("]")) == v.code && val.substring(val.indexOf("[")+1, val.indexOf("]")) != "") {
                            split[index] = val.substring(0, val.indexOf("[")) + " = /" + String.fromCharCode(parseInt(v.one, 16)) + String.fromCharCode(parseInt(v.two, 16)) + String.fromCharCode(parseInt(v.three, 16)) + "/";
                        }

                        if (val.substring(val.indexOf("[")+1, val.indexOf("]")) == "") {
                            split[index] = val.substring(0, val.indexOf("[")) + " = / /";
                        }
                    });

                    phonics += " " + split[index] + " ";
                } else {
                    soundCodes.forEach(function(v) {
                        if (val.substring(val.indexOf("[")+1, val.indexOf("]")) == v.code && val.substring(val.indexOf("[")+1, val.indexOf("]")) != "") {
                            split[index] = val.substring(0, val.indexOf("[")) + " = /" + String.fromCharCode(parseInt(v.one, 16)) + String.fromCharCode(parseInt(v.two, 16)) + String.fromCharCode(parseInt(v.three, 16)) + String.fromCharCode(parseInt(v.four, 16)) + String.fromCharCode(parseInt(v.five, 16)) + "/";
                        }

                        if (val.substring(val.indexOf("[")+1, val.indexOf("]")) == "") {
                            split[index] = val.substring(0, val.indexOf("[")) + " = / /";
                        }
                    });

                    phonics += " " + split[index] + " ";
                }
            });

            value.phonic = phonics;
        }
    });

    // sort list by frequency
    if (freqDes) {
        wordMatch.sort(compareFreqDes);
    } else if (document.getElementById("freqsort").className == "glyphicon glyphicon-arrow-up") {
        wordMatch.sort(compareFreqAsc);
    } else if (alphaDes) {
        wordMatch.sort(compareWordDes);
    } else if (document.getElementById("alphasort").className == "glyphicon glyphicon-arrow-up") {
        wordMatch.sort(compareWordAsc);
    }
}

/**
 * Performs a binary search on the host array. This method can either be
 * injected into Array.prototype or called with a specified scope like this:
 * binaryIndexOf.call(someArray, searchElement);
 *
 * @param {*} searchElement The item to search for within the array.
 * @return {Number} The index of the element which defaults to -1 when not found.
 */
function binaryIndexOf(searchElement) {
    'use strict';

    var minIndex = 0;
    var maxIndex = this.length - 1;
    var currentIndex;
    var currentElement;

    while (minIndex <= maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentElement = this[currentIndex];

        if (currentElement < searchElement) {
            minIndex = currentIndex + 1;
        }
        else if (currentElement > searchElement) {
            maxIndex = currentIndex - 1;
        }
        else {
            return currentIndex;
        }
    }

    return -1;
}

function initializeFreqSlider() {
    $("#slider").noUiSlider({
        start: [0, 25000000],
        behaviour: 'drag-tap',
        connect: true,
        range: {
            'min': [     0 ],
            '10%': [   5000,  1000 ],
            '25%': [  50000, 10000 ],
            '50%': [  500000, 100000 ],
            '75%': [  5000000, 1000000 ],
            'max': [ 25000000 ]
        },

        serialization: {

            lower: [

                $.Link({
                    // Place the value in the #value element,
                    // using the text method.
                    target: $("#minFreq"),
                    method: "text"
                }),

                $.Link({
                    target: $("#minFreq"),
                    format: {
                        // Write the value using 1 decimal.
                        decimals: 0
                    }
                })

            ],

            upper: [

                $.Link({
                    // Link accepts functions too.
                    // The arguments are the slider value,
                    // the .noUi-handle element and the slider instance.
                    target: function( value, handleElement, slider ){

                        $("#maxFreq").text( value );

                    }
                }),

                $.Link({
                    target: $("#maxFreq"),
                    format: {
                        // Write the value using 1 decimal.
                        decimals: 0
                    }
                }),

                $.Link({
                    // When you pass a string to a link,
                    // it will create a hidden input.
                    // You'll see the value appear when you
                    // alert the form contents.
                    target: "inputName"
                })

            ],

            // Set some default formatting options.
            // These options will be applied to any Link
            // that doesn't overwrite these values.
            format: {
                decimal: 0
            }

        }
    });
}