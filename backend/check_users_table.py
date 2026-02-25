from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    result = conn.execute(text('SHOW CREATE TABLE users'))
    print(result.fetchone()[1])
