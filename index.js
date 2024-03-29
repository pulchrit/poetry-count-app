'use strict';

//processdata
// poetList = {authors: ["Adam Lindsay Gordon","Alan Seeger"...]}
function getPoetList() {

    fetch("https://poetrydb.org/authors")
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

//createString
function createPoetsListString(responseJSON) {
    return responseJSON.authors.map(poet => `<option class="poet-options">${poet}</option>`).join('\n'); 
}

//display
// When a user's search returns an error because the poet was not found. This function
// calls the PoetryDB, gets, and displays a full list of poets actually in the database. 
function displayPoetsList(responseJSON) {
    $("#poet-list").html(createPoetsListString(responseJSON));
} 

//display
// Attribution: https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
function enableCopySelectedPoetFromList() {
    $("#poet-list").change(function() {
        let selectedPoet = $("#poet-list option:selected").text();
        const poetNameTextArea = document.createElement('textarea');
        poetNameTextArea.value = selectedPoet;
        document.body.appendChild(poetNameTextArea);
        poetNameTextArea.select();
        document.execCommand("copy"); 
        document.body.removeChild(poetNameTextArea);
    });
}

//display
// Helper function for toggleCollapsibleMenus.
function togglePredefinedSearchesVisibility() {
    $(".js-predefined-searches-list").toggleClass("hidden");
    $(".js-predefined-searches").toggleClass("searches-collapsible searches-active");
}

//display
// Helper function for toggleCollapsibleMenus.
function togglePoetSearchVisbility() {
    $(".js-poet-search-form").toggleClass("hidden");
    $(".js-poet-search").toggleClass("searches-collapsible searches-active");
}
//display
// Opens/closes 'Search poets' and 'Predefined searches' on mobile/smaller screens.
// May not be necessary for larger screens.
function toggleCollapsibleMenus() { 
    $(".js-predefined-searches").click(togglePredefinedSearchesVisibility);
    $(".js-predefined-searches-list").submit(togglePredefinedSearchesVisibility);

    $(".js-poet-search").click(togglePoetSearchVisbility);
    $(".js-poet-search-form").submit(togglePoetSearchVisbility);
}

// Not sure if I should include this functionality? If the user hasn't entered more
// than one poet, there is no reason to show them the Compare checkbox. This function 
// mostly works, BUT if the user hits enter instead of tabbing to the submit button, they 
// will never see the Compare checkbox...Maybe instead of this I can change Compare back
// to false when a user clicks it having only entered one poet name? Right now if they click
// Compare with only one poet, they get duplicate charts and data tables. 
/* function hideShowCompare() {
    $("#poets").change(function() {
        if ($("#poets").val().includes(",")) {
            $("#checkbox").removeClass("hidden");
        }
    });
    $("#checkbox").addClass("hidden");
} */

//processData
// Helper function for getAllPoetData.
function makePoetDataObject(results) {
    return {
        name: results[0].author,
        individualData: results
    };
}

//createString
// Helper function for onPoetsEntered.
function constructPoetryDBUrl(poet) {
    return `https://poetrydb.org/author/${poet}`;
}

//processData
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

//processData
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

//processData
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

//processData
// Helper function for processAllData.
// Produces an array of objects that relate a poet to their words.
function getIndividualArraysOfWords(allData) {

    const separateWords = allData.map(makeSeparateWordsObject);

    separateWords.forEach(IndividualPoetWordsObject => {
        IndividualPoetWordsObject.justWords = IndividualPoetWordsObject.justWords.filter(word => word !== null);
    })

    return separateWords;
}
//processData
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
//processData
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
//processData
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
//createString
// Helper function for createIndividualComparisonCharts.
// Create divs for each poet. Charts will be rendered to these divs.
function createPoetDivs(poetNamesArray) {
    poetNamesArray.forEach(poet => $(".individual").append(
        `<div class="charts-style" id="${poet}"></div`));
}
//createString
function createViewDataChartsPoemsButtons(id, text) {
    return `<button type="button" class="table-poem-button-styles" id="${id}">${text}</button>`;
}

//createString
function createHighChartWordChart(...args) {
    Highcharts.chart(args[1], {
        series: [{
            type: 'wordcloud',
            data: args[0],
            name: 'Occurrences'
        }],
        plotOptions: {
            series: {
                minFontSize: 5,
                maxFontSize: 55
            }
        },
        title: {
            text: "Top 100 Words for " + args[2]
        },
        credits: {
            enabled: false
        }
    });
}


//display
// Creates highcharts for each poet when multiple poets are compared.
function createIndividualComparisonCharts(individualPoetWordFrequency) {

    // Clear out any previous results.
    $(".individual").html("");

    // Add buttons to view data poems.
    $(".individual").prepend(`
        ${createViewDataChartsPoemsButtons("js-individualTable-button", "View data table")}
        ${createViewDataChartsPoemsButtons("js-poems-button", "View poems")}
        `);

        // { Shakespeare: {word1: 1, word2: 15}, "Emily Dickinson": {word1: 15, word2: 25}, ...}
    // Get poet names in an array for later iteration. 
    const poetNamesArray = Object.keys(individualPoetWordFrequency);

    // Create divs with ids equaling poet names.
    createPoetDivs(poetNamesArray);

    // Create data array and chart for each poet.    
    Object.keys(individualPoetWordFrequency).forEach(poet => {

        // Create the data for each poet. 
        let individualPoetData = Object.keys(individualPoetWordFrequency[poet]).map(word => {
            return {
                name: word,
                weight: individualPoetWordFrequency[poet][word]
            };
        });

        // Create a highchart for each poet.
        createHighChartWordChart(individualPoetData, poet, poet);
    })
}

//createString
// Creates a chart for either a single poet or multiple poets in aggregate. 
function createAggregateComparisonChart(aggregateWordFrequencyAnalysis, poetNameString) {
    
    const aggregatePoetData = Object.keys(aggregateWordFrequencyAnalysis).map(wordKey => {
                return {
                    name: wordKey,
                    weight: aggregateWordFrequencyAnalysis[wordKey]
                };
            });
     
    // Clear out any previous results.
    $(".singleAggregate").html("");

    // Add view data and view poems buttons; create div to hold chart. 
    $(".singleAggregate").append(`
        ${createViewDataChartsPoemsButtons("js-table-button", "View data table")}
        ${createViewDataChartsPoemsButtons("js-poems-button", "View poems")}
        <div class="charts-style" id="aggregateChart"></div>`);
    
    // Create and render highchart for single poet or multipe poets combined.
    return createHighChartWordChart(aggregatePoetData, "aggregateChart", poetNameString);
}

//createString
// Helper function for processAllData.
// Creates a string of poet names for use in chart and other titles. 
function createPoetNameString(allData) { 
    return allData.map(currentPoet => currentPoet.name).join(", ");
}
//display
// Helper function for processAllData.
// Makes the results and error sections visible.
function displayResults() {
    $(".js-results").removeClass("hidden");
    $(".js-error").addClass("hidden");
    $(".js-poet-list").addClass("hidden");
}

//processData
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

//createString
// Create data tables for each poet when multiple poets are compared. 
function createIndividualDataTable(individualPoetWordFrequency) {

    const occurencesTotalByPoet = getIndividualSumOfWordOccurences(individualPoetWordFrequency);

    // Create view charts and view poems buttons and create beginning of table.
    let tableString = `
        ${createViewDataChartsPoemsButtons("js-individualCharts-button", "View charts")}
        ${createViewDataChartsPoemsButtons("js-poems-button", "View poems")}
                
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

    tableString += `
        ${tableRowsArray.join("\n")}
        </tbody>
        </table>`;

    return tableString;
}

//display
// Listen for View Data Table clicks and show data table for multiple poets compared.
function handleViewIndividualDataTableClicked(individualPoetWordFrequency) {
    $(".js-results").off("click", "#js-individualTable-button");
    $(".js-results").on("click", "#js-individualTable-button", function(event) {
        $(".individual").html(createIndividualDataTable(individualPoetWordFrequency));
    })
}

//createString
function getAggregateSumOfWordOccurences(aggregateWordFrequencyAnalysis) {
    return Object.keys(aggregateWordFrequencyAnalysis).reduce((total, currentVal) => 
        total += aggregateWordFrequencyAnalysis[currentVal], 0);
}

//createString
// Create data table for single poet or multiple poets in aggregate. 
function createAggregateDataTable(aggregateWordFrequencyAnalysis, poetNameString) {

    // Reduce word frequency object to get sum of occurences to calculate percentage below.
    /* const occurencesTotal = Object.keys(aggregateWordFrequencyAnalysis).reduce((total, currentVal) => {
        return total += aggregateWordFrequencyAnalysis[currentVal]}, 0); */

    const occurencesTotal = getAggregateSumOfWordOccurences(aggregateWordFrequencyAnalysis);
    
    // Create view charts and view poems buttons and create beginning of table.
    let tableString = `
        ${createViewDataChartsPoemsButtons("js-charts-button", "View chart")}
        ${createViewDataChartsPoemsButtons("js-poems-button", "View poems")}
        
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
    
    // Map keys of object to create array of strings, then join with \n and create rest of
    // table element. 
    const tableRowsArray = Object.keys(aggregateWordFrequencyAnalysis).map(word => {
        return `<tr>
                    <td>${word}</td>
                    <td>${aggregateWordFrequencyAnalysis[word]}</td>
                    <td>${((aggregateWordFrequencyAnalysis[word]/occurencesTotal)*100).toFixed(1)}%</td>
                </tr>`;
    });

    tableString += `
        ${tableRowsArray.join("\n")}
        </tbody>
        </table>`;

    return tableString; 
}

//display
// List for View Data Table click and show data table for single or multiple poets in aggregate. 
function handleViewAggregateDataTableClicked(aggregateWordFrequencyAnalysis, poetNames) {
    $(".js-results").off("click", "#js-table-button");
    $(".js-results").on("click", "#js-table-button", function(event) {
        $(".singleAggregate").html(createAggregateDataTable(aggregateWordFrequencyAnalysis, poetNames));
    })
}

//display
// Listen for View All Data click and show data for aggregate and individual poet tables.
function handleViewAllTablesClicked(individualPoetWordFrequency, aggregateWordFrequencyAnalysis, poetNames) {
    $(".js-results").off("click", "#js-allTables-button");
    $(".js-results").on("click", "#js-allTables-button", function(event) {
        $(".singleAggregate").html(createAggregateDataTable(aggregateWordFrequencyAnalysis, poetNames));
        $(".individual").html(createIndividualDataTable(individualPoetWordFrequency));
    });
}

//display
// Listen for View Charts click and show individual charts for multiple poets compared. 
function handleViewIndividualChartsClicked(individualPoetWordFrequency) {
    $(".js-results").off("click", "#js-individualCharts-button");
    $(".js-results").on("click", "#js-individualCharts-button", function(event) {
        createIndividualComparisonCharts(individualPoetWordFrequency);
    })
}

//display
// Listen for View Chart click and show chart for single poet or multiple poets in aggregate.
function handleViewAggregateChartsClicked(aggregateWordFrequencyAnalysis, poetNames) {
    $(".js-results").off("click", "#js-charts-button");
    $(".js-results").on("click", "#js-charts-button", function(event) {        
        createAggregateComparisonChart(aggregateWordFrequencyAnalysis, poetNames);
    })
}

//display
// Listen for View Charts click and show charts for individual poets.
function handleViewAllChartsClicked(individualPoetWordFrequency, aggregateWordFrequencyAnalysis, poetNames) {
    $(".js-results").off("click", "#js-allCharts-button");
    $(".js-results").on("click", "#js-allCharts-button", function(event) {
        createAggregateComparisonChart(aggregateWordFrequencyAnalysis, poetNames);
        createIndividualComparisonCharts(individualPoetWordFrequency);
    });
}

//createString
// Helper object for poem viewer screen.
// Create global object to track poem count.
const poemCountTracking = {
    count: 1,
    
    incrementCount: function() {
        //poemCountTracking.count++;
        this.count++;
    },

    decrementCount: function() {
        //poemCountTracking.count--;
        this.count--;
    },

    resetCount: function() {
        //poemCountTracking.count = 1;
        this.count = 1;
    },

    getCount: function() {
        return this.count;
    }
};

//processData
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

//processData
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

//createString
// Helper function for createPoemViewer.
// Gets a specific poem object (i.e. poem) from the array of poems to 
// render in the poem viewer screen.
function getPoemObject(poemsArray, count) {
    return poemsArray.find(poem => poem.poemNumber === count);
}

//createString
// Helper function for createPoemViewer.
// Creates the prev, next and current count navigation for the poem viewer screen.
function createPoemViewerMenu(count, length) {
    
    // If count equals length, then this is the last poem, next button is inactive.
    if (count === length) {
        return `
            <ul class="poem-viewer-menu-styles">
                <li><button type="button" class="previous-next-styles" id="js-previous-poem">previous</button></li>
                <li class="js-current-poem-number">${count} of ${length}</li>
                <li><button type="button" class="previous-next-styles inactive-button">next</button></li>
            </ul>`
    // If count is 1, then this is first poem, previous button is inactive. 
    } else if (count === 1) {
        return `
            <ul class="poem-viewer-menu-styles">
                <li><button type="button" class="previous-next-styles inactive-button">previous</button></li>
                <li class="js-current-poem-number">${count} of ${length}</li>
                <li><button type="button" class="previous-next-styles" id="js-next-poem">next</button></li>
            </ul>`
    }
    // Otherwise, this is a poem in the middle so both previous and next are active buttons. 
    return `
        <ul class="poem-viewer-menu-styles">
            <li><button type="button" class="previous-next-styles" id="js-previous-poem">previous</button></li>
            <li class="js-current-poem-number">${count} of ${length}</li>
            <li><button type="button" class="previous-next-styles" id="js-next-poem">next</button></li>
        </ul>`
}

//createString
// Helper function for createPoemString. Processes lines into <p> elements.
// Tries to account for indentation and line breaks to mirror the poem's
// original layout.
function createPoemLinesString(linesArray) {
    const poemLines = linesArray.map(line => {
        if (!line) {
            return `<br>`;
        } else if (line.startsWith("  ")) {
            return `<p class="poem-lines-styles line-indented">${line}</p>`;
        } else {
            return `<p class="poem-lines-styles">${line}</p>`;
        }
    });
    return poemLines.join("\n");
}

//createString
// Helper function for createPoemViewer.
// Creates the title, author, and lines elements to render the poem 
// to the poem viewer screen.
function createPoemString(poemObject) {
    return `
        <p class="poem-title-styles">${poemObject.title}</p>
        <p class="poem-author-styles">By: ${poemObject.author}</p>
        <div class="full-poem-styles">${createPoemLinesString(poemObject.lines)}</div>`
}

//createString
// Helper function for handleViewPoemsClicked. Same function works for
// individual poets compared search and single/aggregate poet search. 
function createPoemViewer(poemsArray, compare) {
    
    let poemViewerString;
    
    // Buttons are slightly different to alert users that charts and data tables will be 
    // shown for individual poets and all poets combined when multiple poets were compared. 
    if (compare) {
        poemViewerString = `
            ${createViewDataChartsPoemsButtons("js-allCharts-button", "View all charts")}
            ${createViewDataChartsPoemsButtons("js-allTables-button", "View all data tables")}    
            `
    } else {
        poemViewerString = `
            ${createViewDataChartsPoemsButtons("js-charts-button", "View chart")}
            ${createViewDataChartsPoemsButtons("js-table-button", "View data table")}
            `
    }
    
    const poemMenu = createPoemViewerMenu(poemCountTracking.getCount(), poemsArray.length);
    let poemObject = getPoemObject(poemsArray, poemCountTracking.getCount());
    
    poemViewerString += `
        ${poemMenu}
        ${createPoemString(poemObject)}
        ${poemMenu}`

    return poemViewerString;
}

//display
// This function can be used for both individual comparison and single/aggregate searches. 
// We will only show one poem viewer for all poets and poems. 
// Listen for View Poems click and show poem viewer.
function handleViewPoemsClicked(poemsArray, compare) {
    $(".js-results").on("click", "#js-poems-button", function(event) {
        $(".individual").html("");
        poemCountTracking.resetCount();
        $(".singleAggregate").html(createPoemViewer(poemsArray, compare));
    })
}

//display
// Listen for Next poem click and show next poem in poems array.
function handleNextPoemClicked(poemsArray, compare) {
    // Need to unbind previous click events before adding a new one. This 
    // will allow the prev/next buttons to work correctly when multiple 
    // searches are performed during the same page load. 
    $(".js-results").off("click", "#js-next-poem");
    $(".js-results").on("click", "#js-next-poem", function(event) {
        poemCountTracking.incrementCount();
        $(".singleAggregate").html(createPoemViewer(poemsArray, compare));
    })
}

//display
// Listen for previous poem click and show previous poem in poems array.
function handlePreviousPoemClicked(poemsArray, compare) {
    // Need to unbind previous click events before adding a new one. This 
    // will allow the prev/next buttons to work correctly when multiple 
    // searches are performed during the same page load. 
    $(".js-results").off("click", "#js-previous-poem");
    $(".js-results").on("click", "#js-previous-poem", function(event) {
        poemCountTracking.decrementCount();
        $(".singleAggregate").html(createPoemViewer(poemsArray, compare));
    })
}

//processData
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

//processData
// Helper function for getAllPoetData.
function handleResponseErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    } 
    return response.json();  
}

//processData
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
            if (results[0] === undefined) {
                return $(".js-error").prepend("Please try again.");
            } else {
                results.forEach(result => allData.push(makePoetDataObject(result)));
                processAllData(allData, compare);
            }
        }) 
}

//processData
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

//processData
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

//processData
function runApp() {
    enableCopySelectedPoetFromList();
    getPoetList();
    toggleCollapsibleMenus();
    onPoetsEntered();
    onPredefinedSearchSelected();
}

//processData
$(runApp);