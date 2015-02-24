/**
 * Created by Miao on 3/29/14.
 */
var lines3 = new Array();
var wordList = new Array();
var phonics = new Array();
var wordMatch = new Array();
var numLimitSyl;

$(document).ready(function() {
    $.get('AmericanWordList.txt', function(data) {
        lines3 = data.split('\n');
        lines3.forEach(function(value) {
            var split = value.split("\t");
            wordList.push({word:split[0], fullPhonic:split[1], phonic:split[2]});
        });

        wordList.sort(compare);
    }, 'text');

    numLimitSyl = $('#slider').slider()
        .data('slider');
});
/*
 $('#button').button();

 $('#button').click(function () {
 $(this).button('loading');
 searchWordList(selectedLetters);
 searchWords();
 $(this).button('reset');

 });*/

function compare(a,b) {
    if (a.word < b.word)
        return -1;
    if (a.word > b.word)
        return 1;
    return 0;
}

function searchWordList(selected) {
    phonics = [];
    wordMatch = [];

    selected.forEach(function(value) {
        //phonics.push(value.substring(0,value.indexOf("=")-1) + "[" + value.substring(value.indexOf("/")+1,value.length-1) + "]");
        phonics.push(value.gpc);
    });

    var shouldBeAdded = true;
    if (selected.length != 0) {
        wordList.forEach(function(value, index) {
            var k = 0;
            shouldBeAdded = true;
            while (k < selected.length && shouldBeAdded) {
                phonics.forEach(function(val, i) {
                    if (value.phonic.indexOf(val) == -1) {
                        shouldBeAdded = false;
                        return;
                    }

                    if (numLimitSyl.value[0] != 0) {
                        var count = 0;

                        for (var p = 0; p < value.fullPhonic.length; p++) {
                            if (value.fullPhonic.charAt(p) == ']') {
                                count++;
                            }
                        }

                        if (count > numLimitSyl.value[0]) {
                            shouldBeAdded = false;
                            return;
                        }
                    }
                });

                k++;
            }

            if (shouldBeAdded) {
                wordMatch.push({word:value.word, phonic:value.phonic, fullPhonic:value.fullPhonic});  // push entire value and print word
            }
        });
        if (wordMatch.length == 0) {
            wordMatch.push({word:"No results found"});
        }
    } else {
        wordMatch.push({word:"Select one or more IPA codes"});
    }

    wordMatch.forEach(function(value) {
        var split = value.phonic.split(' ');
        var phonics = "";

        split.forEach(function(v) {
            phonics += "  [" + v.substring(0, v.indexOf("[")) + " = /" + v.substring(v.indexOf("[")+1, v.indexOf("]")) + "/]  ";
        });

        value.phonic = phonics;
    });
}