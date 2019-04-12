'use strict';


// Opens/closes 'Search poets' and 'Predefined searches' on mobile/smaller screens.
// May not be necessary for larger screens.
function toggleCollapsibleMenus() {
    
    $(".js-predefined-searches").click(function() {
        $(".js-predefined-searches-list").toggleClass("hidden");
        $(".js-predefined-searches").toggleClass("searches-collapsible searches-active ");
    });

    $(".js-poet-search").click(function() {
        $(".js-poet-search-form").toggleClass("hidden");
        $(".js-poet-search").toggleClass("searches-collapsible searches-active");
    });
}

// For multiple poets, only a comma delimited list with no spaces is acceptable.
// Simple validation from: 
// https://developer.mozilla.org/en-US/docs/Learn/HTML/Forms/Form_validation#Customized_error_messages
function validateForm() {
    
    const poets = document.getElementById("poets");

    poets.addEventListener("input", event => {
      
        // if the input does not match the pattern defined with the pattern attribute on the input
        // element of the form, a custom error message is alerted.
        if (poets.validity.patternMismatch) {
            poets.setCustomValidity("No spaces please. Enter poet names separated by commas.");
        
        // If input matches pattern, setCustomValidity to empty string, which effectively
        // clears any error message. 
        } else {
            poets.setCustomValidity("");
        }
    }); 
}

// Global data structure for data pull from API. 
const allData = [];

// Helper function for getAllPoetData.
function makePoetDataObject(results) {
    return {
        name: results[0].author,
        individualData: results
    };
}

// Won't need this function if I stay with PoetryDb, but 
// leaving it in for now just in case. 
/* function formatQueryParams(params) {

    const queryItems = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
    
        return queryItems.join("&");
}  */

// Helper function for onPoetsEntered.
// Leaving this as a function in case I change to an API with 
// more required parameters. 
function constructPoetryDBUrl(poet) {
    return `http://poetrydb.org/author/${poet}`;

    /* const params = {
        author: states,
        limit: maxResults - 1,
        fields: "addresses",
        api_key: npsApikey,
    };

    const url = `${baseUrl}${formatQueryParams(params)}`; */

    /* const options = {
        headers: new Headers({
        'accept': 'application/json'
        })
    }; */
}

// Helper function for getAggregateArrayOfWords and makeSeparateWordsObject.
function flattenToWordsOnly(currentPoetObject) {
    return currentPoetObject.individualData.flatMap(currentPoetData => {
        return currentPoetData.lines.flatMap(line => { 
            return line.toLowerCase().split(" ").flatMap(word => {
               return word.match(/[a-z']+/g);  
            });
        });
    });
}

 
function getAggregateArrayOfWords(allData) {

    // Using nested flatMaps to get down to the words in each poem. 
    // Changing each word to lowercase, removing punctuation marks (except 
    // apostrophes and hyphens), removing empty strings and nulls (see below
    // for more on null). 
    const words = allData.flatMap(flattenToWordsOnly);

    // Need to do a secondary filter to remove several pesky nulls that weren't
    // removed with the match(regex) above. I'm not exactly sure why they are there...
    // Regardless, this extra step removes them and ensures we have an array of only words. 
    return words.filter(word => word !== null);
   
} 

// Helper function for getIndividualArraysOfWords.
// Saving new object that relates poet to their list of words.
// This is so I can identify the words by poet name (which is 
// pretty obvious, I guess. :) )
function makeSeparateWordsObject(currentPoetObject) {
    return {
        poet: currentPoetObject.name,
        justWords: flattenToWordsOnly(currentPoetObject)
    };
}

// Produces an array of objects that relate a poet to their words.
function getIndividualArraysOfWords(allData) {

    const separateWords = allData.map(makeSeparateWordsObject);
    console.log("separateWords", separateWords);

    separateWords.forEach(IndividualPoetWordsObject => {
        IndividualPoetWordsObject.justWords = IndividualPoetWordsObject.justWords.filter(word => word !== null);
    })

    return separateWords;

}

// Helper function for getIndividualWordFrequencyAnalysis and 
// to get the AggregateWordFrequencyAnalysis.
// Filters out common words like "a", "the", "and" from the Object. 
// Converts object to array of subarrays to sort results and restrict to top 100.
// Then converts back to an object. 
// I'm sure there is a better way to do this... 
function filterAndRestrictWordFrequency(wordFrequency) {
    
    // Iterate over keys, delete keys (and thereby values) that are 
    // in the notTheseWords array. These words don't have a lot of meaning
    // when taken out of the context of their sentences.
    const notTheseWords = ["a", "and", "as", "at", "but", "by", "for", "from", 
                            "in", "it", "its", "of", "on", "or", "that", 
                            "the", "then", "this", "these", "those", "though", 
                            "to", "upon", "with"];
    
    // Delete key/value pairs that are in the notTheseWords array.
    Object.keys(wordFrequency).forEach(key => {
        if (notTheseWords.includes(key.toString())) {
            delete wordFrequency[key];
        }
    });

    // Convert wordFrequency object to an array of subarrays and sort. 
    // Attribution: https://stackoverflow.com/questions/1069666/sorting-javascript-object-by-property-value
    var sortWordFrequency = [];
    for (let word in wordFrequency) {
        sortWordFrequency.push([word, wordFrequency[word]]);
    }
    
    sortWordFrequency.sort((a, b) => {
        return b[1] - a[1];
    });

    // Slice off first 100 words of sorted array.
    let first100Words = sortWordFrequency.slice(0, 100);

    // Reduce array to new word frequency object for top 100 words.
    // {word1: 34, word2: 23...}
    return first100Words.reduce((first100, currentWordArray) => {
        first100[currentWordArray[0]] = currentWordArray[1];
        return first100;
    }, {});

}

// Helper function for getIndividualWordFrequencyAnalysis and 
// getAggregateWordFrequencyAnalysis.
// Reduces an array to an object of word frequencies.
// {word1: 13, word2: 44, ...}
function reduceWordArrayToWordFrequency(wordArray) {
    return wordArray.reduce(
        (wordFrequencyAccumulator, currentWord) => {
            if (wordFrequencyAccumulator.hasOwnProperty(currentWord)) {
                wordFrequencyAccumulator[currentWord]+= 1;
            } else {
                wordFrequencyAccumulator[currentWord] = 1;
            }
            return wordFrequencyAccumulator;
        }, {});
}

// Produces a word frequency object for each individual poet.
// { Shakespeare: {word1: 1, word2: 15}, "Emily Dickinson": {word1: 15, word2: 25}, ...}
function getIndividualWordFrequencyAnalysis(individualWordArrayOfObjects) {

    const individualPoetWordFrequency = {}; 
    
    individualWordArrayOfObjects.forEach(currentPoet => {
        individualPoetWordFrequency[currentPoet.poet] = 
            filterAndRestrictWordFrequency(reduceWordArrayToWordFrequency(currentPoet.justWords));
    });

    return individualPoetWordFrequency;
}

////////////// This function may be unnecessary!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// Produces a word frequency object for the aggregate of multiple poets or for 
// a single poet.
// {word1: 45, word2: 16, word3: 1,...}
/* function getAggregateWordFrequencyAnalysis(aggregateWordArray) {
    //return reduceWordArrayToWordFrequency(aggregateWordArray);
    //return filterAndRestrictWordFrequency(reduceWordArrayToWordFrequency(aggregateWordArray));
    return filterAndRestrictWordFrequency(reduceWordArrayToWordFrequency(aggregateWordArray));
} */

/* function mapWordFrequencyToChartSeries() {

} */

// Creates a data series for each poet when compare is checked. Highcharts will 
// plot the multiple data series together on a single chart for comparison.
function createIndividualComparisonChart(individualPoetWordFrequency) {
    
    const poetSeries = Object.keys(individualPoetWordFrequency).map(key => {
        return {
            name: key,
            data: Object.keys(individualPoetWordFrequency[key]).map(wordKey => {
                return {
                    value: individualPoetWordFrequency[key][wordKey],
                    name: wordKey
                };
            })
        };
    });

    console.log("poetSeries:", poetSeries);

    return Highcharts.chart('container', {
        chart: {
          type: 'packedbubble'
        },
        series: poetSeries
      });
    
    
   /*  return Highcharts.chart('container', {
        chart: {
          type: 'packedbubble'
        },
        series: [{
          data: [50, 12, 33, 45, 60]
        }]
      }); */
}



function processAllData(allData, compare) {
    
    console.log("allData array:", allData);

    // move below into display function!!!!!!!!!!!!!!!!
    const poetNameString = allData
        .map(currentPoet => currentPoet.name)
        .join(", ");

    $(".js-results").html(`Results for: ${poetNameString}`).removeClass("hidden");
    
    
    $(".js-results").append(`
        <div class="aggregate-chart" id="container"></div>
    `);




    // Get word arrays: 
    
    // If compare is checked, an additional data structure will be created
    // containing information for each individual poet. 
    let individualWordArrayOfObjects = [];
    let individualPoetWordFrequency;
    if (compare) {
        
        // Get word arrays for each individual poet. 
        individualWordArrayOfObjects = getIndividualArraysOfWords(allData);

        // Get a word frequency object for each individual poet.
        // { Shakespeare: {word1: 1, word2: 15}, "Emily Dickinson": {word1: 15, word2: 25}, ...}
        individualPoetWordFrequency = getIndividualWordFrequencyAnalysis(individualWordArrayOfObjects);

        // Create packed bubble chart using HighCharts from word frequency object.
      //  createIndividualComparisonChart(individualPoetWordFrequency);
        
        // create poem object for each poet

        // create data table for each poet
    }

    // All of the following data structures will always be created. They are either
    // for when a single poet is entered or for when only aggregate information is 
    // requested for multiple poets. Also, the aggregate data will be displayed along 
    // with the individual poet information when compare IS checked. 

    // Get word arrays for single or aggregate poets.
    const aggregateWordArray = getAggregateArrayOfWords(allData);
    
    // Get word frequency object for single or aggregate poets.
    // {word1: 45, word2: 16, word3: 1,...}
    const aggregateWordFrequencyAnalysis = filterAndRestrictWordFrequency(reduceWordArrayToWordFrequency(aggregateWordArray));
    
    console.log("aggregateWordFrequency:", aggregateWordFrequencyAnalysis);
    console.log("individualPoetWordFrequency:", individualPoetWordFrequency);


    // Create packed bubble chart using HighCharts from word frequncy object

    // Create data table from word frequency chart

    // Display poems from addData (first need to get the poems into an object and allow for COMPARE being true)
    

} 

// Helper function for getAllPoetData.
function handleResponseErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    } 
    return response.json();  
}

// Uses Promises.all() to wait for all fetch calls to resolve, then processes
// responses into a global data structure. 
// Attribution: http://tinyurl.com/y5vm3eu8
function getAllPoetData(allURLS, compare) {

    let promises = allURLS.map(url => 
        fetch(url)
        .then(handleResponseErrors)
        // I wasn't able to pass the poet name to a separate function, so
        // I'm handling any 404 errors within Fetch because I can access the
        // poet name and it's important to include it in the error message.
        .then(responseJSON => {
            if (responseJSON.status === 404) {
            throw Error(`The poet, ${poet}, was ${responseJSON.reason.toLowerCase()} in the PoetryDB. 
            Please enter a new search with a different poet.`);
            }
            return responseJSON;
        })
        .catch(error => {
            $(".js-error")
            .html(
                `<p>Something isn't right:</p>
                <p>${error}</p>`)
            .removeClass("hidden");
        })
    );

    Promise.all(promises).then(results => {
        console.log("results:", results);
        results.forEach(result => allData.push(makePoetDataObject(result)));
        console.log("data", allData);
        processAllData(allData, compare);
    });
}

function onPoetsEntered() {
    
    $(".js-poet-search-form").submit(event => {
        event.preventDefault();
        
        // Get poet(s) entered and split into array
        // so that we can make individual calls to the
        // PoetyDB API. 
        const poets = $("#poets").val().split(",");

        // If compare is checked, then save compare variable as true.
        // Attribution: https://stackoverflow.com/questions/2834350/get-checkbox-value-in-jquery
        // Initializing compare as false which is the value that will be passed
        // if the comparison checkbox is NOT checked.
        let compare = false;
        if ($("#compare-poets").is(":checked")) {
            compare = true;
        }

        // Create array of all URLs to call
        const allURLs = poets.map(constructPoetryDBUrl);

        getAllPoetData(allURLs, compare); 
        
        // Empty input box, uncheck checkbox.
        $("#poets").val("");
        $("#compare-poets").prop("checked", false);
    });
}


function runApp() {
    toggleCollapsibleMenus();
    validateForm();
    onPoetsEntered();

}

$(runApp);