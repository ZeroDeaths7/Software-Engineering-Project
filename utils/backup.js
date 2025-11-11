/**
 * Database Backup Utility for SMMS
 * SMMS-NF-005: Manual database backup functionality
 */

const fs = require('fs');
const path = require('path');
const db = require('../database');

const BACKUP_DIR = path.join(__dirname, '../backups');

// Ensure backups directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Create a backup of the database
 * Returns the backup file path
 */
async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `smms-backup-${timestamp}.sql`;
    const backupFilePath = path.join(BACKUP_DIR, backupFileName);

    // Export all data as SQL INSERT statements
    const tables = ['users', 'posts', 'sessions'];
    let sqlContent = `-- SMMS Database Backup\n-- Created: ${new Date().toISOString()}\n\n`;

    for (const table of tables) {
      // Get table schema
      const schema = await db.all(
        `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`,
        [table]
      );

      if (schema && schema.length > 0) {
        sqlContent += `-- Table: ${table}\n`;
        sqlContent += `DROP TABLE IF EXISTS ${table};\n`;
        sqlContent += `${schema[0].sql};\n\n`;

        // Get all rows
        const rows = await db.all(`SELECT * FROM ${table}`);

        if (rows && rows.length > 0) {
          for (const row of rows) {
            const columns = Object.keys(row);
            const values = columns.map((col) => {
              const val = row[col];
              if (val === null) return 'NULL';
              if (typeof val === 'number') return val;
              // Escape single quotes in strings
              return `'${String(val).replace(/'/g, "''")}'`;
            });

            sqlContent += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
          }
          sqlContent += '\n';
        }
      }
    }

    // Write to file
    fs.writeFileSync(backupFilePath, sqlContent, 'utf8');

    return {
      success: true,
      filePath: backupFilePath,
      fileName: backupFileName,
      size: fs.statSync(backupFilePath).size,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Backup error:', err);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * List all available backups
 */
function listBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter((file) => file.endsWith('.sql'))
      .map((file) => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          fileName: file,
          filePath: filePath,
          size: stats.size,
          created: stats.mtime,
        };
      })
      .sort((a, b) => b.created - a.created);

    return backups;
  } catch (err) {
    console.error('Error listing backups:', err);
    return [];
  }
}

/**
 * Delete a backup file
 */
function deleteBackup(fileName) {
  try {
    const filePath = path.join(BACKUP_DIR, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    }
    return { success: false, error: 'Backup file not found' };
  } catch (err) {
    console.error('Error deleting backup:', err);
    return { success: false, error: err.message };
  }
}

module.exports = {
  createBackup,
  listBackups,
  deleteBackup,
  BACKUP_DIR,
};
