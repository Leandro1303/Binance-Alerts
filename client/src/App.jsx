import { useEffect, useState } from 'react';
import socketIOClient from 'socket.io-client';
const ENDPOINT = "http://localhost:4000";

function App() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const socket = socketIOClient(ENDPOINT);
    socket.on("macd-cross", data => {
      setAlerts(prevAlerts => [...prevAlerts, `MACD cross detected for ${data.symbol}`]);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <div>
      <h1>MACD Alerts</h1>
      <ul>
        {alerts.map((alert, index) => (
          <li key={index}>{alert}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
