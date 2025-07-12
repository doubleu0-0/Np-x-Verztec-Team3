### Update `chatbot_logs` Table

To support **chat search**, **chat history**, and **auto-naming chat titles**, run the following code:

```sql
ALTER TABLE chatbot_logs ADD COLUMN title VARCHAR(128) DEFAULT NULL;
