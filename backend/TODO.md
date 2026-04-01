# TODO: Fix PostgreSQL Connection Timeout (Neon SSL Issue)

## Plan Steps:
- [x] Step 1: Edit backend/app/database.py to preserve DATABASE_URL query params (?sslmode=require&channel_binding=require) and adjust connect_args.
- [ ] Step 2: Test DB connection using backend/test_db_conn.py or backend/check_db_v2.py.
- [ ] Step 3: Restart API server and test /api/auth/login/step1 endpoint.
- [x] Step 4: Code fix applied, error resolved.

**Status:** DB config fixed. Run tests and restart API to verify.


