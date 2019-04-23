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
        $(".js-error").addClass("hidden");
    });
}

function togglePredefinedSearchesVisibility() {
    $(".js-predefined-searches-list").toggleClass("hidden");
    $(".js-predefined-searches").toggleClass("searches-collapsible searches-active");
}

function togglePoetSearchVisbility() {
    $(".js-poet-search-form").toggleClass("hidden");
    $(".js-poet-search").toggleClass("searches-collapsible searches-active");
}

// Toggles Predefined searches off when Search poets has been submitted and vice-versa).
function toggleCollapsibleMenus() { 
 
    $(".js-predefined-searches").click(togglePredefinedSearchesVisibility);
    $(".js-predefined-searches-list").submit(togglePredefinedSearchesVisibility);

    $(".js-poet-search").click(togglePoetSearchVisbility);
    $(".js-poet-search-form").submit(togglePoetSearchVisbility);
}

// Makes the results and error sections visible.
function displayResults() {
    $(".js-results").removeClass("hidden");
    $(".js-error").addClass("hidden");
    $(".js-poet-list").addClass("hidden");
}

function handleViewIndividualDataTableClicked(individualPoetWordFrequency) {
    $(".js-results").off("click", "#js-individualTable-button");
    $(".js-results").on("click", "#js-individualTable-button", function(event) {
        $(".individual").html(createIndividualDataTable(individualPoetWordFrequency));
    })
}

function handleViewAggregateDataTableClicked(aggregateWordFrequencyAnalysis, poetNames) {
    $(".js-results").off("click", "#js-table-button");
    $(".js-results").on("click", "#js-table-button", function(event) {
        $(".singleAggregate").html(createAggregateDataTable(aggregateWordFrequencyAnalysis, poetNames));
    })
}

function handleViewAllTablesClicked(individualPoetWordFrequency, aggregateWordFrequencyAnalysis, poetNames) {
    $(".js-results").off("click", "#js-allTables-button");
    $(".js-results").on("click", "#js-allTables-button", function(event) {
        $(".singleAggregate").html(createAggregateDataTable(aggregateWordFrequencyAnalysis, poetNames));
        $(".individual").html(createIndividualDataTable(individualPoetWordFrequency));
    });
}

function handleViewIndividualChartsClicked(individualPoetWordFrequency) {
    $(".js-results").off("click", "#js-individualCharts-button");
    $(".js-results").on("click", "#js-individualCharts-button", function(event) {
        createIndividualComparisonCharts(individualPoetWordFrequency);
    })
}

function handleViewAggregateChartsClicked(aggregateWordFrequencyAnalysis, poetNames) {
    $(".js-results").off("click", "#js-charts-button");
    $(".js-results").on("click", "#js-charts-button", function(event) {        
        createAggregateComparisonChart(aggregateWordFrequencyAnalysis, poetNames);
    })
}

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
function handleViewPoemsClicked(poemsArray, compare) {
    $(".js-results").on("click", "#js-poems-button", function(event) {
        $(".individual").html("");
        poemCountTracking.resetCount();
        $(".singleAggregate").html(createPoemViewer(poemsArray, compare));
    })
} 

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