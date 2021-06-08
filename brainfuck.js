"use strict";

(function() {

    const BYTES_FOR_CELL = 1;
    const MEMORY_SIZE = 10;

    class UnsignedInt {
        static max = (1 << ((1 << 3) * BYTES_FOR_CELL));

        constructor(value = 0) {
            this.fill(value);
        }

        increment() {
            this.value = (this.value + 1) % UnsignedInt.max;
        }

        decrement() {
            this.value--;
            if (this.value < 0) this.value = UnsignedInt.max;
        }

        fill(value = 0) {
            value = value % UnsignedInt.max;
            if (value < 0)
                this.value = UnsignedInt.max + value;
            else this.value = value;
        }
    }

    class Ok {};
    class Error {
        static codes = {
            INVALID_SYNTAX: 0,
            UNDEFINED_TOKEN: 1,
            EMPTY_INPUT: 2,
        };
        static messages = [
            'Invalid syntax',
            'Undefined token',
            'Run-time error: empty input',
        ];

        constructor(code) {
            this.code = code;
        }

        what() {
            return Error.messages[this.code];
        }
    };

    const tokens = {
        INCREMENT: '+',
        DECREMENT: '-',
        R_SHIFT: '>',
        L_SHIFT: '<',
        INPUT: ',',
        OUTPUT: '.',
        BEGIN_LOOP: '[',
        END_LOOP: ']',
        EOL: ''
    };

    const tokenLength = 1;

    const runBtn = document.querySelector('.run-btn');

    let memory = [];
    let stack_br = 0;

    let program_ptr = 0;
    let memory_ptr = 0;

    let program = '';

    let input = '';
    let output = '';

    
    runBtn.onclick = event => {
        program = document.querySelector('.program__textarea').value.replace(/\s/g,'');
        input =  document.querySelector('.input__input').value;

        stack_br = program_ptr = memory_ptr = 0;
        memory = getMemory(MEMORY_SIZE);

        showOutput('', false);

        run();
    };

    function getMemory(memorySize) {
        const memory = [];
        for (let i = 0; i < memorySize; i++)
            memory[i] = new UnsignedInt();
        return memory;
    }

    function run() {
        while (true) {
            const token = readToken();

            if (token == tokens.EOL) break;

            let result = execute(token, memory);

            if (result instanceof Error) {
                showOutput(result.what(), false);
                return;
            }
        }

        showOutput(output, true);
        output = '';
    }

    function readToken() {
        const token = program.slice(program_ptr, program_ptr + tokenLength);
        program_ptr += tokenLength;
        return token;
    }

    function execute(token, memory) {
        const extra_items = 5;
        switch (token) {
            case tokens.INCREMENT:
                memory[memory_ptr].increment();
                break;
            case tokens.DECREMENT:
                memory[memory_ptr].decrement();
                break;
            case tokens.R_SHIFT:
                memory_ptr++;
                for (let i = 0; i < extra_items; i++)
                    memory.push(new UnsignedInt());
                break;
            case tokens.L_SHIFT:
                if (memory_ptr === 0) {
                    for (let i = 0; i < extra_items; i++)
                        memory.splice(0, 0, new UnsignedInt());
                    memory_ptr = extra_items - 1;
                } else memory_ptr--;
                break;
            case tokens.INPUT:
                const status = getInput(memory);
                if (status instanceof Error)
                    return status;
                break;
            case tokens.OUTPUT:
                getOutput(memory);
                break;
            case tokens.BEGIN_LOOP:
                execLoop(memory);
                break;
            case tokens.END_LOOP:
                if (--stack_br < 0)
                    return new Error(Error.codes.INVALID_SYNTAX);
            default:
                return new Error(Error.codes.UNDEFINED_TOKEN);
        }
        return new Ok();
    }

    function getInput(memory) {
        if (input) {
            memory[memory_ptr].fill(input.charCodeAt(0));
            input = input.substring(1);
            return new Ok();
        } else {
            return new Error(Error.codes.EMPTY_INPUT);
        }
    }

    function getOutput(memory) {
        output += String.fromCharCode(memory[memory_ptr].value);
    }

    function execLoop(memory) {
        stack_br++;
        let loop_program = '';
        while (true) {
            const token = readToken(program);

            switch (token) {
                case tokens.BEGIN_LOOP:
                    stack_br++;
                    break;
                case tokens.END_LOOP:
                    stack_br--;
                    break;
                case tokens.EOL:
                    return new Error(Error.codes.INVALID_SYNTAX);
            }

            if (stack_br === 0) break;

            loop_program += token;
        }

        let temp_program_ptr = program_ptr;
        let temp_program = program;

        program = loop_program;

        while (memory[memory_ptr].value !== 0) {
            program_ptr = 0;
            run();
        }

        program_ptr = temp_program_ptr;
        program = temp_program;
    }

    function showOutput(msg, addMode = false) {
        const output_div = document.querySelector('.output__pre');
        if (addMode) output_div.innerText += msg;
        else output_div.innerText = msg;
    }

})();