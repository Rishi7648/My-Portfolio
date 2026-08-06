const { spawn, execSync } = require('child_process');
const net = require('net');

function stopProcessOnPort(port) {
  try {
    if (process.platform === 'win32') {
      execSync(`powershell -NoProfile -Command "$ErrorActionPreference='SilentlyContinue'; $pids = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if ($pids) { $pids | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"`, {
        stdio: 'ignore',
      });
    } else {
      execSync(`lsof -ti tcp:${port} | xargs -r kill -9`, { stdio: 'ignore' });
    }
  } catch {
    // ignore
  }
}

function waitForPortFree(port, retries = 15) {
  return new Promise((resolve) => {
    let attempt = 0;

    const check = () => {
      const server = net.createServer();
      server.once('error', () => {
        if (attempt < retries) {
          attempt += 1;
          setTimeout(check, 250);
        } else {
          resolve(false);
        }
      });
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      server.listen(port, '0.0.0.0');
    };

    check();
  });
}

function startNextDev(port) {
  console.log(`Starting Next.js on port ${port}`);

  const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '-p', String(port)], {
    stdio: 'inherit',
    shell: false,
  });

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error(error);
    process.exit(1);
  });
}

(async () => {
  const port = Number(process.env.PORT || 3005);
  stopProcessOnPort(port);

  const isFree = await waitForPortFree(port);
  if (!isFree) {
    console.error(`Port ${port} is still in use after cleanup.`);
    process.exit(1);
  }

  startNextDev(port);
})();
