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

const data = [];

function makePoetDataObject(results) {
    return {
        name: results[0].author,
        data: results
    };
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

function processAllData(data, compare) {
    
    console.log("data array:", data);

    const poetNameString = data
        .map(currentPoet => currentPoet.name)
        .join(", ");

    $(".js-results").html(`Results for: ${poetNameString}`).removeClass("hidden");
} 

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
        results.forEach(result => data.push(makePoetDataObject(result)));
        console.log("data", data);
        processAllData(data, compare);
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