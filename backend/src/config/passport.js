const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./database');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
      scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/calendar',
      ],
      accessType: 'offline',
      prompt: 'consent',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;

        // Check if user exists
        let result = await pool.query(
          'SELECT * FROM users WHERE google_id = $1',
          [googleId]
        );

        let user;
        if (result.rows.length === 0) {
          // Create new user
          result = await pool.query(
            `INSERT INTO users (email, google_id, google_tokens)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [
              email,
              googleId,
              JSON.stringify({ 
                access_token: accessToken, 
                refresh_token: refreshToken 
              }),
            ]
          );
          user = result.rows[0];
        } else {
          // Update tokens
          result = await pool.query(
            `UPDATE users
             SET google_tokens = $1, updated_at = CURRENT_TIMESTAMP
             WHERE google_id = $2
             RETURNING *`,
            [JSON.stringify({ 
              access_token: accessToken, 
              refresh_token: refreshToken 
            }), googleId]
          );
          user = result.rows[0];
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
