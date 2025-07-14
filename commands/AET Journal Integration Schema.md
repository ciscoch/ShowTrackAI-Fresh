### **AET Journal Integration Schema**
```sql
-- Integration tracking table
CREATE TABLE aet_journal_sync (
    id SERIAL PRIMARY KEY,
    health_record_id INTEGER REFERENCES health_records(id),
    aet_entry_id VARCHAR(100),
    sync_direction VARCHAR(20), -- 'to_aet', 'from_aet', 'bidirectional'
    sync_status VARCHAR(20), -- 'pending', 'synced', 'failed', 'conflict'
    sync_timestamp TIMESTAMP,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0
);
```
