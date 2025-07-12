### Update `chatbot_logs` Table

To support the following new features:
- Chat search
- Chat history
- Auto-naming of chat titles

Please run the following SQL command to add the title column in `chatbot_logs` Table

```sql
ALTER TABLE chatbot_logs ADD COLUMN title VARCHAR(128) DEFAULT NULL;
````

---

### Notes

**Chat titles and clickable chat history and chat search results will only work for new chats created *after* this title column is added.**

If you want to test these features, pls remember to delete the **delete existing records** from the `chatbot_logs` table.
