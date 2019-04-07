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

// Initializing this global variable for the array that contains 
// the aggregate data for all poets. 
// Not sure of the better way to do this and avoid a global variable??
//const allDataForAllPoets = [];

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

function processAllData(allDataForAllPoets, compare) {
    console.log("data from process function: ");
    console.log(allDataForAllPoets);
    console.log("compare:" + compare);
  
}

function getPoetData(poets, compare) {

    const allDataForAllPoets = [];

    // PoetryDB API allows only one poet to be queried at a time,
    // so, if multiple poets have been entered, we need to loop 
    // through them and call the API for each. Resulting data for 
    // each is pushed into the allDataForAllPoets array.
    poets.forEach(poet => {
    
        fetch(constructPoetryDBUrl(poet))
        .then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json(); 
        })
        .then(responseJSON => {
            allDataForAllPoets.push(responseJSON);
            return allDataForAllPoets;
        }) 
        .catch(error => {
            $(".js-results").html(
                `<p>Hmmm...Something isn't right. Here's the error message:</p>
                <p>${error}</p>`);
            $(".js-results").removeClass("hidden");
        })    
    });

    processAllData(allDataForAllPoets, compare);
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

        // Get all of the data for individual and multiple poets.
        getPoetData(poets, compare);

        // Empty input box, uncheck checkbox.
        $("#poets").val("");
        $("#compare-poets").prop("checked", false);
    });
}


function runApp() {
    toggleCollapsibleMenus();
    onPoetsEntered();
}

$(runApp);