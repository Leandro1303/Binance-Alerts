const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const axios = require('axios');
const { MACD } = require('technicalindicators');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const BINANCE_API_URL = 'https://api.binance.com/api/v3/klines';
const symbols = ['BTCUSDT', 'ETHUSDT']; // List of symbols to monitor
const interval = '1m'; // Candle interval

async function fetchCandles(symbol) {
    const response = await axios.get(`${BINANCE_API_URL}`, {
        params: {
            symbol,
            interval,
            limit: 50
        }
    });
    return response.data.map(candle => ({
        close: parseFloat(candle[4])
    }));
}

function calculateMACD(candles) {
    const closePrices = candles.map(candle => candle.close);
    const macdInput = {
        values: closePrices,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false
    };
    return MACD.calculate(macdInput);
}

function checkMACDCross(macdValues) {
    const macdLine = macdValues.map(val => val.MACD);
    const signalLine = macdValues.map(val => val.signal);
    const histogram = macdValues.map(val => val.histogram);

    for (let i = 1; i < histogram.length; i++) {
        if (histogram[i - 1] < 0 && histogram[i] > 0) {
            return true;
        }
    }
    return false;
}

async function monitorSymbols() {
    for (const symbol of symbols) {
        const candles = await fetchCandles(symbol);
        const macdValues = calculateMACD(candles);
        if (checkMACDCross(macdValues)) {
            io.emit('macd-cross', { symbol });
        }
    }
}

setInterval(monitorSymbols, 60000); // Check every minute

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

server.listen(4000, () => {
    console.log('Listening on port 4000');
});
