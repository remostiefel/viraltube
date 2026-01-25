const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const inputFile = '../NeuroCode_Teasers/GodMode_Demo.webp';
const outputFile = '../NeuroCode_Teasers/GodMode_Demo.mp4';

console.log('Starting conversion...');
console.log(`Input: ${inputFile}`);
console.log(`Output: ${outputFile}`);

ffmpeg(inputFile)
    .outputOptions('-c:v libx264', '-pix_fmt yuv420p')
    .on('start', (cmd) => {
        console.log('Spawned Ffmpeg with command: ' + cmd);
    })
    .on('stderr', function (stderrLine) {
        console.log('Stderr output: ' + stderrLine);
    })
    .save(outputFile)
    .on('end', () => {
        console.log('Conversion finished successfully!');
    })
    .on('error', (err) => {
        console.error('Error:', err);
        process.exit(1);
    });
