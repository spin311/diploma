let PythonLogRequestDTO = {
    id: null,
    pythonCode: null,
    errorMessage: null,
    taskNumber: null

}


let stopExecution = false;
let studentId = null;
const tasks = [
    {id: 1, text: "Napišite funkcijo v Pythonu, ki sprejme seznam števil kot vhod in vrne vsoto vseh sodih števil v seznamu."},
    {id: 2, text: "Implementirajte funkcijo v Pythonu, ki sprejme seznam števil kot vhod in vrne največji element v seznamu."},
    {id: 3, text: "Napišite funkcijo v Pythonu, ki sprejme seznam kot vhod in vrne nov seznam z obrnjenimi elementi (brez uporabe vgrajene funkcije reverse())."},
    {id: 4, text: "Ustvarite funkcijo v Pythonu, ki sprejme seznam števil in ciljno število kot vhod ter vrne število pojavitev ciljnega števila v seznamu."},
    {id: 5, text: "Implementirajte funkcijo v Pythonu, ki sprejme seznam kot vhod in vrne nov seznam brez podvojenih elementov, pri tem pa ohranja izvirni red elementov."},
];
let currentTask = 1;
let codes = ["", "", "", "", ""];

window.onload = function() {
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
    changeOutputColor("#ffcccc");

}
function changeOutputText(text, htmlElement= document.getElementById("output")) {
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

// Here's everything you need to run a python program in skulpt
// grab the code from your textarea
// get a reference to your pre element for output
// configure the output function
// call Sk.importMainWithBody()
function runit() {
    stopExecution = false;
    changeOutputColor("aliceblue");
    const prog = editor.getDoc().getValue();
    const mypre = document.getElementById("output");
    mypre.innerHTML = '';
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
            console.log('success');
        },
        function(err) {
            pythonLogRequestDTO.errorMessage = err.toString();
        let interrupt = "Execution interrupted";
        if(err === interrupt) {
            changeOutputText(interrupt);
        }
        else {
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
            pythonLogRequestDTO.pythonCode = prog;
            pythonLogRequestDTO.id = studentId;
            pythonLogRequestDTO.taskNumber = currentTask;
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
    editor.getDoc().setValue(codes[currentTask - 1]);
    document.getElementById("navodila").innerHTML = tasks[currentTask - 1].text;
    document.getElementById("progress").innerHTML = currentTask.toString();
}

function previousCode() {
    if (currentTask > 1){
        codes[currentTask - 1] = editor.getValue();
        currentTask--;
        switchAndSaveCode();
    }


}

function nextCode() {
    if(currentTask < 5) {
        codes[currentTask - 1] = editor.getValue();
        currentTask++;
        switchAndSaveCode();
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
// Prevent closing the window with unsaved code
// window.addEventListener('beforeunload', function (e) {
//     // Cancel the event
//     e.preventDefault();
//     // Chrome requires returnValue to be set
//     e.returnValue = '';
// });


