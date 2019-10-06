//-------------------
// GLOBAL variables
//-------------------
var modelName = "cnn";
var model;

var canvasWidth           	= 150;
var canvasHeight 			= 150;
var canvasBackgroundColor 	= "black";
var canvasId              	= "canvas";

document.getElementById('chart_box').innerHTML = "";
document.getElementById('chart_box').style.display = "none";

//---------------
// Create canvas
//---------------
var canvasBox = document.getElementById('canvas_box');
var canvas    = document.createElement("canvas");

canvas.setAttribute("width", canvasWidth);
canvas.setAttribute("height", canvasHeight);
canvas.setAttribute("id", canvasId);
canvas.style.backgroundColor = canvasBackgroundColor;
canvasBox.appendChild(canvas);
if(typeof G_vmlCanvasManager != 'undefined') {
  canvas = G_vmlCanvasManager.initElement(canvas);
}

//------------------------
// Clear Canvas and Chart function
//------------------------
function clearCanvas() {
	var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    if(chart){
        chart.destroy();
    }
}

//-----------------------
// Load Webcam
//-----------------------
var video = document.querySelector("#videoElement");

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (err0r) {
      console.log("Something went wrong!");
    });
}

function stopWebCam(e) {
	var stream = video.srcObject;
	var tracks = stream.getTracks();

	for (var i = 0; i < tracks.length; i++) {
	  var track = tracks[i];
	  track.stop();
	}
	video.srcObject = null;
}

//---------------------------
// Take Picture from Webcam
//---------------------------
function takePicture() {
    var context =  canvas.getContext("2d");
    var w = 150,h = 150;
    // Define the size of the rectangle that will be filled (basically the entire element)
    context.fillRect(0, 0, w, h);
    // Grab the image from the video
    context.drawImage(video, 0, 0, w, h);
}

//---------------------------
// Upload Picture from File
//---------------------------
function handleImage(e){
    var reader = new FileReader();
    reader.onload = function(event){
        var img = new Image();
        img.onload = function(){
			var context =  canvas.getContext("2d");
			var w = 150,h = 150;
			// Define the size of the rectangle that will be filled (basically the entire element)
			context.fillRect(0, 0, w, h);
			// Grab the image from the video
			context.drawImage(img, 0, 0, w, h);
			// predict()
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
}

//-----------------------
// Select Model
//-----------------------
$('input:radio[name="model_select"]').change(function(){
    console.log($(this).val());
    if($(this).val() === 'MLP'){
        modelName = "mlp";
    } else if ($(this).val() === "CNN") {
        modelName = "cnn";
    }
    loadModel(modelName);
});

//--------------------------------------------
// Loader for sign language recognizer model
//--------------------------------------------
async function loadModel(modelName) {
    console.log("model loading..");

    model = undefined;

    // load the model using a HTTPS request (where you have stored your model files)
    model = await tf.loadLayersModel("/output/" + modelName + "/model.json");

    console.log("model loaded..");
}

loadModel(modelName);

//-----------------------------------------------
// Preprocess the canvas to be MLP/CNN friendly
//-----------------------------------------------
function preprocessCanvas(image, modelName) {

	// if model is not available, send the tensor with expanded dimensions
	if (modelName === undefined) {
		alert("No model defined..")
	}

	// if model is mlp, perform all the preprocessing
	else if (modelName === "mlp") {

		// resize the input image to mlp's target size of (784, )
		let tensor = tf.browser.fromPixels(image)
		    .resizeNearestNeighbor([28, 28])
		    .mean(2)
		    .toFloat()
			.reshape([1 , 784]);
		return tensor.div(255.0);
	}

	// if model is cnn, perform all the preprocessing
	else if (modelName === "cnn") {
		// resize the input image to cnn's target size of (1, 28, 28)
		let tensor = tf.browser.fromPixels(image)
		    .resizeNearestNeighbor([28, 28])
		    .mean(2)
		    .expandDims(2)
		    .expandDims()
		    .toFloat();
		console.log(tensor.shape);
		return tensor.div(255.0);
	}

	// else throw an error
	else {
		alert("Unknown model name..")
	}
}

// Returns the index of the max element in the array
function argMax(array) {
	return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
}

//------------------------------------------------
// Predict function for sign language recognizer
//------------------------------------------------
async function predict() {
	// preprocess canvas
	let tensor = preprocessCanvas(canvas, modelName);

	// make predictions on the preprocessed image tensor
	let predictions = await model.predict(tensor).data();

	// get the model's prediction results
	let results = Array.from(predictions)

	// display the predictions in chart
	displayChart(results)
	let index = argMax(results)
	let predictedLetter = String.fromCharCode(65+index);
	console.log(predictedLetter);
}

//------------------------------
// Chart to display predictions
//------------------------------
var chart = "";
var firstTime = 0;
function loadChart(label, data, modelSelected) {
	var context = document.getElementById('chart_box').getContext('2d');
	chart = new Chart(context, {
	    // The type of chart we want to create
	    type: 'bar',

	    // The data for our dataset
	    data: {
	        labels: label,
	        datasets: [{
	            label: modelSelected + " prediction",
	            backgroundColor: '#f50057',
	            borderColor: 'rgb(255, 99, 132)',
	            data: data,
	        }]
	    },

	    // Configuration options go here
	    options: {}
	});
}

//-------------------------------------------------------------
// Display prediction chart with updated drawing from canvas
//-------------------------------------------------------------
function displayChart(data) {
  	var select_option = modelName;

	label = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
	if (firstTime == 0) {
		loadChart(label, data, select_option);
		firstTime = 1;
	} else {
		chart.destroy();
		loadChart(label, data, select_option);
	}
	document.getElementById('chart_box').style.display = "block";
}