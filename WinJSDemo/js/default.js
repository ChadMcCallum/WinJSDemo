//This is the JS file for processing events and handling business logic for the app
// note how it's defined in a self-executing function
// this is pretty standard practice for javascript and ensures you dn't have any namespace conflicts
(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    //this is the default "startup" event handler they give you with a blank WinJS application
    //it handles when the app is launched via the start menu, and an if statement to determine
    //if the app was prevoiusly running (resumed from Suspended state) or not
    //it also contains the WinJS.UI.processAll() method which is responsible for creating any
    //WinJS controls you may have defined in your HTML (data-win-control attribute)
    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {

            } else {

            }
            app.searches = [];
            //here we're setting a Promise, which basically tells the app to keep showing the splash
            //screen until we're done with these operations.  Your app should be in a "ready to handle user input"
            //state before removing the splash screen.  We're processing all the WinJS controls,
            //setting up our event handlers, and loading state if necessary
            args.setPromise(WinJS.UI.processAll().then(setEventHandlers).then(loadState));
        }
    };

    function loadState() {
        //here we're getting the ToggleSwitch WinJS control from the DOM, by accessing it using
        // the id attribute of the div, as well as the .winControl property. Once we have a reference
        // to the actual WinJS control, we can access it's properties and methods (like .checked)
        var toggleSwitch = document.getElementById("toggle-update").winControl;
        //we're loading the toggle state session variable that we saved in app.oncheckpoint, and
        //setting the ToggleSwitch control to that state
        toggleSwitch.checked = WinJS.Application.sessionState.toggleState;

        //here we're getting the string we saved in our roaming settings and serializing it back
        // to an array we can work with in javascript.  Need to check if it's null to ensure
        // our app still works if there is no roaming state or it's the first time we've ever run the app
        var searchString = Windows.Storage.ApplicationData.current.roamingSettings.values["searches"];
        if (searchString != null) {
            app.searches = JSON.parse(searchString);
            _.each(app.searches, CreateSearchResult);
        }
    }

    function setEventHandlers() {
        //here we're pre-compiling the underscore template so we can use it later.  See
        //http://underscorejs.org/#template
        app.searchTemplate = _.template(document.getElementById("search-result-template").innerHTML);

        //binding to the Search button is as easy as defining the onclick function - nothing WinJS specific here
        document.getElementById("search-button").onclick = function () {
            var searchTerm = document.getElementById("search-term");
            var term = searchTerm.value;
            CreateSearchResult(term);
            searchTerm.value = "";
        };

        //here we're binding to the AppBarCommand by referring to it by the ID we defined in data-win-options
        document.getElementById("refresh").onclick = function () {
            _.each(app.searches, updateSearch);
        }

        //also using a standard javascript function, setInterval, to schedule updates 
        //to the twiter feed every 10 seconds
        setInterval(function () {
            var toggleSwitch = document.getElementById("toggle-update").winControl;
            if (toggleSwitch.checked == true) {
                _.each(app.searches, updateSearch);
            }
        }, 10 * 1000);
    }

    //here we simply create a div and append it to the document.  Again nothing specific to WinJS
    // you'll notice the -ms-grid CSS - this is to ensure each column we add to the div is appended to the end
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

    //here we use a WinJS function to make an ajax request.  It's similar in structure to $.ajax in that you pass
    //an options object and give it a callback.  .xhr returns a Promise object which we then bind a "done" handler to
    function updateSearch(term) {
        WinJS.xhr({
            url: 'http://search.twitter.com/search.json?rpp=15&q=' + term,
            //url: '/data/data.json',
            responseType: 'json'
        }).done(function (response) {
            var data = JSON.parse(response.responseText);
            var targetElement = document.getElementById(term);
            targetElement.innerHTML = app.searchTemplate({ term: term, results: data.results });
        });
    }

    //here is the event handler for our 'suspending' event.  When our app is about to be suspended, we save our state to
    //session and roaming settings. Technically this should be done as soon as we click the toggle switch or create a new
    //search, but I'm doing it here for demonstration purposes.
    app.oncheckpoint = function (args) {
        var toggleSwitch = document.getElementById("toggle-update").winControl;
        //the sessionState object is a javascript object that gets serialized when the app is suspended. It gets removed
        //whenever someone forcably closes our app (alt+f4, task manager) or when the PC is restarted. Temporary, low-impact
        //settings should be stored here
        WinJS.Application.sessionState.toggleState = toggleSwitch.checked;

        //the roamingSettings is a string-string dictionary that is saved to disk every time the app is suspended. It is also
        //then uploaded to the user's Microsoft Account, and shared between all their windows 8 devices - so if they have the
        //same app installed on their laptop and their tablet, it will automagically save settings between devices
        Windows.Storage.ApplicationData.current.roamingSettings.values["searches"] = JSON.stringify(app.searches);
    };

    app.start();
})();
