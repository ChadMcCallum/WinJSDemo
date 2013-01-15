// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            args.setPromise(WinJS.UI.processAll().then(function () {
                var toggleSwitch = document.getElementById("toggle-update").winControl;
                if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                    app.searches = [];
                    toggleSwitch.checked = true;
                } else {
                    app.searches = JSON.parse(Windows.Storage.ApplicationData.current.localSettings.values["searches"]);
                    toggleSwitch.checked = WinJS.Application.sessionState.toggleUpdate;
                    _.each(app.searches, CreateSearchResult);
                }
                app.searchTemplate = _.template(document.getElementById("search-result-template").innerHTML);
                var button = document.getElementById("search-button");
                button.onclick = function () {
                    var textfield = document.getElementById("search-term");
                    var searchterm = textfield.value;
                    if (searchterm != "") {
                        CreateSearchResult(searchterm);
                        textfield.value = "";
                    }
                };
                document.getElementById("abc-refresh").addEventListener("click", updateAllSearches, false);
                setInterval(function () {
                    if (toggleSwitch.checked) {
                        updateAllSearches();
                    }
                }, 10 * 1000);
            }));
        }
    };

    function updateAllSearches() {
        _.each(app.searches, function (search) {
            updateSearch(search);
        });
    }

    function updateSearch(term) {
        WinJS.xhr({
            url: 'http://search.twitter.com/search.json?rpp=15&q=' + term,
            responseType: 'json'
        }).done(function (response) {
            var data = JSON.parse(response.responseText);
            var targetElement = document.getElementById(term);
            targetElement.innerHTML = toStaticHTML(app.searchTemplate({ term: term, results: data.results }));
        });
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

    app.oncheckpoint = function (args) {
        Windows.Storage.ApplicationData.current.roamingSettings.values["searches"] = JSON.stringify(app.searches);
        var toggleSwitch = document.getElementById("toggle-update").winControl;
        WinJS.Application.sessionState.toggleUpdate = toggleSwitch.checked;
    };

    app.start();
})();
