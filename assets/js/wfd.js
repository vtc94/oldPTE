// Load transcript
// Select question
//var recordedText;
var selectedTranscript;
var selectedQuestion;
var countdown;
var audio;
var auto = false;
var manual = true;
var goNextTime = 7;
var goNext;
var haveDone = 0;

db.ref('wfd').once('value', snapshot => {
	if(snapshot.val()){
		localStorage.setItem("wfd", JSON.stringify(snapshot.val()));
	} else {
		var wfd = localStorage.getItem("wfd") == null? {lastAttempt: "1", redo: ""} : JSON.parse(localStorage.getItem("wfd"));
		db.ref('wfd').update(wfd);
	}
	
	var lastAttempt = localStorage.getItem("wfd") == null? snapshot.val().lastAttempt : JSON.parse(localStorage.getItem("wfd")).lastAttempt;

	getQuestions(lastAttempt);
	console.log(JSON.parse(localStorage.getItem("wfd")));
});
	
function getQuestions(lastAttempt){	
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
			} else{
				document.getElementById("questionNumber").innerHTML = '<h1>Question ' + (parseInt(lastAttempt) + 1) + '</h1>'; 
				document.getElementsByTagName("select")[0].value = parseInt(lastAttempt) + 1;				
			}			
			
			selectedQuestion = document.getElementsByTagName("select")[0].value;
			selectedTranscript = sentences[(selectedQuestion -1)].substring(sentences[(selectedQuestion -1)].indexOf(" ")).trim();
			
			
			countTime();
			
			document.getElementsByTagName("select")[0].onchange = function(){
				document.getElementById('speaking').innerHTML = '<button onclick="checkResult()">Check</button>'
																+ '<br><br><br>'
																+ '<div id="correct">Correct: </div>'
																+ '<br><div id="transcript"><b>Transcript: </b></div>'
																+ '<div id="answer"><b>Answer: </b></div>';
				
				/*if(recognition){
					recognition.stop();
				}*/
				selectedQuestion = document.getElementsByTagName("select")[0].value;
				selectedTranscript = sentences[(selectedQuestion -1)].substring(sentences[(selectedQuestion -1)].indexOf(" ")).trim();
				
				document.getElementById("questionNumber").innerHTML = '<h1>Question ' + selectedQuestion + '</h1>';
				
				countTime();
			};
		}
	};
	
	xhttp.open("GET", "../wfd/transcripts.txt", true);
	xhttp.send();
}

// Countdown the preration time
function countTime(){
	document.getElementById("input").contentEditable = false;
	document.getElementById("input").innerHTML = '';
	document.getElementById("input").contentEditable = true;
	document.getElementById("input").focus();
				
	clearInterval(countdown);
	clearInterval(goNext);
	
	audio = new Audio('../wfd/audio/' + selectedQuestion + '.mp3');

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
				document.getElementById('speaking').innerHTML = '<button onclick="checkResult()">Check</button>'
																+ '<br><br><br>'
																+ '<div id="correct">Correct: </div>'
																+ '<br><div id="transcript"><b>Transcript: </b></div>'
																+ '<div id="answer"><b>Answer: </b></div>';
				//record();
			};
		}
	}, 1000);
}

// Compare answer with transcript and check result
/*var recognition;
				
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
}*/

function checkResult(){
	clearInterval(countdown);

	document.getElementById('speaking').innerHTML = '<button onclick="tryAgain()">Try again</button>'
													+ '<br><br><br>'
													+ '<div id="correct">Correct: </div>'
													+ '<br><div id="transcript"><b>Transcript: </b></div>'
													+ '<div id="answer"><b>Answer: </b></div>';
																
	document.getElementById("transcript").innerHTML = "<b>Transcript: </b>" + selectedTranscript;
	
	var input = document.getElementById("input").innerText.trim();
	var answer = selectedTranscript;
	
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
	
	var wfd = localStorage.getItem("wfd") == null? {lastAttempt: "", redo: ""} : JSON.parse(localStorage.getItem("wfd"));
	
	wfd.lastAttempt = selectedQuestion;
	
	if(correct/answers.length < 1){
		if(!wfd.redo){
			wfd.redo = " " + selectedQuestion + ",";
		} else if(wfd.redo.indexOf(" " + selectedQuestion + ",") < 0){
			wfd.redo = wfd.redo + " " + selectedQuestion + ",";
		}
	} else {
		if(!wfd.redo){
			
		} else if(wfd.redo.indexOf(" " + selectedQuestion + ",") >= 0){
			wfd.redo = wfd.redo.replace(" " + selectedQuestion + ",", "");
			//console.log(selectedQuestion);
		}
	}
	
	db.ref('wfd').update(wfd);
	localStorage.setItem("wfd", JSON.stringify(wfd));
	
	console.log(JSON.parse(localStorage.getItem("wfd")));
	
	//recognition.stop();
	
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
	
	haveDone++;
	
	if(haveDone == 30){
		alert("Congratualation! You have done 30 questions...");
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

function redoQuestion(){
	clearInterval(goNext);
	goNextTime = 5;
	
	var wfd = JSON.parse(localStorage.getItem("wfd"));
	var redo = wfd.redo.substring(0, wfd.redo.indexOf(','));
	wfd.redo = wfd.redo.replace(redo + ', ', '') + redo + ',';
	
	localStorage.setItem("wfd", JSON.stringify(wfd));
	
	document.getElementsByTagName("select")[0].value = parseInt(redo);
	document.getElementsByTagName("select")[0].onchange();
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

var onFocus = false;

document.getElementById("input").onfocus = function(){
	onFocus = true; 
};

document.getElementById("input").onblur = function(){
	onFocus = false;
};

// Change question by pressing a key
document.onkeydown = function(event){		
	if(!onFocus){
		if(event.keyCode == 37){
			//press left arrow key
			previousQuestion();
		} else if(event.keyCode == 38){
			//press up arrow key
			redoQuestion();
		} else if(event.keyCode == 39){
			//press right arrow key
			nextQuestion();
		} else if(event.keyCode == 40){
			//press down arrow key
			tryAgain();
		} else if(event.keyCode == 32){
			//press white space key
			tryAgain();
		} else if(event.keycode == 65){
			autoMode();
		} else if(event.keycode == 77){
			manualMode();
		}
	} else {	
		if(event.keyCode == 13){
			event.preventDefault();
			checkResult();
			document.getElementById("input").blur();
		}
	}
}
 