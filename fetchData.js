// let url = "http://127.0.0.1:5000/iterativeClustering/buenosAires/greedy-modularity?projection=False"
// let iterativeGraph;

// // get request with fetch
// fetch(url) // Call the fetch function passing the url of the API as a parameter
//     .then(function(response) {
//         // Your code for handling the data you get from the API
//         console.log("getting data")
//         return response.json()
//     })
//     .then(function(data) {
//         console.log("got data")
//         iterativeGraph = data
//         console.log(data)
//     })
//     .catch(function(error) {
//         // This is where you run code if the server returns any errors
//         console.log("error")
//         console.log(error)
//     });

let DATA;

function loadJSON(path, callback) {
    // function to load local json file
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', path, true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
        callback(JSON.parse(xobj.responseText));
        }
    };
    xobj.send(null);
}

loadJSON("data/buenosAires_uni_1780_1820_bc.json", function(json){
    let data = json;
    console.log(data)

    const url = "http://197bde5d.ngrok.io/iterative/modularity"


    // $.post(url, data, function(data, status){
    //     console.log(data, status)
    // })


    fetch(url,
        {
            method: "POST",
            mode: "cors",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(function(response) {
            // Your code for handling the data you get from the API
            return response.json()
        })
        .then(function(data) {
            console.log(10)
            DATA = data;
        })
        .catch(function(error) {
            // This is where you run code if the server returns any errors
            console.log("error")
            console.log(error)
        });
})

