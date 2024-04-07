let ChatLogDTO = {
    id: null,
    chatNumber: null,
    codeNumber: null,
    chatQuestion: null,
    chatAnswer: null,
    timeStamp: null,
};

let PythonLogRequestDTO = {
    id: null,
    pythonCode: null,
    errorMessage: null,
    taskNumber: null
};

let SubmitDTO = {
    errorCount: null,
    correctCount: null,
    startTime: null,
    endTime: null,
    totalQuestions: null,
    seconds: null
};

let chatLogDTOS = [];

let chatCounter = 1;
let stopExecution = false;
let studentId = null;
let codeHasError = true;
let startTime = null;
let endTime = null;
let errorCount = 0;
let correctCount = 0;
const tasks = [
    {id: 1, text: "Napišite funkcijo v Pythonu, ki sprejme seznam števil kot vhod in vrne vsoto vseh sodih števil v seznamu.", chatAllowed: true, difficulty: 1},
    {id: 2, text: "Implementirajte funkcijo v Pythonu, ki sprejme seznam števil kot vhod in vrne največji element v seznamu.", chatAllowed: true, difficulty: 2},
    {id: 3, text: "Napišite funkcijo v Pythonu, ki sprejme seznam kot vhod in vrne nov seznam z obrnjenimi elementi (brez uporabe vgrajene funkcije reverse()).", chatAllowed: true, difficulty: 3},
    {id: 4, text: "Ustvarite funkcijo v Pythonu, ki sprejme seznam števil in ciljno število kot vhod ter vrne število pojavitev ciljnega števila v seznamu.", chatAllowed: true, difficulty: 1},
    {id: 5, text: "Implementirajte funkcijo v Pythonu, ki sprejme seznam kot vhod in vrne nov seznam brez podvojenih elementov, pri tem pa ohranja izvirni red elementov.", chatAllowed: true, difficulty: 2},
    {id: 6, text: "Napišite funkcijo v Pythonu, ki sprejme niz kot vhod in vrne niz v obratnem vrstnem redu.", chatAllowed: false, difficulty: 1},
    {id: 7, text: "Implementirajte funkcijo v Pythonu, ki sprejme seznam nizov kot vhod in vrne nov seznam, ki vsebuje samo nize, ki se začnejo s črko 'a'.", chatAllowed: false, difficulty: 2},
    {id: 8, text: "Ustvarite funkcijo v Pythonu, ki sprejme dve števili kot vhod in vrne njun produkt. Če je produkt večji od 1000, potem vrne njuno vsoto.", chatAllowed: false, difficulty: 3},
    {id: 9, text: "Razvijte funkcijo v Pythonu, ki sprejme seznam števil kot vhod in vrne nov seznam, ki vsebuje samo sode številke.", chatAllowed: false, difficulty: 1},
    {id: 10, text: "Oblikujte funkcijo v Pythonu, ki sprejme niz kot vhod in vrne slovar, kjer so ključi znaki v nizu in vrednosti so število pojavitev vsakega znaka.", chatAllowed: false, difficulty: 2},
];
const themes = [
    'default',
    'monokai',
    'lucario',
    'paraiso-light',
    'ayu-mirage',
    'eclipse',
    'rubyblue',
    'dracula',
    'ambiance',
    'panda-syntax',
    'the-matrix',
    'abbott',
    'abcdef',
    'base16-dark',
    'lesser-dark',
    'liquibyte',
    '3024-night',
    'isotope',
];

let currentTask = 0;
let codes = ["", "", "", "", "", "", "", "", "", ""];

window.onload = function() {
    shuffleArray(tasks);
    fetch('http://localhost:8080/student/getId')
        .then(response => response.text())
        .then(data => {
            console.log(data);
            studentId = data;
            document.getElementById("studentId").innerHTML = studentId;
                            })
        .catch((error) => {
            console.error('Error:', error);
        });
    const dropdownMenu = document.querySelector('.dropdown-menu');

    themes.forEach(theme => {
        const dropdownItem = document.createElement('li');
        dropdownItem.classList.add('dropdown-item');
        dropdownItem.textContent = theme;
        dropdownMenu.appendChild(dropdownItem);
    });

// Add an event listener to the dropdown menu
    dropdownMenu.addEventListener('click', event => {
        event.preventDefault();
        const selectedTheme = event.target.textContent;
        editor.setOption('theme', selectedTheme);
    });

    // Get the fa-square-minus icon
    const icon = document.getElementById('hide-nav');

// Get the navigation section
    const nav = document.getElementById('navigation');

// Add an event listener to the icon
    icon.addEventListener('click', () => {
        // Check if the icon is fa-square-minus
        if (icon.classList.contains('fa-square-minus')) {
            // Hide the navigation section
            nav.style.display = 'none';

            // Change the icon to fa-square-plus
            icon.classList.remove('fa-square-minus');
            icon.classList.add('fa-square-plus');
        } else {
            // Show the navigation section
            nav.style.display = 'block';

            // Change the icon to fa-square-minus
            icon.classList.remove('fa-square-plus');
            icon.classList.add('fa-square-minus');
        }
    });
}

function stop() {
    stopExecution = true;
}

const editor = CodeMirror.fromTextArea(document.getElementById("yourcode"), {
    mode: "python",
    lineNumbers: true,
    indentUnit: 4,
    theme: "monokai",
    indentWithTabs: true,
    extraKeys: {
        "Ctrl-Space": "autocomplete",
        "Ctrl-/": "toggleComment",
        "Cmd-/": "toggleComment",
        "Tab": "indentMore",
        "Shift-Tab": "indentLess"
    }
});
function outf(text) {
    const mypre = document.getElementById("output");
    mypre.innerHTML = mypre.innerHTML + text;
}
function displayError(linenumber, lineText, errorText) {
    const mypre = document.getElementById("output");
    let displayText = errorText + "\n" + "line " + (linenumber + 1) + ": " + lineText;
    changeOutputText(displayText, mypre);
    changeOutputColor("#ef2f2f");

}
function changeOutputText(text="", htmlElement= document.getElementById("output")) {
    htmlElement.innerHTML = text;
}

function changeOutputColor(color, htmlElement= document.getElementById("output")) {
    htmlElement.style.backgroundColor = color;
}

function builtinRead(x) {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined)
        throw "File not found: '" + x + "'";
    return Sk.builtinFiles["files"][x];
}

function runit() {
    stopExecution = false;
    changeOutputColor("white");
    const prog = editor.getDoc().getValue();
    changeOutputText();
    Sk.pre = "output";
    Sk.configure({
        output:outf,
        read:builtinRead,
        execLimit: 7500,
        inputTakesPrompt: true,
        timeoutMsg: () => { throw new Error("Your program timed out"); },
        killableWhile: true,
        killableFor: true,
        __future__: Sk.python3
    });
    (Sk.TurtleGraphics || (Sk.TurtleGraphics = {})).target = 'mycanvas';
    const myPromise = Sk.misceval.asyncToPromise(() =>
        Sk.importMainWithBody("<stdin>", false, prog, true), {
        "*": () => {
            if (stopExecution){
                console.log("execution interrupted");
                throw "Execution interrupted"
            }
        }
    });
    let pythonLogRequestDTO = Object.create(PythonLogRequestDTO);
    myPromise.then(function() {
            codeHasError = false;
            correctCount++;
            console.log('success');
        },
        function(err) {
            errorCount++;
            pythonLogRequestDTO.errorMessage = err.toString();
        let interrupt = "Execution interrupted";
        if(err === interrupt) {
            changeOutputText(interrupt);
        }
        else {
            codeHasError = true;
            let lineNumber = extractLineNumber(err.toString());
            while (isLineEmpty(lineNumber)) {
                lineNumber--;
            }
            highlightLine(lineNumber);
            displayError(lineNumber, editor.getLine(lineNumber), err.toString());
            console.log(err.toString());
        }

    }).finally(
        function () {
            if (currentTask === 0) return;
            codes[currentTask - 1] = prog;
            pythonLogRequestDTO.pythonCode = prog;
            pythonLogRequestDTO.id = studentId;
            pythonLogRequestDTO.taskNumber = tasks[currentTask - 1].id;
        let jsonData = JSON.stringify(pythonLogRequestDTO);
        console.log('logging error' + jsonData);
        fetch('http://localhost:8080/python/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: jsonData,
        }).then( r =>console.log(r));
        }

    );
}

function extractLineNumber(errorString) {
    // Extract line number from error message
    const match = errorString.match(/line (\d+)/);
    return match ? parseInt(match[1], 10) - 1 : null;
}

function highlightLine(lineNumber) {
    if (lineNumber !== null && lineNumber >= 0) {
        editor.markText({line: lineNumber, ch: 0}, {line: lineNumber + 1, ch: 0}, {className: "highlighted-error"});
    }
}

function switchAndSaveCode() {
    toggleChat();
    editor.getDoc().setValue(codes[currentTask - 1]);
    document.getElementById("navodila").innerHTML = tasks[currentTask - 1].text;
    changeProgressBar();
    function changeProgressBar() {
        document.getElementById("progress").innerHTML = currentTask.toString();
        document.getElementById("progress-bar").style.width = (currentTask * 10).toString() + "%";
    }

}

function previousCode() {
    if (currentTask >= 1){
        codes[currentTask - 1] = editor.getValue();
        currentTask--;
        switchAndSaveCode();
    }
}

function resetOutputAndVariables() {
    changeOutputText();
    startTime = new Date();
    codeHasError = true;
    chatLogDTOS = [];
    errorCount = 0;
    correctCount = 0;
}

function nextCode() {
    resetOutputAndVariables();
    if(currentTask < tasks.length) {
        if (currentTask > 0) {
            codes[currentTask - 1] = editor.getValue();
            let textArea = document.getElementById("text-area");
            removeChildren(textArea);
        }
        currentTask++;
        switchAndSaveCode();
    }
}
function toggleChat() {
    let isChatAllowed = tasks[currentTask - 1].chatAllowed;

    if (isChatAllowed === true) {
        console.log('isChatAllowed: ' + isChatAllowed);
        document.getElementById('chatGPT-input').disabled = false;
        document.getElementById('submitChat').disabled = false;
        document.getElementById('chatGPT-input').value = "";
    } else {
        console.log('isChatAllowed: ' + isChatAllowed);
        document.getElementById('chatGPT-input').value = "Za to nalogo uporaba chatGPT ni dovoljena.";
        document.getElementById('chatGPT-input').disabled = true;
        document.getElementById('submitChat').disabled = true;
    }
}

editor.on('change', function() {
    editor.getAllMarks().forEach(function(mark) {
        mark.clear();
    });
});

function isLineEmpty(lineNumber) {
    const lineContent = editor.getLine(lineNumber);
    return !lineContent || !lineContent.trim();
}

function copyId() {
    navigator.clipboard.writeText(studentId);
}
async function getChat(){
    if(tasks[currentTask - 1].chatAllowed === false) {
        return;
    }
    const questionPre = document.createElement('pre');
    const chatInput = document.getElementById('chatGPT-input').value;

    let chatLogDTO = Object.create(ChatLogDTO);
    chatLogDTO.chatQuestion = chatInput;
    chatLogDTO.chatNumber = chatCounter;
    chatCounter++;
    chatLogDTO.codeNumber = currentTask;
    chatLogDTO.id = studentId;


    const chatWindow = document.getElementById('text-area');
    questionPre.classList.add('question');
    questionPre.innerHTML = chatInput;
    chatWindow.appendChild(questionPre);


    const answerPre = document.createElement('pre');
    answerPre.classList.add('answer');

    const response = await fetch('http://localhost:8080/openai/getOpenAiChat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatInput)
        });
    console.log(response);
    const responseBody = await response.text();
    const formattedBody = responseBody.replace(/\\n/g, '\n');
    answerPre.innerHTML = formattedBody;
    chatLogDTO.chatAnswer = formattedBody;
    chatLogDTO.timeStamp = new Date().toISOString();
    chatLogDTOS.push(chatLogDTO);
    chatWindow.appendChild(answerPre);
    console.log(chatLogDTOS);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    }

function testChat(){
    const question = document.createElement('div');
    const chatInput = document.getElementById('chatGPT-input').value;

    const chatWindow = document.getElementById('text-area');
    question.innerHTML = chatInput;
    question.classList.add('question');
    chatWindow.appendChild(question);


    const answer = document.createElement('pre');
    answer.classList.add('answer');
    const testAnswer = "You can use the `max()` function to find the highest value in a Python array. Here's an example:\n" +
        "\n" +
        "```python\n" +
        "my_array = [1, 5, 2, 8, 4]\n" +
        "highest_value = max(my_array)\n" +
        "print(highest_value)\n" +
        "```\n" +
        "\n" +
        "This will output:\n" +
        "```\n" +
        "8\n" +
        "```";
    answer.innerHTML = testAnswer;
    chatWindow.appendChild(answer);

    let chatLogDTO = Object.create(ChatLogDTO);
    chatLogDTO.chatQuestion = chatInput;
    chatLogDTO.chatNumber = chatCounter;
    chatCounter++;
    chatLogDTO.codeNumber = currentTask;
    chatLogDTO.id = studentId;
    chatLogDTO.chatAnswer = testAnswer;
    chatLogDTO.timeStamp = new Date().toISOString();
    chatLogDTOS.push(chatLogDTO);
    console.log(chatLogDTOS);
    smoothScrollToBottom(chatWindow);


}

function smoothScrollToBottom(element) {
    const scrollHeight = element.scrollHeight;
    const speed = 30;
    let scrollPosition = element.scrollTop;
    let difference = scrollHeight - scrollPosition;

    function step() {
        difference = scrollHeight - scrollPosition;
        scrollPosition += difference / speed;
        element.scrollTop = scrollPosition;

        if (difference > 1) {
            window.requestAnimationFrame(step);
        }
    }
    window.requestAnimationFrame(step);
}

function submitAll() {
    endTime = new Date();
    let pythonLogRequestDTO = Object.create(PythonLogRequestDTO);
    pythonLogRequestDTO.pythonCode = editor.getValue();
    pythonLogRequestDTO.id = studentId;
    pythonLogRequestDTO.taskNumber = tasks[currentTask - 1].id;
    let submitDTO = Object.create(SubmitDTO);

    submitDTO.errorCount = errorCount;
    submitDTO.correctCount = correctCount;
    submitDTO.startTime = startTime;
    submitDTO.endTime = endTime;
    let timeDiff = endTime - startTime;
    timeDiff /= 1000;
    submitDTO.seconds = Math.round(timeDiff);
    submitDTO.totalQuestions = chatCounter - 1;


    let submitObject = {
        chatLogs: chatLogDTOS,
        pythonLogRequestDTO: pythonLogRequestDTO,
        submitDTO: submitDTO
    };
    let jsonData = JSON.stringify(submitObject);
    console.log('submitting code' + jsonData);
    fetch('http://localhost:8080/python/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: jsonData,
    }).then( r =>console.log(r));

}

function submitPyCode() {
    if (currentTask !== 0 && codes[currentTask - 1].trim() === "") {
        let myModal = new bootstrap.Modal(document.getElementById('warningModal'), {});
        document.getElementById('warningModalBody').innerHTML = "Vaša koda je prazna. Napišite kodo in poskusite znova.";
        myModal.show();
        return;
    }
    if (codeHasError) {
        let myModal = new bootstrap.Modal(document.getElementById('warningModal'), {});
        document.getElementById('warningModalBody').innerHTML = "Vaša koda vsebuje napake ali ni bila izvedena. Popravite napake in jo zaženite ter poskusite znova.";
        myModal.show();
    }
    else {
        let myModal = new bootstrap.Modal(document.getElementById('confirmSubmitModal'), {});
        myModal.show();
    }

}

function submitModal() {
    if (currentTask !== 0) {
        submitAll();
    }
    nextCode();

}



function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function removeChildren(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}


// Prevent closing the window with unsaved code
// window.addEventListener('beforeunload', function (e) {
//     // Cancel the event
//     e.preventDefault();
//     // Chrome requires returnValue to be set
//     e.returnValue = '';
// });


