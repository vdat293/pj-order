const crypto = require('crypto');

const SESSION_TTL_MINUTES = 30;

let schemaReady = false;

const ensureTableSessionSchema = async (db) => {
    if (schemaReady) return;

    await db.query(`
        CREATE TABLE IF NOT EXISTS table_sessions (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            table_id BIGINT NOT NULL,
            order_id BIGINT NULL,
            session_token VARCHAR(128) UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            revoked_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (table_id) REFERENCES dining_tables(id),
            INDEX idx_table_sessions_token (session_token),
            INDEX idx_table_sessions_order_id (order_id),
            INDEX idx_table_sessions_table_active (table_id, expires_at, revoked_at)
        )
    `);

    try {
        await db.query('ALTER TABLE table_sessions ADD COLUMN order_id BIGINT NULL AFTER table_id');
    } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') {
            throw error;
        }
    }

    try {
        await db.query('ALTER TABLE table_sessions ADD INDEX idx_table_sessions_order_id (order_id)');
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME') {
            throw error;
        }
    }

    try {
        await db.query(
            `ALTER TABLE table_sessions
             ADD CONSTRAINT fk_table_sessions_order_id
             FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL`
        );
    } catch (error) {
        if (error.code !== 'ER_DUP_KEYNAME' && error.errno !== 1826) {
            throw error;
        }
    }

    schemaReady = true;
};

const createTableSession = async (db, tableId) => {
    await ensureTableSessionSchema(db);
    await cleanupExpiredTableSessions(db);

    const sessionToken = crypto.randomBytes(32).toString('base64url');
    const [result] = await db.query(
        `INSERT INTO table_sessions (table_id, session_token, expires_at)
         VALUES (?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL ? MINUTE))`,
        [tableId, sessionToken, SESSION_TTL_MINUTES]
    );

    const [sessions] = await db.query(
        'SELECT id, session_token, expires_at FROM table_sessions WHERE id = ?',
        [result.insertId]
    );

    return sessions[0];
};

const getValidTableSession = async (db, tableCode, sessionToken) => {
    await ensureTableSessionSchema(db);

    if (!tableCode || !sessionToken) {
        return null;
    }

    const [sessions] = await db.query(
        `SELECT ts.id, ts.table_id, ts.order_id, ts.session_token, ts.expires_at, dt.table_code, dt.table_name, dt.status
         FROM table_sessions ts
         JOIN dining_tables dt ON dt.id = ts.table_id
         WHERE dt.table_code = ?
           AND ts.session_token = ?
           AND ts.revoked_at IS NULL
           AND ts.expires_at > CURRENT_TIMESTAMP`,
        [tableCode, sessionToken]
    );

    return sessions[0] || null;
};

const attachOrderToTableSession = async (db, sessionId, orderId) => {
    await ensureTableSessionSchema(db);

    await db.query(
        'UPDATE table_sessions SET order_id = ? WHERE id = ?',
        [orderId, sessionId]
    );
};

const revokeSessionsForOrder = async (db, orderId) => {
    await ensureTableSessionSchema(db);

    await db.query(
        'DELETE FROM table_sessions WHERE order_id = ?',
        [orderId]
    );
};

const cleanupExpiredTableSessions = async (db) => {
    await db.query(
        'DELETE FROM table_sessions WHERE expires_at < CURRENT_TIMESTAMP OR revoked_at IS NOT NULL'
    );
};

module.exports = {
    SESSION_TTL_MINUTES,
    ensureTableSessionSchema,
    createTableSession,
    getValidTableSession,
    attachOrderToTableSession,
    revokeSessionsForOrder
};
