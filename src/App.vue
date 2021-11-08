<template>
  <img alt="Vue logo" src="./assets/logo.png" />
  <HelloWorld msg="Hello Vue 3.0 + Vite" />
  <p>{{platform}}</p>
    <div id="log">
        <pre>
          <p>{{log}}</p>
        </pre>
    </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import { Capacitor } from '@capacitor/core';
import {ref, onMounted, getCurrentInstance } from 'vue';
import { useSQLite } from 'vue-sqlite-hook';

export default {
  name: 'App',
  components: {
    HelloWorld
  }, 
  setup() {
    const log = ref("");
    const platform = Capacitor.getPlatform();
    const app = getCurrentInstance();
    console.log(`platform ${platform}`);
    
    onMounted(async () => {
      console.log(' in App on Mounted');
      if( app != null) { 
        app.appContext.config.globalProperties.$sqlite = useSQLite();
        const sqlite = app.appContext.config.globalProperties.$sqlite;
        try {
          let res = await sqlite.echo("Hello from echo");
          if(res.value !== "Hello from echo") {
              log.value = log.value.concat(`> Echo not returning "Hello from echo"\n`);
              return;
          }

          log.value = log.value.concat("> Echo successful\n");
          // create a connection for NoEncryption
          const db = await sqlite.createConnection("NoEncryption");
          log.value = log.value.concat("> createConnection " +
                                                  " 'NoEncryption' successful\n");
          // open NoEncryption database
          await db.open();
          log.value = log.value.concat("> open 'NoEncryption' successful\n");
          const createTablesNoEncryption =  `
            CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY NOT NULL,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            company TEXT,
            size FLOAT,
            age INTEGER,
            last_modified INTEGER DEFAULT (strftime('%s', 'now'))
            );
            CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY NOT NULL,
            userid INTEGER,
            title TEXT NOT NULL,
            body TEXT NOT NULL,
            last_modified INTEGER DEFAULT (strftime('%s', 'now')),
            FOREIGN KEY (userid) REFERENCES users(id) ON DELETE SET DEFAULT
            );
            CREATE INDEX IF NOT EXISTS users_index_name ON users (name);
            CREATE INDEX IF NOT EXISTS users_index_last_modified ON users (last_modified);
            CREATE INDEX IF NOT EXISTS messages_index_last_modified ON messages (last_modified);
            CREATE TRIGGER IF NOT EXISTS users_trigger_last_modified 
            AFTER UPDATE ON users
            FOR EACH ROW WHEN NEW.last_modified <= OLD.last_modified  
            BEGIN  
                UPDATE users SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;   
            END;      
            CREATE TRIGGER IF NOT EXISTS messages_trigger_last_modified AFTER UPDATE ON messages
            FOR EACH ROW WHEN NEW.last_modified <= OLD.last_modified  
            BEGIN  
                UPDATE messages SET last_modified= (strftime('%s', 'now')) WHERE id=OLD.id;   
            END;      
            PRAGMA user_version = 1;
          `;
          const importTwoUsers = `
            DELETE FROM users;
            INSERT INTO users (name,email,age) VALUES ("Whiteley","Whiteley.com",30);
            INSERT INTO users (name,email,age) VALUES ("Jones","Jones.com",44);
          `;
          const importThreeMessages = `
            DELETE FROM messages;
            INSERT INTO messages (userid,title,body) VALUES (1,"test post 1","content test post 1");
            INSERT INTO messages (userid,title,body) VALUES (2,"test post 2","content test post 2");
            INSERT INTO messages (userid,title,body) VALUES (1,"test post 3","content test post 3");
          `;
          const dropTablesTablesNoEncryption = `
            PRAGMA foreign_keys = OFF;
            DROP TABLE IF EXISTS users;
            DROP TABLE IF EXISTS messages;
            PRAGMA foreign_keys = ON;
          `;  
          // Drop tables if exists
          res = await db.execute(dropTablesTablesNoEncryption, false);
          console.log(`drop tables res: ${JSON.stringify(res)}`);
          log.value = log.value.concat(`drop tables res: ${JSON.stringify(res)}\n`);
          if(res.changes.changes < 0) {
            log.value = log.value.concat(" Execute1 failed\n");
            return;
          }
          // Create tables
          res = await db.execute(createTablesNoEncryption);
          if(res.changes.changes !== 0 && res.changes.changes !== 1) {
            log.value = log.value.concat(" Execute2 failed\n");
            return;
          }
          // Insert two users with execute method
          res = await db.execute(importTwoUsers);
          if(res.changes.changes !== 2) {
            log.value = log.value.concat(" Execute3 failed\n");
            return;
          }
          // Close Connection NoEncryption        
          await sqlite.closeConnection("NoEncryption"); 
          log.value = log.value
              .concat("* Ending test successfully*\n");     

        } catch (err) {
          log.value = log.value
                      .concat(`\n* Error ${err} *\n`);
        }
      }
    });
    return {platform, log}
  }
}
</script>
