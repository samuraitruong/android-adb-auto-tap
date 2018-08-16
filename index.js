const fs = require("fs-extra");
const moment = require("moment");
const parse = require('csv-parse/lib/sync');
const execSync = require("child_process").execSync;
const yargs  = require("yargs").argv;
const packageName = "com.strategygame.gameofwarriors";
const restartInternal = 15;

const source  = yargs.input || "./input.csv";


// adb shell am force-stop com.my.app.package
// https://stackoverflow.com/questions/13193592/adb-android-getting-the-name-of-the-current-activity
const testWindows = 2;
const csvText = fs.readFileSync(source, "utf8");
function pad(number) {
    if(number>999) return number;
    if(number>99) return " " + number;
    return "  " + number;
}
var records = parse(csvText, {columns: true}).filter(x => x.commented !== "#");
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}
function getActivityName() {
    const cmd = "adb shell dumpsys activity | grep top-activity";
    const result = execSync(cmd).toString();
    return result;
}
async function restartGame() {
    console.log("Restart game....")
    let stop_cmd = `adb shell am force-stop ${packageName}`
    const start_cmd = `adb shell monkey -p ${packageName} -v 500`
    execSync(stop_cmd);
    await sleep(3000)
    execSync(start_cmd);
    //close the game
    // start game adb shell monkey -p packagename -v 500

    //
}
async function main() {
    console.log("Auto click will running with number of steps", records.length)
    let lastStart = moment().unix();
    let test = testWindows;
    while(true) {
        const current = moment().unix();
        const time = current - lastStart;
        const activityName = getActivityName();
        const notInGame = activityName.indexOf(packageName) < 0;
        if(notInGame) test--;
        if(time > restartInternal*60 || test <=0 ) {
            await restartGame();
            test = testWindows;
            lastStart = current;
        }
        for (const item of records) {
            const cmd = `adb shell input tap ${item.x} ${item.y}`;
            console.log(`Tap [${pad(item.x)}, ${pad(item.y)}] \tsleep ${item.sleep}ms  \t- ${item.desciption}`)
            execSync(cmd);

            await sleep(item.sleep  ||100)

        }
    }
}
main().then(x =>console.log("Good Bye!!!"))

//console.log(getActivityName())