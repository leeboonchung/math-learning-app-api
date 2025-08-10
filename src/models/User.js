const db = require('../config/database');

class User {
  static async findById(id) {
    const result = await db.query('SELECT * FROM public.user WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await db.query('SELECT * FROM public.user WHERE email = $1', [email]);
    return result.rows[0];
  }

  static async create(userData) {
    const { username, password_hash, email } = userData;
    const result = await db.query(
      'INSERT INTO public.user (user_name, password, email) VALUES ($1, $2, $3) RETURNING *',
    [username, password_hash, email]
    );
    return result.rows[0];
  }

  static async updateXP(userId, xpToAdd) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        'UPDATE user SET total_xp = total_xp + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [xpToAdd, userId]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateStreak(userId, newStreak) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      
      const result = await client.query(
        `UPDATE users SET 
         current_streak = $1, 
         best_streak = GREATEST(best_streak, $1),
         updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 RETURNING *`,
        [newStreak, userId]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getStats(userId) {
    const result = await db.query(`
      SELECT 
        total_exp_earned,
        current_streak,
        best_streak
      FROM public.user 
      WHERE user_id = $1
    `, [userId]);
    
    if (result.rows.length === 0) return null;
    
    const stats = result.rows[0];
    // stats.progress_percentage = stats.total_lessons > 0 
    //   ? Math.round((stats.completed_lessons / stats.total_lessons) * 100) 
    //   : 0;
    
    return stats;
  }
}

module.exports = User;
