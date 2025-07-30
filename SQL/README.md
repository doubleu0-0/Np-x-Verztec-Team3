This folder stores all the SQL code required to create and update the database.

### Update `chatbot_logs` Table

To support the following new features:
- Chat search  
- Chat history  
- Auto-naming of chat titles  

Please run the following SQL command to add the `title` column to the `chatbot_logs` table:

```sql
ALTER TABLE chatbot_logs ADD COLUMN title VARCHAR(128) DEFAULT NULL;
```
---

### Update `upload_file_logs` Table

```sql
RENAME TABLE upload_file_logs TO upload_file_logs_old;
DROP TABLE upload_file_logs_old;

CREATE TABLE upload_file_logs (
    file_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    uploaded_by INT NOT NULL,
    department TEXT NOT NULL,
    access_level VARCHAR(50) NOT NULL,
    file_path TEXT NOT NULL,
    countries TEXT NOT NULL,
    departments TEXT NOT NULL,
    batch_id VARCHAR(50),
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

This update supports displaying country and department permissions for uploaded files.

---

### Notes

**Chat titles, clickable chat history, and chat search results will only work for new chats created *after* the `title` column is added.**

If you want to test these features, please remember to **delete existing records** from the `chatbot_logs` table:
