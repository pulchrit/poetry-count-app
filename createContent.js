'use strict';

function createPoetsListString(responseJSON) {
    return responseJSON.authors.map(poet => `<option class="poet-options">${poet}</option>`).join('\n'); 
}

// Helper function for onPoetsEntered.
function constructPoetryDBUrl(poet) {
    return `http://poetrydb.org/author/${poet}`;
}

function createGettingPoetDataString() {
    return `<p class="getting-data-styles">Retrieving poet data...</p>`;
}

// Helper function for createIndividualComparisonCharts.
// Create divs for each poet. Charts will be rendered to these divs.
function createPoetDivs(poetNamesArray) {
    poetNamesArray.forEach(poet => $(".individual").append(
        `<div class="charts-style individual-charts-large-screen-styles" id="${poet}"></div`));
}

function createViewDataChartsPoemsButtons(id, text) {
    return `<button type="button" class="table-poem-button-styles" id="${id}">${text}</button>`;
}

function createHighChartWordChart(...args) {
    Highcharts.chart(args[1], {
        chart: {
            backgroundColor: '#fff9f0',
        },
        series: [{
            type: 'wordcloud',
            data: args[0],
            name: 'Occurrences'
        }],
        plotOptions: {
            series: {
                minFontSize: 7,
                maxFontSize: 55
            }
        },
        title: {
            text: "Top 100 Words for " + args[2],
            style: {
                color: '#533200'
            }
        },
        credits: {
            enabled: false
        }
    });
}

// Creates highcharts for each poet when multiple poets are compared.
function createIndividualComparisonCharts(individualPoetWordFrequency) {

    // Clear out any previous results.
    $(".individual").html("");

    // Add buttons to view data poems.
    $(".individual").prepend(`
        <div class="button-container-style">
            ${createViewDataChartsPoemsButtons("js-individualTable-button", "View data table")}
            ${createViewDataChartsPoemsButtons("js-poems-button", "View poems")}
        </div>`);

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
        <div class="button-container-style">
            ${createViewDataChartsPoemsButtons("js-table-button", "View data table")}
            ${createViewDataChartsPoemsButtons("js-poems-button", "View poems")}
        </div>
        <div class="charts-style" id="aggregateChart"></div>`);
    
    // Create and render highchart for single poet or multipe poets combined.
    return createHighChartWordChart(aggregatePoetData, "aggregateChart", poetNameString);
}

// Helper function for processAllData.
// Creates a string of poet names for use in chart and other titles. 
function createPoetNameString(allData) { 
    return allData.map(currentPoet => currentPoet.name).join(", ");
}

// Create data tables for each poet when multiple poets are compared. 
function createIndividualDataTable(individualPoetWordFrequency) {

    const occurencesTotalByPoet = getIndividualSumOfWordOccurences(individualPoetWordFrequency);

    // Create view charts and view poems buttons and create beginning of table.
    let tableString = `
        <div class="button-container-style">
            ${createViewDataChartsPoemsButtons("js-individualCharts-button", "View charts")}
            ${createViewDataChartsPoemsButtons("js-poems-button", "View poems")}
        </div>       
        <table>
        <caption>Data for: ${Object.keys(individualPoetWordFrequency).join(", ")}</caption>

        <thead>
            <tr>
                <th class="text-column-styles individual-poet-column-styles" scope="col">Poet</th>
                <th class="text-column-styles individual-poet-column-styles" scope="col">Word</th>
                <th class="number-column-styles individual-poet-column-styles" scope="col">Occurences</th>
                <th class="number-column-styles individual-poet-column-styles" scope="col">% for Poet</th>
            </tr>
        </thead>

        <tbody>`;
    
    // Get table rows from individualPoetWordFrequency.
    const tableRowsArray = Object.keys(individualPoetWordFrequency).map(poet => {
        return Object.keys(individualPoetWordFrequency[poet]).map(word => {
            return `<tr>
                        <td class="text-column-styles individual-poet-column-styles">${poet}</td>
                        <td class="text-column-styles individual-poet-column-styles">${word}</td>
                        <td class="number-column-styles individual-poet-column-styles">${individualPoetWordFrequency[poet][word]}</td>
                        <td class="number-column-styles individual-poet-column-styles">${((individualPoetWordFrequency[poet][word]/occurencesTotalByPoet[poet])*100).toFixed(1)}%</td>
                    </tr>`;
        }).join("\n");
    });

    tableString += `
        ${tableRowsArray.join("\n")}
        </tbody>
        </table>`;

    return tableString;
}

function getAggregateSumOfWordOccurences(aggregateWordFrequencyAnalysis) {
    return Object.keys(aggregateWordFrequencyAnalysis).reduce((total, currentVal) => 
        total += aggregateWordFrequencyAnalysis[currentVal], 0);
}

// Create data table for single poet or multiple poets in aggregate. 
function createAggregateDataTable(aggregateWordFrequencyAnalysis, poetNameString) {

    // Reduce word frequency object to get sum of occurences to calculate percentage below.
    /* const occurencesTotal = Object.keys(aggregateWordFrequencyAnalysis).reduce((total, currentVal) => {
        return total += aggregateWordFrequencyAnalysis[currentVal]}, 0); */

    const occurencesTotal = getAggregateSumOfWordOccurences(aggregateWordFrequencyAnalysis);
    
    // Create view charts and view poems buttons and create beginning of table.
    let tableString = `
        <div class="button-container-style">
            ${createViewDataChartsPoemsButtons("js-charts-button", "View chart")}
            ${createViewDataChartsPoemsButtons("js-poems-button", "View poems")}
        </div>
        <table>
        <caption>Data for: ${poetNameString}</caption>

        <thead>
            <tr>
                <th class="text-column-styles" scope="col">Word</th>
                <th class="number-column-styles" scope="col">Occurences</th>
                <th class="number-column-styles" scope="col">Percentage</th>
            </tr>
        </thead>

        <tbody>`;
    
    // Map keys of object to create array of strings, then join with \n and create rest of
    // table element. 
    const tableRowsArray = Object.keys(aggregateWordFrequencyAnalysis).map(word => {
        return `<tr>
                    <td class="text-column-styles">${word}</td>
                    <td class="number-column-styles">${aggregateWordFrequencyAnalysis[word]}</td>
                    <td class="number-column-styles">${((aggregateWordFrequencyAnalysis[word]/occurencesTotal)*100).toFixed(1)}%</td>
                </tr>`;
    });

    tableString += `
        ${tableRowsArray.join("\n")}
        </tbody>
        </table>`;

    return tableString; 
}

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

// Helper function for createPoemViewer.
// Gets a specific poem object (i.e. poem) from the array of poems to 
// render in the poem viewer screen.
function getPoemObject(poemsArray, count) {
    return poemsArray.find(poem => poem.poemNumber === count);
}

// Helper function for createPoemViewer.
// Creates the prev, next and current count navigation for the poem viewer screen.
function createPoemViewerMenu(count, length) {
    
    // If count is 1 and lenght is 1, there is only one poem to display, so both prev and next
    // buttons are inactive. 
    if (count === 1 && length === 1) {
        return `
            <ul class="poem-viewer-menu-styles">
                <li><button type="button" class="previous-style previous-next-styles inactive-button">previous</button></li>
                <li class="current-poem js-current-poem-number">${count} of ${length}</li>
                <li class="next-li"><button type="button" class="next-style previous-next-styles inactive-button">next</button></li>
            </ul>`
    // If count is 1, then this is first poem, previous button is inactive. 
    } else if (count === 1) {
        return `
            <ul class="poem-viewer-menu-styles">
                <li><button type="button" class="previous-style previous-next-styles inactive-button">previous</button></li>
                <li class="current-poem js-current-poem-number">${count} of ${length}</li>
                <li class="next-li"><button type="button" class="next-style previous-next-styles" id="js-next-poem">next</button></li>
            </ul>`
    // If count equals length, then this is the last poem, next button is inactive.
    } else if (count === length) {
        return `
            <ul class="poem-viewer-menu-styles">
                <li><button type="button" class="previous-style previous-next-styles" id="js-previous-poem">previous</button></li>
                <li class="current-poem js-current-poem-number">${count} of ${length}</li>
                <li class="next-li"><button type="button" class="next-style previous-next-styles inactive-button">next</button></li>
            </ul>`
    }
    // Otherwise, this is a poem in the middle so both previous and next are active buttons. 
    return `
        <ul class="poem-viewer-menu-styles">
            <li><button type="button" class=" previous-style previous-next-styles" id="js-previous-poem">previous</button></li>
            <li class="current-poem js-current-poem-number">${count} of ${length}</li>
            <li class="next-li"><button type="button" class="next-style previous-next-styles" id="js-next-poem">next</button></li>
        </ul>`
}

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

// Helper function for createPoemViewer.
// Creates the title, author, and lines elements to render the poem 
// to the poem viewer screen.
function createPoemString(poemObject) {
    return `
        <p class="poem-title-styles">${poemObject.title}</p>
        <p class="poem-author-styles">By: ${poemObject.author}</p>
        <div class="full-poem-styles">${createPoemLinesString(poemObject.lines)}</div>`
}

// Helper function for handleViewPoemsClicked. Same function works for
// individual poets compared search and single/aggregate poet search. 
function createPoemViewer(poemsArray, compare) {
    
    let poemViewerString;
    
    // Buttons are slightly different to alert users that charts and data tables will be 
    // shown for individual poets and all poets combined when multiple poets were compared. 
    if (compare) {
        poemViewerString = `
            <div class="button-container-style">
                ${createViewDataChartsPoemsButtons("js-allCharts-button", "View all charts")}
                ${createViewDataChartsPoemsButtons("js-allTables-button", "View all data tables")}    
            </div>`
    } else {
        poemViewerString = `
            <div class="button-container-style">
                ${createViewDataChartsPoemsButtons("js-charts-button", "View chart")}
                ${createViewDataChartsPoemsButtons("js-table-button", "View data table")}
            </div>`
    }
    
    const poemMenu = createPoemViewerMenu(poemCountTracking.getCount(), poemsArray.length);
    let poemObject = getPoemObject(poemsArray, poemCountTracking.getCount());
    
    poemViewerString += `
        ${poemMenu}
        ${createPoemString(poemObject)}
        ${poemMenu}`

    return poemViewerString;
}
