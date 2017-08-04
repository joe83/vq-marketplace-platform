const spawn = require('child_process').spawn;

const npm = spawn('npm', [ 'run', 'start:dev' ]);

npm.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

npm.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
});

npm.on('close', code => {
    console.log(code);
});