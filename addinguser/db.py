import mysql.connector

def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="Tanhongkai123",
        database="verztec"
    )
