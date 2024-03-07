import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  stopExecution: boolean = false;

  stop(): void {
    this.stopExecution = true;
  }

  outf(text: string): void {
    const mypre = document.getElementById("output") as HTMLElement;
    mypre.innerHTML = mypre.innerHTML + text;
  }

  displayError(linenumber: number, lineText: string, errorText: string): void {
    const mypre = document.getElementById("output") as HTMLElement;
    let displayText: string = errorText + "\n" + "line " + (linenumber + 1) + ": " + lineText;
    this.changeOutputText(displayText, mypre);
    this.changeOutputColor("#ffcccc");
  }

  changeOutputText(text: string, htmlElement: HTMLElement = document.getElementById("output") as HTMLElement): void {
    htmlElement.innerHTML = text;
  }

  changeOutputColor(color: string, htmlElement: HTMLElement = document.getElementById("output") as HTMLElement): void {
    htmlElement.style.backgroundColor = color;
  }

  builtinRead(x: string): any {
    if (Sk.builtinFiles === undefined || Sk.builtinFiles["files"][x] === undefined) {
      throw new Error("File not found: '" + x + "'");
    }
    return Sk.builtinFiles["files"][x];
  }

  runit(): void {
    this.stopExecution = false;
    this.changeOutputColor("white");
    const prog: string = this.editor.getDoc().getValue();
    const mypre = document.getElementById("output") as HTMLElement;
    mypre.innerHTML = '';
    Sk.pre = "output";
    Sk.configure({
      output: this.outf,
      read: this.builtinRead,
      execLimit: 10000,
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
        if (this.stopExecution) {
          console.log("execution interrupted");
          throw new Error("Execution interrupted");
        }
      }
    });
    myPromise.then((mod: any) => {
        console.log('success');
      },
      (err: string) => {
        let interrupt: string = "Execution interrupted";
        if (err === interrupt) {
          this.changeOutputText(interrupt);
        } else {
          let lineNumber: number = this.extractLineNumber(err.toString());
          while (this.isLineEmpty(lineNumber)) {
            lineNumber--;
          }
          this.highlightLine(lineNumber);
          this.displayError(lineNumber, this.editor.getLine(lineNumber), err.toString());
          console.log(err.toString());
        }
      });
  }

  extractLineNumber(errorString: string): number {
    const match = errorString.match(/line (\d+)/);
    return match ? parseInt(match[1], 10) - 1 : 0;
  }

  highlightLine(lineNumber: number): void {
    if (lineNumber !== null && lineNumber >= 0) {
      this.editor.markText({line: lineNumber, ch: 0}, {line: lineNumber + 1, ch: 0}, {className: "highlighted-error"});
    }
  }

  editor = CodeMirror.fromTextArea(document.getElementById("yourcode"), {
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

  isLineEmpty(lineNumber: number): boolean {
    const lineContent: string = this.editor.getLine(lineNumber);
    return !lineContent || !lineContent.trim();
  }

  constructor() {
    this.editor.on('change', () => {
      this.editor.getAllMarks().forEach((mark: any) => {
        mark.clear();
      });
    });
  }
}
