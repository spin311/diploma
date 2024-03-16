let PythonLogRequestDTO = {
    id: null,
    pythonCode: null,
    errorMessage: null

}


let stopExecution = false;
let studentId = null;

window.onload = function() {
    fetch('http://localhost:8080/student/getId')
        .then(response => response.text())
        .then(data => {
            console.log(data);
            studentId = data;
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
    indentWithTabs: true,
    extraKeys: {
        "Ctrl-Space": "autocomplete",
        "Ctrl-/": "toggleComment",
        "Cmd-/": "toggleComment",
        "Tab": "indentMore",
        "Shift-Tab": "indentLess"
    }
});

// output functions are configurable.  This one just appends some text
// to a pre element.
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
    changeOutputColor("white");
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
    myPromise.then(function(mod) {
        pythonLogRequestDTO.id = studentId;
        pythonLogRequestDTO.pythonCode = prog;

            console.log('success');
        },
        function(err) {
            let pythonLogRequestDTO = Object.create(PythonLogRequestDTO);
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
            let jsonData = JSON.stringify(pythonLogRequestDTO);
            console.log('logging error' + jsonData);

            fetch('http://localhost:8080/python/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: jsonData,
            }).then( r =>console.log(r));

    });
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

function submitCode() {
    let code = editor.getValue();
    console.log(code);

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
