-- add_title_column_to_chatbot_logs

ALTER TABLE chatbot_logs ADD COLUMN title VARCHAR(128) DEFAULT NULL;

