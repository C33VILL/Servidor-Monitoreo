const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const si = require('systeminformation');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

io.on('connection', async (socket) => {
    const cpuInfo = await si.cpu();
    const gpuInfo = await si.graphics();
    
    socket.emit('hardware-info', {
        cpuModel: `${cpuInfo.manufacturer} ${cpuInfo.brand}`,
        gpuModel: gpuInfo.controllers[0]?.model || 'Integrada'
    });

    const interval = setInterval(async () => {
        const cpuLoad = await si.currentLoad();
        const mem = await si.mem();
        const gpu = await si.graphics();
        const net = await si.networkStats();
        const fs = await si.fsSize();

        socket.emit('stats', {
            cpu: parseFloat(cpuLoad.currentLoad.toFixed(1)),
            gpu: gpu.controllers[0]?.utilizationGpu || 0,
            ramUsed: parseFloat((mem.active / 1024**3).toFixed(2)),
            ramFree: parseFloat((mem.available / 1024**3).toFixed(2)),
            diskUsed: parseFloat((fs[0].used / 1024**3).toFixed(2)),
            diskFree: parseFloat(((fs[0].size - fs[0].used) / 1024**3).toFixed(2)),
            wifi: parseFloat((net[0]?.rx_sec / 1024).toFixed(1)) || 0
        });
    }, 1000);

    socket.on('disconnect', () => clearInterval(interval));
});

server.listen(3000, () => console.log('Monitor activo en puerto 3000'));
