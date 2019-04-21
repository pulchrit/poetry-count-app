'use strict';

// Append multiple selected poets to search input box.
// Attribution: https://stackoverflow.com/questions/841722/append-text-to-input-field/841728
function appendPoetNameToInput(poetsInput, selectedPoet){
    if (!($(poetsInput).val())) {
        $("#poets").val(selectedPoet);
    } else {
        $(poetsInput).val($(poetsInput).val() + ", " + selectedPoet);
    }
}

// When user selects a poet, his/her name will automatically be added to the input box. 
function enableGetSelectedPoetFromList() {
    $("#poet-list").change(function() {
        let selectedPoet = $("#poet-list option:selected").text();
        if ($(".js-poet-search-form").hasClass("hidden")) {togglePoetSearchVisbility()};
        appendPoetNameToInput("#poets", selectedPoet);

        // Attribution: https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
        /* const poetNameTextArea = document.createElement('textarea');
        poetNameTextArea.value = selectedPoet;
        document.body.appendChild(poetNameTextArea);
        poetNameTextArea.select();
        document.execCommand("copy"); 
        document.body.removeChild(poetNameTextArea);
        if ($(".js-poet-search-form").hasClass("hidden")) {togglePoetSearchVisbility()}; */
    });
}

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
    $(".js-predefined-searches-list").submit(togglePredefinedSearchesVisibility);

    $(".js-poet-search").click(togglePoetSearchVisbility);
    $(".js-poet-search-form").submit(togglePoetSearchVisbility);
}

/* // Creates highcharts for each poet when multiple poets are compared.
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
} */

// Helper function for processAllData.
// Makes the results and error sections visible.
function displayResults() {
    $(".js-results").removeClass("hidden");
    $(".js-error").addClass("hidden");
    $(".js-poet-list").addClass("hidden");
    /* $(".instructions").addClass("hidden"); */
}

// Listen for View Data Table clicks and show data table for multiple poets compared.
function handleViewIndividualDataTableClicked(individualPoetWordFrequency) {
    $(".js-results").off("click", "#js-individualTable-button");
    $(".js-results").on("click", "#js-individualTable-button", function(event) {
        $(".individual").html(createIndividualDataTable(individualPoetWordFrequency));
    })
}

// Listen for View Data Table click and show data table for single or multiple poets in aggregate. 
function handleViewAggregateDataTableClicked(aggregateWordFrequencyAnalysis, poetNames) {
    $(".js-results").off("click", "#js-table-button");
    $(".js-results").on("click", "#js-table-button", function(event) {
        $(".singleAggregate").html(createAggregateDataTable(aggregateWordFrequencyAnalysis, poetNames));
    })
}

// Listen for View All Data click and show data for aggregate and individual poet tables.
function handleViewAllTablesClicked(individualPoetWordFrequency, aggregateWordFrequencyAnalysis, poetNames) {
    $(".js-results").off("click", "#js-allTables-button");
    $(".js-results").on("click", "#js-allTables-button", function(event) {
        $(".singleAggregate").html(createAggregateDataTable(aggregateWordFrequencyAnalysis, poetNames));
        $(".individual").html(createIndividualDataTable(individualPoetWordFrequency));
    });
}

// Listen for View Charts click and show individual charts for multiple poets compared. 
function handleViewIndividualChartsClicked(individualPoetWordFrequency) {
    $(".js-results").off("click", "#js-individualCharts-button");
    $(".js-results").on("click", "#js-individualCharts-button", function(event) {
        createIndividualComparisonCharts(individualPoetWordFrequency);
    })
}

// Listen for View Chart click and show chart for single poet or multiple poets in aggregate.
function handleViewAggregateChartsClicked(aggregateWordFrequencyAnalysis, poetNames) {
    $(".js-results").off("click", "#js-charts-button");
    $(".js-results").on("click", "#js-charts-button", function(event) {        
        createAggregateComparisonChart(aggregateWordFrequencyAnalysis, poetNames);
    })
}

// Listen for View Charts click and show charts for individual poets.
function handleViewAllChartsClicked(individualPoetWordFrequency, aggregateWordFrequencyAnalysis, poetNames) {
    $(".js-results").off("click", "#js-allCharts-button");
    $(".js-results").on("click", "#js-allCharts-button", function(event) {
        createAggregateComparisonChart(aggregateWordFrequencyAnalysis, poetNames);
        createIndividualComparisonCharts(individualPoetWordFrequency);
    });
}

// When a user's search returns an error because the poet was not found. This function
// calls the PoetryDB, gets, and displays a full list of poets actually in the database. 
function displayPoetsList(responseJSON) {
    $("#poet-list").html(createPoetsListString(responseJSON));
}

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