'use strict';

// Storing poet data in this global variable such that it
// can be processes easily for the charts and poem viewer.
// Array of one array if single poet, or array or many
// arrays if multiple poets.
const poetResponseData = [];

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

// Won't need this function if I stay with PoetryDb, but 
// leaving it in for now just in case. 
/* function formatQueryParams(params) {

    const queryItems = Object.keys(params)
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`);
    
        return queryItems.join("&");
}  */

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

function getPoetData(poet) {
    
    fetch(constructPoetryDBUrl(poet)) // adjust if this doesn't work, trying to do what jeremy said
    .then(response => {
        if (!response.ok) {
            throw new Error(response.statusText);
        }
        return response.json(); 
    })   
    //.then(responseJSON => processResults(responseJSON, states))  
    .catch(error => {
        $(".js-results").html(
            `<p>Hmmm...Something isn't right. Here's the error message:</p>
            <p>${error}</p>`);
        $(".js-results").removeClass("hidden");
    })    
}

function getDataForAllPoets(poets) {

    // .map poets array, call getPoetData for each poet, 
    // push API response data to poetResponseData array. 
    poetResponseData.push(poets.map(poet => {
        getPoetData(poet);
    }));

    return poetResponseData;
}

function processResults(poetResponseData, boolean) {
    console.log("compare?" + boolean);
    console.log("poetResponseData:" + poetResponseData);
}

function onPoetsEntered() {
    
    $(".js-poet-search-form").submit(event => {
        event.preventDefault();
        
        // Get poet(s) entered and split into array
        // so that we can make individual calls to the
        // PoetyDB API. 
        const poets = $("#poets").val().split(",");
        console.log(poets);

        /* // .map poets array, call getPoemData for each poet, 
        // push API response data to poetResponseData array. 
        poetResponseData.push(poets.map(poet => {
            getPoemData(poet);
        })); */


        // If compare is checked, then pass a true flag to processResults.
        // Attribution: https://stackoverflow.com/questions/2834350/get-checkbox-value-in-jquery
        if ($("#compare-poets").is(":checked")) {
       // if ($("#compare-poets").val() === "yes") {
            processResults(getDataForAllPoets(poets), true);
        }
        processResults(getDataForAllPoets(poets), false);

        // Empty input box
        $("#poets").val("");
    });
}


function runApp() {
    toggleCollapsibleMenus();
    onPoetsEntered();
}

$(runApp);