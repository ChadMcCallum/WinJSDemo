(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {

            } else {

            }
            app.searches = [];
            args.setPromise(WinJS.UI.processAll().then(setEventHandlers));
        }
    };

    function setEventHandlers() {
        app.searchTemplate = _.template(document.getElementById("search-result-template").innerHTML);

        document.getElementById("search-button").onclick = function () {
            var searchTerm = document.getElementById("search-term");
            var term = searchTerm.value;
            CreateSearchResult(term);
            searchTerm.value = "";
        };

        setInterval(function () {
            _.each(app.searches, updateSearch);
        }, 10 * 1000);
    }

    function CreateSearchResult(term) {
        var searchResults = document.getElementById("search-results");
        var resultSet = document.getElementsByClassName("search-result");
        var newSearchResults = document.createElement("div");
        newSearchResults.className = "search-result";
        newSearchResults.setAttribute("style", "-ms-grid-column: " + (resultSet.length + 1) + "; -ms-grid-row: 0;");
        newSearchResults.id = term;
        searchResults.appendChild(newSearchResults);
        updateSearch(term);

        if (_.any(app.searches, function (search) { return search === term; }))
            return;
        app.searches.push(term);
    }

    function updateSearch(term) {
        WinJS.xhr({
            url: 'http://search.twitter.com/search.json?rpp=15&q=' + term,
            responseType: 'json'
        }).done(function (response) {
            var data = JSON.parse(response.responseText);
            var targetElement = document.getElementById(term);
            targetElement.innerHTML = app.searchTemplate({ term: term, results: data.results });
        });
    }

    app.oncheckpoint = function (args) {
        
    };

    app.start();
})();
