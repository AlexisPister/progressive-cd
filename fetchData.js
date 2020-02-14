let url = "http://127.0.0.1:5000/iterativeClustering/buenosAires/greedy-modularity?projection=False"
let iterativeGraph;

// get request with fetch
fetch(url) // Call the fetch function passing the url of the API as a parameter
    .then(function(response) {
        // Your code for handling the data you get from the API
        console.log("getting data")
        return response.json()
    })
    .then(function(data) {
        console.log("got data")
        iterativeGraph = data
        console.log(data)
    })
    .catch(function(error) {
        // This is where you run code if the server returns any errors
        console.log("error")
        console.log(error)
    });


// function loadJSON(path, callback) {
//     // function to load local json file
//     var xobj = new XMLHttpRequest();
//     xobj.overrideMimeType("application/json");
//     xobj.open('GET', path, true);
//     xobj.onreadystatechange = function () {
//         if (xobj.readyState == 4 && xobj.status == "200") {
//         callback(JSON.parse(xobj.responseText));
//         }
//     };
//     xobj.send(null);  
// }

// loadJSON("data/buenosAires.json", function(json){
//     data = json;
//     console.log(data)

//     url = "http://127.0.0.1:8080/clustering/girvan-newman?projection=False"
//     fetch(url,
//         {
//             method: "POST",
//             mode: "no-cors",
//             body: data
//         })
//         .then(function(response) {
//             // Your code for handling the data you get from the API
//             return response.json()
//         })
//         .then(function(data) {
//             console.log(11)
//             console.log(data)
//         })
//         .catch(function(error) {
//             // This is where you run code if the server returns any errors
//             console.log("error")
//             console.log(error)
//         });

// })

