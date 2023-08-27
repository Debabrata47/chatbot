const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const AWS = require('aws-sdk');
const server = http.createServer(app);
const io = socketIO(server);

const express = require('express');

const bucketName = 'audio-test77';
const jsonKey = 'transcript1.json';

const app = express();
const port = process.env.PORT || 3000;

const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
        accessKeyId: "AKIAXYN4QWK6E474E2FX",
        secretAccessKey: "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"
    },
});

async function getObjectURL(key) {
    const command = new GetObjectCommand({
        Bucket: 'audio-test77',
        Key: key,
    });
    const url = await getSignedUrl(s3Client, command);
    return url;
}


io.on('connection', socket => {
    console.log('A client connected');
    socket.on('disconnect', () => {
        console.log('A client disconnected');
    });
});

app.get('/get-object-url/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const url = await getObjectURL(key);
        res.json({ url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.post('/sns-notification', express.json(), (req, res) => {
    const message = req.body.Message;
    console.log('Received SNS notification:', message);

    // Fetch the updated JSON file from S3 and emit to clients
    s3Client.send(new GetObjectCommand({ Bucket: bucketName, Key: jsonKey }))
        .then(data => {
            const jsonData = data.Body.toString('utf-8');
            io.emit('jsonUpdate', jsonData);
        })
        .catch(err => {
            console.error('Error fetching JSON file:', err);
        });

    res.sendStatus(200);
});



app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
