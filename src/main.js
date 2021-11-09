import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { JeepSqlite } from 'jeep-sqlite/dist/components/jeep-sqlite';

customElements.define('jeep-sqlite', JeepSqlite);

window.addEventListener('DOMContentLoaded', async () => {
    const platform = Capacitor.getPlatform();
    const sqlite = new SQLiteConnection(CapacitorSQLite)
    const app = createApp(App)
    try {
        if(platform === "web") {
          // Create the 'jeep-sqlite' Stencil component
          const jeepSqlite = document.createElement('jeep-sqlite');
          document.body.appendChild(jeepSqlite);
          await customElements.whenDefined('jeep-sqlite');
          // Initialize the Web store
          await sqlite.initWebStore();
        } 
        // here you can initialize some database schema if required

        // example: database creation with standard SQLite statements 
        const ret = await sqlite.checkConnectionsConsistency();
        const isConn = (await sqlite.isConnection("db_vite")).result;
        let db = null;
        if (ret.result && isConn) {
            db = await sqlite.retrieveConnection("db_vite");
        } else {
            db = await sqlite.createConnection("db_vite", false, "no-encryption", 1);
        }
        await db.open();
        const query = `
        CREATE TABLE IF NOT EXISTS test (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL
        );
        `
        const res = await db.execute(query);
        if(res.changes && res.changes.changes && res.changes.changes < 0) {
        throw new Error(`Error: execute failed`);
        }
        await sqlite.closeConnection("db_vite");

        app.mount('#app');
    } catch (err) {
        console.log(`Error: ${err}`);
        throw new Error(`Error: ${err}`)
    }
});
