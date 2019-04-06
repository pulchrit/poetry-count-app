

function toggleCollapsibleMenus() {
    
    $(".js-predefined-searches").click(function() {
        //$(".js-predefined-searches-list").toggleClass("hidden displayBlock");
        $(".js-predefined-searches-list").toggleClass("hidden");
        $(".js-predefined-searches").toggleClass("searches-collapsible searches-active ");
    });

    $(".js-poet-search").click(function() {
        $(".js-poet-search-form").toggleClass("hidden");
        $(".js-poet-search").toggleClass("searches-collapsible searches-active");
    });
}


function runApp() {
    toggleCollapsibleMenus();
}

$(runApp);