function selectQuestion(){
	return db.ref('fibrw/questions').once('value', snapshot => {
		var options = '';
	
		for(var i = 0; i < snapshot.val().length; i++){
			options += '<option>' + (i + 1) + '</option>';
		}
	
		document.getElementById("chooseQuestion").innerHTML = "<b>Select question: </b> <select>" + options + "</select>";
	});
}

var q;
function getQuestion(){
	var selectedQuestion;
	selectedQuestion = document.getElementsByTagName("select")[0].value;

	db.ref('fibrw/questions/' + (selectedQuestion - 1)).once('value', snapshot => {
		q = snapshot.val();
		
		var question = snapshot.val().question;

		for(var i = 0; i < snapshot.val().inputs.length; i++){
			var input =  '';
			
			for(var j = 0; j < snapshot.val().inputs[i].length; j++){
				input += '<li onclick=fillInBlank(this.innerText)>' + snapshot.val().inputs[i][j] + '</li>' ;
			}
			
			var inputs = '<span class="dropdown">'
						+ '<button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown">'
							+ ''
							+ '<span class="caret"></span>'
						+ '</button>'
						+'<ul class="dropdown-menu">'
							+ input
						+ '</ul>'
						+ '</span>';
						
			question = question.replace('___', inputs);
		}
		
		document.getElementById("question").innerHTML = question;
	});
}

selectQuestion().then(db => {
	getQuestion();
});

function fillInBlank(input){
	document.getElementsByClassName("open")[0].getElementsByTagName("button")[0].innerHTML = input;
}

function checkResult(){
    var inputs = document.getElementsByTagName("button");
    var answers = q.answers;
	
    /*var count = 0;
    Object.keys(answers).forEach(j => {
        count++;
    });*/

    var correct = 0;
    for(let i = 0; i < answers.length; i++){
        //console.log(i + ": " + answers[i] + '-' + inputs[0].value);
		console.log(inputs[0].innerText);
        if(answers[i].toLowerCase().replace('.','') == inputs[0].innerText.toLowerCase().replace('.','')){
            correct++;
			document.getElementsByClassName("dropdown")[0].outerHTML = '<span style="color: green;">' + inputs[0].innerText + "</span>"
								+ '<span style="color:green;"> (' + answers[i] + ")</span>";
        } else {
			document.getElementsByClassName("dropdown")[0].outerHTML = '<span style="color: red;">' + inputs[0].innerText + "</span>"
								+ '<span style="color:green;"> (' + answers[i] + ")</span>";
		}
		
    }

    document.getElementById("correct").innerHTML = "Correct: " + correct + "/" + answers.length + "<br>" + answers;
    console.log(correct + "/" + answers.length);
	
	/*var fibrw = localStorage.getItem("fibrw") == null? {lastAttempt: "", redo: ""} : JSON.parse(localStorage.getItem("fibrw"));
	
	var question = document.getElementsByClassName("inputPagination")[0].value;
	fibrw.lastAttempt = question;
	
	if(correct/answers.length < 0.8){
		if(fibrw.redo == null){
			fibrw.redo = question + ",";
		} else if(fibrw.redo.indexOf(question + ",") < 0){
			fibrw.redo = fibrw.redo + question + ",";
		}
	} else {
		if(fibrw.redo == null){
			
		} else if(fibrw.redo.indexOf(question + ",") > 0){
			fibrw.redo = fibrw.redo.replace(question + ",", "");
			console.log(question);
		}
	}
	
	db.ref('fibrw').update(fibrw);
	db.ref('fibrw/questions/' + (question - 1) + '/answers').update(answers);
	console.log(answers);
	localStorage.setItem("fibrw", JSON.stringify(fibrw))
	
	console.log(JSON.parse(localStorage.getItem("fibrw")));*/
}

function nextQuestion(){
	document.getElementsByTagName("select")[0].value = parseInt(document.getElementsByTagName("select")[0].value) + 1;
	//document.getElementsByTagName("select")[0].onchange();
	getQuestion();
	document.body.scrollTop = 0; // For Safari
	document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

function previousQuestion(){
	document.getElementsByTagName("select")[0].value = parseInt(document.getElementsByTagName("select")[0].value) - 1;
	//document.getElementsByTagName("select")[0].onchange();
	getQuestion();	
	document.body.scrollTop = 0; // For Safari
	document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}