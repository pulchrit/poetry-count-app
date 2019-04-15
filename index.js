'use strict';

// Helper function for toggleCollapsibleMenus.
function togglePredefinedSearchesVisibility() {
    $(".js-predefined-searches-list").toggleClass("hidden");
    $(".js-predefined-searches").toggleClass("searches-collapsible searches-active");
   
}

// Helper function for toggleCollapsibleMenus.
function togglePoetSearchVisbility() {
    $(".js-poet-search-form").toggleClass("hidden");
    $(".js-poet-search").toggleClass("searches-collapsible searches-active");
   
}

// Opens/closes 'Search poets' and 'Predefined searches' on mobile/smaller screens.
// May not be necessary for larger screens.
function toggleCollapsibleMenus() {
    
    $(".js-predefined-searches").click(togglePredefinedSearchesVisibility);
    $(".individual-searches").click(togglePredefinedSearchesVisibility);

    $(".js-poet-search").click(togglePoetSearchVisbility);
    $(".js-poet-search-form").submit(togglePoetSearchVisbility);
    
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
//const allData = [];

// Helper function for getAllPoetData.
function makePoetDataObject(results) {
    return {
        name: results[0].author,
        individualData: results
    };
}

// Helper function for onPoetsEntered.
// Leaving this as a function in case I change to an API with 
// more required parameters. 
function constructPoetryDBUrl(poet) {
    return `http://poetrydb.org/author/${poet}`;

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

function createPoetDivs(poetNamesArray) {
    poetNamesArray.forEach(poet => $(".individual").append(
        `<div class="charts-style" id="${poet}"></div`));
}

// Creates highcharts for each poet.
function createIndividualComparisonCharts(individualPoetWordFrequency) {

    // Clear out anything that might be there.
    $(".individual").html("");

    console.log("createIndividualComparisonCharts ran");

    $(".individual").prepend(`
        <button type="button" class="table-poem-button-styles" id="js-individualTable-button">View data table</button>
        <button type="button" class="table-poem-button-styles id="js-individualPoems-button">View poems</button>`);

    // { Shakespeare: {word1: 1, word2: 15}, "Emily Dickinson": {word1: 15, word2: 25}, ...}
    // poets in an array
    const poetNamesArray = Object.keys(individualPoetWordFrequency);

    // Create divs with ids equaling poet names.
    createPoetDivs(poetNamesArray);

    // Create data array and chart for each poet.    
    Object.keys(individualPoetWordFrequency).forEach(poet => {

        // create the data for each poet 
        let individualPoetData = Object.keys(individualPoetWordFrequency[poet]).map(word => {
            return {
                name: word,
                weight: individualPoetWordFrequency[poet][word]
            };
        });


        // create a highchart for each poet
        //return Highcharts.chart({
        Highcharts.chart(poet, {
            /* chart: {
                renderTo: key
            }, */
            series: [{
                type: 'wordcloud',
                data: individualPoetData,
                name: 'Occurrences'
            }],
            plotOptions: {
                series: {
                    minFontSize: 5,
                    maxFontSize: 55
                }
            },
            title: {
                text: "Top 100 Words for " + poet
            },
            credits: {
                enabled: false
            }
        });
    })
}

// Creates a chart for either a single poet or multiple poets in aggregate. 
function createAggregateComparisonChart(aggregateWordFrequencyAnalysis, poetNameString) {
    
    const aggregatePoetData = Object.keys(aggregateWordFrequencyAnalysis).map(wordKey => {
                return {
                    name: wordKey,
                    weight: aggregateWordFrequencyAnalysis[wordKey]
                };
            });
     
    // Clear out anything that might be there.
    $(".singleAggregate").html("");

    // Add view data and view poems buttons; create div to hold chart. 
    $(".singleAggregate").append(`
        <button type="button" class="table-poem-button-styles" id="js-table-button">View data table</button>
        <button type="button" class="table-poem-button-styles" id="js-poems-button">View poems</button>
        <div class="charts-style" id="aggregateChart"></div>`);
    
    return Highcharts.chart("aggregateChart", {
        series: [{
            type: 'wordcloud',
            data: aggregatePoetData,
            name: 'Occurrences'
        }],
        plotOptions: {
            series: {
                minFontSize: 5,
                maxFontSize: 55
            }
        },
        title: {
            text: "Top 100 Words for " + poetNameString
        },
        credits: {
            enabled: false
        }
    });
}


// Helper function for create chart functions.
function createPoetNameString(allData) {
    
    return allData.map(currentPoet => currentPoet.name).join(", ");
  
}

function displayResults() {
    
    $(".js-results").removeClass("hidden");
    $(".js-error").addClass("hidden");

}

function createIndividualDataTable(individualPoetWordFrequency) {

    // Reduce word frequency object to get sum of occurences to calculate percentage below.
    // From this: { Shakespeare: {word1: 1, word2: 15}, "Emily Dickinson": {word1: 15, word2: 25}, ...}
    // To this: {Shakespear: 345, Emily: 3321, ...}
    const occurencesTotalByPoet = Object.keys(individualPoetWordFrequency).reduce((poetAccumulator, currentPoet) => {
        poetAccumulator[currentPoet] = Object.keys(individualPoetWordFrequency[currentPoet]).reduce((total, currentVal) => {
            return total += individualPoetWordFrequency[currentPoet][currentVal]}, 0);
        return poetAccumulator;
    }, {});    

    // Create view charts and view poems buttons and create beginning of table.
    let tableString = `
        <button type="button" class="table-poem-button-styles" id="js-individualCharts-button">View charts</button>
        <button type="button" class="table-poem-button-styles" id="js-poems-button">View poems</button>
        
        <table>
        <caption>Data for: ${Object.keys(individualPoetWordFrequency).join(", ")}</caption>

        <thead>
            <tr>
                <th scope="col">Poet</th>
                <th scope="col">Word</th>
                <th scope="col">Occurences</th>
                <th scope="col">% for Poet</th>
            </tr>
        </thead>

        <tbody>`;
    
    // Get table rows from individualPoetWordFrequency.
    const tableRowsArray = Object.keys(individualPoetWordFrequency).map(poet => {
        return Object.keys(individualPoetWordFrequency[poet]).map(word => {
            return `<tr>
                        <td>${poet}</td>
                        <td>${word}</td>
                        <td>${individualPoetWordFrequency[poet][word]}</td>
                        <td>${((individualPoetWordFrequency[poet][word]/occurencesTotalByPoet[poet])*100).toFixed(1)}%</td>
                    </tr>`;
        }).join("\n");
    });

    tableString += tableRowsArray.join("\n");
    tableString += `
        </tbody>
        </table>`;

    return tableString;
    
}

function handleViewIndividualDataTableClicked(individualPoetWordFrequency) {
    $(".js-results").on("click", "#js-individualTable-button", function(event) {
        $(".individual").html(createIndividualDataTable(individualPoetWordFrequency));
    })
   
}

function createAggregateDataTable(aggregateWordFrequencyAnalysis, poetNameString) {

    // Reduce word frequency object to get sum of occurences to calculate percentage below.
    const occurencesTotal = Object.keys(aggregateWordFrequencyAnalysis).reduce((total, currentVal) => {
        return total += aggregateWordFrequencyAnalysis[currentVal]}, 0);
    
    // Create view charts and view poems buttons and create beginning of table.
    let tableString = `
        <button type="button" class="table-poem-button-styles" id="js-charts-button">View charts</button>
        <button type="button" class="table-poem-button-styles" id="js-poems-button">View poems</button>
        
        <table>
        <caption>Data for: ${poetNameString}</caption>

        <thead>
            <tr>
                <th scope="col">Word</th>
                <th scope="col">Occurences</th>
                <th scope="col">Percentage</th>
            </tr>
        </thead>

        <tbody>`;
    
    // Map keys of object to create array of strings, then join with \n 
    const tableRowsArray = Object.keys(aggregateWordFrequencyAnalysis).map(word => {
        return `<tr>
                    <td>${word}</td>
                    <td>${aggregateWordFrequencyAnalysis[word]}</td>
                    <td>${((aggregateWordFrequencyAnalysis[word]/occurencesTotal)*100).toFixed(1)}%</td>
                </tr>`;
    });

    tableString += tableRowsArray.join("\n");
    tableString += `
        </tbody>
        </table>`;

    return tableString;
    
}

function handleViewAggregateDataTableClicked(aggregateWordFrequencyAnalysis, poetNames) {
    $(".js-results").on("click", "#js-table-button", function(event) {
        $(".singleAggregate").html(createAggregateDataTable(aggregateWordFrequencyAnalysis, poetNames));
    })
}

function handleViewIndividualChartsClicked(individualPoetWordFrequency) {
    $(".js-results").on("click", "#js-individualCharts-button", function(event) {
        console.log("handleViewIndividualChartsClicked ran");
        createIndividualComparisonCharts(individualPoetWordFrequency);
    })
     
}

function handleViewAggregateChartsClicked(aggregateWordFrequencyAnalysis, poetNames) {
    $(".js-results").on("click", "#js-charts-button", function(event) {        
        createAggregateComparisonChart(aggregateWordFrequencyAnalysis, poetNames);
    })
}
/* function  getIndividualPoemsByPoet(allData) {
    return allData.reduces
} */

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

        // Create packed bubble chart using HighCharts from word frequency object.
        createIndividualComparisonCharts(individualPoetWordFrequency);
        handleViewIndividualChartsClicked(individualPoetWordFrequency);
        
        // create data table for each poet
        handleViewIndividualDataTableClicked(individualPoetWordFrequency);
        
        // create poem object for each poet 
        // handleViewIndividualPoemsClicked()
        
    }
    console.log("allData", allData);

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
    

    // Create and display packed bubble chart using HighCharts from word frequncy object
    createAggregateComparisonChart(aggregateWordFrequencyAnalysis, poetNames);
    handleViewAggregateChartsClicked(aggregateWordFrequencyAnalysis, poetNames);
    
    // Create data table from word frequency chart.
    handleViewAggregateDataTableClicked(aggregateWordFrequencyAnalysis, poetNames);
    
    // Create and display poems for all poets (same for single, multiple or multiple compared).
    //const poemsArray = createPoemsArray(allData);
    //handleViewAggregatePoemsClicked(poemsArray);

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

    const allData = [];

    let promises = allURLS.map(url => 
        fetch(url)
        .then(handleResponseErrors)
        // I wasn't able to pass the poet name to a separate function, so
        // I'm handling any 404 errors within Fetch because I can access the
        // poet name and it's important to include it in the error message.
        .then(responseJSON => {
            if (responseJSON.status === 404) {
            throw Error ("Poet or poets were not found.")
            //throw Error(`The poet, ${poet}, was ${responseJSON.reason.toLowerCase()} in the PoetryDB. 
            //Please enter a new search with a different poet.`);
            } else {
                return responseJSON;
            }
            
        })
        .catch(error => {
            $(".js-error")
            .html(
                `<p>Something isn't right:</p>
                <p>${error}</p>`)
            .removeClass("hidden");
            $(".js-results").addClass("hidden");
        })
    );

    // Because fetch() resolves 404 errors, even though I catch the 404s above, all promises
    // still resolve into an array of undefined ([undefined]). To prevent the .then from trying
    // to resolve [undefined], I check for [undefined] and return a message to the error element
    // in the DOM instead of allowing the processing functions to be called with undefined and 
    // throwing errors in future functions. 
    Promise.all(promises)
        .then(results => {
            if (results[0] === undefined) {
                return $(".js-error").append("Please try again.");
            } else {
                results.forEach(result => allData.push(makePoetDataObject(result)));
                processAllData(allData, compare);
            }
        }) 
}

function onPoetsEntered() {
    
    $(".js-poet-search-form").submit(event => {
        event.preventDefault();

        $(".singleAggregate").html("");
        $(".individual").html("");
        
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