'use strict';

// poetList = {authors: ["Adam Lindsay Gordon","Alan Seeger"...]}
function getPoetList() {

    fetch("http://poetrydb.org/authors")
    .then(handleResponseErrors)
    .then(responseJSON => displayPoetsList(responseJSON))
    .catch(error => {
        $(".js-error")
        .html(
            `<p>${error}</p>`)
        .removeClass("hidden");
        $(".js-poet-list").removeClass("hidden");
        $(".js-results").addClass("hidden");
    })
}

// Helper function for getAllPoetData.
function makePoetDataObject(results) {
    return {
        name: results[0].author,
        individualData: results
    };
}

// Helper function for getAggregateArrayOfWords and makeSeparateWordsObject.
// Returns a flattened array of words in lowercase, without punctuation.
function flattenToWordsOnly(currentPoetObject) {
    return currentPoetObject.individualData.flatMap(currentPoetData => 
        currentPoetData.lines.flatMap(line =>  
            line.toLowerCase().split(" ").flatMap(word => 
                word.match(/[a-z'’]+/g)
            )
        )
    );
}

// Helper function for processAllData.
// Returns a clean array of words with extraneous nulls removed.
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

// Helper function for processAllData.
// Produces an array of objects that relate a poet to their words.
function getIndividualArraysOfWords(allData) {

    const separateWords = allData.map(makeSeparateWordsObject);

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
                            "to", "upon", "with", "'"];
    
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

// Reduce word frequency object to get sum of occurences to calculate percentage below.
// From this: { Shakespeare: {word1: 1, word2: 15}, "Emily Dickinson": {word1: 15, word2: 25}, ...}
// To this: {Shakespear: 345, Emily: 3321, ...}
function getIndividualSumOfWordOccurences(individualPoetWordFrequency) {
    return Object.keys(individualPoetWordFrequency).reduce((poetAccumulator, currentPoet) => {
        poetAccumulator[currentPoet] = Object.keys(individualPoetWordFrequency[currentPoet]).reduce((total, currentVal) => {
            return total += individualPoetWordFrequency[currentPoet][currentVal]}, 0);
        return poetAccumulator;
    }, {}); 
}

// Helper function for createPoemsArray.
// Create a poem object to use in rendering each poem to the
// poem viewer screen.
function createPoemViewerPoemObject(currentPoemObject, index) {
    return {
        poemNumber: index + 1,
        title: currentPoemObject.title,
        author: currentPoemObject.author,
        lines: currentPoemObject.lines
    };
}

// Helper function for processAllData to view poems.
// Creates an array of poem objects for us in rendering 
// poems to the poem viewer screen.
function createPoemsArray(allData) {

    const aggregatePoems = allData.flatMap(currentPoetObject => {
        return currentPoetObject.individualData.map(currentPoemObject => {
            const index = currentPoetObject.individualData.indexOf(currentPoemObject);
            return createPoemViewerPoemObject(currentPoemObject, index);
        });
    })

    return aggregatePoems;
}

// Processes all data to create charts, data tables, and poems for the poem viewer.
// Initiates listeners for View Data, View Poems, and View Charts buttons.
function processAllData(allData, compare) {
        
    displayResults();

    const poetNames = createPoetNameString(allData);
    
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

        // Get an object relating each poem array to each poet.
        // {Shakespeare: [{poem: 1, title: "title", lines: ["line1", "line2"]}, {}],
        // Emily Dickinson: [{poem: 1, title: "title", lines: ["line1", "line2"]}, {}]}
        //individualPoemsByPoetObject = getIndividualPoemsByPoet(allData);

        // Create chart using HighCharts from word frequency object.
        createIndividualComparisonCharts(individualPoetWordFrequency);

        // Initiates listener for View Charts button for individual charts.  
        handleViewIndividualChartsClicked(individualPoetWordFrequency);
        
        // Create data table for each poet.
        handleViewIndividualDataTableClicked(individualPoetWordFrequency);   
    }

    // All of the following data structures will always be created. They are either
    // for when a single poet is entered or for when only aggregate information is 
    // requested for multiple poets. Also, the aggregate data will be displayed along 
    // with the individual poet information when compare IS checked. 

    // Get word arrays for single or aggregate poets.
    const aggregateWordArray = getAggregateArrayOfWords(allData);
    
    // Get word frequency object for single or aggregate poets.
    // {word1: 45, word2: 16, word3: 1,...}
    const aggregateWordFrequencyAnalysis = 
        filterAndRestrictWordFrequency(reduceWordArrayToWordFrequency(aggregateWordArray));
    

    // Create and display chart using HighCharts from word frequncy object
    createAggregateComparisonChart(aggregateWordFrequencyAnalysis, poetNames);

    // Initiates listener for View Charts button on aggregate chart. 
    handleViewAggregateChartsClicked(aggregateWordFrequencyAnalysis, poetNames);

    // Initiates listener for both aggregate and individual charts from View Poems screen.
    handleViewAllChartsClicked(individualPoetWordFrequency, aggregateWordFrequencyAnalysis, poetNames);
    
    // Create data table from word frequency chart.
    handleViewAggregateDataTableClicked(aggregateWordFrequencyAnalysis, poetNames);

    // Initiates listener for View All Data for both aggregate and individual data tables from 
    // View Poems screen.
    handleViewAllTablesClicked(individualPoetWordFrequency, aggregateWordFrequencyAnalysis, poetNames) 
    
    // Create and display poems for all poets (same for single, multiple or multiple compared).
    // Initiates listeners for View Poems, Next, and Previous buttons.
    const poemsArray = createPoemsArray(allData);
    handleViewPoemsClicked(poemsArray, compare);
    handleNextPoemClicked(poemsArray, compare);
    handlePreviousPoemClicked(poemsArray, compare);
} 

// Helper function for getAllPoetData.
function handleResponseErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    } 
    return response.json();  
}

// Uses Promises.all() to wait for all fetch calls to resolve, then processes
// responses into a data structure. 
// Attribution: http://tinyurl.com/y5vm3eu8
function getAllPoetData(allURLS, compare) {

    const allData = [];

    let promises = allURLS.map(url => 
        fetch(url)
        .then(handleResponseErrors)
        // Handle 404 errors that resolve, but are still errors for the user.
        .then(responseJSON => {
            if (responseJSON.status === 404) {
            throw Error (`Poet or poets were not found.`)
            } else {
                return responseJSON;
            }  
        })
        .catch(error => {
            $(".js-error")
            .html(
                `<p>${error}</p>`)
            .removeClass("hidden");
            $(".js-poet-list").removeClass("hidden");
            $(".js-results").addClass("hidden");
        })
    );

    // Because fetch() resolves 404 errors, even though I catch the 404s above, all promises
    // still resolve into an array of undefined elements ([undefined]). To prevent the .then from trying
    // to resolve [undefined], I check for [undefined] and return a message to the error element
    // in the DOM. This prevents the processing function from being called with undefined and 
    // throwing errors in future functions. 
    Promise.all(promises)
        .then(results => {
            if (results.includes(undefined)) {
                return $(".js-error").prepend("Please try again.");
            } else {
                results.forEach(result => allData.push(makePoetDataObject(result)));
                processAllData(allData, compare);
            }
        }) 
}

// Listen for when a user selects a predefined search and call getAllPoetData.
function onPredefinedSearchSelected() {

    $(".js-predefined-searches-list").submit(event => {
        event.preventDefault();

        // Remove any previous results.
        $(".singleAggregate").html("");
        $(".individual").html("");

        const poets = $("#predefined-searches").val().split(", ");
        
        if (poets.includes("Jupiter Hammon")|| poets.includes("Edgar Allan Poe")) {
            const allURLs = poets.map(constructPoetryDBUrl);
            getAllPoetData(allURLs, false);
        } else if (poets.includes("William Shakespeare") || poets.includes("Katherine Philips")) {
            const allURLs = poets.map(constructPoetryDBUrl);
            getAllPoetData(allURLs, true);
        }

        // Deselect option previously selected.
        $("#predefined-searches").prop("selected", false);
    });
}  

// Listen for when a user enters a search and call getAllPoetData.
function onPoetsEntered() {
    
    $(".js-poet-search-form").submit(event => {
        event.preventDefault();
    
        // Remove any previous results.
        $(".singleAggregate").html("");
        $(".individual").html("");
        
        // Get poet(s) entered and split into array
        // so that we can make individual calls to the
        // PoetyDB API. Regex splits on  ", " or "," to 
        // make it easier on the user.
        const poets = $("#poets").val().split(/, +|[,]+/);

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
    enableCopySelectedPoetFromList();
    getPoetList();
    toggleCollapsibleMenus();
    onPoetsEntered();
    onPredefinedSearchSelected();
}

$(runApp);