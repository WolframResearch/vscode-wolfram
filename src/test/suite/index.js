"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const path = require("path");
const Mocha = require("mocha");
const { glob } = require("glob");
async function run() {
    // Create the mocha test
    const mocha = new Mocha({
        ui: 'tdd',
    });
    const testsRoot = path.resolve(__dirname, '..');
    const files = await glob('**/**.test.js', { cwd: testsRoot });
    // Add files to the test suite
    files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));
    return new Promise((c, e) => {
        try {
            // Run the mocha test
            mocha.run(failures => {
                if (failures > 0) {
                    e(new Error(`${failures} tests failed.`));
                }
                else {
                    c();
                }
            });
        }
        catch (err) {
            console.error(err);
            e(err);
        }
    });
}
exports.run = run;
//# sourceMappingURL=index.js.map