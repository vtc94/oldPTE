// Load transcript
// Select question
var recordedText;
var selectedTranscript;
var selectedQuestion;
var countdown;
var audio;
var auto = false;
var manual = true;
var haveDone = 0;
var isRedo = false;

db.ref('rs').once('value', snapshot => {
	if(snapshot.val()){
		localStorage.setItem("rs", JSON.stringify(snapshot.val()));
	} else {
		var rs = localStorage.getItem("rs") == null? {lastAttempt: "1", redo: ""} : JSON.parse(localStorage.getItem("rs"));
		db.ref('rs').update(rs);
	}
	
	var lastAttempt = localStorage.getItem("rs") == null? snapshot.val().lastAttempt : JSON.parse(localStorage.getItem("rs")).lastAttempt;

	getQuestions(lastAttempt);
	console.log(JSON.parse(localStorage.getItem("rs")));
});
	
function getQuestions(lastAttempt){
	document.getElementById("questionNumber").innerHTML = '<h1>Question ' + (parseInt(lastAttempt) + 1) + '</h1>'; 
	
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if(this.readyState == 4 && (this.status == 200)){
			var sentences = this.responseText.split('\n');
	
			var options = '';
			
			for(let i = 0; i < sentences.length; i++){
				options += '<option>' + (i+1) + '</option>';
			}
			
			document.getElementById("chooseQuestion").innerHTML = "<b>Select question: </b> <select>" + options + "</select>";
			
			if(lastAttempt == document.getElementsByTagName("select")[0].length){
				document.getElementById("questionNumber").innerHTML = '<h1>Question 1</h1>'; 
				document.getElementsByTagName("select")[0].value = 1;
			} else {
				document.getElementById("questionNumber").innerHTML = '<h1>Question ' + (parseInt(lastAttempt) + 1) + '</h1>'; 
				document.getElementsByTagName("select")[0].value = parseInt(lastAttempt) + 1;
			}
			
			selectedQuestion = document.getElementsByTagName("select")[0].value;
			selectedTranscript = sentences[(selectedQuestion -1)].substring(sentences[(selectedQuestion -1)].indexOf(" ")).trim();
			
			
			countTime();
			
			document.getElementsByTagName("select")[0].onchange = function(){
				document.getElementById('speaking').innerHTML = '<button onclick="tryAgain()">Try again</button>'
																+ '<br><br><br>'
																+ '<div id="correct">Correct: </div>'
																+ '<br><div id="transcript"><b>Transcript: </b></div>'
																+ '<div id="answer"><b>Answer: </b></div>';
				
				if(recognition){
					recognition.stop();
				}
				selectedQuestion = document.getElementsByTagName("select")[0].value;
				selectedTranscript = sentences[(selectedQuestion -1)].substring(sentences[(selectedQuestion -1)].indexOf(" ")).trim();
				
				document.getElementById("questionNumber").innerHTML = '<h1>Question ' + selectedQuestion + '</h1>';
				
				countTime();
			};
		}
	};
	
	xhttp.open("GET", "../rs/transcripts.txt", true);
	xhttp.send();
}

// Countdown the preration time
function countTime(){
	clearInterval(countdown);
	
	audio = new Audio('../rs/audio/' + selectedQuestion + '.mp3');

	var countdownNum = 3;
	
	document.getElementById("countdown").innerHTML = "Beginning in " + countdownNum + " seconds";
	
	countdown = setInterval(function(){
		document.getElementById("countdown").innerHTML = "Beginning in " + countdownNum + " seconds";
		countdownNum--;
		
		if(countdownNum < 0){
			document.getElementById("countdown").innerHTML = 'Listen...';
			//console.log(countdownNum);
			clearInterval(countdown);
			clearInterval(goNext);
			countdownNum = 3;
			audio.play();
			audio.onended = function(){
				document.getElementById("countdown").innerHTML = 'Recording...';
				document.getElementById('speaking').innerHTML = '<button onclick="tryAgain()">Try again</button>'
																+ '<br><br><br>'
																+ '<div id="correct">Correct: </div>'
																+ '<br><div id="transcript"><b>Transcript: </b></div>'
																+ '<div id="answer"><b>Answer: </b></div>';
				record();
			};
		}
	}, 1000);
}

// Compare answer with transcript and check result
var recognition;
				
function record(){
	if('speechRecognition' in window){
		recognition = new speechRecognition();
		speechToText(recognition);
	} else if('webkitSpeechRecognition' in window){
		recognition = new webkitSpeechRecognition();
		speechToText(recognition);
	} else{
		console.log('Your Browser does not support speech recognition.');
	}
}

var endSpeak = true;
var goNextTime = 7;
var goNext;

function speechToText(recognition){
	var transcript = '';
	recognition.lang = 'en-US';
	recognition.continuous = true;
	recognition.interimResults = true;

	recognition.start();
	
	endSpeak = true; //use to confirm final transcript
	
	recognition.onresult = function(event){
		transcript = event.results[event.resultIndex][0].transcript;

		document.getElementById("answer").innerHTML = "Answer: " + transcript;
		recordedText = transcript;
				
		if(event.results[event.resultIndex].isFinal && event.results[event.resultIndex][0].confidence > 0.2 && endSpeak){
			endSpeak = false;
			checkResult();
		}
	};

	recognition.onend = function(event){
		endSpeak = true;
		if(auto){
			goNext = setInterval(function(){
				document.getElementById("autoNotice").innerHTML = "Go to next question in " + (goNextTime--) + ' seconds...';
				
				if(goNextTime < 0){
					clearInterval(goNext);
					goNextTime = 7;
					nextQuestion();
				}
			},1000);
		}
	};
}

function checkResult(){
	document.getElementById("transcript").innerHTML = "<b>Transcript: </b>" + selectedTranscript;
	
	var input = recordedText.toLowerCase();
	var answer = selectedTranscript.toLowerCase();
	
	answer = answer.replace(/[^A-Za-z0-9\s]/gi,'');	
	input = input.replace(/[^A-Za-z0-9\s]/gi,'');

	var answers = answer.split(' ');
	var inputs = input.split(' ');
	var correct = 0;
	var output = '';
	var right = [];
	
	for(var i = 0; i < inputs.length; i++){
		for(var j = 0; j < answers.length; j++){
			if(inputs[i] == answers[j]){
				right.push(i);
			}
		}
	}
	
	for(var i = 0; i < right.length; i++){
		if(right[i] > right[i+1]){
			if(answers.indexOf(inputs[right[i]]) < answers.indexOf(inputs[right[i+1]])){
				right.splice(i,1);			
			} else {
				right.splice(i+1,1);
				i = i - 1;
			}
		}
	}
	
	for(var i = 0; i < right.length; i++){
		if(inputs[right[i]] == inputs[right[i+1]]){
			right.splice(i,1);	
		}
	}
	
	for(var i = 0; i < right.length; i++){
		console.log(inputs[right[i]]);
	}
	
	for(var i = 0; i < right.length; i++){
		inputs[right[i]] = '<span style="color:green;">' + inputs[right[i]] +  '</span>';
	}
	
	for(var i = 0; i < inputs.length; i++){
		output += inputs[i] + ' ';
	}
	
	correct = right.length;
	
	document.getElementById("countdown").innerHTML = 'Correct: ' + Math.floor(correct*100/answers.length) + '%';
	document.getElementById("correct").innerHTML = "Correct: " + correct + "/" + answers.length;
	document.getElementById("answer").innerHTML = '<b style="color:black;">Answer: </b>' + output;
	document.getElementById("answer").style.color = "red";
	
	console.log(output);
	console.log(correct + "/" + answers.length);
	
	var rs = localStorage.getItem("rs") == null? {lastAttempt: "", redo: ""} : JSON.parse(localStorage.getItem("rs"));
	
	if(!isRedo){
		rs.lastAttempt = selectedQuestion;
	}
	
	if(correct/answers.length < 0.8){
		if(rs.redo == null){
			rs.redo = " " + selectedQuestion + ",";
		} else if(rs.redo.indexOf(" " + selectedQuestion + ",") < 0){
			rs.redo = rs.redo + " " + selectedQuestion + ",";
		}
	} else {
		if(!rs.redo){
			
		} else if(rs.redo.indexOf(" " + selectedQuestion + ",") >= 0){
			rs.redo = rs.redo.replace(" " + selectedQuestion + ",", "");
			//console.log(selectedQuestion);
		}
	}
	
	db.ref('rs').update(rs);
	localStorage.setItem("rs", JSON.stringify(rs));
	
	console.log(JSON.parse(localStorage.getItem("rs")));
	
	recognition.stop();
	
	haveDone++;
	
	console.log("Question Done: " + haveDone);
	
	if(haveDone == 50){
		alert("Congratualation! You have done 50 questions...");
	}
}

function tryAgain(){
	clearInterval(goNext);
	goNextTime = 5;
	document.getElementsByTagName("select")[0].onchange();
}

function nextQuestion(){
	clearInterval(goNext);
	goNextTime = 5;
	
	if(document.getElementsByTagName("select")[0].value != document.getElementsByTagName("select")[0].length){
		document.getElementsByTagName("select")[0].value = parseInt(document.getElementsByTagName("select")[0].value) + 1;
	}
	document.getElementsByTagName("select")[0].onchange();
}

function previousQuestion(){
	clearInterval(goNext);
	goNextTime = 5;
	
	if(document.getElementsByTagName("select")[0].value != 1){
		document.getElementsByTagName("select")[0].value = parseInt(document.getElementsByTagName("select")[0].value) - 1;
	}
	document.getElementsByTagName("select")[0].onchange();
}

var lastRedo =" 0";

function redoQuestion(){
	isRedo = true;
	
	clearInterval(goNext);
	goNextTime = 5;
	
	var rs = JSON.parse(localStorage.getItem("rs"));
	var redo = rs.redo.substring(0, rs.redo.indexOf(','));
	
	if(parseInt(lastRedo) != 0 && parseInt(redo) < parseInt(lastRedo)){
		alert("You have just gone through the redo track!");
	} else {
		lastRedo = redo;
		
		rs.redo = rs.redo.replace(redo + ', ', '') + " " + redo + ',';
	
		localStorage.setItem("rs", JSON.stringify(rs));
	
		document.getElementsByTagName("select")[0].value = parseInt(redo);
		document.getElementsByTagName("select")[0].onchange();
	}
}

function autoMode(){
	auto = true;
	manual = false;
	document.getElementById("auto").getElementsByTagName("button")[0].style.backgroundColor = "grey";
	document.getElementById("auto").getElementsByTagName("button")[1].style.backgroundColor = "initial";
}

function manualMode(){
	clearInterval(goNext);
	goNextTime = 5;
	manual = true;
	auto = false;
	document.getElementById("autoNotice").innerHTML = "Auto next is off...";
	document.getElementById("auto").getElementsByTagName("button")[1].style.backgroundColor = "grey";
	document.getElementById("auto").getElementsByTagName("button")[0].style.backgroundColor = "initial";
}
manualMode();

// Change question by pressing a key
document.onkeydown = function(event){		
	if(event.keyCode == 37 || event.keyCode == 65){
		//press left arrow key
		previousQuestion();
	} else if(event.keyCode == 38 || event.keyCode == 87){
		//press up arrow key
		redoQuestion();
	} else if(event.keyCode == 39 || event.keyCode == 68){
		//press right arrow key
		nextQuestion();
	} else if(event.keyCode == 40 || event.keyCode == 83){
		//press down arrow key
		tryAgain();
	} else if(event.keyCode == 32){
		tryAgain();
	} else if(event.keyCode == 13){
		//press white space key
		redoQuestion();
	}
}
 