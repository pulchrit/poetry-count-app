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

const allData = [];

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

function flattenToWordsOnly(currentPoetObject) {
    return currentPoetObject.individualData.flatMap(currentPoetData => {
        return currentPoetData.lines.flatMap(line => { 
            return line.toLowerCase().split(" ").flatMap(word => {
               return word.match(/[a-z'-]+/g);  
            });
        });
    });
}

/* function getArrayOfWords(allData, compare) {

    if (compare) {

        const words = allData.map(currentPoetObject => flattenToWordsOnly(currentPoetObject));
        
        return words.map(currentWordArray => {
            return currentWordArray.filter(word => word != null)});
       
    } else {

        // Using nested flatMaps to get down to the words in each poem. 
        // Changing each word to lowercase, removing punctuation marks (except 
        // apostrophes and hyphens), removing empty strings and nulls (see below
        // for more on null). 
        const words = allData.flatMap(currentPoetObject => flattenToWordsOnly(currentPoetObject));//{

            /* return currentPoetObject.individualData.flatMap(currentPoetData => {
                return currentPoetData.lines.flatMap(line => { 
                    return line.toLowerCase().split(" ").flatMap(word => {
                    return word.match(/[a-z'-]+/g);  
                    });
                });
            }); */
    // });

        // Need to do a secondary filter to remove several pesky nulls that weren't
        // removed with the match(regex) above. I'm not exactly sure why they are there...
        // Regardless, this extra step removes them and ensures we have an array of only words. 
    /*     return words.filter(word => word !== null);
    }
   
}  */
 
function getAggregateArrayOfWords(allData) {

    // Using nested flatMaps to get down to the words in each poem. 
    // Changing each word to lowercase, removing punctuation marks (except 
    // apostrophes and hyphens), removing empty strings and nulls (see below
    // for more on null). 
    //const words = allData.flatMap(currentPoetObject => flattenToWordsOnly(currentPoetObject));
    const words = allData.flatMap(flattenToWordsOnly);

        /* return currentPoetObject.individualData.flatMap(currentPoetData => {
            return currentPoetData.lines.flatMap(line => { 
                return line.toLowerCase().split(" ").flatMap(word => {
                   return word.match(/[a-z'-]+/g);  
                });
            });
        }); 
    }); */

    // Need to do a secondary filter to remove several pesky nulls that weren't
    // removed with the match(regex) above. I'm not exactly sure why they are there...
    // Regardless, this extra step removes them and ensures we have an array of only words. 
    return words.filter(word => word !== null);
   
} 

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

// Reduces an array to an object of word frequency.
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
        individualPoetWordFrequency[currentPoet.poet] = reduceWordArrayToWordFrequency(currentPoet.justWords);
    });

    return individualPoetWordFrequency;
}

// Produces a word frequency object for the aggregate of multiple poets or for 
// a single poet.
// {word1: 45, word2: 16, word3: 1,...}
function getAggregateWordFrequencyAnalysis(aggregateWordArray) {
    return reduceWordArrayToWordFrequency(aggregateWordArray);
}

function processAllData(allData, compare) {
    
    console.log("allData array:", allData);

    // move below into display function!!!!!!!!!!!!!!!!
    const poetNameString = allData
        .map(currentPoet => currentPoet.name)
        .join(", ");

    $(".js-results").html(`Results for: ${poetNameString}`).removeClass("hidden");


    // Get word arrays: 
    
    // If compare is checked, an additional word array will be created
    // containing objects with word arrays for each poet. 
    let individualWordArrayOfObjects = [];
    let individualPoetWordFrequency;
    if (compare) {
        
        // Get word arrays for each individual poet. 
        individualWordArrayOfObjects = getIndividualArraysOfWords(allData);

        // Get a word frequency object for each individual poet.
        individualPoetWordFrequency = getIndividualWordFrequencyAnalysis(individualWordArrayOfObjects);

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
    const aggregateWordFrequencyAnalysis = reduceWordArrayToWordFrequency(aggregateWordArray)
    
    console.log("aggregateWordFrequency:", aggregateWordFrequencyAnalysis);
    console.log("individualPoetWordFrequency:", individualPoetWordFrequency);


    // Create packed bubble chart using HighCharts from word frequncy object

    // Create data table from word frequency chart

    // Display poems from addData (first need to get the poems into an object and allow for COMPARE being true)
    

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